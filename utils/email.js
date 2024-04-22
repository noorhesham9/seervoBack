const nodemailer = require("nodemailer");
// console.log("object");

const sendEmail = async (option) => {
  console.log("object");
  // create a transporter
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "seervocom@gmail.com",
      pass: "yblqdzvpvfsnryob",
    },
  });

  var mailOptions = {
    from: "seervocom@gmail.com",
    to: option.email,
    subject: option.subject,
    text: option.message,
  };

  console.log(option.message);
  console.log(option.subject);
  console.log(option.email);
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
