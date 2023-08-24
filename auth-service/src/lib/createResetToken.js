/**
 * Create password reset token using inbuilt crypto
 */
export const createResetToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};
