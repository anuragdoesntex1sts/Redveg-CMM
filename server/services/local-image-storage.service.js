const fs = require('fs/promises');
const path = require('path');
const logger = require('../utils/logger');

const uploadsRoot = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '../uploads'));
const localUploadPathPattern = /^\/uploads\/(products|ui)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.(jpg|png|webp)$/i;

function getManagedUpload(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null;

  try {
    const configuredOrigin = String(process.env.APP_PUBLIC_URL || 'https://redveg.in').replace(/\/+$/, '');
    const url = new URL(imageUrl, configuredOrigin);
    const origin = new URL(configuredOrigin).origin;
    if (url.origin !== origin || url.search || url.hash) return null;

    const match = localUploadPathPattern.exec(url.pathname);
    if (!match) return null;

    const filePath = path.resolve(uploadsRoot, match[1], `${match[2]}.${match[3]}`);
    if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) return null;
    return { filePath, pathname: url.pathname };
  } catch {
    return null;
  }
}

async function deleteLocalImageIfUnreferenced(db, imageUrl) {
  const managedUpload = getManagedUpload(imageUrl);
  if (!managedUpload) return false;

  try {
    const tableResult = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('products', 'combos', 'category_image_settings', 'campaigns', 'ui_settings')",
      args: [],
    });
    const tables = new Set((tableResult.rows || []).map(row => String(row.name)));
    const canonicalOrigin = new URL(String(process.env.APP_PUBLIC_URL || 'https://redveg.in').replace(/\/+$/, '')).origin;
    const candidates = [...new Set([
      imageUrl,
      managedUpload.pathname,
      `${canonicalOrigin}${managedUpload.pathname}`,
      `https://www.redveg.in${managedUpload.pathname}`,
    ])];
    const placeholders = candidates.map(() => '?').join(', ');
    const references = [];

    if (tables.has('products')) {
      references.push({ sql: `SELECT 1 AS used FROM products WHERE image_url IN (${placeholders}) LIMIT 1`, args: candidates });
    }
    if (tables.has('combos')) {
      references.push({ sql: `SELECT 1 AS used FROM combos WHERE image_url IN (${placeholders}) LIMIT 1`, args: candidates });
    }
    if (tables.has('category_image_settings')) {
      references.push({ sql: `SELECT 1 AS used FROM category_image_settings WHERE image_url IN (${placeholders}) LIMIT 1`, args: candidates });
    }
    if (tables.has('campaigns')) {
      references.push({
        sql: `SELECT 1 AS used FROM campaigns WHERE desktopImageUrl IN (${placeholders}) OR mobileImageUrl IN (${placeholders}) OR posterImageUrl IN (${placeholders}) LIMIT 1`,
        args: [...candidates, ...candidates, ...candidates],
      });
    }
    if (tables.has('ui_settings')) {
      references.push({ sql: `SELECT 1 AS used FROM ui_settings WHERE image_url IN (${placeholders}) LIMIT 1`, args: candidates });
    }

    for (const query of references) {
      const result = await db.execute(query);
      if (result.rows?.length) {
        logger.info(`Kept replaced image because another catalog record still references it: ${managedUpload.pathname}`);
        return false;
      }
    }

    await fs.unlink(managedUpload.filePath);
    logger.info(`Deleted unreferenced replaced image from VPS storage: ${managedUpload.pathname}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    logger.warn(`Could not clean up replaced image ${managedUpload.pathname}: ${error.message}`);
    return false;
  }
}

module.exports = { deleteLocalImageIfUnreferenced };
