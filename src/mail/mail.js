/**
 * Mail Service
 * Handles email sending using nodemailer
 */

import nodemailer from 'nodemailer';

/**
 * @typedef {Object} MailConfig
 * @property {string} host - SMTP host
 * @property {number} port - SMTP port
 * @property {boolean} secure - Use TLS
 * @property {Object} auth - Authentication credentials
 * @property {string} auth.user - SMTP username
 * @property {string} auth.pass - SMTP password
 */

/**
 * @typedef {Object} MailOptions
 * @property {string} from - Sender email address
 * @property {string|string[]} to - Recipient email address(es)
 * @property {string} [cc] - CC email address(es)
 * @property {string} [bcc] - BCC email address(es)
 * @property {string} subject - Email subject
 * @property {string} [text] - Plain text body
 * @property {string} [html] - HTML body
 * @property {Array} [attachments] - Email attachments
 */

/**
 * @typedef {Object} MailResponse
 * @property {boolean} success - Whether the email was sent successfully
 * @property {string} [messageId] - Message ID if successful
 * @property {string} [error] - Error message if failed
 */

/**
 * Create email transporter
 * @returns {nodemailer.Transporter} Nodemailer transporter
 */
function createTransporter() {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    return nodemailer.createTransport(config);
}

/**
 * Send an email
 * @param {MailOptions} options - Email options
 * @returns {Promise<MailResponse>} Send result
 */
export async function sendMail(options) {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER,
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments
        };

        const info = await transporter.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send a welcome email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<MailResponse>} Send result
 */
export async function sendWelcomeEmail(to, name) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>¡Bienvenido!</h1>
                </div>
                <div class="content">
                    <h2>Hola ${name},</h2>
                    <p>Gracias por unirte a nosotros. Estamos emocionados de tenerte con nosotros.</p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendMail({
        to,
        subject: '¡Bienvenido a nuestra plataforma!',
        html
    });
}

/**
 * Send a password reset email
 * @param {string} to - Recipient email
 * @param {string} resetLink - Password reset link
 * @returns {Promise<MailResponse>} Send result
 */
export async function sendPasswordResetEmail(to, resetLink) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Restablecer Contraseña</h1>
                </div>
                <div class="content">
                    <p>Has solicitado restablecer tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <p style="text-align: center;">
                        <a href="${resetLink}" class="button">Restablecer Contraseña</a>
                    </p>
                    <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                    <p><strong>Nota:</strong> Este enlace expirará en 1 hora.</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendMail({
        to,
        subject: 'Restablecer tu contraseña',
        html
    });
}

/**
 * Send an order confirmation email
 * @param {string} to - Recipient email
 * @param {Object} order - Order details
 * @param {string} order.id - Order ID
 * @param {Array} order.items - Order items
 * @param {number} order.total - Order total
 * @returns {Promise<MailResponse>} Send result
 */
export async function sendOrderConfirmationEmail(to, order) {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #FF9800; color: white; padding: 10px; text-align: left; }
                .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Confirmación de Pedido</h1>
                </div>
                <div class="content">
                    <h2>Pedido #${order.id}</h2>
                    <p>Gracias por tu compra. Aquí están los detalles de tu pedido:</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th style="text-align: center;">Cantidad</th>
                                <th style="text-align: right;">Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <div class="total">
                        Total: $${order.total.toFixed(2)}
                    </div>
                    <p>Recibirás una notificación cuando tu pedido sea enviado.</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendMail({
        to,
        subject: `Confirmación de Pedido #${order.id}`,
        html
    });
}

/**
 * Send a notification email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Notification message
 * @returns {Promise<MailResponse>} Send result
 */
export async function sendNotificationEmail(to, subject, message) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Notificación</h1>
                </div>
                <div class="content">
                    <p>${message}</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendMail({
        to,
        subject,
        html
    });
}

/**
 * Check if mail service is configured
 * @returns {boolean}
 */
export function isConfigured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export default {
    sendMail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendNotificationEmail,
    isConfigured
};
