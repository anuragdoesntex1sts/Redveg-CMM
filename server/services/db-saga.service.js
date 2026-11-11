const { getDatabaseConnection } = require('../config/turso');
const { generateNotFoundError, generateValidationError, generateOutOfStockError } = require('../utils/error-classes');
const logger = require('../utils/logger');

/**
 * Execute cross-database saga for order approval
 * Steps:
 * 1. Verify order is pending in ordersDb
 * 2. Atomically deduct stock_count in catalogDb (with race condition handling)
 * 3. Mark order as approved in ordersDb
 *
 * @param {string} orderId - The order ID to approve
 * @param {string} adminId - The ID of the admin approving the order
 * @returns {object} Result of the saga
 */
const executeCrossDbSaga = async (orderId, adminId) => {
  // We'll implement this as a transaction-like process using application-level locking
  // Since we have two separate databases, we can't use ACID transactions across them
  // Instead we'll use a two-phase commit pattern with compensation

  const ordersDb = await getDatabaseConnection('orders');
  const catalogDb = await getDatabaseConnection('catalog');

  let order = null;
  let cartSnapshot = null;

  try {
    // Step 1: Verify order is pending in ordersDb
    logger.info(`Saga Step 1: Verifying order ${orderId} is pending`);

    const orderResult = await ordersDb.execute({
      sql: `
        SELECT id, user_id, customer_id, cart_snapshot, total_amount, customer_name,
               customer_phone, customer_address, status, is_archived
        FROM orders
        WHERE id = ? AND is_archived = 0
      `,
      args: [orderId]
    });

    if (orderResult.rows.length === 0) {
      throw generateNotFoundError('Order not found or already archived');
    }

    order = orderResult.rows[0];

    if (order.status !== 'pending') {
      throw generateValidationError(`Order is not in pending status. Current status: ${order.status}`);
    }

    // Parse cart snapshot
    cartSnapshot = JSON.parse(order.cart_snapshot);

    // Step 2: Deduct stock from catalogDb (handle race conditions)
    logger.info(`Saga Step 2: Deducting stock for order ${orderId}`);

    // Start a transaction on catalogDb for stock deduction
    await catalogDb.execute('BEGIN IMMEDIATE TRANSACTION');

    try {
      // Check stock and deduct for each item in cart
      for (const item of cartSnapshot) {
        const { productId, variantId, quantity } = item;

        // Get current stock
        const variantResult = await catalogDb.execute({
          sql: 'SELECT stock_count FROM variants WHERE id = ? AND product_id = ?',
          args: [variantId, productId]
        });

        if (variantResult.rows.length === 0) {
          throw generateNotFoundError(`Variant not found: ${variantId}`);
        }

        const currentStock = variantResult.rows[0].stock_count;

        if (currentStock < quantity) {
          throw generateOutOfStockError(`Insufficient stock for variant ${variantId}. Available: ${currentStock}, Required: ${quantity}`);
        }

        // Deduct stock
        await catalogDb.execute({
          sql: 'UPDATE variants SET stock_count = stock_count - ? WHERE id = ?',
          args: [quantity, variantId]
        });

        logger.debug(`Deducted ${quantity} from variant ${variantId}. New stock: ${currentStock - quantity}`);
      }

      // Commit the transaction
      await catalogDb.execute('COMMIT');
      logger.info(`Saga Step 2 completed: Stock deducted successfully for order ${orderId}`);

    } catch (stockError) {
      // Rollback transaction on error
      await catalogDb.execute('ROLLBACK');
      throw stockError;
    }

    // Step 3: Mark order as approved in ordersDb
    logger.info(`Saga Step 3: Marking order ${orderId} as approved`);

    await ordersDb.execute({
      sql: `
        UPDATE orders
        SET status = 'approved',
            approved_by = ?,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [adminId, orderId]
    });

    logger.info(`Saga completed successfully for order ${orderId}`);

    return {
      orderId,
      status: 'approved',
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
      cartSnapshot,
      totalAmount: order.total_amount
    };

  } catch (error) {
    logger.error(`Saga failed for order ${orderId}:`, error);

    // If we failed during stock deduction, we might need to compensate
    // For now, we'll let the error propagate up - the order remains pending
    // In a production system, we might want to implement compensation logic

    throw error;
  }
};

module.exports = {
  executeCrossDbSaga
};