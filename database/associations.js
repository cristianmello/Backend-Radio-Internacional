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
const ProfileChangeLog = require('../models/profilechangelog');
const ForgotPasswordLog = require('../models/forgotpasswordlog');
const PasswordChangeLog = require('../models/passwordchangelog');
const LoginLog = require('../models/loginlog');
const RegisterLog = require('../models/registerlog');
const ArticleLog = require('../models/articlelog');
const Short = require('../models/short');
const ShortLog = require('../models/shortlog');
const SectionArticles = require('../models/sectionarticles');
const SectionArticleMap = require('../models/sectionarticlemap');
const SectionShortMap = require('../models/sectionshortmap');
const SectionLog = require('../models/sectionlog');
const Audio = require('../models/audios');
const AudioLog = require('../models/audio_log');
const SectionAudioMap = require('../models/sectionaudiomap');
const Advertisement = require('../models/advertisement');
const AdvertisementLog = require('../models/advertisement_log');
const SectionAdvertisementMap = require('../models/sectionadvertisementmap');
const CommentVote = require('../models/commentvote');
const CommentLog = require('../models/commentlog');

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
User.hasMany(RoleChangeLog, {
  as: 'roleChangesMade',
  foreignKey: 'changed_by',
  onDelete: 'SET NULL',
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
  onDelete: 'SET NULL',
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
  as: 'author',
  foreignKey: 'comment_user_id'
});
CommentArticle.hasMany(CommentArticle, {
  as: 'replies',
  foreignKey: 'comment_parent_id'
})
CommentArticle.belongsTo(CommentArticle, {
  as: 'parent',
  foreignKey: 'comment_parent_id'
});

// Usuario <-> Votos
User.hasMany(CommentVote, { foreignKey: 'user_id' });
CommentVote.belongsTo(User, { foreignKey: 'user_id' });

// Comentario <-> Votos
CommentArticle.hasMany(CommentVote, { as: 'votes', foreignKey: 'comment_id' });
CommentVote.belongsTo(CommentArticle, { foreignKey: 'comment_id' });

User.hasMany(CommentLog, { foreignKey: 'user_id' });
CommentLog.belongsTo(User, { foreignKey: 'user_id' });

// Un comentario puede tener muchos logs asociados
CommentArticle.hasMany(CommentLog, { as: 'logs', foreignKey: 'comment_id' });
CommentLog.belongsTo(CommentArticle, { foreignKey: 'comment_id' });

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
  onDelete: 'SET NULL',
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


// 10) User → ProfileChangeLog (como usuario afectado y como editor)
User.hasMany(ProfileChangeLog, {
  as: 'profileChanges',
  foreignKey: 'user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
User.hasMany(ProfileChangeLog, {
  as: 'profileChangesMade',
  foreignKey: 'changed_by',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
ProfileChangeLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code'
});
ProfileChangeLog.belongsTo(User, {
  as: 'editor',
  foreignKey: 'changed_by'
});

// 11) ForgotPasswordLog ←→ User (1‑N)
User.hasMany(ForgotPasswordLog, {
  as: 'forgotPasswordLogs',
  foreignKey: 'user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
ForgotPasswordLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code'
});

// 12) PasswordChangeLog ←→ User (1‑N)
User.hasMany(PasswordChangeLog, {
  as: 'passwordChangeLogs',
  foreignKey: 'user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
PasswordChangeLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code'
});

// 13) User → LoginLog (1‑N)
User.hasMany(LoginLog, {
  as: 'loginLogs',
  foreignKey: 'user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
LoginLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code'
});


// 14) 1-N: User → RegisterLog
User.hasMany(RegisterLog, {
  as: 'registerLogs',
  foreignKey: 'user_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

RegisterLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_code',
});

// 15) User → ArticleLog (1-N)
User.hasMany(ArticleLog, {
  as: 'articleLogs',
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ArticleLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id',
});

// 16) Article → ArticleLog (1-N)
Article.hasMany(ArticleLog, {
  as: 'logs',
  foreignKey: 'article_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ArticleLog.belongsTo(Article, {
  as: 'article',
  foreignKey: 'article_id',
});

// 17) User → Short (1-N, como autor del short)
User.hasMany(Short, {
  as: 'shorts',
  foreignKey: 'short_author_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Short.belongsTo(User, {
  as: 'author',
  foreignKey: 'short_author_id',
});

// 18) User → ShortLog (1-N)
User.hasMany(ShortLog, {
  as: 'shortLogs',
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ShortLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id',
});

// 19) Short → ShortLog (1-N)
Short.hasMany(ShortLog, {
  as: 'logs',
  foreignKey: 'short_id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
ShortLog.belongsTo(Short, {
  as: 'short',
  foreignKey: 'short_id',
});


// 20) ArticleCategory → Short (1-N)
ArticleCategory.hasMany(Short, {
  as: 'shorts',
  foreignKey: 'short_category_id',   // ← aquí coincide con tu modelo
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Short.belongsTo(ArticleCategory, {
  as: 'category',
  foreignKey: 'short_category_id',   // ← y aquí también
});

// 20) SectionArticles --- SectionArticlesMap (N-N)

SectionArticles.belongsToMany(Article, {
  through: SectionArticleMap,
  foreignKey: 'section_code',
  otherKey: 'article_code',
  as: 'articles'
});

Article.belongsToMany(SectionArticles, {
  through: SectionArticleMap,
  foreignKey: 'article_code',
  otherKey: 'section_code',
  as: 'sections'
});

// Secciones <-> Shorts (M‑N)
SectionArticles.belongsToMany(Short, {
  through: SectionShortMap,
  foreignKey: 'section_code',
  otherKey: 'short_code',
  as: 'shorts'
});
Short.belongsToMany(SectionArticles, {
  through: SectionShortMap,
  foreignKey: 'short_code',
  otherKey: 'section_code',
  as: 'sections'
});

// ——— SectionLog ←→ User (1‑N)
User.hasMany(SectionLog, {
  as: 'sectionLogs',
  foreignKey: 'user_id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
SectionLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id'
});

// ——— SectionArticles ←→ SectionLog (1‑N)
SectionArticles.hasMany(SectionLog, {
  as: 'logs',
  foreignKey: 'section_code',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
SectionLog.belongsTo(SectionArticles, {
  as: 'section',
  foreignKey: 'section_code'
});

// —— Audio ←→ User (1-N, como autor del audio)
User.hasMany(Audio, {
  as: 'audios',
  foreignKey: 'audio_author_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
Audio.belongsTo(User, {
  as: 'author',
  foreignKey: 'audio_author_id'
});

// —— ArticleCategory ←→ Audio (1-N, como categoría del audio)
ArticleCategory.hasMany(Audio, {
  as: 'audios',
  foreignKey: 'audio_category_id',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});
Audio.belongsTo(ArticleCategory, {
  as: 'category',
  foreignKey: 'audio_category_id'
});

// ——— AudioLog ←→ User (1-N)
User.hasMany(AudioLog, {
  as: 'audioLogs',
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});
AudioLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id'
});

// ——— AudioLog ←→ Audio (1-N)
Audio.hasMany(AudioLog, {
  as: 'logs',
  foreignKey: 'audio_id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});
AudioLog.belongsTo(Audio, {
  as: 'audio',
  foreignKey: 'audio_id'
});

// —— Secciones <-> Audios (M‑N)
SectionArticles.belongsToMany(Audio, {
  through: SectionAudioMap,
  foreignKey: 'section_code',
  otherKey: 'audio_code',
  as: 'audios'
});

Audio.belongsToMany(SectionArticles, {
  through: SectionAudioMap,
  foreignKey: 'audio_code',
  otherKey: 'section_code',
  as: 'sections'
});

SectionAudioMap.belongsTo(SectionArticles, {
  as: 'section',
  foreignKey: 'section_code'
});
SectionAudioMap.belongsTo(Audio, {
  as: 'audio',
  foreignKey: 'audio_code'
});

// ====== SISTEMA DE PUBLICIDAD ======

// 21) Secciones <-> Anuncios (M-N)
SectionArticles.belongsToMany(Advertisement, {
  through: SectionAdvertisementMap,
  foreignKey: 'section_code',
  otherKey: 'ad_id',
  as: 'advertisements' // Podrás usar este alias en tus includes
});

Advertisement.belongsToMany(SectionArticles, {
  through: SectionAdvertisementMap,
  foreignKey: 'ad_id',
  otherKey: 'section_code',
  as: 'sections'
});

// 22) AdvertisementLog <-> User (1-N)
User.hasMany(AdvertisementLog, {
  as: 'advertisementLogs',
  foreignKey: 'user_id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

AdvertisementLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'user_id'
});

// 23) AdvertisementLog <-> Advertisement (1-N)
Advertisement.hasMany(AdvertisementLog, {
  as: 'logs',
  foreignKey: 'ad_id',
  onDelete: 'CASCADE'
});

AdvertisementLog.belongsTo(Advertisement, {
  as: 'advertisement',
  foreignKey: 'ad_id'
});


module.exports = database;
