// controllers/users/sendVerificationEmail.js
const redisClient = require('../../services/RedisClient');
const nodemailer = require('nodemailer');
const User = require('../../models/User');
const crypto = require('crypto');
require('dotenv').config();

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
  const { user_mail } = req.body;
  const user = await User.findOne({ where: { user_mail } });
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
  }

  // Eliminar tokens previos de este usuario
  const keys = await redisClient.keys('verify_*');
  for (let key of keys) {
    const code = await redisClient.get(key);
    if (code === user.user_code) {
      await redisClient.del(key);
    }
  }

  // Generar nuevo token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  await redisClient.set(`verify_${verifyToken}`, user.user_code, 'EX', 24 * 60 * 60);

  const link = `${CLIENT_URL}/verify-email?token=${verifyToken}`;
  await mailTransporter.sendMail({
    to: user_mail,
    subject: 'Verifica tu correo',
    html: `
      <p>Hola ${user.user_name || ''},</p>
      <p>Para verificar tu cuenta haz clic <a href="${link}">aquí</a>.</p>
      <p>Este enlace expirará en 24 horas.</p>
    `
  });

  res.json({ status: 'success', message: 'Email de verificación enviado.' });
};

module.exports = sendVerificationEmail;
