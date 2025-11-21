const { runQuery, getQuery, allQuery } = require('../utils/database');

class LinkModel {
  static async create(shortCode, originalUrl) {
    const result = await runQuery(
      `INSERT INTO links (short_code, original_url) 
       VALUES (?, ?)`,
      [shortCode, originalUrl]
    );

    const link = await getQuery(
      `SELECT id, short_code, original_url, total_clicks, last_clicked, created_at 
       FROM links 
       WHERE id = ?`,
      [result.id]
    );

    return {
      id: link.id,
      shortCode: link.short_code,
      originalUrl: link.original_url,
      totalClicks: link.total_clicks,
      lastClicked: link.last_clicked,
      createdAt: link.created_at
    };
  }

  static async findByShortCode(shortCode) {
    const link = await getQuery(
      `SELECT id, short_code, original_url, total_clicks, last_clicked, created_at 
       FROM links 
       WHERE short_code = ?`,
      [shortCode]
    );

    if (!link) {
      return null;
    }

    return {
      id: link.id,
      shortCode: link.short_code,
      originalUrl: link.original_url,
      totalClicks: link.total_clicks,
      lastClicked: link.last_clicked,
      createdAt: link.created_at
    };
  }

  static async exists(shortCode) {
    const link = await getQuery(
      'SELECT 1 FROM links WHERE short_code = ?',
      [shortCode]
    );
    return !!link;
  }

static async incrementClicks(shortCode) {
  try {
    const link = await getQuery(
      'SELECT original_url FROM links WHERE short_code = ?',
      [shortCode]
    );
    
    if (!link) {
      return null;
    }
    
    await runQuery(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = datetime("now") WHERE short_code = ?',
      [shortCode]
    );
    
    return link.original_url;
  } catch (error) {
    console.error('Error incrementing clicks:', error);
    throw error;
  }
}

  static async findAll() {
    const links = await allQuery(
      `SELECT id, short_code, original_url, total_clicks, last_clicked, created_at 
       FROM links 
       ORDER BY created_at DESC`
    );

    return links.map(link => ({
      id: link.id,
      shortCode: link.short_code,
      originalUrl: link.original_url,
      totalClicks: link.total_clicks,
      lastClicked: link.last_clicked,
      createdAt: link.created_at
    }));
  }

  static async getStats(shortCode) {
    const link = await getQuery(
      `SELECT short_code, original_url, total_clicks, last_clicked, created_at 
       FROM links 
       WHERE short_code = ?`,
      [shortCode]
    );

    if (!link) {
      return null;
    }

    return {
      shortCode: link.short_code,
      originalUrl: link.original_url,
      totalClicks: link.total_clicks,
      lastClicked: link.last_clicked,
      createdAt: link.created_at
    };
  }

  static async delete(shortCode) {
    const result = await runQuery(
      'DELETE FROM links WHERE short_code = ?',
      [shortCode]
    );

    return result.changes > 0;
  }
  static async findByOriginalUrl(originalUrl) {
    const link = await getQuery(
      `SELECT id, short_code, original_url, total_clicks, last_clicked, created_at 
       FROM links 
       WHERE original_url = ?`,
      [originalUrl]
    );

    if (!link) {
      return null;
    }

    return {
      id: link.id,
      shortCode: link.short_code,
      originalUrl: link.original_url,
      totalClicks: link.total_clicks,
      lastClicked: link.last_clicked,
      createdAt: link.created_at
    };
  }
}


module.exports = LinkModel;