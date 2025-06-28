const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all vehicles with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.*, 
             p.puc_number, p.puc_from, p.puc_to, p.puc_contact_no, p.puc_address,
             i.company_name as insurance_company_name, i.policy_number, i.insurance_type,
             i.insurance_from, i.insurance_to, i.insurance_contact_no, i.insurance_address
      FROM vehicles v
      LEFT JOIN puc_details p ON v.id = p.vehicle_id
      LEFT JOIN insurance_details i ON v.id = i.vehicle_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (v.registration_number ILIKE $${paramCount} OR v.registered_owner_name ILIKE $${paramCount} OR v.chassis_number ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (type) {
      paramCount++;
      query += ` AND v.type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM vehicles v WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (v.registration_number ILIKE $${countParamCount} OR v.registered_owner_name ILIKE $${countParamCount} OR v.chassis_number ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (type) {
      countParamCount++;
      countQuery += ` AND v.type = $${countParamCount}`;
      countParams.push(type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        vehicles: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vehicle by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT v.*, 
             p.puc_number, p.puc_date, p.puc_tenure, p.puc_from, p.puc_to, p.puc_contact_no, p.puc_address,
             i.company_name as insurance_company_name, i.policy_number, i.insurance_type,
             i.insurance_date, i.insurance_tenure, i.insurance_from, i.insurance_to, 
             i.insurance_contact_no, i.insurance_address,
             f.fc_number, f.fc_tenure_from, f.fc_tenure_to, f.fc_contact_no, f.fc_address,
             pr.permit_number, pr.permit_tenure_from, pr.permit_tenure_to, pr.permit_contact_no, pr.permit_address,
             t.tax_number, t.tax_tenure_from, t.tax_tenure_to, t.tax_contact_no, t.tax_address
      FROM vehicles v
      LEFT JOIN puc_details p ON v.id = p.vehicle_id
      LEFT JOIN insurance_details i ON v.id = i.vehicle_id
      LEFT JOIN fitness_details f ON v.id = f.vehicle_id
      LEFT JOIN permit_details pr ON v.id = pr.vehicle_id
      LEFT JOIN tax_details t ON v.id = t.vehicle_id
      WHERE v.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new vehicle
router.post('/', authenticateToken, validateRequest(schemas.vehicle), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const vehicleData = req.body;
    
    // Insert vehicle
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
      ) RETURNING id
    `;

    const vehicleValues = [
      vehicleData.aadharNumber, vehicleData.mobileNumber, vehicleData.registeredOwnerName,
      vehicleData.registrationNumber, vehicleData.guardianInfo, vehicleData.dateOfRegistration,
      vehicleData.address, vehicleData.registrationValidUpto, vehicleData.taxUpto,
      vehicleData.insuranceUpto, vehicleData.fcValidUpto, vehicleData.hypothecatedTo,
      vehicleData.permitUpto, vehicleData.chassisNumber, vehicleData.bodyType,
      vehicleData.engineNumber, vehicleData.colour, vehicleData.vehicleClass,
      vehicleData.fuelUsed, vehicleData.makersName, vehicleData.cubicCapacity,
      vehicleData.makersClassification, vehicleData.seatingCapacity,
      vehicleData.monthYearOfManufacture, vehicleData.ulw, vehicleData.gvw,
      vehicleData.subject, vehicleData.registeringAuthority, vehicleData.type,
      req.user.id
    ];

    const vehicleResult = await client.query(vehicleQuery, vehicleValues);
    const vehicleId = vehicleResult.rows[0].id;

    // Insert PUC details if provided
    if (vehicleData.pucNumber) {
      await client.query(`
        INSERT INTO puc_details (vehicle_id, puc_number, puc_date, puc_tenure, puc_from, puc_to, puc_contact_no, puc_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [vehicleId, vehicleData.pucNumber, vehicleData.pucDate, vehicleData.pucTenure,
          vehicleData.pucFrom, vehicleData.pucTo, vehicleData.pucContactNo, vehicleData.pucAddress]);
    }

    // Insert Insurance details if provided
    if (vehicleData.insuranceCompanyName) {
      await client.query(`
        INSERT INTO insurance_details (vehicle_id, company_name, policy_number, insurance_type, insurance_date, insurance_tenure, insurance_from, insurance_to, insurance_contact_no, insurance_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [vehicleId, vehicleData.insuranceCompanyName, vehicleData.policyNumber, vehicleData.insuranceType,
          vehicleData.insuranceDate, vehicleData.insuranceTenure, vehicleData.insuranceFrom,
          vehicleData.insuranceTo, vehicleData.insuranceContactNo, vehicleData.insuranceAddress]);
    }

    // Insert Fitness details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.fcNumber) {
      await client.query(`
        INSERT INTO fitness_details (vehicle_id, fc_number, fc_tenure_from, fc_tenure_to, fc_contact_no, fc_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vehicleId, vehicleData.fcNumber, vehicleData.fcTenureFrom, vehicleData.fcTenureTo,
          vehicleData.fcContactNo, vehicleData.fcAddress]);
    }

    // Insert Permit details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.permitNumber) {
      await client.query(`
        INSERT INTO permit_details (vehicle_id, permit_number, permit_tenure_from, permit_tenure_to, permit_contact_no, permit_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vehicleId, vehicleData.permitNumber, vehicleData.permitTenureFrom, vehicleData.permitTenureTo,
          vehicleData.permitContactNo, vehicleData.permitAddress]);
    }

    // Insert Tax details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.taxNumber) {
      await client.query(`
        INSERT INTO tax_details (vehicle_id, tax_number, tax_tenure_from, tax_tenure_to, tax_contact_no, tax_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [vehicleId, vehicleData.taxNumber, vehicleData.taxTenureFrom, vehicleData.taxTenureTo,
          vehicleData.taxContactNo, vehicleData.taxAddress]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: { id: vehicleId }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create vehicle error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Update vehicle
router.put('/:id', authenticateToken, validateRequest(schemas.vehicle), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const vehicleData = req.body;

    // Check if vehicle exists
    const existingVehicle = await client.query('SELECT id FROM vehicles WHERE id = $1', [id]);
    if (existingVehicle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update vehicle
    const vehicleQuery = `
      UPDATE vehicles SET
        aadhar_number = $1, mobile_number = $2, registered_owner_name = $3,
        registration_number = $4, guardian_info = $5, date_of_registration = $6,
        address = $7, registration_valid_upto = $8, tax_upto = $9, insurance_upto = $10,
        fc_valid_upto = $11, hypothecated_to = $12, permit_upto = $13, chassis_number = $14,
        body_type = $15, engine_number = $16, colour = $17, vehicle_class = $18,
        fuel_used = $19, makers_name = $20, cubic_capacity = $21, makers_classification = $22,
        seating_capacity = $23, month_year_of_manufacture = $24, ulw = $25, gvw = $26,
        subject = $27, registering_authority = $28, type = $29, updated_at = CURRENT_TIMESTAMP
      WHERE id = $30
    `;

    const vehicleValues = [
      vehicleData.aadharNumber, vehicleData.mobileNumber, vehicleData.registeredOwnerName,
      vehicleData.registrationNumber, vehicleData.guardianInfo, vehicleData.dateOfRegistration,
      vehicleData.address, vehicleData.registrationValidUpto, vehicleData.taxUpto,
      vehicleData.insuranceUpto, vehicleData.fcValidUpto, vehicleData.hypothecatedTo,
      vehicleData.permitUpto, vehicleData.chassisNumber, vehicleData.bodyType,
      vehicleData.engineNumber, vehicleData.colour, vehicleData.vehicleClass,
      vehicleData.fuelUsed, vehicleData.makersName, vehicleData.cubicCapacity,
      vehicleData.makersClassification, vehicleData.seatingCapacity,
      vehicleData.monthYearOfManufacture, vehicleData.ulw, vehicleData.gvw,
      vehicleData.subject, vehicleData.registeringAuthority, vehicleData.type, id
    ];

    await client.query(vehicleQuery, vehicleValues);

    // Update related details (delete and insert)
    await client.query('DELETE FROM puc_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM insurance_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM fitness_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM permit_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM tax_details WHERE vehicle_id = $1', [id]);

    // Re-insert details (same logic as create)
    if (vehicleData.pucNumber) {
      await client.query(`
        INSERT INTO puc_details (vehicle_id, puc_number, puc_date, puc_tenure, puc_from, puc_to, puc_contact_no, puc_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [id, vehicleData.pucNumber, vehicleData.pucDate, vehicleData.pucTenure,
          vehicleData.pucFrom, vehicleData.pucTo, vehicleData.pucContactNo, vehicleData.pucAddress]);
    }

    if (vehicleData.insuranceCompanyName) {
      await client.query(`
        INSERT INTO insurance_details (vehicle_id, company_name, policy_number, insurance_type, insurance_date, insurance_tenure, insurance_from, insurance_to, insurance_contact_no, insurance_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [id, vehicleData.insuranceCompanyName, vehicleData.policyNumber, vehicleData.insuranceType,
          vehicleData.insuranceDate, vehicleData.insuranceTenure, vehicleData.insuranceFrom,
          vehicleData.insuranceTo, vehicleData.insuranceContactNo, vehicleData.insuranceAddress]);
    }

    if (vehicleData.type === 'Transport' && vehicleData.fcNumber) {
      await client.query(`
        INSERT INTO fitness_details (vehicle_id, fc_number, fc_tenure_from, fc_tenure_to, fc_contact_no, fc_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, vehicleData.fcNumber, vehicleData.fcTenureFrom, vehicleData.fcTenureTo,
          vehicleData.fcContactNo, vehicleData.fcAddress]);
    }

    if (vehicleData.type === 'Transport' && vehicleData.permitNumber) {
      await client.query(`
        INSERT INTO permit_details (vehicle_id, permit_number, permit_tenure_from, permit_tenure_to, permit_contact_no, permit_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, vehicleData.permitNumber, vehicleData.permitTenureFrom, vehicleData.permitTenureTo,
          vehicleData.permitContactNo, vehicleData.permitAddress]);
    }

    if (vehicleData.type === 'Transport' && vehicleData.taxNumber) {
      await client.query(`
        INSERT INTO tax_details (vehicle_id, tax_number, tax_tenure_from, tax_tenure_to, tax_contact_no, tax_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, vehicleData.taxNumber, vehicleData.taxTenureFrom, vehicleData.taxTenureTo,
          vehicleData.taxContactNo, vehicleData.taxAddress]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if vehicle exists
    const existingVehicle = await client.query('SELECT id FROM vehicles WHERE id = $1', [id]);
    if (existingVehicle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Delete related records first (due to foreign key constraints)
    await client.query('DELETE FROM puc_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM insurance_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM fitness_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM permit_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM tax_details WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM service_orders WHERE vehicle_id = $1', [id]);
    await client.query('DELETE FROM renewal_dues WHERE vehicle_id = $1', [id]);

    // Delete vehicle
    await client.query('DELETE FROM vehicles WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Search vehicle by registration number
router.get('/search/:registrationNumber', authenticateToken, async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    const query = `
      SELECT v.*, 
             p.puc_number, p.puc_date, p.puc_tenure, p.puc_from, p.puc_to, p.puc_contact_no, p.puc_address,
             i.company_name as insurance_company_name, i.policy_number, i.insurance_type,
             i.insurance_date, i.insurance_tenure, i.insurance_from, i.insurance_to, 
             i.insurance_contact_no, i.insurance_address
      FROM vehicles v
      LEFT JOIN puc_details p ON v.id = p.vehicle_id
      LEFT JOIN insurance_details i ON v.id = i.vehicle_id
      WHERE v.registration_number ILIKE $1
    `;

    const result = await pool.query(query, [registrationNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Search vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;