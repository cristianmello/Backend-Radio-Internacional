// src/controllers/contact/sendContactEmail.js

const nodemailer = require('nodemailer');

// Reutilizamos la configuración de Brevo que ya tienes en tus variables de entorno
const {
    ADMIN_EMAIL,
    SMTP_FROM_NAME,
    SMTP_FROM_ADDRESS   // El correo donde se recibira los mensajes de contacto
} = process.env;

// Reutilizamos el transporter de nodemailer
const sendEmailViaAPI = async (to, subject, htmlContent, replyTo) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: SMTP_FROM_NAME,
                email: SMTP_FROM_ADDRESS
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent,
            replyTo: { email: replyTo }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
};

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
        try {
            await sendEmailViaAPI(
                ADMIN_EMAIL,
                `Nuevo Mensaje de Contacto: ${subject}`,
                `  
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
                `,
                email
            );
        } catch (emailError) {
            console.error('[API ERROR] Email de contacto falló:', emailError.message);
            // Continuar sin fallar  
        }

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