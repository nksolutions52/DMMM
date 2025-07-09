const pool = require('../config/database');

const createRolesTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles
    await client.query(`
      INSERT INTO roles (name, description, permissions) VALUES 
      ('admin', 'Administrator with full access', '{"all": true}'),
      ('agent', 'Agent with limited access', '{"vehicles": true, "services": true, "appointments": true, "renewals": true, "dashboard": true}')
      ON CONFLICT (name) DO NOTHING
    `);

    // Add role_id column to users table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role_id'
        ) THEN
          ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
        END IF;
      END $$;
    `);

    // Update existing users to have role_id based on their role string
    await client.query(`
      UPDATE users SET role_id = (
        SELECT id FROM roles WHERE name = users.role
      ) WHERE role_id IS NULL
    `);

    // Add indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)');

    await client.query('COMMIT');
    console.log('Roles table and user role migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating roles table:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createRolesTable()
  .then(() => {
    console.log('Roles migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Roles migration failed:', error);
    process.exit(1);
  });