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
      SELECT v.*, o.aadhar_number, o.mobile_number, o.registered_owner_name, o.guardian_info, o.address,
             CASE WHEN UPPER(v.type) = 'TRANSPORT' THEN 'COMMERCIAL' ELSE 'PRIVATE' END as category,
             UPPER(v.type) as type
      FROM vehicles v
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
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

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM vehicles v
      LEFT JOIN vehicle_owner_details o ON v.id = o.vehicle_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (startDate && endDate) {
      countParamCount += 2;
      countQuery += ` AND v.date_of_registration BETWEEN $${countParamCount - 1} AND $${countParamCount}`;
      countParams.push(startDate, endDate);
    }

    if (type) {
      countParamCount++;
      countQuery += ` AND v.type = $${countParamCount}`;
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        vehicles: result.rows,
        reportType: 'Vehicle Registration Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, type },
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
    const { startDate, endDate, status, serviceType, page = 1, limit = 50 } = req.query;
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

    if (serviceType) {
      paramCount++;
      query += ` AND so.service_type = $${paramCount}`;
      queryParams.push(serviceType);
    }

    query += ` ORDER BY so.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(amount) as total_revenue,
        SUM(amount_paid) as collected_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM service_orders so
      WHERE 1=1
      ${startDate && endDate ? `AND so.created_at BETWEEN '${startDate}' AND '${endDate}'` : ''}
      ${status ? `AND so.status = '${status}'` : ''}
      ${serviceType ? `AND so.service_type = '${serviceType}'` : ''}
    `;

    const statsResult = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        serviceOrders: result.rows,
        statistics: statsResult.rows[0],
        reportType: 'Service Orders Summary Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status, serviceType }
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
        COUNT(CASE WHEN so.service_type LIKE '%TRANSFER%' THEN 1 END) as transfer_orders,
        SUM(CASE WHEN so.service_type LIKE '%TRANSFER%' THEN so.amount ELSE 0 END) as transfer_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%FITNESS%' THEN 1 END) as fitness_orders,
        SUM(CASE WHEN so.service_type LIKE '%FITNESS%' THEN so.amount ELSE 0 END) as fitness_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%INSURANCE%' THEN 1 END) as insurance_orders,
        SUM(CASE WHEN so.service_type LIKE '%INSURANCE%' THEN so.amount ELSE 0 END) as insurance_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%TAX%' THEN 1 END) as tax_orders,
        SUM(CASE WHEN so.service_type LIKE '%TAX%' THEN so.amount ELSE 0 END) as tax_revenue,
        COUNT(CASE WHEN so.service_type LIKE '%PUC%' OR so.service_type LIKE '%POLLUTION%' THEN 1 END) as puc_orders,
        SUM(CASE WHEN so.service_type LIKE '%PUC%' OR so.service_type LIKE '%POLLUTION%' THEN so.amount ELSE 0 END) as puc_revenue
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

    // Get total summary
    const summaryQuery = `
      SELECT 
        SUM(total_revenue) as grand_total,
        SUM(collected_revenue) as total_collected,
        SUM(pending_revenue) as total_pending,
        SUM(total_orders) as total_orders
      FROM (${query}) as daily_data
    `;

    const summaryResult = await pool.query(summaryQuery, queryParams);

    res.json({
      success: true,
      data: {
        dailyRevenue: result.rows,
        summary: summaryResult.rows[0],
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
    const { type, status, urgency, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rd.*, v.registration_number, o.registered_owner_name, v.makers_name, 
             v.makers_classification, v.date_of_registration, v.chassis_number, v.engine_number,
             CASE 
               WHEN rd.due_date < CURRENT_DATE THEN 'Overdue'
               WHEN rd.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Critical'
               WHEN rd.due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
               ELSE 'Upcoming'
             END as urgency_status,
             (rd.due_date - CURRENT_DATE) as days_left
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
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

    if (urgency) {
      if (urgency === 'overdue') {
        query += ` AND rd.due_date < CURRENT_DATE`;
      } else if (urgency === 'critical') {
        query += ` AND rd.due_date >= CURRENT_DATE AND rd.due_date <= CURRENT_DATE + INTERVAL '7 days'`;
      } else if (urgency === 'due_soon') {
        query += ` AND rd.due_date > CURRENT_DATE + INTERVAL '7 days' AND rd.due_date <= CURRENT_DATE + INTERVAL '30 days'`;
      }
    }

    query += ` ORDER BY rd.due_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_dues,
        COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_count,
        COUNT(CASE WHEN due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as critical_count,
        COUNT(CASE WHEN due_date > CURRENT_DATE + INTERVAL '7 days' AND due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as due_soon_count,
        COUNT(CASE WHEN renewal_type = 'Insurance' THEN 1 END) as insurance_count,
        COUNT(CASE WHEN renewal_type = 'Tax' THEN 1 END) as tax_count,
        COUNT(CASE WHEN renewal_type = 'FC' THEN 1 END) as fc_count,
        COUNT(CASE WHEN renewal_type = 'Permit' THEN 1 END) as permit_count,
        COUNT(CASE WHEN renewal_type = 'PUC' THEN 1 END) as puc_count
      FROM renewal_dues rd
      WHERE rd.status != 'completed'
    `;

    const statsResult = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        renewalDues: result.rows,
        statistics: statsResult.rows[0],
        reportType: 'Renewal Dues Report',
        generatedAt: new Date().toISOString(),
        filters: { type, status, urgency }
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
        COUNT(CASE WHEN fuel_used = 'Electric' THEN 1 END) as electric_count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
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
        COUNT(CASE WHEN type = 'Non Transport' THEN 1 END) as non_transport_count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM vehicles
      WHERE makers_name IS NOT NULL AND makers_name != ''
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

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
      FROM appointments a
      WHERE 1=1
      ${startDate && endDate ? `AND a.appointment_date BETWEEN '${startDate}' AND '${endDate}'` : ''}
      ${status ? `AND a.status = '${status}'` : ''}
    `;

    const statsResult = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        appointments: result.rows,
        statistics: statsResult.rows[0],
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

// Get agent performance report
router.get('/agents/performance', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name as agent_name,
        u.email,
        COUNT(so.id) as total_orders,
        SUM(so.amount) as total_revenue,
        COUNT(CASE WHEN so.status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN so.status = 'pending' THEN 1 END) as pending_orders,
        ROUND(AVG(so.amount), 2) as avg_order_value,
        COUNT(DISTINCT so.vehicle_id) as unique_customers
      FROM users u
      LEFT JOIN service_orders so ON u.id = so.agent_id
      WHERE u.role = 'agent'
    `;

    const queryParams = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount += 2;
      query += ` AND so.created_at BETWEEN $${paramCount - 1} AND $${paramCount}`;
      queryParams.push(startDate, endDate);
    }

    query += ` GROUP BY u.id, u.name, u.email ORDER BY total_revenue DESC`;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        agentPerformance: result.rows,
        reportType: 'Agent Performance Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Agent performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get monthly trends report
router.get('/trends/monthly', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const query = `
      SELECT 
        DATE_TRUNC('month', v.date_of_registration) as month,
        COUNT(v.id) as registrations,
        COUNT(CASE WHEN v.type = 'Transport' THEN 1 END) as transport_registrations,
        COUNT(CASE WHEN v.type = 'Non Transport' THEN 1 END) as non_transport_registrations,
        COALESCE(SUM(so.amount), 0) as revenue,
        COUNT(so.id) as service_orders
      FROM vehicles v
      LEFT JOIN service_orders so ON v.id = so.vehicle_id 
        AND DATE_TRUNC('month', so.created_at) = DATE_TRUNC('month', v.date_of_registration)
      WHERE EXTRACT(YEAR FROM v.date_of_registration) = $1
      GROUP BY DATE_TRUNC('month', v.date_of_registration)
      ORDER BY month
    `;

    const result = await pool.query(query, [year]);

    res.json({
      success: true,
      data: {
        monthlyTrends: result.rows,
        reportType: 'Monthly Trends Report',
        generatedAt: new Date().toISOString(),
        filters: { year }
      }
    });
  } catch (error) {
    console.error('Monthly trends report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Export report data as CSV
router.get('/export/:reportType', authenticateToken, async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'csv' } = req.query;

    // This is a placeholder for CSV export functionality
    // In a real implementation, you would generate CSV data based on the report type
    
    res.json({
      success: true,
      message: 'Export functionality will be implemented based on report type',
      data: {
        reportType,
        format,
        downloadUrl: `/api/reports/download/${reportType}.${format}`
      }
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;