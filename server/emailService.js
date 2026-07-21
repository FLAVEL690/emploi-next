const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendNotificationEmail(to, subject, text) {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: `"EmploiPro" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error.message);
  }
}

module.exports = { sendNotificationEmail };
