const { Op } = require('sequelize');
const sequelize = require('../database/connection');

const LoginLog = require('../models/loginlog');
const ForgotPasswordLog = require('../models/forgotpasswordlog');
const PasswordChangeLog = require('../models/passwordchangelog');
const ProfileChangeLog = require('../models/profilechangelog');
const RegisterLog = require('../models/registerlog');

const cleanOldLogs = async () => {
    try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const deletedLoginLogs = await LoginLog.destroy({
            where: { login_time: { [Op.lt]: threeMonthsAgo } }
        });

        const deletedForgotPasswordLogs = await ForgotPasswordLog.destroy({
            where: { requested_at: { [Op.lt]: threeMonthsAgo } }
        });

        const deletedPasswordChangeLogs = await PasswordChangeLog.destroy({
            where: { created_at: { [Op.lt]: threeMonthsAgo } }
        });

        const deletedProfileChangeLogs = await ProfileChangeLog.destroy({
            where: { changed_at: { [Op.lt]: threeMonthsAgo } }
        });

        const deletedRegisterLogs = await RegisterLog.destroy({
            where: { register_time: { [Op.lt]: threeMonthsAgo } }
        });

        console.log(`LoginLogs eliminados: ${deletedLoginLogs}`);
        console.log(`ForgotPasswordLogs eliminados: ${deletedForgotPasswordLogs}`);
        console.log(`PasswordChangeLogs eliminados: ${deletedPasswordChangeLogs}`);
        console.log(`ProfileChangeLogs eliminados: ${deletedProfileChangeLogs}`);
        console.log(`RegisterLogs eliminados: ${deletedRegisterLogs}`);

    } catch (error) {
        console.error('Error limpiando logs antiguos:', error);
    } finally {
        await sequelize.close();
    }
};

cleanOldLogs();
