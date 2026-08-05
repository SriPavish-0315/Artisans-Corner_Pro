const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret12345', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = generateToken;
