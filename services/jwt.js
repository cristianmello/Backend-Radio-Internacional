const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
require('dotenv').config();

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
} = process.env;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('[JWT] Faltan las variables de entorno ACCESS_TOKEN_SECRET o REFRESH_TOKEN_SECRET');
}

const ACCESS_EXPIRES = ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = REFRESH_TOKEN_EXPIRES_IN || '30d';

function createToken(user) {
  const payload = {
    sub: user.user_code,
    name: user.user_name,
    lastname: user.user_lastname,
    email: user.user_mail,
    roles: [user.role?.role_name],
    jti: randomUUID()
  };

  try {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_EXPIRES
    });
  } catch (err) {
    console.error('[JWT][createToken]', err);
    throw new Error('No se pudo generar el token de acceso.');
  }
}


function createRefreshToken(user) {
  const payload = {
    sub: user.user_code,
    email: user.user_mail,
    jti: randomUUID()
  };

  try {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_EXPIRES
    });
  } catch (err) {
    console.error('[JWT][createRefreshToken]', err);
    throw new Error('No se pudo generar el token de refresh.');
  }
}

module.exports = {
  createToken,
  createRefreshToken
};
