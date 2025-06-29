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
    
    console.log(`📅 Today's date: ${currentDateStr}`);
    console.log(`📅 30 days from today: ${futureDateStr}`);
    console.log(`📋 Logic: EXPIRED (to_date < ${currentDateStr}) + DUE (${currentDateStr} <= to_date <= ${futureDateStr})`);
    
    let totalAdded = 0;
    const results = {
      puc: 0,
      insurance: 0,
      tax: 0,
      fitness: 0,
      permit: 0,
      taxDetails: 0
    };
    
    // Check PUC renewals
    console.log('\n📋 Checking PUC renewals...');
    try {
      // First, let's see what PUC documents we have and categorize them
      const pucCheckQuery = `
        SELECT v.registration_number, p.puc_to, p.vehicle_id,
               CASE 
                 WHEN p.puc_to < $1 THEN 'EXPIRED'
                 WHEN p.puc_to >= $1 AND p.puc_to <= $2 THEN 'DUE_SOON' 
                 ELSE 'FUTURE' 
               END as category,
               ($1::date - p.puc_to::date) as days_overdue,
               (p.puc_to::date - $1::date) as days_until_due
        FROM puc_details p
        JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.puc_to IS NOT NULL
        ORDER BY p.puc_to ASC
      `;
      const pucCheck = await client.query(pucCheckQuery, [currentDateStr, futureDateStr]);
      console.log('📋 PUC Documents analysis:');
      pucCheck.rows.forEach(row => {
        if (row.category === 'EXPIRED') {
          console.log(`   ❌ ${row.registration_number}: ${row.puc_to} (EXPIRED - ${row.days_overdue} days overdue)`);
        } else if (row.category === 'DUE_SOON') {
          console.log(`   ⚠️  ${row.registration_number}: ${row.puc_to} (DUE SOON - ${row.days_until_due} days left)`);
        } else {
          console.log(`   ✅ ${row.registration_number}: ${row.puc_to} (FUTURE - ${row.days_until_due} days left)`);
        }
      });

      // Insert renewal dues for EXPIRED + DUE_SOON documents
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
      const pucResult = await client.query(pucQuery, [currentDateStr, futureDateStr]);
      results.puc = pucResult.rowCount || 0;
      console.log(`✅ Added ${results.puc} PUC renewal dues`);
    } catch (error) {
      console.error('Error checking PUC renewals:', error);
      results.puc = 0;
    }
    
    // Check Insurance renewals
    console.log('\n🛡️ Checking Insurance renewals...');
    try {
      const insuranceCheckQuery = `
        SELECT v.registration_number, i.insurance_to, i.vehicle_id,
               CASE 
                 WHEN i.insurance_to < $1 THEN 'EXPIRED'
                 WHEN i.insurance_to >= $1 AND i.insurance_to <= $2 THEN 'DUE_SOON' 
                 ELSE 'FUTURE' 
               END as category,
               ($1::date - i.insurance_to::date) as days_overdue,
               (i.insurance_to::date - $1::date) as days_until_due
        FROM insurance_details i
        JOIN vehicles v ON i.vehicle_id = v.id
        WHERE i.insurance_to IS NOT NULL
        ORDER BY i.insurance_to ASC
      `;
      const insuranceCheck = await client.query(insuranceCheckQuery, [currentDateStr, futureDateStr]);
      console.log('🛡️ Insurance Documents analysis:');
      insuranceCheck.rows.forEach(row => {
        if (row.category === 'EXPIRED') {
          console.log(`   ❌ ${row.registration_number}: ${row.insurance_to} (EXPIRED - ${row.days_overdue} days overdue)`);
        } else if (row.category === 'DUE_SOON') {
          console.log(`   ⚠️  ${row.registration_number}: ${row.insurance_to} (DUE SOON - ${row.days_until_due} days left)`);
        } else {
          console.log(`   ✅ ${row.registration_number}: ${row.insurance_to} (FUTURE - ${row.days_until_due} days left)`);
        }
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
          AND (
            i.insurance_to < $1 OR 
            (i.insurance_to >= $1 AND i.insurance_to <= $2)
          )
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = i.vehicle_id 
              AND rd.renewal_type = 'Insurance' 
              AND DATE(rd.due_date) = DATE(i.insurance_to)
              AND rd.status != 'completed'
          )
      `;
      const insuranceResult = await client.query(insuranceQuery, [currentDateStr, futureDateStr]);
      results.insurance = insuranceResult.rowCount || 0;
      console.log(`✅ Added ${results.insurance} Insurance renewal dues`);
    } catch (error) {
      console.error('Error checking Insurance renewals:', error);
      results.insurance = 0;
    }
    
    // Check Tax renewals (from vehicles table)
    console.log('\n💰 Checking Tax renewals from vehicles table...');
    try {
      const taxCheckQuery = `
        SELECT v.registration_number, v.tax_upto, v.id as vehicle_id,
               CASE 
                 WHEN v.tax_upto < $1 THEN 'EXPIRED'
                 WHEN v.tax_upto >= $1 AND v.tax_upto <= $2 THEN 'DUE_SOON' 
                 ELSE 'FUTURE' 
               END as category,
               ($1::date - v.tax_upto::date) as days_overdue,
               (v.tax_upto::date - $1::date) as days_until_due
        FROM vehicles v
        WHERE v.tax_upto IS NOT NULL
        ORDER BY v.tax_upto ASC
      `;
      const taxCheck = await client.query(taxCheckQuery, [currentDateStr, futureDateStr]);
      console.log('💰 Tax Documents analysis (from vehicles table):');
      taxCheck.rows.forEach(row => {
        if (row.category === 'EXPIRED') {
          console.log(`   ❌ ${row.registration_number}: ${row.tax_upto} (EXPIRED - ${row.days_overdue} days overdue)`);
        } else if (row.category === 'DUE_SOON') {
          console.log(`   ⚠️  ${row.registration_number}: ${row.tax_upto} (DUE SOON - ${row.days_until_due} days left)`);
        } else {
          console.log(`   ✅ ${row.registration_number}: ${row.tax_upto} (FUTURE - ${row.days_until_due} days left)`);
        }
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
          AND (
            v.tax_upto < $1 OR 
            (v.tax_upto >= $1 AND v.tax_upto <= $2)
          )
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = v.id 
              AND rd.renewal_type = 'Tax' 
              AND DATE(rd.due_date) = DATE(v.tax_upto)
              AND rd.status != 'completed'
          )
      `;
      const taxResult = await client.query(taxQuery, [currentDateStr, futureDateStr]);
      results.tax = taxResult.rowCount || 0;
      console.log(`✅ Added ${results.tax} Tax renewal dues from vehicles table`);
    } catch (error) {
      console.error('Error checking Tax renewals from vehicles table:', error);
      results.tax = 0;
    }
    
    // Check Fitness renewals (Transport vehicles only)
    console.log('\n🔧 Checking Fitness renewals...');
    try {
      const fitnessCheckQuery = `
        SELECT v.registration_number, f.fc_tenure_to, f.vehicle_id,
               CASE 
                 WHEN f.fc_tenure_to < $1 THEN 'EXPIRED'
                 WHEN f.fc_tenure_to >= $1 AND f.fc_tenure_to <= $2 THEN 'DUE_SOON' 
                 ELSE 'FUTURE' 
               END as category,
               ($1::date - f.fc_tenure_to::date) as days_overdue,
               (f.fc_tenure_to::date - $1::date) as days_until_due
        FROM fitness_details f
        JOIN vehicles v ON f.vehicle_id = v.id
        WHERE f.fc_tenure_to IS NOT NULL AND v.type = 'Transport'
        ORDER BY f.fc_tenure_to ASC
      `;
      const fitnessCheck = await client.query(fitnessCheckQuery, [currentDateStr, futureDateStr]);
      console.log('🔧 Fitness Documents analysis:');
      fitnessCheck.rows.forEach(row => {
        if (row.category === 'EXPIRED') {
          console.log(`   ❌ ${row.registration_number}: ${row.fc_tenure_to} (EXPIRED - ${row.days_overdue} days overdue)`);
        } else if (row.category === 'DUE_SOON') {
          console.log(`   ⚠️  ${row.registration_number}: ${row.fc_tenure_to} (DUE SOON - ${row.days_until_due} days left)`);
        } else {
          console.log(`   ✅ ${row.registration_number}: ${row.fc_tenure_to} (FUTURE - ${row.days_until_due} days left)`);
        }
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
          AND v.type = 'Transport'
          AND (
            f.fc_tenure_to < $1 OR 
            (f.fc_tenure_to >= $1 AND f.fc_tenure_to <= $2)
          )
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = f.vehicle_id 
              AND rd.renewal_type = 'FC' 
              AND DATE(rd.due_date) = DATE(f.fc_tenure_to)
              AND rd.status != 'completed'
          )
      `;
      const fitnessResult = await client.query(fitnessQuery, [currentDateStr, futureDateStr]);
      results.fitness = fitnessResult.rowCount || 0;
      console.log(`✅ Added ${results.fitness} Fitness renewal dues`);
    } catch (error) {
      console.error('Error checking Fitness renewals:', error);
      results.fitness = 0;
    }
    
    // Check Permit renewals (Transport vehicles only)
    console.log('\n📄 Checking Permit renewals...');
    try {
      const permitCheckQuery = `
        SELECT v.registration_number, p.permit_tenure_to, p.vehicle_id,
               CASE 
                 WHEN p.permit_tenure_to < $1 THEN 'EXPIRED'
                 WHEN p.permit_tenure_to >= $1 AND p.permit_tenure_to <= $2 THEN 'DUE_SOON' 
                 ELSE 'FUTURE' 
               END as category,
               ($1::date - p.permit_tenure_to::date) as days_overdue,
               (p.permit_tenure_to::date - $1::date) as days_until_due
        FROM permit_details p
        JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.permit_tenure_to IS NOT NULL AND v.type = 'Transport'
        ORDER BY p.permit_tenure_to ASC
      `;
      const permitCheck = await client.query(permitCheckQuery, [currentDateStr, futureDateStr]);
      console.log('📄 Permit Documents analysis:');
      permitCheck.rows.forEach(row => {
        if (row.category === 'EXPIRED') {
          console.log(`   ❌ ${row.registration_number}: ${row.permit_tenure_to} (EXPIRED - ${row.days_overdue} days overdue)`);
        } else if (row.category === 'DUE_SOON') {
          console.log(`   ⚠️  ${row.registration_number}: ${row.permit_tenure_to} (DUE SOON - ${row.days_until_due} days left)`);
        } else {
          console.log(`   ✅ ${row.registration_number}: ${row.permit_tenure_to} (FUTURE - ${row.days_until_due} days left)`);
        }
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
          AND v.type = 'Transport'
          AND (
            p.permit_tenure_to < $1 OR 
            (p.permit_tenure_to >= $1 AND p.permit_tenure_to <= $2)
          )
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = p.vehicle_id 
              AND rd.renewal_type = 'Permit' 
              AND DATE(rd.due_date) = DATE(p.permit_tenure_to)
              AND rd.status != 'completed'
          )
      `;
      const permitResult = await client.query(permitQuery, [currentDateStr, futureDateStr]);
      results.permit = permitResult.rowCount || 0;
      console.log(`✅ Added ${results.permit} Permit renewal dues`);
    } catch (error) {
      console.error('Error checking Permit renewals:', error);
      results.permit = 0;
    }
    
    // Check Tax renewals from tax_details table (Transport vehicles)
    console.log('\n💳 Checking Tax details renewals...');
    try {
      const taxDetailsCheckQuery = `
        SELECT v.registration_number, t.tax_tenure_to, t.vehicle_id,
               CASE 
                 WHEN t.tax_tenure_to < $1 THEN 'EXPIRED'
                 WHEN t.tax_tenure_to >= $1 AND t.tax_tenure_to <= $2 THEN 'DUE_SOON' 
                 ELSE 'FUTURE' 
               END as category,
               ($1::date - t.tax_tenure_to::date) as days_overdue,
               (t.tax_tenure_to::date - $1::date) as days_until_due
        FROM tax_details t
        JOIN vehicles v ON t.vehicle_id = v.id
        WHERE t.tax_tenure_to IS NOT NULL AND v.type = 'Transport'
        ORDER BY t.tax_tenure_to ASC
      `;
      const taxDetailsCheck = await client.query(taxDetailsCheckQuery, [currentDateStr, futureDateStr]);
      console.log('💳 Tax Details Documents analysis:');
      taxDetailsCheck.rows.forEach(row => {
        if (row.category === 'EXPIRED') {
          console.log(`   ❌ ${row.registration_number}: ${row.tax_tenure_to} (EXPIRED - ${row.days_overdue} days overdue)`);
        } else if (row.category === 'DUE_SOON') {
          console.log(`   ⚠️  ${row.registration_number}: ${row.tax_tenure_to} (DUE SOON - ${row.days_until_due} days left)`);
        } else {
          console.log(`   ✅ ${row.registration_number}: ${row.tax_tenure_to} (FUTURE - ${row.days_until_due} days left)`);
        }
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
          AND v.type = 'Transport'
          AND (
            t.tax_tenure_to < $1 OR 
            (t.tax_tenure_to >= $1 AND t.tax_tenure_to <= $2)
          )
          AND NOT EXISTS (
            SELECT 1 FROM renewal_dues rd 
            WHERE rd.vehicle_id = t.vehicle_id 
              AND rd.renewal_type = 'Tax' 
              AND DATE(rd.due_date) = DATE(t.tax_tenure_to)
              AND rd.status != 'completed'
          )
      `;
      const taxDetailsResult = await client.query(taxDetailsQuery, [currentDateStr, futureDateStr]);
      results.taxDetails = taxDetailsResult.rowCount || 0;
      console.log(`✅ Added ${results.taxDetails} Tax details renewal dues`);
    } catch (error) {
      console.error('Error checking Tax details renewals:', error);
      results.taxDetails = 0;
    }
    
    await client.query('COMMIT');
    
    totalAdded = results.puc + results.insurance + results.tax + results.fitness + results.permit + results.taxDetails;
    
    console.log(`\n🎉 Renewal dues check completed! Total new dues added: ${totalAdded}`);
    console.log('📊 Breakdown:', results);
    
    // Show current status of all renewal dues
    console.log('\n📊 Current renewal dues status:');
    const statusQuery = `
      SELECT 
        rd.renewal_type,
        COUNT(*) as total_count,
        COUNT(CASE WHEN rd.due_date < $1 THEN 1 END) as expired_count,
        COUNT(CASE WHEN rd.due_date >= $1 AND rd.due_date <= $2 THEN 1 END) as due_soon_count
      FROM renewal_dues rd
      WHERE rd.status = 'pending'
      GROUP BY rd.renewal_type
      ORDER BY rd.renewal_type
    `;
    
    const statusResult = await client.query(statusQuery, [currentDateStr, futureDateStr]);
    if (statusResult.rows.length > 0) {
      statusResult.rows.forEach(row => {
        console.log(`   ${row.renewal_type}: ${row.expired_count} expired + ${row.due_soon_count} due soon = ${row.total_count} total`);
      });
    } else {
      console.log('   No pending renewal dues found');
    }
    
    return {
      success: true,
      message: `Renewal dues check completed successfully`,
      data: {
        ...results,
        total: totalAdded,
        currentStatus: statusResult.rows
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