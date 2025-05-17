/*const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createToken, createRefreshToken } = require('../services/Jwt');
const asyncHandler = require('../utils/AsyncHandler');
const redisClient = require('../services/RedisClient');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// Configurar transportador de correo
const mailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_PORT == 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});


// 1) Registrar un nuevo usuario
const _register = async (req, res) => {
  const t = await User.sequelize.transaction();
  try {
    const {
      user_name,
      user_lastname,
      user_birth,
      user_mail,
      user_phone,
      user_password,
      role_code,
      is_vip = false
    } = req.body;

    // Evita doble consulta con findOrCreate
    const [newUser, created] = await User.findOrCreate({
      where: { user_mail },
      defaults: {
        user_name,
        user_lastname,
        user_birth,
        user_phone,
        user_password,
        role_code,
        is_vip
      },
      transaction: t
    });

    if (!created) {
      return res.status(409).json({
        status: 'error',
        message: 'El correo electrónico ya está registrado. Si olvidaste tu contraseña, puedes restablecerla.'
      });
    }


    const verifyToken = crypto.randomBytes(32).toString('hex');
    // Guarda en Redis: llaves compliadas con prefijo
    await redisClient.set(`verify_${verifyToken}`, newUser.user_code, 'EX', 24 * 3600);

    const link = `${CLIENT_URL}/verify-email?token=${verifyToken}`;
    await mailTransporter.sendMail({
      to: newUser.user_mail,
      subject: '¡Confirma tu correo y activa tu cuenta!',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2c3e50;">🎉 ¡Bienvenido a nuestra comunidad!</h2>
      <p>Hola <strong>${newUser.user_name || 'usuario'}</strong>,</p>
      <p>Gracias por registrarte. Para completar tu registro, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background-color: #3498db; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">✅ Verificar mi correo</a>
      </div>
      <p>Si no fuiste tú quien se registró, puedes ignorar este mensaje.</p>
      <hr style="margin: 40px 0;">
      <p style="font-size: 12px; color: #888;">Este enlace expirará en 24 horas por tu seguridad.</p>
      <p style="font-size: 12px; color: #888;">Radio Internacional Rivera © ${new Date().getFullYear()}</p>
    </div>
  `
    });


    const userResponse = (({ user_code, user_name, user_lastname, user_mail, role_code, is_vip }) =>
      ({ user_code, user_name, user_lastname, user_mail, role_code, is_vip }))(newUser);

    await t.commit();

    res.status(201).json({
      status: 'success',
      message: 'Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.',
      user: userResponse
    });
  } catch (err) {
    await t.rollback();
    console.error('[Auth][Register]', err);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor.'
    });
  }
};

Re

// 3) Renovar access token usando refresh token
const _refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refresh_token;
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Refresh token requerido.'
    });
  }

  let payload;
  try {
    payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Refresh token inválido o expirado.'
    });
  }


  // Verificar si este jti ya fue revocado
  const isRevoked = await redisClient.get(`bl_rt_${payload.jti}`);
  if (isRevoked === 'true') {
    return res.status(401).json({
      status: 'error',
      message: 'Refresh token revocado.'
    });
  }


  // Buscar usuario
  const user = await User.findByPk(payload.sub || payload.user_code, {
    attributes: ['user_code', 'user_mail', 'role_code']
  });
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Usuario no encontrado.'
    });
  }

  const newAccessToken = createToken(user);
  res.status(200).json({
    status: 'success',
    message: 'Token renovado correctamente.',
    token: newAccessToken
  });
};

// 4) Logout
const _logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
      // Revocar en Redis
      await redisClient.set(`bl_rt_${payload.jti}`, true, 'EX', 60 * 60 * 24 * 30);
    } catch {
      // si no pudo verificar, igual limpiamos cookie
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ status: 'success', message: 'Sesión cerrada correctamente.' });
};

// 5) Revoke a specific refresh token (admin)
const _revokeRefreshToken = async (req, res) => {
  const { jti } = req.body;
  if (!jti) {
    return res.status(400).json({ status: 'error', message: 'Falta jti.' });
  }
  await redisClient.set(`bl_rt_${jti}`, true, 'EX', 60 * 60 * 24 * 30);
  res.json({ status: 'success', message: 'Refresh token revocado.' });
};

// 6) Forgot password
const _forgotPassword = async (req, res) => {
  const { user_mail } = req.body;
  const user = await User.findOne({ where: { user_mail } });
  if (!user) {
    return res.status(200).json({ status: 'success', message: 'Si existe, enviaremos un email.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  await redisClient.set(`reset_${resetToken}`, user.user_code, 'EX', 3600);

  const link = `${CLIENT_URL}/reset-password?token=${resetToken}`;
  await mailTransporter.sendMail({
    to: user_mail,
    subject: 'Restablece tu contraseña',
    html: `Haz click <a href="${link}">aquí</a> para restablecer tu contraseña.`
  });

  res.json({ status: 'success', message: 'Email de restablecimiento enviado.' });
};

// 7) Reset password
const _resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const userCode = await redisClient.get(`reset_${token}`);
  if (!userCode) {
    return res.status(400).json({ status: 'error', message: 'Token inválido o expirado.' });
  }
  const user = await User.findByPk(userCode);
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
  }

  const salt = await bcrypt.genSalt(12);
  user.user_password = await bcrypt.hash(newPassword, salt);
  await user.save();
  await redisClient.del(`reset_${token}`);

  res.json({ status: 'success', message: 'Contraseña actualizada correctamente.' });
};

// 8) Send verification email
const _sendVerificationEmail = async (req, res) => {
  const { user_mail } = req.body;
  const user = await User.findOne({ where: { user_mail } });
  if (!user) {
    return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');
  await redisClient.set(`verify_${verifyToken}`, user.user_code, 'EX', 86400);

  const link = `${CLIENT_URL}/verify-email?token=${verifyToken}`;
  await mailTransporter.sendMail({
    to: user_mail,
    subject: 'Verifica tu correo',
    html: `Haz click <a href="${link}">aquí</a> para verificar tu cuenta.`
  });

  res.json({ status: 'success', message: 'Email de verificación enviado.' });
};

// 9) Verify email
const _verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Token inválido.' });
    }

    const userCode = await redisClient.get(`verify_${token}`);
    if (!userCode) {
      return res.status(400).json({ status: 'error', message: 'Token inválido o expirado.' });
    }

    const user = await User.findByPk(userCode);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
    }

    user.is_verified = true;
    await user.save();
    await redisClient.del(`verify_${token}`);

    res.json({ status: 'success', message: 'Email verificado correctamente.' });

  } catch (error) {
    console.error('Error al verificar correo:', error);
    res.status(500).json({ status: 'error', message: 'Error del servidor' });
  }
};


// 10) Change password (autenticado)
const _changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.sub);
  const match = await bcrypt.compare(oldPassword, user.user_password);
  if (!match) {
    return res.status(401).json({ status: 'error', message: 'Contraseña actual incorrecta.' });
  }
  const salt = await bcrypt.genSalt(12);
  user.user_password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({ status: 'success', message: 'Contraseña cambiada correctamente.' });
};

// 11) Profile endpoints
const _getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.sub, {
    attributes: { exclude: ['user_password'] }
  });
  res.json({ status: 'success', data: user });
};

const _updateProfile = async (req, res) => {
  const updates = (({ user_name, user_lastname, user_birth, user_phone }) =>
    ({ user_name, user_lastname, user_birth, user_phone }))(req.body);

  await User.update(updates, { where: { user_code: req.user.sub } });
  res.json({ status: 'success', message: 'Perfil actualizado.' });
};

const _deleteAccount = async (req, res) => {
  await User.destroy({ where: { user_code: req.user.sub } });
  res.json({ status: 'success', message: 'Cuenta eliminada.' });
};

module.exports = {
  register: asyncHandler(_register),
  login: asyncHandler(_login),
  refreshToken: asyncHandler(_refreshToken),
  logout: asyncHandler(_logout),
  revokeRefreshToken: asyncHandler(_revokeRefreshToken),
  forgotPassword: asyncHandler(_forgotPassword),
  resetPassword: asyncHandler(_resetPassword),
  sendVerificationEmail: asyncHandler(_sendVerificationEmail),
  verifyEmail: asyncHandler(_verifyEmail),
  changePassword: asyncHandler(_changePassword),
  getProfile: asyncHandler(_getProfile),
  updateProfile: asyncHandler(_updateProfile),
  deleteAccount: asyncHandler(_deleteAccount),

};
*/