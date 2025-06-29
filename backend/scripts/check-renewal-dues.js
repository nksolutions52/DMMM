const pool = require('../config/database');

const checkRenewalDues = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Starting renewal dues check...');
    
    // Get current date
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 30); // Check 30 days ahead
    
    // Check PUC renewals
    console.log('📋 Checking PUC renewals...');
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
    const pucResult = await client.query(pucQuery, [futureDate.toISOString().split('T')[0]]);
    console.log(`✅ Added ${pucResult.rowCount} PUC renewal dues`);
    
    // Check Insurance renewals
    console.log('🛡️ Checking Insurance renewals...');
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
    const insuranceResult = await client.query(insuranceQuery, [futureDate.toISOString().split('T')[0]]);
    console.log(`✅ Added ${insuranceResult.rowCount} Insurance renewal dues`);
    
    // Check Tax renewals (from vehicles table)
    console.log('💰 Checking Tax renewals...');
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
    const taxResult = await client.query(taxQuery, [futureDate.toISOString().split('T')[0]]);
    console.log(`✅ Added ${taxResult.rowCount} Tax renewal dues`);
    
    // Check Fitness renewals (Transport vehicles only)
    console.log('🔧 Checking Fitness renewals...');
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
    const fitnessResult = await client.query(fitnessQuery, [futureDate.toISOString().split('T')[0]]);
    console.log(`✅ Added ${fitnessResult.rowCount} Fitness renewal dues`);
    
    // Check Permit renewals (Transport vehicles only)
    console.log('📄 Checking Permit renewals...');
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
    const permitResult = await client.query(permitQuery, [futureDate.toISOString().split('T')[0]]);
    console.log(`✅ Added ${permitResult.rowCount} Permit renewal dues`);
    
    // Check Tax renewals from tax_details table (Transport vehicles)
    console.log('💳 Checking Tax details renewals...');
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
    const taxDetailsResult = await client.query(taxDetailsQuery, [futureDate.toISOString().split('T')[0]]);
    console.log(`✅ Added ${taxDetailsResult.rowCount} Tax details renewal dues`);
    
    await client.query('COMMIT');
    
    const totalAdded = pucResult.rowCount + insuranceResult.rowCount + taxResult.rowCount + 
                      fitnessResult.rowCount + permitResult.rowCount + taxDetailsResult.rowCount;
    
    console.log(`🎉 Renewal dues check completed! Total new dues added: ${totalAdded}`);
    
    return {
      success: true,
      message: `Renewal dues check completed successfully`,
      data: {
        puc: pucResult.rowCount,
        insurance: insuranceResult.rowCount,
        tax: taxResult.rowCount,
        fitness: fitnessResult.rowCount,
        permit: permitResult.rowCount,
        taxDetails: taxDetailsResult.rowCount,
        total: totalAdded
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