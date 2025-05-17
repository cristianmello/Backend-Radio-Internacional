const User = require('../../models/user');
const bcrypt = require('bcrypt');
const redisClient = require('../../services/redisclient');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const CLIENT_URL = process.env.CLIENT_URL;

const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


// 1) Registrar un nuevo usuario
const register = async (req, res) => {
    const t = await User.sequelize.transaction();
    try {
        const {
            user_name,
            user_lastname,
            user_birth,
            user_mail,
            user_phone,
            user_password,
            role_code
        } = req.body;

        const is_vip = false;


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

module.exports = register;
