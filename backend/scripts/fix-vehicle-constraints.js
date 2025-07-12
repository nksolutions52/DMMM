const pool = require('../config/database');

const fixVehicleConstraints = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🔧 Starting vehicle constraints fix...');

    // First, let's check and clean up any duplicate records
    console.log('📋 Checking for duplicate records...');
    
    const tables = [
      'puc_details',
      'insurance_details', 
      'fitness_details',
      'permit_details',
      'tax_details',
      'hypothication_details'
    ];

    for (const table of tables) {
      try {
        // Find and remove duplicates, keeping only the latest record for each vehicle_id
        const duplicateQuery = `
          DELETE FROM ${table} 
          WHERE id NOT IN (
            SELECT DISTINCT ON (vehicle_id) id 
            FROM ${table} 
            ORDER BY vehicle_id, created_at DESC
          )
        `;
        
        const result = await client.query(duplicateQuery);
        if (result.rowCount > 0) {
          console.log(`   ✅ Removed ${result.rowCount} duplicate records from ${table}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not clean duplicates from ${table}:`, error.message);
      }
    }

    // Add unique constraints
    console.log('🔗 Adding unique constraints...');
    
    const constraints = [
      {
        table: 'puc_details',
        constraint: 'puc_details_vehicle_id_unique',
        sql: 'ALTER TABLE puc_details ADD CONSTRAINT puc_details_vehicle_id_unique UNIQUE (vehicle_id)'
      },
      {
        table: 'insurance_details', 
        constraint: 'insurance_details_vehicle_id_unique',
        sql: 'ALTER TABLE insurance_details ADD CONSTRAINT insurance_details_vehicle_id_unique UNIQUE (vehicle_id)'
      },
      {
        table: 'fitness_details',
        constraint: 'fitness_details_vehicle_id_unique', 
        sql: 'ALTER TABLE fitness_details ADD CONSTRAINT fitness_details_vehicle_id_unique UNIQUE (vehicle_id)'
      },
      {
        table: 'permit_details',
        constraint: 'permit_details_vehicle_id_unique',
        sql: 'ALTER TABLE permit_details ADD CONSTRAINT permit_details_vehicle_id_unique UNIQUE (vehicle_id)'
      },
      {
        table: 'tax_details',
        constraint: 'tax_details_vehicle_id_unique',
        sql: 'ALTER TABLE tax_details ADD CONSTRAINT tax_details_vehicle_id_unique UNIQUE (vehicle_id)'
      },
      {
        table: 'hypothication_details',
        constraint: 'hypothication_details_vehicle_id_unique',
        sql: 'ALTER TABLE hypothication_details ADD CONSTRAINT hypothication_details_vehicle_id_unique UNIQUE (vehicle_id)'
      }
    ];

    for (const { table, constraint, sql } of constraints) {
      try {
        // Check if constraint already exists
        const checkConstraint = await client.query(`
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = $1 AND table_name = $2
        `, [constraint, table]);

        if (checkConstraint.rows.length === 0) {
          await client.query(sql);
          console.log(`   ✅ Added unique constraint to ${table}`);
        } else {
          console.log(`   ℹ️  Constraint already exists on ${table}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to add constraint to ${table}:`, error.message);
        // Continue with other constraints
      }
    }

    // Add status column if it doesn't exist
    console.log('📊 Checking status columns...');
    
    for (const table of tables) {
      try {
        const checkColumn = await client.query(`
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = 'status'
        `, [table]);

        if (checkColumn.rows.length === 0) {
          await client.query(`ALTER TABLE ${table} ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'`);
          console.log(`   ✅ Added status column to ${table}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not add status column to ${table}:`, error.message);
      }
    }

    // Add created_by column if it doesn't exist
    console.log('👤 Checking created_by columns...');
    
    for (const table of tables) {
      try {
        const checkColumn = await client.query(`
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = 'created_by'
        `, [table]);

        if (checkColumn.rows.length === 0) {
          await client.query(`ALTER TABLE ${table} ADD COLUMN created_by UUID REFERENCES users(id)`);
          console.log(`   ✅ Added created_by column to ${table}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not add created_by column to ${table}:`, error.message);
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Vehicle constraints fix completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing vehicle constraints:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (require.main === module) {
  fixVehicleConstraints()
    .then(() => {
      console.log('✅ Vehicle constraints migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Vehicle constraints migration failed:', error);
      process.exit(1);
    });
}

module.exports = fixVehicleConstraints;