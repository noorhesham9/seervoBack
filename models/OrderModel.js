const mongoose = require("mongoose");
const validator = require("validator");

const DetailSchema = new mongoose.Schema({
  detail: {
    type: String,
    // required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  pictures: {
    type: [String],
    default: [],
  },
});
const OrderSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  issueDetail: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  categoryOfProduct: {
    type: String,
    required: true,
    enum: ["laptop", "Mobile Phones"],
  },
  phone: {
    type: Number,
    required: [true, "please add a phone number"],
  },
  email: {
    type: String,
    required: [true, "please add an email"],
    lowercase: true,
    validate: [validator.isEmail, "please enter a valid email"],
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  product: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  latestDetail: {
    type: String,
    // required: true,
  },
  AllDetails: {
    type: [DetailSchema],
    default: [],
  },

  price: {
    type: Number,
  },
  methodOfPayment: {
    type: String,
    required: true,
    default: "Cash on delivery",
    enum: ["Cash on delivery", "fawery", "Credit Card", "Debit Card"],
  },
  invoice: {
    type: String,
  },
  warantyDate: {
    type: Date,
    default: Date.now() + 2764800000,
  },
});

const Orders = mongoose.model("Orders", OrderSchema);
module.exports = Orders;
