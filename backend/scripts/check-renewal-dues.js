const pool = require('../config/database');

const RENEWAL_TYPES = [
  {
    table: 'puc_details',
    toDateCol: 'puc_to',
    renewalType: 'PUC'
  },
  {
    table: 'insurance_details',
    toDateCol: 'insurance_to',
    renewalType: 'Insurance'
  },
  {
    table: 'permit_details',
    toDateCol: 'permit_tenure_to',
    renewalType: 'Permit'
  },
  {
    table: 'fitness_details',
    toDateCol: 'fc_tenure_to',
    renewalType: 'FC'
  },
  {
    table: 'tax_details',
    toDateCol: 'tax_tenure_to',
    renewalType: 'Tax'
  }
];

const checkRenewalDues = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 30);
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    let totalAdded = 0;
    const results = {};
    console.log('🔍 Checking all renewal dues...');

    for (const type of RENEWAL_TYPES) {
      const { table, toDateCol, renewalType } = type;
      console.log(`\n📋 Checking ${renewalType} renewals...`);
      try {
        // Only check ACTIVE records for each vehicle
        const checkQuery = `
          SELECT v.registration_number, d.${toDateCol} as to_date, d.vehicle_id
          FROM ${table} d
          JOIN vehicles v ON d.vehicle_id = v.id
          WHERE d.${toDateCol} IS NOT NULL
            AND d.status = 'ACTIVE'
        `;
        const checkResult = await client.query(checkQuery);
        let expired = 0, due = 0, added = 0;
        for (const row of checkResult.rows) {
          const toDateRaw = row.to_date;
          if (!toDateRaw) continue;
          // Ensure both dates are compared as Date objects
          const toDate = new Date(toDateRaw instanceof Date ? toDateRaw.toISOString().split('T')[0] : toDateRaw);
          const today = new Date(currentDateStr);
          const future = new Date(futureDateStr);
          let status = null;
          if (toDate < today) {
            status = 'EXPIRED';
            expired++;
          } else if (toDate >= today && toDate <= future) {
            status = 'DUE';
            due++;
          }
          if (status) {
            // Prevent duplicate: only insert if not already present and pending
            // Also, do not insert if a service order exists for this vehicle/type and is not cancelled
            const existsQuery = `
              SELECT 1 FROM renewal_dues 
              WHERE vehicle_id = $1 AND renewal_type = $2 AND DATE(due_date) = $3 AND status = 'pending'
              LIMIT 1
            `;
            const serviceOrderExistsQuery = `
              SELECT 1 FROM service_orders 
              WHERE vehicle_id = $1 AND UPPER(service_type) = UPPER($2) AND status != 'completed' AND status != 'cancelled'
              LIMIT 1
            `;
            const [exists, serviceOrderExists] = await Promise.all([
              client.query(existsQuery, [row.vehicle_id, renewalType, toDateRaw]),
              client.query(serviceOrderExistsQuery, [row.vehicle_id, renewalType])
            ]);
            if (exists.rowCount === 0 && serviceOrderExists.rowCount === 0) {
              const insertQuery = `
                INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, status, created_at)
                VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
              `;
              await client.query(insertQuery, [row.vehicle_id, renewalType, toDateRaw]);
              added++;
              console.log(`   ➕ ${row.registration_number}: ${toDateRaw} (${status})`);
            } else {
              if (serviceOrderExists.rowCount > 0) {
                console.log(`   ⏩ ${row.registration_number}: ${toDateRaw} (${status}) - service order exists (not completed/cancelled), skipping`);
              } else {
                console.log(`   ⏩ ${row.registration_number}: ${toDateRaw} (${status}) - already exists`);
              }
            }
          }
        }
        results[renewalType] = { expired, due, added };
        totalAdded += added;
        console.log(`✅ ${renewalType}: ${added} new dues added (${expired} expired, ${due} due)`);
      } catch (err) {
        console.error(`Error checking ${renewalType}:`, err);
        results[renewalType] = { expired: 0, due: 0, added: 0 };
      }
    }
    await client.query('COMMIT');
    console.log(`\n🎉 Renewal dues check completed! Total new dues added: ${totalAdded}`);
    console.log('📊 Breakdown:', results);
    return {
      success: true,
      message: 'Renewal dues check completed successfully',
      data: { ...results, total: totalAdded }
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