const { randomUUID } = require('node:crypto');

async function ensureComboSchema(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS combos (
    id TEXT PRIMARY KEY,
    variant_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    price REAL NOT NULL CHECK (price >= 0),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS combo_items (
    combo_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (combo_id, variant_id)
  )`);
  const columns = await db.execute('PRAGMA table_info(combos)');
  if (!(columns.rows || []).some(column => column.name === 'discount_percentage')) {
    await db.execute('ALTER TABLE combos ADD COLUMN discount_percentage REAL NOT NULL DEFAULT 0');
  }
  if (!(columns.rows || []).some(column => column.name === 'stock_count')) {
    await db.execute('ALTER TABLE combos ADD COLUMN stock_count INTEGER NOT NULL DEFAULT 0');
    // Existing bundles inherit their current component capacity once.
    const legacy = await db.execute({ sql: 'SELECT id FROM combos WHERE stock_count = 0', args: [] });
    for (const row of legacy.rows || []) {
      const capacity = await db.execute({
        sql: `SELECT MIN(CASE WHEN v.is_available = 1 AND p.is_active = 1 THEN CAST(v.stock_count / ci.quantity AS INTEGER) ELSE 0 END) AS stock
          FROM combo_items ci JOIN variants v ON v.id = ci.variant_id AND v.product_id = ci.product_id JOIN products p ON p.id = ci.product_id
          WHERE ci.combo_id = ?`, args: [row.id],
      });
      await db.execute({ sql: 'UPDATE combos SET stock_count = ? WHERE id = ?', args: [Math.max(0, Number(capacity.rows?.[0]?.stock) || 0), row.id] });
    }
  }
  await db.execute('CREATE INDEX IF NOT EXISTS idx_combo_items_variant ON combo_items(variant_id)');
}

function comboIds() {
  const id = `CMB-${randomUUID()}`;
  return { id, variantId: `CBV-${randomUUID()}` };
}

function slugify(value) {
  const base = String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
  return base || `combo-${randomUUID().slice(0, 8)}`;
}

async function validateComboItems(db, items, excludedComboId = null) {
  if (!Array.isArray(items) || items.length < 2 || items.length > 30) {
    throw Object.assign(new Error('A combo must include between 2 and 30 product variants.'), { statusCode: 400 });
  }
  const normalized = [];
  const seen = new Set();
  for (const item of items) {
    const productId = String(item?.productId || '').trim();
    const variantId = String(item?.variantId || '').trim();
    const quantity = Number(item?.quantity);
    if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw Object.assign(new Error('Choose a product variant and a quantity from 1 to 99 for every combo item.'), { statusCode: 400 });
    }
    const key = `${productId}:${variantId}`;
    if (seen.has(key)) throw Object.assign(new Error('Each product variant can only be added once; change its quantity instead.'), { statusCode: 400 });
    seen.add(key);
    normalized.push({ productId, variantId, quantity });
  }
  if (new Set(normalized.map(item => item.productId)).size < 2) {
    throw Object.assign(new Error('A combo must contain at least two different products.'), { statusCode: 400 });
  }
  const result = await db.execute({
    sql: `SELECT p.id AS product_id, p.name AS product_name, p.is_active,
        v.id AS variant_id, v.size, v.weight, v.piece_size, v.stock_count, v.is_available
      FROM products p JOIN variants v ON v.product_id = p.id
      WHERE p.id = ? AND v.id = ?`,
    args: [normalized[0].productId, normalized[0].variantId],
  });
  // Validate each row independently so IDs cannot be mixed across products.
  for (const item of normalized) {
    const rowResult = item === normalized[0] ? result : await db.execute({
      sql: `SELECT p.id AS product_id, p.name AS product_name, p.is_active,
          v.id AS variant_id, v.size, v.weight, v.piece_size, v.stock_count, v.is_available
        FROM products p JOIN variants v ON v.product_id = p.id
        WHERE p.id = ? AND v.id = ?`,
      args: [item.productId, item.variantId],
    });
    const row = rowResult.rows[0];
    if (!row) throw Object.assign(new Error('One of the selected product variants no longer exists.'), { statusCode: 400 });
    item.name = String(row.product_name);
    item.label = [row.size, row.weight, row.piece_size].filter(Boolean).join(' / ');
  }
  if (excludedComboId && normalized.some(item => item.productId === excludedComboId)) {
    throw Object.assign(new Error('A combo cannot include itself.'), { statusCode: 400 });
  }
  return normalized;
}

async function listCombos(db, { includeInactive = false } = {}) {
  await ensureComboSchema(db);
  const combos = await db.execute({
    sql: `SELECT * FROM combos ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY updated_at DESC`,
    args: [],
  });
  const output = [];
  for (const combo of combos.rows) {
    const items = await db.execute({
      sql: `SELECT ci.product_id, ci.variant_id, ci.quantity, p.name AS product_name,
          p.image_url, p.is_active, v.sku, v.size, v.weight, v.piece_size,
          v.stock_count, v.is_available
        FROM combo_items ci
        JOIN products p ON p.id = ci.product_id
        JOIN variants v ON v.id = ci.variant_id AND v.product_id = ci.product_id
        WHERE ci.combo_id = ? ORDER BY p.name, v.size`,
      args: [combo.id],
    });
    const components = items.rows.map(item => ({
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name,
      variant: [item.size, item.weight, item.piece_size].filter(Boolean).join(' / '),
      quantity: Number(item.quantity),
      stock: Number(item.stock_count || 0),
      isAvailable: Number(item.is_active) === 1 && Number(item.is_available) === 1,
    }));
    const componentStock = components.length
      ? Math.min(...components.map(item => item.isAvailable ? Math.floor(item.stock / item.quantity) : 0))
      : 0;
    const stockCount = Math.max(0, Number(combo.stock_count) || 0);
    const stock = Math.min(componentStock, stockCount);
    const contents = components.map(item => `${item.quantity} × ${item.name}${item.variant ? ` (${item.variant})` : ''}`).join(' · ');
    output.push({
      id: combo.id,
      variantId: combo.variant_id,
      name: combo.name,
      slug: combo.slug,
      category: 'combos',
      description: combo.description || '',
      shortDescription: combo.short_description || (contents ? `Includes ${contents}` : ''),
      image: combo.image_url || items.rows.find(item => item.image_url)?.image_url || null,
      imageUrl: combo.image_url || items.rows.find(item => item.image_url)?.image_url || null,
      listPrice: Number(combo.price),
      stockCount,
      componentStock,
      discountPercentage: Number(combo.discount_percentage || 0),
      price: Number((Number(combo.price) * (1 - Number(combo.discount_percentage || 0) / 100)).toFixed(2)),
      isActive: Number(combo.is_active) === 1 && stock > 0,
      enabled: Number(combo.is_active) === 1,
      rating: null,
      reviewCount: 0,
      variants: [{
        id: combo.variant_id,
        sku: combo.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 40),
        label: 'Combo',
        size: 'Combo',
        weight: null,
        pieceSize: null,
        price: Number((Number(combo.price) * (1 - Number(combo.discount_percentage || 0) / 100)).toFixed(2)),
        mrp: Number(combo.discount_percentage || 0) > 0 ? Number(combo.price) : undefined,
        discountPercentage: Number(combo.discount_percentage || 0),
        stock,
        stockCount: stock,
        isAvailable: Number(combo.is_active) === 1 && stock > 0,
        available: Number(combo.is_active) === 1 && stock > 0,
      }],
      components,
      updatedAt: combo.updated_at,
    });
  }
  return output;
}

function expandInventoryItems(items) {
  const totals = new Map();
  for (const item of items || []) {
    const parts = item?.isCombo && Array.isArray(item.components) ? item.components : [item];
    for (const part of parts) {
      const productId = String(part.productId || '').trim();
      const variantId = String(part.variantId || '').trim();
      const quantity = Number(part.quantity) * (item?.isCombo ? Number(item.quantity) : 1);
      if (!productId || !variantId || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Order contains invalid combo inventory details.');
      }
      const key = `${productId}:${variantId}`;
      const existing = totals.get(key);
      if (existing) existing.quantity += quantity;
      else totals.set(key, { productId, variantId, quantity });
    }
  }
  return [...totals.values()];
}

function expandComboItems(items) {
  const totals = new Map();
  for (const item of items || []) {
    if (!item?.isCombo) continue;
    const comboId = String(item.productId || item.product_id || '').trim();
    const variantId = String(item.variantId || item.variant_id || '').trim();
    const quantity = Number(item.quantity);
    if (!comboId || !variantId || !Number.isInteger(quantity) || quantity < 1) throw new Error('Order contains invalid combo stock details.');
    const key = `${comboId}:${variantId}`;
    totals.set(key, { comboId, variantId, quantity: (totals.get(key)?.quantity || 0) + quantity });
  }
  return [...totals.values()];
}

async function changeComboStock(db, items, direction) {
  for (const item of items || []) {
    const result = direction < 0
      ? await db.execute({ sql: 'UPDATE combos SET stock_count = stock_count - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND variant_id = ? AND is_active = 1 AND stock_count >= ?', args: [item.quantity, item.comboId, item.variantId, item.quantity] })
      : await db.execute({ sql: 'UPDATE combos SET stock_count = stock_count + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND variant_id = ?', args: [item.quantity, item.comboId, item.variantId] });
    if (!result.rowsAffected) throw Object.assign(new Error(direction < 0 ? `Not enough stock for combo ${item.comboId}.` : `Could not restore stock for combo ${item.comboId}.`), { statusCode: 409 });
  }
}

async function getComboForVariant(db, productId, variantId) {
  await ensureComboSchema(db);
  const result = await db.execute({
    sql: `SELECT id FROM combos WHERE id = ? AND variant_id = ? AND is_active = 1 LIMIT 1`,
    args: [productId, variantId],
  });
  if (!result.rows.length) return null;
  const combos = await listCombos(db, { includeInactive: true });
  return combos.find(combo => combo.id === productId && combo.variantId === variantId) || null;
}

module.exports = { ensureComboSchema, comboIds, slugify, validateComboItems, listCombos, expandInventoryItems, expandComboItems, changeComboStock, getComboForVariant };
