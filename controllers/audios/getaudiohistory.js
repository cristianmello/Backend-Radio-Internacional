// src/controllers/audios/getAudioHistory.js
const { Op } = require('sequelize');
const User = require('../../models/user');
const AudioLog = require('../../models/audio_log');
const Audio = require('../../models/audios');

const getAudioHistory = async (req, res) => {
  try {
    const {
      user_id,
      audio_id,
      action,
      from,
      to,
      page = 1,
      limit = 10
    } = req.query;

    const where = {};

    if (user_id) where.user_id = parseInt(user_id, 10);
    if (audio_id) where.audio_id = parseInt(audio_id, 10);
    if (action) where.action = action; // 'create'|'update'|'delete'

    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp[Op.gte] = new Date(from);
      if (to) where.timestamp[Op.lte] = new Date(to);
    }

    const parsedLimit = Math.max(parseInt(limit, 10), 1);
    const parsedPage = Math.max(parseInt(page, 10), 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await AudioLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'user_name', 'user_mail']
        },
        {
          model: Audio,
          as: 'audio',
          attributes: ['audio_code', 'audio_title']
        }
      ],
      limit: parsedLimit,
      offset,
      order: [['timestamp', 'DESC']]
    });

    return res.json({
      total: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      logs: rows
    });
  } catch (error) {
    console.error('[Audios][History]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener el historial de notas de audio.'
    });
  }
};

module.exports = getAudioHistory;
