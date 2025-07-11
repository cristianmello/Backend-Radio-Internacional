// controllers/articles/getAllArticles.js
const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const categoryId = req.query.category_id || "";
    const categorySlug = req.query.category_slug || "";
    const published = req.query.published || "";

    const cacheKey = `articles:page=${page}&limit=${limit}` +
      `&category_id=${categoryId}&category_slug=${categorySlug}` +
      `&published=${published}`;

    const data = await getOrSetCache(cacheKey, async () => {
      // Construimos el filtro principal
      const where = {};
      if (published) {
        where.article_is_published = published === "true";
      }
      // Si filtramos por ID, lo dejamos. Si filtramos por slug, lo haremos en el include.
      if (categoryId && !categorySlug) {
        where.article_category_id = categoryId;
      }

      // Preparamos los includes
      const includes = [
        {
          model: User,
          as: "author",
          attributes: ["user_code", "user_name", "user_lastname"],
        },
        {
          model: ArticleCategory,
          as: "category",
          attributes: ["category_code", "category_name", "category_slug"],
          // Si viene slug, lo filtramos aquí
          ...(categorySlug
            ? { where: { category_slug: categorySlug } }
            : {}
          )
        },
      ];

      // Ejecutamos findAndCountAll
      const { rows: articles, count } = await Article.findAndCountAll({
        where,
        include: includes,
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      // Mapear la respuesta
      return {
        status: "success",
        page,
        pageSize: limit,
        total: count,
        items: articles.map(a => ({
          article_code: a.article_code,
          title: a.article_title,
          excerpt: a.article_excerpt,
          image: a.article_image_url,
          category: a.category.category_name,
          author: `${a.author.user_name} ${a.author.user_lastname}`,
          date: a.article_published_at,
          readTime: `${Math.ceil(a.article_content.split(" ").length / 200)} min lectura`,
          url: `/categoria/${a.category.category_slug}/${a.article_slug}`,
          is_premium: a.article_is_premium,
        })),
      };
    });
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');

    return res.status(200).json(data);
  } catch (error) {
    console.error("[Articles][GetAll]", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener los artículos.",
    });
  }
};



/*// controllers/articles/getAllArticles.js
const { getOrSetCache } = require('../../services/cacheservice');
const Article = require('../../models/article');
const User = require('../../models/user');
const ArticleCategory = require('../../models/articlecategory');

module.exports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        const category = req.query.category_id || '';
        const published = req.query.published || '';

        const cacheKey = `articles:page=${page}&limit=${limit}&category=${category}&published=${published}`;

        const data = await getOrSetCache(cacheKey, async () => {
            const where = {};
            if (category) where.article_category_id = category;
            if (published) where.article_is_published = published === 'true';

            const { rows: articles, count } = await Article.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['user_code', 'user_name', 'user_lastname'],
                    },
                    {
                        model: ArticleCategory,
                        as: 'category',
                        attributes: ['category_code', 'category_name'],
                    },
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            return {
                status: 'success',
                page,
                pageSize: limit,
                total: count,
                articles,
            };
        });

        res.status(200).json(data);
    } catch (error) {
        console.error('[Articles][GetAll]', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener los artículos.',
        });
    }
};
*/