const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get vehicle registration report
router.get('/vehicles/registration', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.*, 
             CASE WHEN v.type = 'Transport' THEN 'Commercial' ELSE 'Private' END as category
      FROM vehicles v
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount += 2;
      query += ` AND v.date_of_registration BETWEEN $${paramCount - 1} AND $${paramCount}`;
      queryParams.push(startDate, endDate);
    }

    if (type) {
      paramCount++;
      query += ` AND v.type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY v.date_of_registration DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        vehicles: result.rows,
        reportType: 'Vehicle Registration Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, type }
      }
    });
  } catch (error) {
    console.error('Vehicle registration report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get service orders summary report
router.get('/services/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;
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

    if (startDate && endDate) {
      paramCount += 2;
      query += ` AND so.created_at BETWEEN $${paramCount - 1} AND $${paramCount}`;
      queryParams.push(startDate, endDate);
    }

    if (status) {
      paramCount++;
      query += ` AND so.status = $${paramCount}`;
      queryParams.push(status);
    }

    query += ` ORDER BY so.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        serviceOrders: result.rows,
        reportType: 'Service Orders Summary Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status }
      }
    });
  } catch (error) {
    console.error('Service orders report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get daily revenue report
router.get('/revenue/daily', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        DATE(so.created_at) as date,
        COUNT(*) as total_orders,
        SUM(so.amount) as total_revenue,
        SUM(so.amount_paid) as collected_revenue,
        SUM(so.amount - so.amount_paid) as pending_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%Transfer%' THEN 1 END) as transfer_orders,
        SUM(CASE WHEN so.service_type LIKE '%Transfer%' THEN so.amount ELSE 0 END) as transfer_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%Fitness%' THEN 1 END) as fitness_orders,
        SUM(CASE WHEN so.service_type LIKE '%Fitness%' THEN so.amount ELSE 0 END) as fitness_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%Insurance%' THEN 1 END) as insurance_orders,
        SUM(CASE WHEN so.service_type LIKE '%Insurance%' THEN so.amount ELSE 0 END) as insurance_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%Tax%' THEN 1 END) as tax_orders,
        SUM(CASE WHEN so.service_type LIKE '%Tax%' THEN so.amount ELSE 0 END) as tax_revenue
      FROM service_orders so
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount += 2;
      query += ` AND DATE(so.created_at) BETWEEN $${paramCount - 1} AND $${paramCount}`;
      queryParams.push(startDate, endDate);
    } else {
      // Default to last 30 days
      query += ` AND so.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    query += ` GROUP BY DATE(so.created_at) ORDER BY date DESC`;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        dailyRevenue: result.rows,
        reportType: 'Daily Revenue Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Daily revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get renewal dues report
router.get('/renewals/dues', authenticateToken, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rd.*, v.registration_number, v.registered_owner_name, v.makers_name, 
             v.makers_classification, v.date_of_registration,
             CASE 
               WHEN rd.due_date < CURRENT_DATE THEN 'Overdue'
               WHEN rd.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
               ELSE 'Upcoming'
             END as urgency_status,
             (rd.due_date - CURRENT_DATE) as days_left
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

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

    res.json({
      success: true,
      data: {
        renewalDues: result.rows,
        reportType: 'Renewal Dues Report',
        generatedAt: new Date().toISOString(),
        filters: { type, status }
      }
    });
  } catch (error) {
    console.error('Renewal dues report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vehicles by type report
router.get('/vehicles/by-type', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN fuel_used = 'Petrol' THEN 1 END) as petrol_count,
        COUNT(CASE WHEN fuel_used = 'Diesel' THEN 1 END) as diesel_count,
        COUNT(CASE WHEN fuel_used = 'CNG' THEN 1 END) as cng_count,
        COUNT(CASE WHEN fuel_used = 'Electric' THEN 1 END) as electric_count
      FROM vehicles
      GROUP BY type
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        vehiclesByType: result.rows,
        reportType: 'Vehicles by Type Report',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Vehicles by type report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vehicles by manufacturer report
router.get('/vehicles/by-manufacturer', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        makers_name,
        COUNT(*) as count,
        COUNT(CASE WHEN type = 'Transport' THEN 1 END) as transport_count,
        COUNT(CASE WHEN type = 'Non Transport' THEN 1 END) as non_transport_count
      FROM vehicles
      GROUP BY makers_name
      ORDER BY count DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: {
        vehiclesByManufacturer: result.rows,
        reportType: 'Vehicles by Manufacturer Report',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Vehicles by manufacturer report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get appointment summary report
router.get('/appointments/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let query = `
      SELECT a.*, u.name as agent_name
      FROM appointments a
      LEFT JOIN users u ON a.agent_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount += 2;
      query += ` AND a.appointment_date BETWEEN $${paramCount - 1} AND $${paramCount}`;
      queryParams.push(startDate, endDate);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    query += ` ORDER BY a.appointment_date DESC, a.time_slot DESC`;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        appointments: result.rows,
        reportType: 'Appointment Summary Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status }
      }
    });
  } catch (error) {
    console.error('Appointment summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;