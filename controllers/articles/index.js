const getArticleHistory = require('./getarticlehistory');

module.exports = {
  CreateArticle: require('./addarticle'),
  UpdateArticle: require('./updatearticle'),
  DeleteArticle: require('./deletearticle'),
  GetArticleByID: require('./getarticlebyid'),
  GetArticles: require('./getarticles'),
  GetArticleHistory: require('./getarticlehistory'),
  GetArticleHistoryCSV: require('./getarticlehistorycsv'),

};
