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
      SELECT so.*, v.registration_number, v.registered_owner_name,
             u.name as agent_name
      FROM service_orders so
      JOIN vehicles v ON so.vehicle_id = v.id
      LEFT JOIN users u ON so.agent_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (v.registration_number ILIKE $${paramCount} OR v.registered_owner_name ILIKE $${paramCount} OR so.service_type ILIKE $${paramCount})`;
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
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (v.registration_number ILIKE $${countParamCount} OR v.registered_owner_name ILIKE $${countParamCount} OR so.service_type ILIKE $${countParamCount})`;
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

// Get service order by ID
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT so.*, v.registration_number, v.registered_owner_name,
             u.name as agent_name
      FROM service_orders so
      JOIN vehicles v ON so.vehicle_id = v.id
      LEFT JOIN users u ON so.agent_id = u.id
      WHERE so.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service order not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
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
  try {
    const { vehicleId, serviceType, actualAmount, discount = 0, customerName } = req.body;

    // Verify vehicle exists
    const vehicleResult = await pool.query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Calculate amount in backend for validation
    const amount = Number(actualAmount) - Number(discount);

    const query = `
      INSERT INTO service_orders (
        vehicle_id, service_type, actual_amount, amount, amount_paid, discount, customer_name, 
        status, agent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const values = [vehicleId, serviceType, actualAmount, amount, 0, discount, customerName, 'pending', req.user.id];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Service order created successfully',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Create service order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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

    const result = await pool.query(
      'UPDATE service_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [status, id]
    );

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
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Get current service order
    const orderResult = await pool.query(
      'SELECT amount, amount_paid FROM service_orders WHERE id = $1',
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

    // Update payment
    await pool.query(
      'UPDATE service_orders SET amount_paid = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newAmountPaid, id]
    );

    // If fully paid, update status to completed
    if (newAmountPaid >= totalAmount) {
      await pool.query(
        'UPDATE service_orders SET status = $1 WHERE id = $2',
        ['completed', id]
      );
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        amountPaid: newAmountPaid,
        pendingAmount: totalAmount - newAmountPaid
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;