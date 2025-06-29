const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Import the check renewal dues function
let checkRenewalDues;
try {
  checkRenewalDues = require('../scripts/check-renewal-dues');
} catch (error) {
  console.error('Failed to load check-renewal-dues script:', error);
  checkRenewalDues = null;
}

// Get all renewal dues
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT rd.*, v.registration_number, v.registered_owner_name, v.makers_name, 
             v.makers_classification, v.date_of_registration, v.chassis_number, 
             v.engine_number, v.fuel_used, v.mobile_number, v.address
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
        vehicle_id, service_type, actual_amount, amount, amount_paid, customer_name, 
        status, agent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const serviceType = `${renewal.renewal_type} Renewal`;
    const serviceOrderValues = [
      renewal.vehicle_id, serviceType, amount, amount, 0, 
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
        COUNT(CASE WHEN renewal_type = 'Permit' THEN 1 END) as permit_count,
        COUNT(CASE WHEN renewal_type = 'PUC' THEN 1 END) as puc_count
      FROM renewal_dues
      WHERE status != 'completed'
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

// Manual trigger to check renewal dues
router.post('/check-dues', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Manual renewal dues check triggered by:', req.user.name);
    
    if (!checkRenewalDues) {
      return res.status(500).json({
        success: false,
        message: 'Renewal dues check function not available'
      });
    }
    
    const result = await checkRenewalDues();
    
    res.json({
      success: true,
      message: 'Renewal dues check completed successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Manual renewal dues check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check renewal dues',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Auto-check renewal dues on login (called by frontend)
router.post('/auto-check', authenticateToken, async (req, res) => {
  try {
    // Check if we've already run this today
    const lastCheckResult = await pool.query(`
      SELECT created_at 
      FROM renewal_dues 
      WHERE DATE(created_at) = CURRENT_DATE 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    // If we've already checked today, skip
    if (lastCheckResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Renewal dues already checked today',
        data: { skipped: true }
      });
    }

    console.log('🔄 Auto renewal dues check triggered on login by:', req.user.name);
    
    if (!checkRenewalDues) {
      return res.json({
        success: true,
        message: 'Renewal dues check function not available',
        data: { error: 'Function not available' }
      });
    }
    
    const result = await checkRenewalDues();
    
    res.json({
      success: true,
      message: 'Auto renewal dues check completed',
      data: result.data
    });
  } catch (error) {
    console.error('Auto renewal dues check error:', error);
    // Don't fail login if renewal check fails
    res.json({
      success: true,
      message: 'Renewal dues check failed but login successful',
      data: { error: error.message }
    });
  }
});

// Debug endpoint to check what's happening with the duplicate check
router.post('/debug-duplicate-check', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Debug: Checking duplicate logic...');
    
    const currentDate = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    console.log(`📅 Current date: ${currentDate}`);
    console.log(`📅 Future date: ${futureDateStr}`);
    
    // Check what PUC documents exist and what renewal dues exist
    const pucDocsQuery = `
      SELECT v.registration_number, p.puc_to, p.vehicle_id,
             CASE 
               WHEN p.puc_to < $1 THEN 'EXPIRED'
               WHEN p.puc_to >= $1 AND p.puc_to <= $2 THEN 'DUE_SOON' 
               ELSE 'FUTURE' 
             END as category
      FROM puc_details p
      JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.puc_to IS NOT NULL
      ORDER BY p.puc_to ASC
    `;
    
    const pucDocs = await pool.query(pucDocsQuery, [currentDate, futureDateStr]);
    console.log('📋 PUC Documents found:', pucDocs.rows.length);
    
    // Check existing renewal dues for PUC
    const existingPucDues = await pool.query(`
      SELECT rd.*, v.registration_number
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE rd.renewal_type = 'PUC'
      ORDER BY rd.due_date ASC
    `);
    console.log('📋 Existing PUC renewal dues:', existingPucDues.rows.length);
    
    // For each PUC document, check if it would be blocked by the duplicate check
    const duplicateCheckResults = [];
    for (const pucDoc of pucDocs.rows) {
      if (pucDoc.category === 'EXPIRED' || pucDoc.category === 'DUE_SOON') {
        const duplicateCheckQuery = `
          SELECT 1 FROM renewal_dues rd 
          WHERE rd.vehicle_id = $1 
            AND rd.renewal_type = 'PUC' 
            AND DATE(rd.due_date) = DATE($2)
            AND rd.status != 'completed'
        `;
        
        const duplicateCheck = await pool.query(duplicateCheckQuery, [pucDoc.vehicle_id, pucDoc.puc_to]);
        
        duplicateCheckResults.push({
          registration: pucDoc.registration_number,
          puc_to: pucDoc.puc_to,
          category: pucDoc.category,
          vehicle_id: pucDoc.vehicle_id,
          has_duplicate: duplicateCheck.rows.length > 0,
          would_be_inserted: duplicateCheck.rows.length === 0
        });
      }
    }
    
    console.log('🔍 Duplicate check results:');
    duplicateCheckResults.forEach(result => {
      console.log(`   ${result.registration}: ${result.category} - ${result.has_duplicate ? 'BLOCKED (duplicate exists)' : 'WOULD INSERT'}`);
    });
    
    // Test the actual INSERT query to see what happens
    console.log('\n🧪 Testing actual INSERT query...');
    const testInsertQuery = `
      SELECT 
        p.vehicle_id,
        'PUC' as renewal_type,
        p.puc_to as due_date,
        500 as amount,
        'pending' as status,
        v.registration_number,
        CASE 
          WHEN p.puc_to < $1 THEN 'EXPIRED'
          WHEN p.puc_to >= $1 AND p.puc_to <= $2 THEN 'DUE_SOON' 
          ELSE 'FUTURE' 
        END as category,
        CASE WHEN EXISTS (
          SELECT 1 FROM renewal_dues rd 
          WHERE rd.vehicle_id = p.vehicle_id 
            AND rd.renewal_type = 'PUC' 
            AND DATE(rd.due_date) = DATE(p.puc_to)
            AND rd.status != 'completed'
        ) THEN true ELSE false END as has_duplicate
      FROM puc_details p
      JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.puc_to IS NOT NULL 
        AND (
          p.puc_to < $1 OR 
          (p.puc_to >= $1 AND p.puc_to <= $2)
        )
    `;
    
    const testResult = await pool.query(testInsertQuery, [currentDate, futureDateStr]);
    console.log('🧪 Test query results:');
    testResult.rows.forEach(row => {
      console.log(`   ${row.registration_number}: ${row.category} - ${row.has_duplicate ? 'BLOCKED' : 'WOULD INSERT'}`);
    });
    
    const wouldInsert = testResult.rows.filter(row => !row.has_duplicate);
    console.log(`\n📊 Summary: ${wouldInsert.length} out of ${testResult.rows.length} PUC documents would be inserted`);
    
    res.json({
      success: true,
      data: {
        currentDate,
        futureDateStr,
        pucDocuments: pucDocs.rows,
        existingPucDues: existingPucDues.rows,
        duplicateCheckResults,
        testQueryResults: testResult.rows,
        summary: {
          totalPucDocs: pucDocs.rows.length,
          existingDues: existingPucDues.rows.length,
          wouldInsert: wouldInsert.length
        }
      }
    });
  } catch (error) {
    console.error('Debug duplicate check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Simple test endpoint to directly insert PUC renewal dues
router.post('/test-insert-puc', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🧪 Testing direct PUC insertion...');
    
    const currentDate = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    console.log(`📅 Current date: ${currentDate}`);
    console.log(`📅 Future date: ${futureDateStr}`);
    
    // Get PUC documents that should be inserted
    const selectQuery = `
      SELECT DISTINCT
        p.vehicle_id,
        'PUC' as renewal_type,
        p.puc_to as due_date,
        500 as amount,
        'pending' as status,
        v.registration_number
      FROM puc_details p
      JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.puc_to IS NOT NULL 
        AND (
          p.puc_to < $1 OR 
          (p.puc_to >= $1 AND p.puc_to <= $2)
        )
        AND NOT EXISTS (
          SELECT 1 FROM renewal_dues rd 
          WHERE rd.vehicle_id = p.vehicle_id 
            AND rd.renewal_type = 'PUC' 
            AND DATE(rd.due_date) = DATE(p.puc_to)
            AND rd.status != 'completed'
        )
    `;
    
    const selectResult = await client.query(selectQuery, [currentDate, futureDateStr]);
    console.log(`📋 Found ${selectResult.rows.length} PUC documents to insert:`);
    selectResult.rows.forEach(row => {
      console.log(`   ${row.registration_number}: ${row.due_date}`);
    });
    
    if (selectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: true,
        message: 'No PUC documents to insert',
        data: { inserted: 0, found: 0 }
      });
    }
    
    // Now try to insert them
    const insertQuery = `
      INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status, created_at)
      SELECT DISTINCT
        p.vehicle_id,
        'PUC' as renewal_type,
        p.puc_to as due_date,
        500 as amount,
        'pending' as status,
        CURRENT_TIMESTAMP
      FROM puc_details p
      JOIN vehicles v ON p.vehicle_id = v.id
      WHERE p.puc_to IS NOT NULL 
        AND (
          p.puc_to < $1 OR 
          (p.puc_to >= $1 AND p.puc_to <= $2)
        )
        AND NOT EXISTS (
          SELECT 1 FROM renewal_dues rd 
          WHERE rd.vehicle_id = p.vehicle_id 
            AND rd.renewal_type = 'PUC' 
            AND DATE(rd.due_date) = DATE(p.puc_to)
            AND rd.status != 'completed'
        )
    `;
    
    const insertResult = await client.query(insertQuery, [currentDate, futureDateStr]);
    console.log(`✅ Successfully inserted ${insertResult.rowCount} PUC renewal dues`);
    
    // Verify the insertion
    const verifyQuery = `
      SELECT rd.*, v.registration_number
      FROM renewal_dues rd
      JOIN vehicles v ON rd.vehicle_id = v.id
      WHERE rd.renewal_type = 'PUC'
      ORDER BY rd.created_at DESC
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log(`📋 Total PUC renewal dues in database: ${verifyResult.rows.length}`);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `Successfully inserted ${insertResult.rowCount} PUC renewal dues`,
      data: {
        inserted: insertResult.rowCount,
        found: selectResult.rows.length,
        total_in_db: verifyResult.rows.length,
        inserted_records: verifyResult.rows.slice(0, insertResult.rowCount)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Test insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Test insert failed',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;