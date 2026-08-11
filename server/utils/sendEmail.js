const nodemailer = require('nodemailer');

// Utility helper to send transactional emails via Nodemailer
const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const smtpPass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
    const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"${process.env.FROM_NAME || 'Artisan\'s Corner'}" <${smtpUser || 'no-reply@artisanscorner.com'}>`,
      to: email,
      subject: subject,
      text: message,
      html: html || `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; border-radius: 20px; overflow: hidden; border: 1px solid #fef3c7; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background-color: #78350f; padding: 28px; text-align: center;">
          <h1 style="color: #ffffff; font-family: Georgia, serif; margin: 0; font-size: 26px; font-weight: bold;">Artisan's Corner</h1>
          <p style="color: #fde68a; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Handmade Goods Marketplace</p>
        </div>
        <div style="padding: 32px 28px; background-color: #ffffff;">
          <h2 style="color: #451a03; margin-top: 0; font-size: 20px; font-weight: bold;">${subject}</h2>
          <p style="color: #451a03; font-size: 15px; line-height: 1.6;">${message}</p>
        </div>
        <div style="background-color: #fffbeb; padding: 20px; text-align: center; border-top: 1px solid #fef3c7;">
          <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">Regards,<br/><strong>Artisan's Corner Team</strong></p>
        </div>
      </div>`
    };

    if (smtpUser && smtpPass) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 [REAL EMAIL DELIVERED TO INBOX] Message ID: ${info.messageId} to ${email}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`\n==================================================`);
      console.log(`📧 [EMAIL DISPATCHED TO: ${email}]`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`MESSAGE CONTENT:\n${message}`);
      console.log(`💡 NOTE: Set EMAIL_USER & EMAIL_PASSWORD in server/.env to send real emails to your Gmail inbox!`);
      console.log(`==================================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Error delivering email via Nodemailer:', error.message);
    console.log(`\n==================================================`);
    console.log(`📧 [FALLBACK EMAIL LOG FOR: ${email}]`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT:\n${message}`);
    console.log(`==================================================\n`);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
