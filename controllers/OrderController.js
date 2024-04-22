let User = require("./../models/UserModel");
let Order = require("./../models/OrderModel");
const jwt = require("jsonwebtoken");
const util = require("util");
const CustomError = require("./../utils/CustomError");
const asyncErrorHandler = require("./../utils/asynsErrorHandler");
const crypto = require("crypto");
const sendEmail = require("./../utils/email");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

exports.createOrder = asyncErrorHandler(async (req, res, next) => {
  console.log(req.user);
  const newOrder = await Order.create({
    userName: req.user.firstName + " " + req.user.lastName,
    UserId: req.user._id,
    address: req.user.address,
    city: req.user.city,
    state: req.user.state,
    phone: req.user.number1,
    email: req.user.email,
    product: req.body.productName,
    issueDetail: req.body.issueDetail,
    categoryOfProduct: req.body.categoryOfProduct,
  });

  const user = req.user;
  user.orders.push(newOrder.id);
  user.save({ validateModifiedOnly: true });
  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    data: newOrder,
  });
});

exports.changeNumber = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }

  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
});
exports.getAllOrder = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }

  const ordersId = user.orders;
  const orders = await Order.find({ _id: { $in: ordersId } });
  res.status(200).json({
    status: "success",
    message: "orders fetched successfully",
    data: orders,
  });
});
