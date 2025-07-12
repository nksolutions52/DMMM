const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'agent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aadhar_number VARCHAR(20) NOT NULL,
        mobile_number VARCHAR(15) NOT NULL,
        registered_owner_name VARCHAR(255) NOT NULL,
        registration_number VARCHAR(20) UNIQUE NOT NULL,
        guardian_info VARCHAR(255),
        date_of_registration DATE NOT NULL,
        address TEXT NOT NULL,
        registration_valid_upto DATE,
        tax_upto DATE,
        insurance_upto DATE,
        fc_valid_upto DATE,
        hypothecated_to VARCHAR(255),
        permit_upto DATE,
        chassis_number VARCHAR(50) NOT NULL,
        body_type VARCHAR(100),
        engine_number VARCHAR(50) NOT NULL,
        colour VARCHAR(50),
        vehicle_class VARCHAR(50),
        fuel_used VARCHAR(50),
        makers_name VARCHAR(100),
        cubic_capacity VARCHAR(20),
        makers_classification VARCHAR(100),
        seating_capacity VARCHAR(10),
        month_year_of_manufacture VARCHAR(20),
        ulw VARCHAR(20),
        gvw VARCHAR(20),
        subject VARCHAR(255),
        registering_authority VARCHAR(255),
        type VARCHAR(20) NOT NULL CHECK (type IN ('Transport', 'Non Transport')),
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create PUC details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS puc_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        puc_number VARCHAR(50),
        puc_date DATE,
        puc_tenure VARCHAR(10),
        puc_from DATE,
        puc_to DATE,
        puc_contact_no VARCHAR(15),
        puc_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create insurance details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        company_name VARCHAR(255),
        policy_number VARCHAR(100),
        insurance_type VARCHAR(50),
        insurance_date DATE,
        insurance_tenure VARCHAR(10),
        insurance_from DATE,
        insurance_to DATE,
        insurance_contact_no VARCHAR(15),
        insurance_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create fitness details table (for Transport vehicles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        fc_number VARCHAR(50),
        fc_tenure_from DATE,
        fc_tenure_to DATE,
        fc_contact_no VARCHAR(15),
        fc_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permit details table (for Transport vehicles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS permit_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        permit_number VARCHAR(50),
        permit_tenure_from DATE,
        permit_tenure_to DATE,
        permit_contact_no VARCHAR(15),
        permit_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tax details table (for Transport vehicles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        tax_number VARCHAR(50),
        tax_tenure_from DATE,
        tax_tenure_to DATE,
        tax_contact_no VARCHAR(15),
        tax_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create service orders table with actual_amount column
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        service_type VARCHAR(255) NOT NULL,
        actual_amount DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        customer_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        agent_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_number VARCHAR(20) NOT NULL,
        appointment_date DATE NOT NULL,
        time_slot VARCHAR(10) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        agent_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create renewal dues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS renewal_dues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        renewal_type VARCHAR(50) NOT NULL CHECK (renewal_type IN ('Insurance', 'Tax', 'FC', 'Permit')),
        due_date DATE NOT NULL,
        amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add actual_amount column to existing service_orders table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'service_orders' AND column_name = 'actual_amount'
        ) THEN
          ALTER TABLE service_orders ADD COLUMN actual_amount DECIMAL(10,2);
          -- Set actual_amount to current amount + discount for existing records
          UPDATE service_orders SET actual_amount = amount + discount WHERE actual_amount IS NULL;
          -- Make actual_amount NOT NULL after setting values
          ALTER TABLE service_orders ALTER COLUMN actual_amount SET NOT NULL;
        END IF;
      END $$;
    `);
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
     // Create vehicle_documents table to store file references
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('puc', 'insurance', 'fitness', 'permit', 'tax', 'rc')),
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

    // Add unique constraint for upsert support
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_documents_vehicle_id_document_type_unique'
          ) THEN
              ALTER TABLE vehicle_documents
              ADD CONSTRAINT vehicle_documents_vehicle_id_document_type_unique
              UNIQUE (vehicle_id, document_type);
          END IF;
      END$$;
    `);

    // Add indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON vehicle_documents(document_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_created_at ON vehicle_documents(created_at)');

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
    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicles_registration_number ON vehicles(registration_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_renewal_dues_due_date ON renewal_dues(due_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_renewal_dues_type ON renewal_dues(renewal_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_order_amounts_service_order_id ON service_order_amounts(service_order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_order_amounts_vehicle_id ON service_order_amounts(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_service_order_amounts_created_at ON service_order_amounts(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON vehicle_documents(document_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_created_at ON vehicle_documents(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)');

    await client.query('COMMIT');
    console.log('Database tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });