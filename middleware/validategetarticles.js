// src/middlewares/validators/validateGetArticles.js
const { query, validationResult } = require("express-validator");

const validateGetArticles = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("limit debe ser un entero entre 1 y 100"),
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("page debe ser un entero mayor o igual a 1"),
    query("published")
        .optional()
        .isBoolean()
        .withMessage("published debe ser true o false"),
    query("category_id")
        .optional()
        .isInt()
        .withMessage("category_id debe ser un entero"),
    query("category_slug")
        .optional()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage("category_slug inválido"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "error",
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = validateGetArticles;
