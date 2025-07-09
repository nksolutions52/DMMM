const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get total vehicles
    const vehiclesResult = await pool.query('SELECT COUNT(*) as count FROM vehicles');
    const totalVehicles = parseInt(vehiclesResult.rows[0].count);

    // Get new registrations (current month, by created_at)
    const newRegistrationsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM vehicles 
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    `);
    const newRegistrations = parseInt(newRegistrationsResult.rows[0].count);

    // Get renewals due (next 30 days)
    const renewalsDueResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM renewal_dues 
      WHERE due_date <= CURRENT_DATE + INTERVAL '30 days' 
      AND status != 'completed'
    `);
    const renewalsDue = parseInt(renewalsDueResult.rows[0].count);

    // Get pending approvals (pending service orders)
    const pendingApprovalsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM service_orders 
      WHERE status = 'pending'
    `);
    const pendingApprovals = parseInt(pendingApprovalsResult.rows[0].count);

    // Calculate percentage changes (mock data for now)
    const stats = [
      {
        title: 'Total Vehicles',
        value: totalVehicles,
        icon: 'car',
        change: 12.5,
        color: 'blue',
        label: 'Vehicles'
      },
      {
        title: 'New Registrations',
        value: newRegistrations,
        icon: 'file-plus',
        change: 8.2,
        color: 'green',
        label: 'Registrations'
      },
      {
        title: 'Renewals Due',
        value: renewalsDue,
        icon: 'refresh-cw',
        change: -3.5,
        color: 'orange',
        label: 'Renewals'
      },
      {
        title: 'Pending Approvals',
        value: pendingApprovals,
        icon: 'clock',
        change: -1.8,
        color: 'red',
        label: 'Approvals'
      }
    ];

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent service orders
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    // Always limit to 5
    const query = `
      SELECT so.*, v.registration_number, o.registered_owner_name,
             u.name as agent_name
      FROM service_orders so
      JOIN vehicles v ON so.vehicle_id = v.id
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
      LEFT JOIN users u ON so.agent_id = u.id
      ORDER BY so.created_at DESC
      LIMIT 5
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming renewals
router.get('/upcoming-renewals', authenticateToken, async (req, res) => {
  try {
    // Only future renewals in next 30 days
    const query = `
      SELECT rd.*, v.registration_number, o.registered_owner_name,
             (rd.due_date - CURRENT_DATE) as days_left,
             'upcoming' as status
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      LEFT JOIN vehicle_owner_details o ON v.id = o.vehicle_id
      WHERE rd.due_date > CURRENT_DATE
        AND rd.due_date <= CURRENT_DATE + INTERVAL '30 days'
        AND rd.status != 'completed'
      ORDER BY rd.due_date ASC
      LIMIT 5
    `;

    const result = await pool.query(query);

    // Remove 'amount' from each renewal due in the response
    const renewals = result.rows.map(({ amount, ...rest }) => rest);

    res.json({
      success: true,
      data: renewals
    });
  } catch (error) {
    console.error('Get upcoming renewals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get revenue summary
router.get('/revenue-summary', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "DATE(created_at) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '1 year'";
        break;
      default:
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(amount) as total_revenue,
        SUM(amount_paid) as collected_revenue,
        SUM(amount - amount_paid) as pending_revenue,
        AVG(amount) as average_order_value
      FROM service_orders
      WHERE ${dateFilter}
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: {
        period,
        ...result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get revenue summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vehicle type distribution
router.get('/vehicle-distribution', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM vehicles
      GROUP BY type
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get vehicle distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get monthly registration trends
router.get('/registration-trends', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_TRUNC('month', date_of_registration) as month,
        COUNT(*) as registrations,
        COUNT(CASE WHEN type = 'Transport' THEN 1 END) as transport_count,
        COUNT(CASE WHEN type = 'Non Transport' THEN 1 END) as non_transport_count
      FROM vehicles
      WHERE date_of_registration >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', date_of_registration)
      ORDER BY month DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get registration trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;