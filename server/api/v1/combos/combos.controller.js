const { getDatabaseConnection } = require('../../../config/turso');
const { generateValidationError, generateNotFoundError } = require('../../../utils/error-classes');
const logger = require('../../../utils/logger');
const { ensureComboSchema, comboIds, slugify, validateComboItems, listCombos } = require('../../../services/combo.service');
const { deleteLocalImageIfUnreferenced } = require('../../../services/local-image-storage.service');
const { ensureCatalogCategorySchema } = require('../categories/categories.schema');

function normalizeInput(body = {}) {
  const name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  const description = String(body.description || '').trim().slice(0, 2000);
  const shortDescription = String(body.shortDescription || body.short_description || '').trim().slice(0, 300);
  const imageUrl = String(body.imageUrl || body.image_url || '').trim().slice(0, 2048) || null;
  const price = Number(body.price);
  const discountPercentage = Number(body.discountPercentage ?? body.discount_percentage ?? 0);
  const stockCount = Number(body.stockCount ?? body.stock_count);
  if (!name) throw generateValidationError('Enter a name for the combo.');
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) throw generateValidationError('Enter a fixed combo price greater than zero.');
  if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage >= 100) throw generateValidationError('Discount must be between 0% and less than 100%.');
  if (!Number.isInteger(stockCount) || stockCount < 0 || stockCount > 1000000) throw generateValidationError('Combo stock must be a whole number from 0 to 1,000,000.');
  if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('/')) throw generateValidationError('Combo image must be a valid URL.');
  return { name, description, shortDescription, imageUrl, price: Number(price.toFixed(2)), discountPercentage: Number(discountPercentage.toFixed(2)), stockCount, items: body.items };
}

async function createCombo(req, res) {
  let transaction;
  try {
    const data = normalizeInput(req.body);
    const db = await getDatabaseConnection('catalog');
    await ensureComboSchema(db);
    const items = await validateComboItems(db, data.items);
    const ids = comboIds();
    const slug = `${slugify(data.name)}-${ids.id.slice(-8).toLowerCase()}`;
    transaction = await db.transaction('write');
    await transaction.execute({
      sql: `INSERT INTO combos (id, variant_id, name, slug, short_description, description, image_url, price, discount_percentage, stock_count, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [ids.id, ids.variantId, data.name, slug, data.shortDescription, data.description, data.imageUrl, data.price, data.discountPercentage, data.stockCount],
    });
    for (const item of items) {
      await transaction.execute({
        sql: 'INSERT INTO combo_items (combo_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        args: [ids.id, item.productId, item.variantId, item.quantity],
      });
    }
    await transaction.commit();
    transaction = null;
    await ensureCatalogCategorySchema(db);
    await db.execute({
      sql: 'INSERT INTO catalog_categories (category_slug, category_name) VALUES (?, ?) ON CONFLICT(category_slug) DO NOTHING',
      args: ['combos', 'Combos'],
    });
    const combo = (await listCombos(db, { includeInactive: true })).find(item => item.id === ids.id);
    return res.status(201).json({ success: true, data: combo });
  } catch (error) {
    await transaction?.rollback().catch(() => {});
    if (error.statusCode || error.type === 'validation-error') return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    logger.error('Could not create combo:', error);
    return res.status(500).json({ success: false, message: 'Could not save this combo.' });
  } finally {
    await transaction?.close().catch(() => {});
  }
}

async function updateCombo(req, res) {
  let transaction;
  try {
    const data = normalizeInput(req.body);
    const id = String(req.params.id || '').trim();
    const db = await getDatabaseConnection('catalog');
    await ensureComboSchema(db);
    const existing = await db.execute({ sql: 'SELECT id, image_url FROM combos WHERE id = ? LIMIT 1', args: [id] });
    if (!existing.rows.length) throw generateNotFoundError('Combo not found.');
    const items = await validateComboItems(db, data.items, id);
    transaction = await db.transaction('write');
    await transaction.execute({
      sql: `UPDATE combos SET name = ?, short_description = ?, description = ?, image_url = ?, price = ?, discount_percentage = ?, stock_count = ?,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [data.name, data.shortDescription, data.description, data.imageUrl, data.price, data.discountPercentage, data.stockCount, id],
    });
    await transaction.execute({ sql: 'DELETE FROM combo_items WHERE combo_id = ?', args: [id] });
    for (const item of items) {
      await transaction.execute({
        sql: 'INSERT INTO combo_items (combo_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        args: [id, item.productId, item.variantId, item.quantity],
      });
    }
    await transaction.commit();
    transaction = null;
    if (existing.rows[0].image_url !== data.imageUrl) await deleteLocalImageIfUnreferenced(db, existing.rows[0].image_url);
    const combo = (await listCombos(db, { includeInactive: true })).find(item => item.id === id);
    return res.status(200).json({ success: true, data: combo });
  } catch (error) {
    await transaction?.rollback().catch(() => {});
    if (error.statusCode || error.type === 'not-found' || error.type === 'validation-error') return res.status(error.statusCode || (error.type === 'not-found' ? 404 : 400)).json({ success: false, message: error.message });
    logger.error(`Could not update combo ${req.params.id}:`, error);
    return res.status(500).json({ success: false, message: 'Could not update this combo.' });
  } finally {
    await transaction?.close().catch(() => {});
  }
}

async function setComboActive(req, res) {
  try {
    const id = String(req.params.id || '').trim();
    const isActive = req.body?.isActive === true || req.body?.is_active === true || req.body?.is_active === 1;
    const db = await getDatabaseConnection('catalog');
    await ensureComboSchema(db);
    const result = await db.execute({
      sql: 'UPDATE combos SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [isActive ? 1 : 0, id],
    });
    if (!result.rowsAffected) throw generateNotFoundError('Combo not found.');
    return res.status(200).json({ success: true, data: { id, isActive } });
  } catch (error) {
    if (error.type === 'not-found') return res.status(404).json({ success: false, message: error.message });
    logger.error(`Could not update combo status ${req.params.id}:`, error);
    return res.status(500).json({ success: false, message: 'Could not update this combo.' });
  }
}

async function getCombos(req, res) {
  try {
    const db = await getDatabaseConnection('catalog');
    const includeInactive = req.path.startsWith('/admin');
    const data = await listCombos(db, { includeInactive });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    logger.error('Could not load combos:', error);
    return res.status(500).json({ success: false, message: 'Could not load combos.' });
  }
}

module.exports = { createCombo, updateCombo, setComboActive, getCombos };
