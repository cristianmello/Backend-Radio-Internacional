const User = require('../../models/user');
const redisClient = require('../../services/redisclient');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const RegisterLog = require('../../models/registerlog');

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
        } = req.body;

        const is_vip = false;
        const fixedRole = 1; // siempre user

        // Evita doble consulta con findOrCreate
        const [newUser, created] = await User.findOrCreate({
            where: { user_mail },
            defaults: {
                user_name,
                user_lastname,
                user_birth,
                user_phone,
                user_password,
                role_code: fixedRole,
                is_vip,
            },
            transaction: t,
        });

        if (!created) {
            await t.rollback();
            return res.status(409).json({
                status: 'error',
                message:
                    'El correo electrónico ya está registrado. Si olvidaste tu contraseña, puedes restablecerla.',
            });
        }

        const verifyToken = crypto.randomBytes(32).toString('hex');
        await redisClient.set(`verify_${verifyToken}`, newUser.user_code, 'EX', 24 * 3600);

        const requestOrigin = req.get('origin');

        const baseUrl = (requestOrigin && [CLIENT_URL, 'https://front-radio-internacional.pages.dev'].includes(requestOrigin))
            ? requestOrigin
            : CLIENT_URL;

        const link = `${baseUrl}/verify-email?token=${verifyToken}`;
        try {
            await sendEmailViaAPI(
                newUser.user_mail,
                '¡Confirma tu correo y activa tu cuenta!',
                `  
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">  
                  <h2 style="color: #2c3e50;">🎉 ¡Bienvenido a nuestra comunidad!</h2>  
                  <p>Hola <strong>${newUser.user_name || 'usuario'}</strong>,</p>  
                  <p>Gracias por registrarte. Para completar tu registro, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:</p>  
                  <div style="text-align: center; margin: 30px 0;">  
                    <a href="${link}" style="background-color: #3498db; color: white; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">  
                      ✅ Verificar mi correo  
                    </a>  
                  </div>  
                  <p>Si no fuiste tú quien se registró, puedes ignorar este mensaje.</p>  
                  <hr style="margin: 40px 0;">  
                  <p style="font-size: 12px; color: #888;">Este enlace expirará en 24 horas por tu seguridad.</p>  
                  <p style="font-size: 12px; color: #888;">Radio Internacional Rivera © ${new Date().getFullYear()}</p>  
                </div>  
                `
            );
        } catch (emailError) {
            console.error('[API ERROR] Email de verificación falló:', emailError.message);
            // Continuar sin fallar - el usuario puede reenviar el email después  
        }

        await RegisterLog.create({
            user_code: newUser.user_code,
            user_mail: newUser.user_mail,
            ip_address: req.ip || null,
            user_agent: req.get('User-Agent') || null,
            register_time: new Date(),
        }, { transaction: t });

        await t.commit();

        const userResponse = (({ user_code, user_name, user_lastname, user_mail, role_code, is_vip }) => ({
            user_code,
            user_name,
            user_lastname,
            user_mail,
            role_code,
            is_vip,
        }))(newUser);

        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.',
            user: userResponse,
        });
    } catch (err) {
        await t.rollback();
        console.error('[Auth][Register]', err);
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor.',
        });
    }
};

module.exports = register;
