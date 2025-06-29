const pool = require('../config/database');

const createDocumentTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create vehicle_documents table to store file references
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('puc', 'insurance', 'fitness', 'permit', 'tax')),
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        original_name VARCHAR(255),
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON vehicle_documents(document_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_created_at ON vehicle_documents(created_at)');

    await client.query('COMMIT');
    console.log('Vehicle documents table created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating document tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createDocumentTables()
  .then(() => {
    console.log('Document tables migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Document tables migration failed:', error);
    process.exit(1);
  });