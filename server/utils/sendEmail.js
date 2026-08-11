const nodemailer = require('nodemailer');

// Utility helper to send actual SMTP emails to user inbox
const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Artisan\'s Corner'}" <${process.env.FROM_EMAIL || smtpUser || 'no-reply@artisanscorner.com'}>`,
      to: email,
      subject: subject,
      text: message,
      html: html || `<div style="font-family: Arial, sans-serif; padding: 24px; border-radius: 16px; background-color: #fffbeb; border: 1px solid #fef3c7;">
        <h2 style="color: #78350f; font-size: 20px; margin-bottom: 12px;">${subject}</h2>
        <p style="color: #451a03; font-size: 14px; line-height: 1.6;">${message}</p>
        <hr style="border: none; border-top: 1px solid #fde68a; margin: 20px 0;" />
        <p style="color: #92400e; font-size: 11px;">Artisan's Corner Marketplace &copy; 2026. All rights reserved.</p>
      </div>`
    };

    if (smtpUser && smtpPass) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 [REAL EMAIL DELIVERED] Message ID: ${info.messageId} to ${email}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`📧 [EMAIL READY] Set SMTP_USER & SMTP_PASS in server/.env or Render env settings to deliver directly to real Gmail inbox: ${email}`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Error delivering email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
