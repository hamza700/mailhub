const bcrypt = require('bcryptjs');

/**
 * Hash password
 * @param string password
 */
export const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};
