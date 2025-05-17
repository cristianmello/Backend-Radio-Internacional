// controllers/users/forgotPassword.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const redisClient = require('../../services/RedisClient');
const User = require('../../models/User');
const nodemailer = require('nodemailer');
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

const forgotPassword = async (req, res) => {
  const { user_mail } = req.body;
  const user = await User.findOne({ where: { user_mail } });

  // Siempre respondemos 200 para no filtrar emails
  if (!user) {
    return res.status(200).json({ status: 'success', message: 'Si existe, enviaremos un email.' });
  }

  // 1) Limpiar tokens de reset previos de este usuario
  const keys = await redisClient.keys('reset_*');
  for (let key of keys) {
    const code = await redisClient.get(key);
    if (code === user.user_code) {
      await redisClient.del(key);
    }
  }

  // 2) Generar nuevo token y guardarlo
  const resetToken = crypto.randomBytes(32).toString('hex');
  await redisClient.set(`reset_${resetToken}`, user.user_code, 'EX', 60 * 60); // 1 hora

  // 3) Enviar email
  const link = `${CLIENT_URL}/reset-password?token=${resetToken}`;
  await mailTransporter.sendMail({
    to: user_mail,
    subject: 'Restablece tu contraseña',
    html: `
      <p>Hola ${user.user_name || ''},</p>
      <p>Para restablecer tu contraseña haz clic <a href="${link}">aquí</a>. Este enlace expira en 1 hora.</p>
    `
  });

  return res.status(200).json({ status: 'success', message: 'Si existe, enviaremos un email.' });
};

module.exports = forgotPassword;
