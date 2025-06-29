const pool = require('../config/database');

const createPaymentTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create service_order_amounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_order_amounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        actual_amount DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        payment_type VARCHAR(50) NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('initial', 'payment')),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_order_amounts_service_order_id ON service_order_amounts(service_order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_order_amounts_vehicle_id ON service_order_amounts(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_order_amounts_created_at ON service_order_amounts(created_at)');

    await client.query('COMMIT');
    console.log('Service order amounts table created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payment table:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createPaymentTable()
  .then(() => {
    console.log('Payment table migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Payment table migration failed:', error);
    process.exit(1);
  });