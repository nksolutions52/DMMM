const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all renewal dues
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rd.*, v.registration_number, v.registered_owner_name, v.makers_name, 
             v.makers_classification, v.date_of_registration, v.chassis_number, 
             v.engine_number, v.fuel_used
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (v.registration_number ILIKE $${paramCount} OR v.registered_owner_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (type) {
      paramCount++;
      query += ` AND rd.renewal_type = $${paramCount}`;
      queryParams.push(type);
    }

    if (status) {
      paramCount++;
      query += ` AND rd.status = $${paramCount}`;
      queryParams.push(status);
    }

    query += ` ORDER BY rd.due_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Calculate days left for each renewal
    const renewalsWithDaysLeft = result.rows.map(renewal => {
      const dueDate = new Date(renewal.due_date);
      const today = new Date();
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        ...renewal,
        days_left: daysLeft,
        status: daysLeft < 0 ? 'overdue' : 'upcoming'
      };
    });

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (v.registration_number ILIKE $${countParamCount} OR v.registered_owner_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (type) {
      countParamCount++;
      countQuery += ` AND rd.renewal_type = $${countParamCount}`;
      countParams.push(type);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND rd.status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        renewals: renewalsWithDaysLeft,
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
    console.error('Get renewal dues error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get renewal due by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT rd.*, v.registration_number, v.registered_owner_name, v.makers_name, 
             v.makers_classification, v.date_of_registration, v.chassis_number, 
             v.engine_number, v.fuel_used, v.address, v.mobile_number
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE rd.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renewal due not found'
      });
    }

    const renewal = result.rows[0];
    const dueDate = new Date(renewal.due_date);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    res.json({
      success: true,
      data: {
        ...renewal,
        days_left: daysLeft,
        status: daysLeft < 0 ? 'overdue' : 'upcoming'
      }
    });
  } catch (error) {
    console.error('Get renewal due error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create service order from renewal due
router.post('/:id/process', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Get renewal due details
    const renewalResult = await client.query(`
      SELECT rd.*, v.registration_number, v.registered_owner_name
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE rd.id = $1
    `, [id]);

    if (renewalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renewal due not found'
      });
    }

    const renewal = renewalResult.rows[0];

    // Create service order
    const serviceOrderQuery = `
      INSERT INTO service_orders (
        vehicle_id, service_type, amount, amount_paid, customer_name, 
        status, agent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const serviceType = `${renewal.renewal_type} Renewal`;
    const serviceOrderValues = [
      renewal.vehicle_id, serviceType, amount, 0, 
      renewal.registered_owner_name, 'pending', req.user.id
    ];

    const serviceOrderResult = await client.query(serviceOrderQuery, serviceOrderValues);

    // Update renewal due status
    await client.query(
      'UPDATE renewal_dues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['processing', id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Service order created successfully',
      data: { 
        serviceOrderId: serviceOrderResult.rows[0].id,
        renewalId: id
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process renewal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Update renewal due status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, processing, or completed'
      });
    }

    const result = await pool.query(
      'UPDATE renewal_dues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Renewal due not found'
      });
    }

    res.json({
      success: true,
      message: 'Renewal due status updated successfully'
    });
  } catch (error) {
    console.error('Update renewal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get renewal statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_renewals,
        COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_count,
        COUNT(CASE WHEN due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as upcoming_count,
        COUNT(CASE WHEN renewal_type = 'Insurance' THEN 1 END) as insurance_count,
        COUNT(CASE WHEN renewal_type = 'Tax' THEN 1 END) as tax_count,
        COUNT(CASE WHEN renewal_type = 'FC' THEN 1 END) as fc_count,
        COUNT(CASE WHEN renewal_type = 'Permit' THEN 1 END) as permit_count
      FROM renewal_dues
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    console.error('Get renewal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;