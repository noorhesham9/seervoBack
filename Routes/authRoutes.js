const express = require("express");
const authController = require("../controllers/UserController");
const router = express.Router();

router.route("/signup").post(authController.signup);
router.route("/login").get(authController.login);
router.route("/resetPassword/:token").post(authController.resetPassword);
router.route("/forgotPasword").post(authController.forgotPasword);
router
  .route("/updatePassword")
  .patch(authController.protect, authController.updatePassword);

router
  .route("/updatename")
  .patch(authController.protect, authController.updatename);
router
  .route("/ubdateNumber1")
  .patch(authController.protect, authController.ubdateNumber1);
router
  .route("/ubdateNumber2")
  .patch(authController.protect, authController.ubdateNumber2);
router
  .route("/ubdateAddress")
  .patch(authController.protect, authController.ubdateAddress);

router
  .route("/updatephoto")
  .patch(authController.protect, authController.updatephoto);

router
  .route("/changerole")
  .patch(
    authController.protect,
    authController.restrict("admin"),
    authController.updaterole
  );

router.route("/front").get((req, res, next) => {
  res.status(200).cookie("try", "success").json("success");
});
module.exports = router;
