const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "please inter your first name"],
  },
  lastName: {
    type: String,
    required: [true, "please inter your last name"],
  },
  userName: {
    type: String,
    required: [true, "please inter an username"],
    unique: [true, "this username is already taken"],
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "please inter an email"],
    unique: [true, "this email is already signed up go to login page please"],
    lowercase: true,
    validate: [validator.isEmail, "please enter a valid email"],
  },
  photo: String,
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin", "delivery", "repairman"],
  },
  password: {
    type: String,
    required: [true, "please anter a password"],
    minlength: 8,
    select: false,
  },

  confirmPassword: {
    type: String,
    required: [true, "please anter a password"],
    validate: {
      // this will only work in save() and create() ;
      validator: function (val) {
        console.log(val);
        console.log(this.password);
        return val == this.password;
      },
      message: "password and confirm password does not match!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  address: {
    type: String,
  },
  number1: {
    type: Number,
  },
  number2: {
    type: Number,
  },
  orders: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Order",
    default: [],
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.comparePasswordInDB = async function (pswd, pswdDB) {
  return await bcrypt.compare(pswd, pswdDB);
};

userSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < pswdChangedTimestamp;
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  // console.log(resetToken, this.passwordResetToken);
  return resetToken;
};

const users = mongoose.model("users", userSchema);
module.exports = users;
