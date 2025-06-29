const pool = require('../config/database');

const checkRenewalDues = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Starting renewal dues check...');
    
    // Get current date and future date (30 days ahead)
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 30);
    
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    console.log(`📅 Current date: ${currentDateStr}`);
    console.log(`📅 Checking for renewals until: ${futureDateStr}`);
    console.log(`📅 This means we're looking for documents expiring between now and ${futureDateStr}`);
    
    let totalAdded = 0;
    const results = {
      puc: 0,
      insurance: 0,
      tax: 0,
      fitness: 0,
      permit: 0,
      taxDetails: 0
    };
    
    // Check PUC renewals - documents expiring within 30 days or already expired
    console.log('📋 Checking PUC renewals...');
    try {
      // First, let's see what PUC documents we have
      const pucCheckQuery = `
        SELECT v.registration_number, p.puc_to, p.vehicle_id,
               CASE WHEN p.puc_to <= $1 THEN 'SHOULD_ADD' ELSE 'NOT_DUE' END as should_add
        FROM puc_details p
        JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.puc_to IS NOT NULL
        ORDER BY p.puc_to ASC
      `;
      const pucCheck = await client.query(pucCheckQuery, [futureDateStr]);
      console.log('📋 PUC Documents found:');
      pucCheck.rows.forEach(row => {
        console.log(`   ${row.registration_number}: ${row.puc_to} (${row.should_add})`);
      });

      const pucQuery = `
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
          AND p.puc_to <= $1
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = p.vehicle_id 
              AND rd.renewal_type = 'PUC' 
              AND rd.due_date = p.puc_to
              AND rd.status != 'completed'
          )
      `;
      const pucResult = await client.query(pucQuery, [futureDateStr]);
      results.puc = pucResult.rowCount || 0;
      console.log(`✅ Added ${results.puc} PUC renewal dues`);
      
      // Show which ones were added
      if (results.puc > 0) {
        const addedPucQuery = `
          SELECT v.registration_number, rd.due_date
          FROM renewal_dues rd
          JOIN vehicles v ON rd.vehicle_id = v.id
          WHERE rd.renewal_type = 'PUC'
          AND rd.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute'
          ORDER BY rd.created_at DESC
          LIMIT $1
        `;
        const addedPuc = await client.query(addedPucQuery, [results.puc]);
        console.log('📋 PUC renewals added:');
        addedPuc.rows.forEach(row => {
          console.log(`   ${row.registration_number}: due ${row.due_date}`);
        });
      }
    } catch (error) {
      console.error('Error checking PUC renewals:', error);
      results.puc = 0;
    }
    
    // Check Insurance renewals - documents expiring within 30 days or already expired
    console.log('🛡️ Checking Insurance renewals...');
    try {
      // First, let's see what Insurance documents we have
      const insuranceCheckQuery = `
        SELECT v.registration_number, i.insurance_to, i.vehicle_id,
               CASE WHEN i.insurance_to <= $1 THEN 'SHOULD_ADD' ELSE 'NOT_DUE' END as should_add
        FROM insurance_details i
        JOIN vehicles v ON i.vehicle_id = v.id
        WHERE i.insurance_to IS NOT NULL
        ORDER BY i.insurance_to ASC
      `;
      const insuranceCheck = await client.query(insuranceCheckQuery, [futureDateStr]);
      console.log('🛡️ Insurance Documents found:');
      insuranceCheck.rows.forEach(row => {
        console.log(`   ${row.registration_number}: ${row.insurance_to} (${row.should_add})`);
      });

      const insuranceQuery = `
        INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status, created_at)
        SELECT DISTINCT
          i.vehicle_id,
          'Insurance' as renewal_type,
          i.insurance_to as due_date,
          2000 as amount,
          'pending' as status,
          CURRENT_TIMESTAMP
        FROM insurance_details i
        JOIN vehicles v ON i.vehicle_id = v.id
        WHERE i.insurance_to IS NOT NULL 
          AND i.insurance_to <= $1
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = i.vehicle_id 
              AND rd.renewal_type = 'Insurance' 
              AND rd.due_date = i.insurance_to
              AND rd.status != 'completed'
          )
      `;
      const insuranceResult = await client.query(insuranceQuery, [futureDateStr]);
      results.insurance = insuranceResult.rowCount || 0;
      console.log(`✅ Added ${results.insurance} Insurance renewal dues`);
    } catch (error) {
      console.error('Error checking Insurance renewals:', error);
      results.insurance = 0;
    }
    
    // Check Tax renewals (from vehicles table) - documents expiring within 30 days or already expired
    console.log('💰 Checking Tax renewals from vehicles table...');
    try {
      // First, let's see what Tax documents we have
      const taxCheckQuery = `
        SELECT v.registration_number, v.tax_upto, v.id as vehicle_id,
               CASE WHEN v.tax_upto <= $1 THEN 'SHOULD_ADD' ELSE 'NOT_DUE' END as should_add
        FROM vehicles v
        WHERE v.tax_upto IS NOT NULL
        ORDER BY v.tax_upto ASC
      `;
      const taxCheck = await client.query(taxCheckQuery, [futureDateStr]);
      console.log('💰 Tax Documents found (from vehicles table):');
      taxCheck.rows.forEach(row => {
        console.log(`   ${row.registration_number}: ${row.tax_upto} (${row.should_add})`);
      });

      const taxQuery = `
        INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status, created_at)
        SELECT DISTINCT
          v.id as vehicle_id,
          'Tax' as renewal_type,
          v.tax_upto as due_date,
          1500 as amount,
          'pending' as status,
          CURRENT_TIMESTAMP
        FROM vehicles v
        WHERE v.tax_upto IS NOT NULL 
          AND v.tax_upto <= $1
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = v.id 
              AND rd.renewal_type = 'Tax' 
              AND rd.due_date = v.tax_upto
              AND rd.status != 'completed'
          )
      `;
      const taxResult = await client.query(taxQuery, [futureDateStr]);
      results.tax = taxResult.rowCount || 0;
      console.log(`✅ Added ${results.tax} Tax renewal dues from vehicles table`);
    } catch (error) {
      console.error('Error checking Tax renewals from vehicles table:', error);
      results.tax = 0;
    }
    
    // Check Fitness renewals (Transport vehicles only) - documents expiring within 30 days or already expired
    console.log('🔧 Checking Fitness renewals...');
    try {
      const fitnessCheckQuery = `
        SELECT v.registration_number, f.fc_tenure_to, f.vehicle_id,
               CASE WHEN f.fc_tenure_to <= $1 THEN 'SHOULD_ADD' ELSE 'NOT_DUE' END as should_add
        FROM fitness_details f
        JOIN vehicles v ON f.vehicle_id = v.id
        WHERE f.fc_tenure_to IS NOT NULL AND v.type = 'Transport'
        ORDER BY f.fc_tenure_to ASC
      `;
      const fitnessCheck = await client.query(fitnessCheckQuery, [futureDateStr]);
      console.log('🔧 Fitness Documents found:');
      fitnessCheck.rows.forEach(row => {
        console.log(`   ${row.registration_number}: ${row.fc_tenure_to} (${row.should_add})`);
      });

      const fitnessQuery = `
        INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status, created_at)
        SELECT DISTINCT
          f.vehicle_id,
          'FC' as renewal_type,
          f.fc_tenure_to as due_date,
          800 as amount,
          'pending' as status,
          CURRENT_TIMESTAMP
        FROM fitness_details f
        JOIN vehicles v ON f.vehicle_id = v.id
        WHERE f.fc_tenure_to IS NOT NULL 
          AND f.fc_tenure_to <= $1
          AND v.type = 'Transport'
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = f.vehicle_id 
              AND rd.renewal_type = 'FC' 
              AND rd.due_date = f.fc_tenure_to
              AND rd.status != 'completed'
          )
      `;
      const fitnessResult = await client.query(fitnessQuery, [futureDateStr]);
      results.fitness = fitnessResult.rowCount || 0;
      console.log(`✅ Added ${results.fitness} Fitness renewal dues`);
    } catch (error) {
      console.error('Error checking Fitness renewals:', error);
      results.fitness = 0;
    }
    
    // Check Permit renewals (Transport vehicles only) - documents expiring within 30 days or already expired
    console.log('📄 Checking Permit renewals...');
    try {
      const permitCheckQuery = `
        SELECT v.registration_number, p.permit_tenure_to, p.vehicle_id,
               CASE WHEN p.permit_tenure_to <= $1 THEN 'SHOULD_ADD' ELSE 'NOT_DUE' END as should_add
        FROM permit_details p
        JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.permit_tenure_to IS NOT NULL AND v.type = 'Transport'
        ORDER BY p.permit_tenure_to ASC
      `;
      const permitCheck = await client.query(permitCheckQuery, [futureDateStr]);
      console.log('📄 Permit Documents found:');
      permitCheck.rows.forEach(row => {
        console.log(`   ${row.registration_number}: ${row.permit_tenure_to} (${row.should_add})`);
      });

      const permitQuery = `
        INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status, created_at)
        SELECT DISTINCT
          p.vehicle_id,
          'Permit' as renewal_type,
          p.permit_tenure_to as due_date,
          1000 as amount,
          'pending' as status,
          CURRENT_TIMESTAMP
        FROM permit_details p
        JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.permit_tenure_to IS NOT NULL 
          AND p.permit_tenure_to <= $1
          AND v.type = 'Transport'
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = p.vehicle_id 
              AND rd.renewal_type = 'Permit' 
              AND rd.due_date = p.permit_tenure_to
              AND rd.status != 'completed'
          )
      `;
      const permitResult = await client.query(permitQuery, [futureDateStr]);
      results.permit = permitResult.rowCount || 0;
      console.log(`✅ Added ${results.permit} Permit renewal dues`);
    } catch (error) {
      console.error('Error checking Permit renewals:', error);
      results.permit = 0;
    }
    
    // Check Tax renewals from tax_details table (Transport vehicles) - documents expiring within 30 days or already expired
    console.log('💳 Checking Tax details renewals...');
    try {
      const taxDetailsCheckQuery = `
        SELECT v.registration_number, t.tax_tenure_to, t.vehicle_id,
               CASE WHEN t.tax_tenure_to <= $1 THEN 'SHOULD_ADD' ELSE 'NOT_DUE' END as should_add
        FROM tax_details t
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE t.tax_tenure_to IS NOT NULL AND v.type = 'Transport'
        ORDER BY t.tax_tenure_to ASC
      `;
      const taxDetailsCheck = await client.query(taxDetailsCheckQuery, [futureDateStr]);
      console.log('💳 Tax Details Documents found:');
      taxDetailsCheck.rows.forEach(row => {
        console.log(`   ${row.registration_number}: ${row.tax_tenure_to} (${row.should_add})`);
      });

      const taxDetailsQuery = `
        INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status, created_at)
        SELECT DISTINCT
          t.vehicle_id,
          'Tax' as renewal_type,
          t.tax_tenure_to as due_date,
          1500 as amount,
          'pending' as status,
          CURRENT_TIMESTAMP
        FROM tax_details t
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE t.tax_tenure_to IS NOT NULL 
          AND t.tax_tenure_to <= $1
          AND v.type = 'Transport'
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = t.vehicle_id 
              AND rd.renewal_type = 'Tax' 
              AND rd.due_date = t.tax_tenure_to
              AND rd.status != 'completed'
          )
      `;
      const taxDetailsResult = await client.query(taxDetailsQuery, [futureDateStr]);
      results.taxDetails = taxDetailsResult.rowCount || 0;
      console.log(`✅ Added ${results.taxDetails} Tax details renewal dues`);
    } catch (error) {
      console.error('Error checking Tax details renewals:', error);
      results.taxDetails = 0;
    }
    
    await client.query('COMMIT');
    
    totalAdded = results.puc + results.insurance + results.tax + results.fitness + results.permit + results.taxDetails;
    
    console.log(`🎉 Renewal dues check completed! Total new dues added: ${totalAdded}`);
    console.log('📊 Breakdown:', results);
    
    // Also check for overdue documents (already expired)
    console.log('🚨 Checking for overdue documents...');
    const overdueQuery = `
      SELECT 
        rd.renewal_type,
        COUNT(*) as overdue_count
      FROM renewal_dues rd
      WHERE rd.due_date < CURRENT_DATE
        AND rd.status = 'pending'
      GROUP BY rd.renewal_type
    `;
    
    const overdueResult = await client.query(overdueQuery);
    if (overdueResult.rows.length > 0) {
      console.log('⚠️ Overdue documents found:');
      overdueResult.rows.forEach(row => {
        console.log(`   ${row.renewal_type}: ${row.overdue_count} overdue`);
      });
    } else {
      console.log('✅ No overdue documents found');
    }
    
    return {
      success: true,
      message: `Renewal dues check completed successfully`,
      data: {
        ...results,
        total: totalAdded,
        overdue: overdueResult.rows
      }
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error checking renewal dues:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (require.main === module) {
  checkRenewalDues()
    .then((result) => {
      console.log('✅ Renewal dues check completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Renewal dues check failed:', error);
      process.exit(1);
    });
}

module.exports = checkRenewalDues;