const User = require('../../models/user');

// 11) Profile endpoints
const getProfile = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['user_password'] }
  });
  res.json({ status: 'success', data: user });
};

module.exports = getProfile