const redisClient = require('../../services/redisclient');
const nodemailer = require('nodemailer');
const User = require('../../models/user');
const crypto = require('crypto');

const {
  CLIENT_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS
} = process.env;

const mailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_PORT == 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

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

    const link = `${CLIENT_URL}/verify-email?token=${verifyToken}`;
    await mailTransporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_ADDRESS}>`,
      to: user_mail,
      subject: 'Verifica tu correo',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>📧 Verificación de correo</h2>
          <p>Hola ${user.user_name || ''},</p>
          <p>Para verificar tu cuenta haz clic en el siguiente enlace:</p>
          <p><a href="${link}" style="color: #1a73e8;">Verificar correo</a></p>
          <p>Este enlace expirará en 24 horas.</p>
        </div>
      `
    });

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
