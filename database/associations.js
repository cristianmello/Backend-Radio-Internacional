const Role = require('../models/role');
const User = require('../models/user');
const ArticleCategory = require('../models/articlecategory');
const Article = require('../models/article');
const CommentArticle = require('../models/commentarticle');
const CommentEdit = require('../models/commentedit');
const ArticleEdit = require('../models/articleedit');
const ArticleRating = require('../models/articlerating');
const FavoriteArticle = require('../models/favoritearticle');
const Membership = require('../models/membership');
const RoleChangeLog = require('../models/rolechangelog');

const database = require('./connection');

// 1) Role → User (1‑N)
Role.hasMany(User, {
  as: 'users',
  foreignKey: 'role_code',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
User.belongsTo(Role, {
  as: 'role',
  foreignKey: 'role_code'
});

// 2) User → Membership (1‑N)
User.hasMany(Membership, {
  as: 'memberships',
  foreignKey: 'user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Membership.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code'
});

// 3) Category → Article (1‑N)
ArticleCategory.hasMany(Article, {
  as: 'articles',
  foreignKey: 'article_category_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Article.belongsTo(ArticleCategory, {
  as: 'category',
  foreignKey: 'article_category_id'
});

// 4) Article → ArticleEdit (1‑N) y ArticleEdit → User (editor)
Article.hasMany(ArticleEdit, {
  as: 'edits',
  foreignKey: 'edit_article_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Article.belongsTo(User, {
  foreignKey: 'article_author_id',
  as: 'author'
});
ArticleEdit.belongsTo(Article, {
  as: 'article',
  foreignKey: 'edit_article_code'
});
User.hasMany(ArticleEdit, {
  as: 'articleEdits',
  foreignKey: 'edit_editor_code',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
ArticleEdit.belongsTo(User, {
  as: 'editor',
  foreignKey: 'edit_editor_code'
});

// 5) Article → ArticleRating (1‑N) y Rating → User
Article.hasMany(ArticleRating, {
  as: 'ratings',
  foreignKey: 'rating_article_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
ArticleRating.belongsTo(Article, {
  as: 'article',
  foreignKey: 'rating_article_code'
});
User.hasMany(ArticleRating, {
  as: 'articleRatings',
  foreignKey: 'rating_user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
ArticleRating.belongsTo(User, {
  as: 'user',
  foreignKey: 'rating_user_code'
});

// 6) Article → FavoriteArticle y Favorite → User
Article.hasMany(FavoriteArticle, {
  as: 'favoritedBy',
  foreignKey: 'favorite_article_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
FavoriteArticle.belongsTo(Article, {
  as: 'article',
  foreignKey: 'favorite_article_code'
});
User.hasMany(FavoriteArticle, {
  as: 'favorites',
  foreignKey: 'favorite_user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
FavoriteArticle.belongsTo(User, {
  as: 'user',
  foreignKey: 'favorite_user_code'
});

// 7) Article → CommentArticle y CommentArticle → User
Article.hasMany(CommentArticle, {
  as: 'comments',
  foreignKey: 'comment_article_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
CommentArticle.belongsTo(Article, {
  as: 'article',
  foreignKey: 'comment_article_id'
});
User.hasMany(CommentArticle, {
  as: 'commentsByUser',
  foreignKey: 'comment_user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
CommentArticle.belongsTo(User, {
  as: 'user',
  foreignKey: 'comment_user_id'
});

// 8) CommentArticle → CommentEdit y CommentEdit → User
CommentArticle.hasMany(CommentEdit, {
  as: 'edits',
  foreignKey: 'edit_comment_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
CommentEdit.belongsTo(CommentArticle, {
  as: 'comment',
  foreignKey: 'edit_comment_code'
});
User.hasMany(CommentEdit, {
  as: 'commentEdits',
  foreignKey: 'edit_editor_code',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
CommentEdit.belongsTo(User, {
  as: 'editor',
  foreignKey: 'edit_editor_code'
});

// 9) roleChangeLog → rolechangelog y user → rolechange
RoleChangeLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code'
});
RoleChangeLog.belongsTo(User, {
  as: 'changer',
  foreignKey: 'changed_by'
});
RoleChangeLog.belongsTo(Role, {
  as: 'oldRole',
  foreignKey: 'old_role_code'
});
RoleChangeLog.belongsTo(Role, {
  as: 'newRole',
  foreignKey: 'new_role_code'
});

module.exports = database;
