const forbiddenWords = [
  'idiota', 'estúpido', 'imbécil', 'mierda',
  'puta', 'maldito', 'basura', 'asqueroso'
];

const checkOffensiveLanguage = (field) => {
  return (req, res, next) => {
    const value = req.body[field];

    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      const hasOffensive = forbiddenWords.some(word => normalized.includes(word));

      if (hasOffensive) {
        return res.status(400).json({
          status: 'error',
          message: `El campo '${field}' contiene lenguaje ofensivo o inapropiado`
        });
      }
    }

    next();
  };
};

module.exports = checkOffensiveLanguage;
