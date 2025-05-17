const express = require('express');
const router = express.Router();

const validateComment = require('../validators/validateComment');
const checkOffensiveLanguage = require('../middlewares/checkOffensiveLanguage');
const handleValidationErrors = require('../middlewares/handleValidationErrors');

// Ruta para publicar un comentario
router.post(
  '/comment',
  validateComment,
  handleValidationErrors,
  checkOffensiveLanguage('comment_content'),
  async (req, res) => {
    try {
      const { comment_content, comment_article_id, comment_user_id } = req.body;

      // Guardar comentario en la base de datos aquí
      // await Comment.create({ ... });

      res.status(201).json({
        status: 'success',
        message: 'Comentario publicado correctamente'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;
