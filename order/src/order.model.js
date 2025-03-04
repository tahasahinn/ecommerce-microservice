const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    products: [
      {
        productId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
    destination: {
      city: { type: String, required: true },
      district: { type: String, required: true },
      street: { type: String, required: true },
      apartment: { type: Number, required: true },
      flat: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
