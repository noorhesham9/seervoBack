let User = require("./../models/UserModel");
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

exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const token = signToken(newUser._id);
  console.log(token);
  res
    .status(201)
    .cookie("token", token)
    .json({
      status: "success",
      token,
      data: {
        user: newUser,
      },
    });
});

exports.login = asyncErrorHandler(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    const error = new CustomError(
      "please enter email and password to login!",
      400
    );
    return next(error);
  }
  const user = await User.findOne({ email }).select("+password");
  const token = signToken(user._id);
  res
    .status(200)
    .cookie("token", token)
    .json({
      status: "success",
      token,
      role: user.role,
      data: {
        user: user,
      },
    });
  console.log(user);
});

let token;

exports.protect = asyncErrorHandler(async (req, res, next) => {
  // 1. read the token & check if exist
  const testToken = req.headers.authorization;
  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }
  if (!token) {
    next(new CustomError("you are not logged in!", 401));
  }

  // 2. validate the token

  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );

  // 3. if the user exists

  const user = await User.findById(decodedToken.id);

  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }

  // 4. if the user changeed password after the token was issued
  if (await user.isPasswordChanged(decodedToken.iat)) {
    const error = new CustomError(
      "the password has been changed recently. please login again",
      401
    );
    return next(error);
  }
  // 5. allow user to access route
  req.user = user;

  next();
});

exports.restrict = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      const error = new CustomError(
        "You do not have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

exports.forgotPasword = asyncErrorHandler(async (req, res, next) => {
  // get user based on his Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const err = new CustomError(
      "we couldn't find the user with the given email",
      404
    );
    next(err);
  }
  // generate a random Reset Token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  // send the token back to the user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `we have recived a password reset request. use the link below to reset your password\n\n${resetURL}\n\n this url will be valid for just 10 minutes`;

  try {
    await sendEmail({
      email: user.email,
      subject: "password change request",
      message: message,
    });
    res.status(200).json({
      status: "success",
      message: "password reset send to the user email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.save({ validateBeforeSave: false });
    console.log(err.message);
    return next(
      new CustomError(
        "there was an error sending pasword reset email. please try again later",
        500
      )
    );
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    const err = new CustomError("token is invalid or has expired!", 400);
    next(err);
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();
  user.save({ validateBeforeSave: true });

  const logintoken = signToken(user._id);
  res.status(200).json({
    status: "success",
    token: logintoken,
    role: user.role,
  });
});

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (
    !(await user.comparePasswordInDB(req.body.CurrentPassword, user.password))
  ) {
    return next(new CustomError("Your current password is wrong", 401));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordChangedAt = Date.now();
  // console.log(req.body.password);
  // console.log(req.body.confirmpassword);
  // console.log(req.body.confirmpassword === req.body.password);
  await user.save({ validateBeforeSave: true });
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    role: user.role,
  });
});

exports.updatename = asyncErrorHandler(async (req, res, next) => {
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

  console.log(user.firstName);
  console.log(user.lastName);
  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: "success",
    role: user.role,
  });
});

exports.updaterole = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }

  var userRoleChanged = await User.find({ email: req.body.email });
  if (!userRoleChanged[0]) {
    userRoleChanged = await User.find({ userName: req.body.userName });
    if (!userRoleChanged[0]) {
      const error = new CustomError(
        "the user with the given token does not exist",
        401
      );
      next(error);
    }
  }

  console.log(userRoleChanged[0]);
  const userWillChange = userRoleChanged[0];
  userWillChange.role = req.body.role;
  await userWillChange.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: "success role changed",
    role: userWillChange.role,
  });
});

exports.ubdateAddress = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }

  user.address = req.body.address;
  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: "success",
    role: user.role,
  });
});

exports.ubdateNumber1 = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }

  user.number1 = req.body.number1;

  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: "success",
    role: user.role,
  });
});
exports.ubdateNumber2 = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }
  user.number2 = req.body.number2;
  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: "success",
    role: user.role,
  });
});

exports.updatephoto = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new CustomError(
      "the user with the given token does not exist",
      401
    );
    next(error);
  }
  user.photo = req.body.updatephoto;
  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: "success",
    role: user.role,
  });
});
