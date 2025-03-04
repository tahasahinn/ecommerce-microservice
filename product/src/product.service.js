const amqp = require("amqplib");
const Product = require("./product.model");

class ProductService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.initializeRabbitMq();
  }

  async initializeRabbitMq() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(process.env.RABBITMQ_PRODUCT_QUEUE);

      this.channel.consume(process.env.RABBITMQ_PRODUCT_QUEUE, async (data) => {
        try {
          const orderData = JSON.parse(data.content.toString());
          console.log("products kanaluna gelen mesaj", orderData);

          await this.processOrder(orderData);

          this.channel.ack(data);
        } catch (error) {
          this.channel.nack(data);
        }
      });

      console.log("RabbitMQ'ya bağlandı");
    } catch (error) {
      console.error("RabbitMq'ya bağalanamadı", error);
    }
  }

  async processOrder(orderData) {
    const { products } = orderData;

    for (const product of products) {
      await this.updateStock(product.productId, -product.quantity);
    }
  }

  async createProduct(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw error;
    }
  }

  async getAllProducts(query = {}) {
    try {
      const filter = { isActive: true };

      if (query.title) filter.name = { $regex: query.title, $options: "i" };
      if (query.category) filter.category = query.category;
      if (query.minPrice) filter.price = { $gte: query.minPrice };
      if (query.maxPrice) filter.price = { ...filter.price, $lte: query.maxPrice };

      return await Product.find(filter);
    } catch (error) {
      throw error;
    }
  }

  async getProductById(productId) {
    try {
      return await Product.findById(productId);
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(id, data) {
    try {
      return await Product.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw error;
    }
  }

  async updateStock(id, quantity) {
    try {
      const product = await Product.findById(id);
      if (!product) {
        throw new Error("Ürün bulunamadı");
      }

      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new Error("Yetersiz stock");
      }

      return await Product.findByIdAndUpdate(
        id,
        { $inc: { stock: quantity } },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      return await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductService();
