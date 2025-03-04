const amqp = require("amqplib");
const User = require("./auth.model");
const jwt = require("jsonwebtoken");

class AuthService {
  constructor() {
    this.channel = null;
    this.initializeRabbitMq();
  }

  async initializeRabbitMq() {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await connection.createChannel();
      await this.channel.assertExchange(process.env.RABBITMQ_EXCHANGE, "topic", {
        durable: true,
      });
      await this.channel.assertQueue(process.env.RABBITMQ_QUEUE);
      console.log("RabbitMQ'ya bağlandı");
    } catch (error) {
      console.error("RabbitMq'ya bağalanamadı", error);
    }
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error("Artık bu kullanıcı bulunmuyor");
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("Email zaten kullanımda");
    }

    const user = new User(userData);
    await user.save();

    const tokens = this.generateTokens(user);
    user.refreshToken = tokens.refreshToken;

    await user.save();

    return { user, ...tokens };
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }

      if (!user.isActive) {
        throw new Error("Kullanıcı hesabı inaktif");
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new Error("Şifre yanlış");
      }

      user.lastLogin = new Date();
      await user.save();

      const tokens = this.generateTokens(user);

      return { ...tokens, user };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async refresh(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error("Artık bu kullanıcı bulunmuyor");
      }

      const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        }
      );

      return accessToken;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
