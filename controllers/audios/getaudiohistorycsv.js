// src/controllers/audios/getAudioHistoryCSV.js
const { Op } = require('sequelize');
const AudioLog = require('../../models/audio_log');
const Audio = require('../../models/audios');
const User = require('../../models/user');
const { Parser } = require('json2csv');

const getAudioHistoryCSV = async (req, res) => {
    try {
        const { user_id, audio_id, action, from, to } = req.query;
        const where = {};

        if (user_id) where.user_id = parseInt(user_id, 10);
        if (audio_id) where.audio_id = parseInt(audio_id, 10);
        if (action) where.action = action;

        if (from || to) {
            where.timestamp = {
                ...(from && { [Op.gte]: new Date(from) }),
                ...(to && { [Op.lte]: new Date(to) }),
            };
        }

        const logs = await AudioLog.findAll({
            where,
            limit: 10000,
            include: [
                { model: User, as: 'user', attributes: ['user_name', 'user_mail'] },
                { model: Audio, as: 'audio', attributes: ['audio_title'] }
            ],
            order: [['timestamp', 'DESC']]
        });

        if (!logs.length) {
            return res.status(404).json({ message: 'No se encontraron registros de historial de notas de audio' });
        }

        const mapped = logs.map(log => ({
            Usuario: `${log.user?.user_name || 'Desconocido'} (${log.user?.user_mail || 'N/A'})`,
            'Nota de audio': log.audio?.audio_title || 'N/A',
            Acción: log.action,
            Detalles: log.details || '',
            Fecha: log.timestamp.toLocaleString('es-UY'),
        }));

        const parser = new Parser();
        const csv = parser.parse(mapped);
        const today = new Date().toISOString().split('T')[0];
        const fileName = `historial-audios-${today}.csv`;

        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        return res.send(csv);
    } catch (error) {
        console.error('Error al exportar CSV de historial de notas de audio:', error);
        return res.status(500).json({ message: 'Error interno del servidor al generar el CSV' });
    }
};

module.exports = getAudioHistoryCSV;
