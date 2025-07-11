// Este objeto define las dimensiones estándar para cada tipo de formato de anuncio.
// Los nombres ('mrec', 'leaderboard', etc.) son los valores que se enviam
// desde el campo 'ad_format' del formulario de administración.

const AD_FORMATS = {
    // Medium Rectangle (el más común)
    'mrec': { width: 338, height: 225, fit: 'cover' },

    'large-rectangle': { width: 780, height: 90, fit: 'cover' },

    'skyscraper': { width: 338, height: 600, fit: 'cover' },

    'square': { width: 338, height: 338, fit: 'cover' },

    'default': { width: 800, height: 800, fit: 'inside' },

    'biglarge-rectangle': { width: 970, height: 200, fit: 'cover' },

    'vertical': { width: 330, height: 350, fit: 'cover' },
};

module.exports = AD_FORMATS;


/*const AD_FORMATS = {
    // Medium Rectangle (el más común)
    'mrec': { width: 300, height: 250, fit: 'cover' },
    // Large Rectangle
    'large-rectangle': { width: 336, height: 280, fit: 'cover' },
    // Leaderboard (banner superior)
    'leaderboard': { width: 728, height: 90, fit: 'cover' },
    // Skyscraper (rascacielos lateral)
    'skyscraper': { width: 160, height: 600, fit: 'cover' },
    // Square
    'square': { width: 250, height: 250, fit: 'cover' },
    // Default o fallback si no se especifica formato
    'default': { width: 800, height: 800, fit: 'inside' }
};

module.exports = AD_FORMATS;
*/