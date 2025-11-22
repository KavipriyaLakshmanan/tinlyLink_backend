const LinkModel = require('../models/linkModel');
const { createLinkSchema, validateShortCode } = require('../utils/validation');

const generateShortCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const createLink = async (req, res) => {
  try {
    const { error, value } = createLinkSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { originalUrl, customCode } = value;

    // Check if URL already exists
    const existingLink = await LinkModel.findByOriginalUrl(originalUrl);
    if (existingLink && !customCode) {
      return res.status(409).json({ 
        error: 'This URL has already been shortened',
        existingLink: {
          shortCode: existingLink.shortCode,
          shortUrl: `${process.env.BASE_URL}/${existingLink.shortCode}`,
          originalUrl: existingLink.originalUrl
        }
      });
    }

    let shortCode = customCode;

    if (!shortCode) {
      shortCode = generateShortCode();
    } else {
      if (!validateShortCode(shortCode)) {
        return res.status(400).json({ 
          error: 'Custom code can only contain letters, numbers, hyphens, and underscores (max 10 characters)' 
        });
      }
    }

    // Check if short code already exists
    const exists = await LinkModel.exists(shortCode);
    if (exists) {
      return res.status(409).json({ error: 'Short code already exists' });
    }

    // Create new link
    const link = await LinkModel.create(shortCode, originalUrl);

    const response = {
      shortCode: link.shortCode,
      shortUrl: `${process.env.BASE_URL}/${link.shortCode}`,
      originalUrl: link.originalUrl
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating link:', error);
    
    // More specific error messages
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ error: 'Short code already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const redirectLink = async (req, res) => {
  try {
    const { code } = req.params;
    const originalUrl = await LinkModel.incrementClicks(code);

    if (!originalUrl) {
      return res.status(404).json({ error: 'Link not found' });
    }

    let redirectUrl = originalUrl;
    
    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      redirectUrl = 'https://' + redirectUrl;
    }

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllLinks = async (req, res) => {
  try {
    const links = await LinkModel.findAll();
    res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getLinkStats = async (req, res) => {
  try {
    const { code } = req.params;

    const stats = await LinkModel.getStats(code);

    if (!stats) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching link stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteLink = async (req, res) => {
  try {
    const { code } = req.params;

    const deleted = await LinkModel.delete(code);

    if (!deleted) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createLink,
  redirectLink,
  getAllLinks,
  getLinkStats,
  deleteLink
};