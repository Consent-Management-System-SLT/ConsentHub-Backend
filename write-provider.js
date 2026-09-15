const fs = require('fs');

const code = 
const nodemailer = require('nodemailer');
const BaseProvider = require('./BaseProvider');

class NodemailerProvider extends BaseProvider {
  constructor() {
    super('NODEMAILER_SMTP');
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Missing required SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS)');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });
  }

  async deliver({ customer, subject, content }) {
    if (!customer.email) {
      return { success: false, error: new Error('MISSING_CUSTOMER_EMAIL') };
    }

    try {
      const fromName = process.env.SMTP_FROM_NAME || 'SLT ConsentHub';
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@sltmobitel.lk';
      const info = await this.transporter.sendMail({
        from: \"\" <\>\,
        to: customer.email,
        subject: subject || 'ConsentHub Notification',
        text: content,
        html: \<p>\</p>\
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error
      };
    }
  }

  async sendConsentRequest(customer, requestContext) {
    if (!customer.email) return { success: false, error: new Error('MISSING_CUSTOMER_EMAIL') };

    const subject = \Consent Request from \ via SLT ConsentHub\;
    const content = \
\ would like your permission to send you promotional communications through SLT.

Purpose: \
Requested Channel: \
Valid Until: \

To review this request, log in to ConsentHub and open:
Partner Permissions
\;

    try {
      const fromName = process.env.SMTP_FROM_NAME || 'SLT ConsentHub';
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@sltmobitel.lk';
      const info = await this.transporter.sendMail({
        from: \"\" <\>\,
        to: customer.email,
        subject: subject,
        text: content,
        html: \<p>\</p>\
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}

module.exports = new NodemailerProvider();
;

fs.writeFileSync('services/messaging/NodemailerProvider.js', code.trim());
