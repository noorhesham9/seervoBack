const express = require("express");
const orderController = require("../controllers/OrderController");
const router = express.Router();
const userController = require("../controllers/UserController");
router
  .route("/makeOrder")
  .post(userController.protect, orderController.createOrder);
router
  .route("/changeNumber")
  .patch(userController.protect, orderController.changeNumber);

router
  .route("/getAllOrder")
  .get(userController.protect, orderController.getAllOrder);
// router
//   .route("changeAddress")
//   .patch(userController.protect, orderController.changeAddress);
module.exports = router;
