const crypto = require('crypto');
const redisClient = require('../../services/redisclient');
const User = require('../../models/user');
const nodemailer = require('nodemailer');
const PasswordResetLog = require('../../models/forgotpasswordlog');

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
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,   // 30 segundos  
  socketTimeout: 75000      // 75 segundos  
});

const forgotPassword = async (req, res) => {
  console.log(`[LOG] Iniciando proceso de forgotPassword para: ${req.body.user_mail}`);

  const { user_mail } = req.body;

  try {
    const user = await User.findOne({ where: { user_mail } });

    // Se responde éxito para no filtrar emails
    if (!user) {
      console.log(`[LOG] Usuario no encontrado. Respondiendo 200 para no filtrar información.`);

      return res.status(200).json({
        status: 'success',
        message: 'Si existe, enviaremos un email con instrucciones.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Si existe una cuenta con ese correo, se enviarán instrucciones...'
    });

    console.log(`[LOG] Usuario ${user_mail} encontrado. Generando token...`);

    const userCode = user.user_code;

    // Registrar log de intento de recuperación
    await PasswordResetLog.create({
      user_code: userCode,
      user_mail,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    // Limpiar token anterior (si existe)
    const oldToken = await redisClient.get(`reset_user_${userCode}`);
    if (oldToken) {
      await redisClient.del(`reset_token_${oldToken}`);
    }

    // Generar nuevo token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Guardar token en Redis (asociado al user y al token)
    await redisClient.set(`reset_user_${userCode}`, resetToken, 'EX', 60 * 60); // 1 hora
    await redisClient.set(`reset_token_${resetToken}`, userCode, 'EX', 60 * 60);

    const requestOrigin = req.get('origin');
    const allowedOrigins = [CLIENT_URL, 'https://front-radio-internacional.pages.dev'];

    // Construir el link de recuperación
    const baseUrl = (requestOrigin && allowedOrigins.includes(requestOrigin))
      ? requestOrigin
      : CLIENT_URL;

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    console.log(`[LOG] Preparado para enviar email. La API se detendrá aquí hasta que Brevo responda...`);

    // Enviar email
    await mailTransporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_ADDRESS}>`,
      to: user_mail,
      subject: '🔑 Restablece tu contraseña',
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="color: #007bff;">Restablece tu contraseña</h2>
      <p>Hola <b>${user.user_name || ''}</b>,</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">Restablecer contraseña</a>
      <p>Este enlace expirará en <b>1 hora</b>.</p>
      <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      <hr>
      <p style="font-size: 12px; color: #999;">Este es un mensaje automático. No respondas a este correo.</p>
    </div>
  `
    });

    console.log(`[LOG] Email enviado con éxito (respuesta de Brevo recibida). Preparando para enviar respuesta al cliente...`);

  } catch (err) {
    console.error('[ERROR] Ocurrió un error en el proceso de forgotPassword:', err);

    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.error('[SMTP ERROR] Problema de conectividad con servidor de email');
    }

    return res.status(200).json({
      status: 'success',
      message: 'Si existe, enviaremos un email con instrucciones.'
    });
  }
};

module.exports = forgotPassword;
