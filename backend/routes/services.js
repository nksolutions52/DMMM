const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all service types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const serviceTypes = [
      { id: 'transfer', name: 'Transfer of Ownership', fee: 1500 },
      { id: 'permit', name: 'Permit', fee: 1000 },
      { id: 'hpa', name: 'HPA', fee: 800 },
      { id: 'hpt', name: 'HPT', fee: 800 },
      { id: 'fitness', name: 'Fitness', fee: 600 },
      { id: 'pollution', name: 'Pollution', fee: 300 },
      { id: 'insurance', name: 'Insurance', fee: 2000 },
    ];

    res.json({
      success: true,
      data: serviceTypes
    });
  } catch (error) {
    console.error('Get service types error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all service orders with pagination and filters
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT so.*, v.registration_number, o.registered_owner_name,
             u.name as agent_name, UPPER(so.status) as status, UPPER(so.service_type) as service_type
      FROM service_orders so
      JOIN vehicles v ON so.vehicle_id = v.id
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
      LEFT JOIN users u ON so.agent_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (v.registration_number ILIKE $${paramCount} OR o.registered_owner_name ILIKE $${paramCount} OR so.service_type ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND so.status = $${paramCount}`;
      queryParams.push(status);
    }

    query += ` ORDER BY so.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM service_orders so
      JOIN vehicles v ON so.vehicle_id = v.id
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (v.registration_number ILIKE $${countParamCount} OR o.registered_owner_name ILIKE $${countParamCount} OR so.service_type ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND so.status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        orders: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get service orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get service order by ID with payment history
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get service order details
    const orderQuery = `
      SELECT so.*, v.registration_number, o.registered_owner_name,
             u.name as agent_name, v.makers_name, v.makers_classification,
             v.chassis_number, v.engine_number, v.fuel_used
      FROM service_orders so
      JOIN vehicles v ON so.vehicle_id = v.id
      LEFT JOIN vehicle_owner_details o ON v.id = o.vehicle_id
      LEFT JOIN users u ON so.agent_id = u.id
      WHERE so.id = $1
    `;

    const orderResult = await pool.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service order not found'
      });
    }

    // Get payment history
    const paymentQuery = `
      SELECT soa.*, u.name as created_by_name
      FROM service_order_amounts soa
      LEFT JOIN users u ON soa.created_by = u.id
      WHERE soa.service_order_id = $1
      ORDER BY soa.created_at ASC
    `;

    const paymentResult = await pool.query(paymentQuery, [id]);

    const orderData = {
      ...orderResult.rows[0],
      payment_history: paymentResult.rows
    };

    res.json({
      success: true,
      data: orderData
    });
  } catch (error) {
    console.error('Get service order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new service order
router.post('/orders', authenticateToken, validateRequest(schemas.serviceOrder), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { vehicleId, serviceType, actualAmount, discount = 0, customerName } = req.body;

    // Verify vehicle exists
    const vehicleResult = await client.query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // --- HPA/HPT business rule check ---
    if (['hpa', 'hpt'].includes(serviceType.toLowerCase())) {
      // Get ACTIVE hypothication record for this vehicle
      const hypoResult = await client.query(
        'SELECT is_hpa FROM hypothication_details WHERE vehicle_id = $1 AND status = \'ACTIVE\'',
        [vehicleId]
      );
      if (hypoResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active hypothication record found for this vehicle'
        });
      }
      const isHpa = hypoResult.rows[0].is_hpa === true || hypoResult.rows[0].is_hpa === 'true';

      if (serviceType.toLowerCase() === 'hpt' && !isHpa) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create HPT order: HPA is not active for this vehicle'
        });
      }
      if (serviceType.toLowerCase() === 'hpa' && isHpa) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create HPA order: HPA is already active for this vehicle'
        });
      }
    }
    // --- end HPA/HPT business rule check ---

    // Calculate final amount after discount
    const amount = Number(actualAmount) - Number(discount);

    // Create service order
    const serviceOrderQuery = `
      INSERT INTO service_orders (
        vehicle_id, service_type, actual_amount, amount, amount_paid, customer_name, 
        status, agent_id, created_at
      ) VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const orderValues = [
      vehicleId,           // $1
      serviceType,         // $2
      actualAmount,        // $3
      amount,              // $4
      0,                   // $5 (amount_paid)
      customerName,        // $6
      'pending',           // $7 (status)
      req.user.id          // $8 (agent_id)
    ];
    const orderResult = await client.query(serviceOrderQuery, orderValues);
    const serviceOrderId = orderResult.rows[0].id;

    // Create initial record in service_order_amounts table
    const amountQuery = `
      INSERT INTO service_order_amounts (
        service_order_id, vehicle_id, amount, actual_amount, discount, payment_type, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `;

    await client.query(amountQuery, [serviceOrderId, vehicleId, amount, actualAmount, discount, 'initial', req.user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Service order created successfully',
      data: { id: serviceOrderId }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create service order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Update service order status
router.patch('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, completed, or cancelled'
      });
    }

    const updateStatusQuery = 'UPDATE service_orders SET status = UPPER($1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(updateStatusQuery, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service order not found'
      });
    }

    res.json({
      success: true,
      message: 'Service order status updated successfully'
    });
  } catch (error) {
    console.error('Update service order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Make payment for service order
router.post('/orders/:id/payment', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Get current service order
    const orderResult = await client.query(
      'SELECT amount, amount_paid, vehicle_id, actual_amount, discount FROM service_orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service order not found'
      });
    }

    const order = orderResult.rows[0];
    const newAmountPaid = parseFloat(order.amount_paid) + parseFloat(amount);
    const totalAmount = parseFloat(order.amount);

    if (newAmountPaid > totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds pending amount'
      });
    }

    // Update service order amount_paid
    await client.query(
      'UPDATE service_orders SET amount_paid = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newAmountPaid, id]
    );

    // Create payment record in service_order_amounts table
    await client.query(`
      INSERT INTO service_order_amounts (
        service_order_id, vehicle_id, amount, actual_amount, discount, payment_type, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [id, order.vehicle_id, amount, order.actual_amount, order.discount, 'payment', req.user.id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        amountPaid: newAmountPaid,
        pendingAmount: totalAmount - newAmountPaid
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Complete service order and create record in respective table
router.patch('/orders/:id/complete', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { fromDate, toDate, number, serviceType } = req.body;

    // Get order and vehicle info
    const orderResult = await client.query('SELECT * FROM service_orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service order not found' });
    }
    const order = orderResult.rows[0];

    // Use serviceType from body if provided, else from DB
    const typeToUse = (serviceType || order.service_type || '').toLowerCase();

    console.log('Complete order: typeToUse=', typeToUse, 'number=', number, 'fromDate=', fromDate, 'toDate=', toDate);

    // Update order status
    await client.query('UPDATE service_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['completed', id]);

    // Prepare update and insert queries for the details table
    let updateOldQuery = null;
    let insertNewQuery = null;
    let updateParams = null;
    let insertParams = null;

    switch (typeToUse) {
      case 'fitness':
        updateOldQuery = `UPDATE fitness_details SET status = 'INACTIVE' WHERE vehicle_id = $1 AND status = 'ACTIVE'`;
        insertNewQuery = `INSERT INTO fitness_details (vehicle_id, fc_number, fc_tenure_from, fc_tenure_to, status, created_at) VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)`;
        updateParams = [order.vehicle_id];
        insertParams = [order.vehicle_id, number, fromDate, toDate];
        break;
      case 'insurance':
        updateOldQuery = `UPDATE insurance_details SET status = 'INACTIVE' WHERE vehicle_id = $1 AND status = 'ACTIVE'`;
        insertNewQuery = `INSERT INTO insurance_details (vehicle_id, policy_number, insurance_from, insurance_to, status, created_at) VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)`;
        updateParams = [order.vehicle_id];
        insertParams = [order.vehicle_id, number, fromDate, toDate];
        break;
      case 'permit':
        updateOldQuery = `UPDATE permit_details SET status = 'INACTIVE' WHERE vehicle_id = $1 AND status = 'ACTIVE'`;
        insertNewQuery = `INSERT INTO permit_details (vehicle_id, permit_number, permit_tenure_from, permit_tenure_to, status, created_at) VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)`;
        updateParams = [order.vehicle_id];
        insertParams = [order.vehicle_id, number, fromDate, toDate];
        break;
      case 'pollution':
      case 'puc': // <-- Add this line
        updateOldQuery = `UPDATE puc_details SET status = 'INACTIVE' WHERE vehicle_id = $1 AND status = 'ACTIVE'`;
        insertNewQuery = `INSERT INTO puc_details (vehicle_id, puc_number, puc_from, puc_to, status, created_at) VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)`;
        updateParams = [order.vehicle_id];
        insertParams = [order.vehicle_id, number, fromDate, toDate];
        break;
      case 'tax':
        updateOldQuery = `UPDATE tax_details SET status = 'INACTIVE' WHERE vehicle_id = $1 AND status = 'ACTIVE'`;
        insertNewQuery = `INSERT INTO tax_details (vehicle_id, tax_number, tax_tenure_from, tax_tenure_to, status, created_at) VALUES ($1, $2, $3, $4, 'ACTIVE', CURRENT_TIMESTAMP)`;
        updateParams = [order.vehicle_id];
        insertParams = [order.vehicle_id, number, fromDate, toDate];
        break;
      case 'transfer':
        // Set old owner details to INACTIVE
        updateOldQuery = `UPDATE vehicle_owner_details SET status = 'INACTIVE' WHERE vehicle_id = $1 AND status = 'ACTIVE'`;
        // Insert new owner details
        insertNewQuery = `INSERT INTO vehicle_owner_details (vehicle_id, aadhar_number, mobile_number, registered_owner_name, guardian_info, address, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', CURRENT_TIMESTAMP)`;
        updateParams = [order.vehicle_id];
        // Get these from req.body.transferDetails or similar
        const { aadharNumber, mobileNumber, registeredOwnerName, guardianInfo, address } = req.body.transferDetails || req.body;
        insertParams = [order.vehicle_id, aadharNumber, mobileNumber, registeredOwnerName, guardianInfo, address];
        break;
      case 'hpt':
        // Set old hypothication record to INACTIVE
        await client.query(
          `UPDATE hypothication_details SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE vehicle_id = $1 AND status = 'ACTIVE'`,
          [order.vehicle_id]
        );
        // Insert new hypothication record with is_hpa = false and status ACTIVE
        await client.query(
          `INSERT INTO hypothication_details (vehicle_id, is_hpa, status, created_at, updated_at)
           VALUES ($1, $2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [order.vehicle_id, false]
        );
        break;
      case 'hpa':
        // Set old hypothication record to INACTIVE
        await client.query(
          `UPDATE hypothication_details SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE vehicle_id = $1 AND status = 'ACTIVE'`,
          [order.vehicle_id]
        );
        // Insert new hypothication record with is_hpa = true and status ACTIVE
        const { hypothicatedTo } = req.body;
        await client.query(
          `INSERT INTO hypothication_details (vehicle_id, is_hpa, hypothicated_to, status, created_at, updated_at)
           VALUES ($1, $2, $3, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [order.vehicle_id, true, hypothicatedTo]
        );
        break;
      default:
        break;
    }

    if (updateOldQuery) {
      const updateResult = await client.query(updateOldQuery, updateParams);
      console.log('Old records set to INACTIVE:', updateResult.rowCount);
    }
    if (insertNewQuery) {
      const insertResult = await client.query(insertNewQuery, insertParams);
      console.log('Inserted new record:', insertResult.rowCount);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Order completed and record created' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Complete order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;