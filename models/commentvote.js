// models/commentVote.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const CommentVote = sequelize.define('CommentVote', {
    vote_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    vote_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isIn: [[1, -1]]
        }
    }
}, {
    tableName: 'comment_votes',
    timestamps: true,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['comment_id', 'user_id'],
            name: 'unique_user_comment_vote'
        }
    ]
});

module.exports = CommentVote;