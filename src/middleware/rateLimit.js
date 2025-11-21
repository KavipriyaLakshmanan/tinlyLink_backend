const rateLimit = require('express-rate-limit');

const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many redirect attempts from this IP, please try again later'
});

const createLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 link creations per windowMs
  message: 'Too many links created from this IP, please try again later'
});

module.exports = {
  redirectLimiter,
  createLinkLimiter
};