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

const sendEmailViaAPI = async (to, subject, htmlContent) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': "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",
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

console.log('[ENV VARS] CLIENT_URL:', CLIENT_URL);
console.log('[ENV VARS] SMTP_HOST:', SMTP_HOST);
console.log('[ENV VARS] SMTP_PORT:', SMTP_PORT);
console.log('[ENV VARS] SMTP_USER:', SMTP_USER);
console.log('[ENV VARS] SMTP_PASS:', SMTP_PASS ? '***CONFIGURADO***' : 'NO_CONFIGURADO');
console.log('[ENV VARS] SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME);
console.log('[ENV VARS] SMTP_FROM_ADDRESS:', process.env.SMTP_FROM_ADDRESS);

const mailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  connectionTimeout: 60000, // 60 segundos
  greetingTimeout: 30000,   // 30 segundos  
  socketTimeout: 75000      // 75 segundos  
});

console.log('[TRANSPORTER CONFIG] Host:', SMTP_HOST);
console.log('[TRANSPORTER CONFIG] Port:', Number(SMTP_PORT));
console.log('[TRANSPORTER CONFIG] Secure:', Number(SMTP_PORT) === 465);
console.log('[TRANSPORTER CONFIG] Auth User:', SMTP_USER);


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

    console.log('[EMAIL CONFIG] From Name:', process.env.SMTP_FROM_NAME);
    console.log('[EMAIL CONFIG] From Address:', process.env.SMTP_FROM_ADDRESS);
    console.log('[EMAIL CONFIG] To:', user_mail);
    console.log('[EMAIL CONFIG] Reset Link:', resetLink);

    console.log('[RAILWAY ENV] NODE_ENV:', process.env.NODE_ENV);
    console.log('[RAILWAY ENV] PORT:', process.env.PORT);
    console.log('[RAILWAY ENV] RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);

    try {
      await sendEmailViaAPI(
        user_mail,
        '🔑 Restablece tu contraseña',
        `  
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
      );

      console.log(`[LOG] Email enviado con éxito vía API de Brevo`);
    } catch (emailError) {
      console.error('[API ERROR] Email falló:', emailError.message);
      // Continuar sin fallar  
    }

    return res.status(200).json({
      status: 'success',
      message: 'Si existe una cuenta con ese correo, se enviarán instrucciones...'
    });

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
