const amqp = require("amqplib");
const Order = require("./order.model");

class OrderService {
  constructor() {
    this.channel = null;
    this.initializeRabbitMq();
  }

  async initializeRabbitMq() {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await connection.createChannel();
      await this.channel.assertQueue(process.env.RABBITMQ_ORDER_QUEUE);
      await this.channel.assertQueue(process.env.RABBITMQ_PRODUCT_QUEUE);
      console.log("RabbitMQ'ya bağlandı");
    } catch (error) {
      console.error("RabbitMq'ya bağalanamadı", error);
    }
  }

  async createOrder(userId, orderData) {
    try {
      const newOrder = new Order({
        user: userId,
        ...orderData,
      });

      const savedOrder = await newOrder.save();

      if (this.channel) {
        this.channel.sendToQueue(
          process.env.RABBITMQ_PRODUCT_QUEUE,
          Buffer.from(JSON.stringify(savedOrder))
        );
      }

      return savedOrder;
    } catch (error) {
      throw error;
    }
  }

  async getOrderById(orderId) {
    try {
      return await Order.findById(orderId);
    } catch (error) {
      throw error;
    }
  }

  async getUserOrders(userId) {
    try {
      return await Order.find({ user: userId });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OrderService();
