// src/controllers/contact/sendContactEmail.js

const nodemailer = require('nodemailer');

// Reutilizamos la configuración de Brevo que ya tienes en tus variables de entorno
const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    ADMIN_EMAIL // El correo donde se recibira los mensajes de contacto
} = process.env;

// Reutilizamos el transporter de nodemailer
const mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_PORT == 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
});

const sendContactEmail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validación simple en el backend
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'Todos los campos son obligatorios.'
            });
        }

        // --- Configuración del Correo a Enviar ---
        await mailTransporter.sendMail({
            from: '"Radio Internacional - Contacto" <mellocristian44@gmail.com>',

            to: ADMIN_EMAIL,

            subject: `Nuevo Mensaje de Contacto: ${subject}`,


            replyTo: email,

            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #e0e0e0; padding: 25px; border-radius: 10px; max-width: 600px; margin: auto;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Nuevo Mensaje desde tu Sitio Web</h2>
                    <p style="font-size: 16px;">Has recibido un nuevo mensaje a través del formulario de contacto.</p>
                    <div style="background-color: #f4f7f6; padding: 20px; border-radius: 8px;">
                        <p style="margin: 10px 0;"><strong>Nombre:</strong> ${name}</p>
                        <p style="margin: 10px 0;"><strong>Email del remitente:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p style="margin: 10px 0;"><strong>Asunto:</strong> ${subject}</p>
                        <p style="margin: 10px 0;"><strong>Mensaje:</strong></p>
                        <p style="margin: 0; line-height: 1.6;">
                            ${message.replace(/\n/g, "<br>")}
                        </p>
                    </div>
                    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
                        Este correo fue enviado automáticamente desde el formulario de contacto de Radio Internacional.
                    </p>
                </div>
            `
        });

        return res.status(200).json({
            status: 'success',
            message: '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.'
        });

    } catch (err) {
        console.error('[ContactForm][SendEmail]', err);
        return res.status(500).json({
            status: 'error',
            message: 'Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.'
        });
    }
};

module.exports = sendContactEmail;