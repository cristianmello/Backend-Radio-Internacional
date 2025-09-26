const redisClient = require('../../services/redisclient');
const nodemailer = require('nodemailer');
const User = require('../../models/user');
const crypto = require('crypto');

const {
  CLIENT_URL,
  SMTP_FROM_NAME,
  SMTP_FROM_ADDRESS
} = process.env;

const sendEmailViaAPI = async (to, subject, htmlContent) => {
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
      htmlContent: htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

const sendVerificationEmail = async (req, res) => {
  try {
    const { user_mail } = req.body;

    if (!user_mail || typeof user_mail !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Correo inválido.' });
    }

    const user = await User.findOne({ where: { user_mail } });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    await redisClient.set(`verify_${verifyToken}`, user.user_code, 'EX', 24 * 60 * 60);

    const requestOrigin = req.get('origin');


    const baseUrl = (requestOrigin && [CLIENT_URL, 'https://front-radio-internacional.pages.dev'].includes(requestOrigin))
      ? requestOrigin
      : CLIENT_URL;

    const link = `${baseUrl}/verify-email?token=${verifyToken}`;
    try {
      await sendEmailViaAPI(
        user_mail,
        'Verifica tu correo',
        `  
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">  
          <h2>📧 Verificación de correo</h2>  
          <p>Hola ${user.user_name || ''},</p>  
          <p>Para verificar tu cuenta haz clic en el siguiente enlace:</p>  
          <p><a href="${link}" style="color: #1a73e8;">Verificar correo</a></p>  
          <p>Este enlace expirará en 24 horas.</p>  
        </div>  
        `
      );
    } catch (emailError) {
      console.error('[API ERROR] Email de verificación falló:', emailError.message);
      // Continuar sin fallar - el usuario puede reenviar el email después  
    }

    return res.json({
      status: 'success',
      message: 'Email de verificación enviado.'
    });

  } catch (err) {
    console.error('[User][SendVerificationEmail]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Error al enviar el correo de verificación.'
    });
  }
};

module.exports = sendVerificationEmail;
