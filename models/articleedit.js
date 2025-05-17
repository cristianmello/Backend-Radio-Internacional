const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const ArticleEdit = sequelize.define('ArticleEdit', {
    edit_code: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    edit_article_code: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    edit_editor_code: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    edit_previous_title: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    edit_previous_content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    edit_edited_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    indexes: [
        { fields: ['edit_article_code'] },
        { fields: ['edit_editor_code'] }
    ]
});

module.exports = ArticleEdit;
