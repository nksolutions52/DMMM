const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 🔹 Create default users — INSERT one at a time with ON CONFLICT
    const hashedPassword = await bcrypt.hash('password123', 10);

    await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@rta.gov', hashedPassword, 'admin']
    );

    await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Agent User', 'agent@rta.gov', hashedPassword, 'agent']
    );

    // 🔹 Get user IDs
    const adminUser = await client.query('SELECT id FROM users WHERE email = $1', ['admin@rta.gov']);
    const agentUser = await client.query('SELECT id FROM users WHERE email = $1', ['agent@rta.gov']);

    const adminId = adminUser.rows[0]?.id;
    const agentId = agentUser.rows[0]?.id;

    // 🔹 Insert sample vehicles
    const vehicleInserts = [
      {
        aadhar_number: '1234 5678 9012',
        mobile_number: '9876543210',
        registered_owner_name: 'Rahul Sharma',
        registration_number: 'KA01MJ2022',
        guardian_info: 'S/o Rajesh Sharma',
        date_of_registration: '2022-05-15',
        address: '123, MG Road, Bangalore, Karnataka',
        registration_valid_upto: '2037-05-14',
        tax_upto: '2023-05-14',
        insurance_upto: '2024-05-14',
        chassis_number: 'MBLHA10ATCGJ12345',
        body_type: 'Sedan',
        engine_number: 'HA10ENCGJ12345',
        colour: 'White',
        vehicle_class: 'LMV',
        fuel_used: 'Petrol',
        makers_name: 'Maruti Suzuki',
        cubic_capacity: '1197',
        makers_classification: 'Swift',
        seating_capacity: '5',
        month_year_of_manufacture: '04/2022',
        ulw: '920',
        gvw: '1415',
        subject: 'New Registration',
        registering_authority: 'RTO Bangalore Central',
        type: 'Non Transport',
        created_by: adminId
      },
      {
        aadhar_number: '2345 6789 0123',
        mobile_number: '9123456780',
        registered_owner_name: 'Priya Verma',
        registration_number: 'MH12DE1432',
        guardian_info: 'D/o Sunil Verma',
        date_of_registration: '2021-08-10',
        address: '45, FC Road, Pune, Maharashtra',
        registration_valid_upto: '2036-08-09',
        tax_upto: '2024-08-09',
        insurance_upto: '2025-08-09',
        chassis_number: 'HYU1234567890',
        body_type: 'Hatchback',
        engine_number: 'EN1234567890',
        colour: 'Red',
        vehicle_class: 'LMV',
        fuel_used: 'Petrol',
        makers_name: 'Hyundai',
        cubic_capacity: '998',
        makers_classification: 'i10',
        seating_capacity: '5',
        month_year_of_manufacture: '06/2021',
        ulw: '850',
        gvw: '1300',
        subject: 'New Registration',
        registering_authority: 'RTO Pune',
        type: 'Non Transport',
        created_by: agentId
      },
      {
        aadhar_number: '3456 7890 1234',
        mobile_number: '9988776655',
        registered_owner_name: 'Suresh Kumar',
        registration_number: 'AP16TR5678',
        guardian_info: 'S/o Mahesh Kumar',
        date_of_registration: '2020-01-20',
        address: '12, MG Road, Vijayawada, Andhra Pradesh',
        registration_valid_upto: '2035-01-19',
        tax_upto: '2025-01-19',
        insurance_upto: '2024-01-19',
        fc_valid_upto: '2025-01-19',
        hypothecated_to: 'SBI Bank',
        permit_upto: '2025-01-19',
        chassis_number: 'TATA123456789',
        body_type: 'Truck',
        engine_number: 'EN987654321',
        colour: 'Blue',
        vehicle_class: 'HMV',
        fuel_used: 'Diesel',
        makers_name: 'Tata Motors',
        cubic_capacity: '2956',
        makers_classification: 'LPT',
        seating_capacity: '3',
        month_year_of_manufacture: '12/2019',
        ulw: '3500',
        gvw: '16200',
        subject: 'Commercial',
        registering_authority: 'RTO Vijayawada',
        type: 'Transport',
        created_by: adminId
      }
    ];

    for (const vehicle of vehicleInserts) {
      const vehicleQuery = `
        INSERT INTO vehicles (
          aadhar_number, mobile_number, registered_owner_name, registration_number,
          guardian_info, date_of_registration, address, registration_valid_upto,
          tax_upto, insurance_upto, fc_valid_upto, hypothecated_to, permit_upto,
          chassis_number, body_type, engine_number, colour, vehicle_class,
          fuel_used, makers_name, cubic_capacity, makers_classification,
          seating_capacity, month_year_of_manufacture, ulw, gvw, subject,
          registering_authority, type, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        )
        ON CONFLICT (registration_number) DO NOTHING
        RETURNING id
      `;

      const vehicleValues = [
        vehicle.aadhar_number, vehicle.mobile_number, vehicle.registered_owner_name,
        vehicle.registration_number, vehicle.guardian_info, vehicle.date_of_registration,
        vehicle.address, vehicle.registration_valid_upto, vehicle.tax_upto,
        vehicle.insurance_upto, vehicle.fc_valid_upto, vehicle.hypothecated_to,
        vehicle.permit_upto, vehicle.chassis_number, vehicle.body_type,
        vehicle.engine_number, vehicle.colour, vehicle.vehicle_class,
        vehicle.fuel_used, vehicle.makers_name, vehicle.cubic_capacity,
        vehicle.makers_classification, vehicle.seating_capacity,
        vehicle.month_year_of_manufacture, vehicle.ulw, vehicle.gvw,
        vehicle.subject, vehicle.registering_authority, vehicle.type,
        vehicle.created_by
      ];

      const vehicleResult = await client.query(vehicleQuery, vehicleValues);

      if (vehicleResult.rows.length > 0) {
        const vehicleId = vehicleResult.rows[0].id;

        // PUC details
        await client.query(`
          INSERT INTO puc_details (vehicle_id, puc_number, puc_date, puc_tenure, puc_from, puc_to, puc_contact_no, puc_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [vehicleId, `PUC${Math.random().toString().substr(2, 5)}`, '2023-05-15', '1', '2023-05-15', '2024-05-14', vehicle.mobile_number, vehicle.address]);

        // Insurance details
        await client.query(`
          INSERT INTO insurance_details (vehicle_id, company_name, policy_number, insurance_type, insurance_date, insurance_tenure, insurance_from, insurance_to, insurance_contact_no, insurance_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [vehicleId, 'ICICI Lombard', `POL${Math.random().toString().substr(2, 6)}`, 'Comprehensive', '2023-05-15', '1', '2023-05-15', '2024-05-14', vehicle.mobile_number, vehicle.address]);

        // Renewal dues
        const renewalTypes = ['Insurance', 'Tax'];
        if (vehicle.type === 'Transport') {
          renewalTypes.push('FC', 'Permit');
        }

        for (const renewalType of renewalTypes) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) - 30);
          await client.query(`
            INSERT INTO renewal_dues (vehicle_id, renewal_type, due_date, amount, status)
            VALUES ($1, $2, $3, $4, $5)
          `, [vehicleId, renewalType, dueDate.toISOString().split('T')[0], Math.floor(Math.random() * 2000) + 500, 'pending']);
        }
      }
    }

    // Service orders
    const vehicles = await client.query('SELECT id, registration_number, registered_owner_name FROM vehicles LIMIT 3');
    for (const vehicle of vehicles.rows) {
      await client.query(`
        INSERT INTO service_orders (vehicle_id, service_type, amount, amount_paid, customer_name, status, agent_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        vehicle.id,
        'Transfer of Ownership',
        1500,
        Math.floor(Math.random() * 1500),
        vehicle.registered_owner_name,
        Math.random() > 0.5 ? 'completed' : 'pending',
        Math.random() > 0.5 ? adminId : agentId
      ]);
    }

    // Appointments
    for (let i = 0; i < 5; i++) {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30));
      await client.query(`
        INSERT INTO appointments (vehicle_number, appointment_date, time_slot, description, status, agent_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        `KA01MJ202${i}`,
        appointmentDate.toISOString().split('T')[0],
        `${9 + Math.floor(Math.random() * 8)}:${Math.random() > 0.5 ? '00' : '30'}`,
        `Vehicle inspection for service ${i + 1}`,
        Math.random() > 0.3 ? 'scheduled' : 'completed',
        Math.random() > 0.5 ? adminId : agentId
      ]);
    }

    await client.query('COMMIT');
    console.log('Sample data seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run
seedData()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
