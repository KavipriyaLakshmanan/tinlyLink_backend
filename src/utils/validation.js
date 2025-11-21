const Joi = require('joi');

const createLinkSchema = Joi.object({
  originalUrl: Joi.string().uri().required().messages({
    'string.uri': 'Please provide a valid URL',
    'any.required': 'URL is required'
  }),
  customCode: Joi.string().pattern(/^[A-Za-z0-9_-]{1,10}$/).optional().messages({
    'string.pattern.base': 'Custom code can only contain letters, numbers, hyphens, and underscores (max 10 characters)'
  })
});

const validateShortCode = (code) => {
  return /^[A-Za-z0-9_-]{1,10}$/.test(code);
};

module.exports = {
  createLinkSchema,
  validateShortCode
};