const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const cookiesMiddleware = require("universal-cookie-express");
let app = express();
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
const authRouter = require("./Routes/authRoutes");
const orderRoutes = require("./Routes/orderRoutes");
app.use(cookiesMiddleware());
app.use(express.static("./public"));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// app.use("/home", (req, res, next) => {
//   res.json("success");
// });
app.use("/api/v1/users", authRouter);
app.use("/api/v1/orders", orderRoutes);
// app.use("/api/v1/orders", authRouter);
// app.use(globalErrorHandler);

app.use(express.static("public"));

module.exports = app;
