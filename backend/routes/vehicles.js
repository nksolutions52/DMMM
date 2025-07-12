const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get all vehicles with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.*, o.registered_owner_name,
             p.puc_number, p.puc_from, p.puc_to, puc_contact_no, p.puc_address,
             i.company_name as insurance_company_name, i.policy_number, i.insurance_type,
             i.insurance_from, i.insurance_to, i.insurance_contact_no, i.insurance_address,
             UPPER(v.type) as type
      FROM vehicles v
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
      LEFT JOIN (
        SELECT * FROM puc_details WHERE status = 'ACTIVE'
      ) p ON v.id = p.vehicle_id
      LEFT JOIN (
        SELECT * FROM insurance_details WHERE status = 'ACTIVE'
      ) i ON v.id = i.vehicle_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (v.registration_number ILIKE $${paramCount} OR o.registered_owner_name ILIKE $${paramCount} OR v.chassis_number ILIKE $${paramCount})`;
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
    let countQuery = 'SELECT COUNT(*) FROM vehicles v LEFT JOIN vehicle_owner_details o ON v.id = o.vehicle_id WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (v.registration_number ILIKE $${countParamCount} OR o.registered_owner_name ILIKE $${countParamCount} OR v.chassis_number ILIKE $${countParamCount})`;
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

// Get vehicle by ID with documents
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT v.*, o.aadhar_number, o.mobile_number, o.registered_owner_name, o.guardian_info, o.address,
             p.puc_number, p.puc_date, p.puc_tenure, p.puc_from, p.puc_to, p.puc_contact_no, p.puc_address,
             i.company_name as insurance_company_name, i.policy_number, i.insurance_type,
             i.insurance_date, i.insurance_tenure, i.insurance_from, i.insurance_to, 
             i.insurance_contact_no, i.insurance_address,
             f.fc_number, f.fc_tenure_from, f.fc_tenure_to, f.fc_contact_no, f.fc_address,
             pr.permit_number, pr.permit_tenure_from, pr.permit_tenure_to, pr.permit_contact_no, pr.permit_address,
             t.tax_number, t.tax_tenure_from, t.tax_tenure_to, t.tax_contact_no, t.tax_address,
             h.is_hpa, h.hypothicated_to
      FROM vehicles v
      LEFT JOIN (
        SELECT * FROM vehicle_owner_details WHERE status = 'ACTIVE'
      ) o ON v.id = o.vehicle_id
      LEFT JOIN (
        SELECT * FROM puc_details WHERE status = 'ACTIVE'
      ) p ON v.id = p.vehicle_id
      LEFT JOIN (
        SELECT * FROM insurance_details WHERE status = 'ACTIVE'
      ) i ON v.id = i.vehicle_id
      LEFT JOIN (
        SELECT * FROM fitness_details WHERE status = 'ACTIVE'
      ) f ON v.id = f.vehicle_id
      LEFT JOIN (
        SELECT * FROM permit_details WHERE status = 'ACTIVE'
      ) pr ON v.id = pr.vehicle_id
      LEFT JOIN (
        SELECT * FROM tax_details WHERE status = 'ACTIVE'
      ) t ON v.id = t.vehicle_id
      LEFT JOIN (
        SELECT * FROM hypothication_details WHERE status = 'ACTIVE'
      ) h ON v.id = h.vehicle_id
      WHERE v.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get vehicle documents
    const documentsQuery = `
      SELECT id, document_type, file_name, original_name, file_size, mime_type, created_at
      FROM vehicle_documents
      WHERE vehicle_id = $1
      ORDER BY document_type, created_at DESC
    `;

    const documentsResult = await pool.query(documentsQuery, [id]);

    // Group documents by type
    const documents = {};
    documentsResult.rows.forEach(doc => {
      if (!documents[doc.document_type]) {
        documents[doc.document_type] = [];
      }
      documents[doc.document_type].push(doc);
    });

    const vehicleData = {
      ...result.rows[0],
      documents
    };

    res.json({
      success: true,
      data: vehicleData
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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
             i.insurance_contact_no, i.insurance_address,
             f.fc_number, f.fc_tenure_from, f.fc_tenure_to, f.fc_contact_no, f.fc_address,
             pr.permit_number, pr.permit_tenure_from, pr.permit_tenure_to, pr.permit_contact_no, pr.permit_address,
             t.tax_number, t.tax_tenure_from, t.tax_tenure_to, t.tax_contact_no, t.tax_address
      FROM vehicles v
      LEFT JOIN (
        SELECT * FROM puc_details WHERE status = 'ACTIVE'
      ) p ON v.id = p.vehicle_id
      LEFT JOIN (
        SELECT * FROM insurance_details WHERE status = 'ACTIVE'
      ) i ON v.id = i.vehicle_id
      LEFT JOIN (
        SELECT * FROM fitness_details WHERE status = 'ACTIVE'
      ) f ON v.id = f.vehicle_id
      LEFT JOIN (
        SELECT * FROM permit_details WHERE status = 'ACTIVE'
      ) pr ON v.id = pr.vehicle_id
      LEFT JOIN (
        SELECT * FROM tax_details WHERE status = 'ACTIVE'
      ) t ON v.id = t.vehicle_id
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

// Helper function to save document files
const saveDocumentFiles = async (client, vehicleId, files, userId) => {
  if (!files) return;

  for (const [fieldName, fileArray] of Object.entries(files)) {
    const documentType = fieldName.split('_')[0]; // Extract type from fieldname
    
    for (const file of fileArray) {
      await client.query(`
        INSERT INTO vehicle_documents (
          vehicle_id, document_type, file_name, file_path, file_size, 
          mime_type, original_name, uploaded_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        vehicleId,
        documentType,
        file.filename,
        file.path,
        file.size,
        file.mimetype,
        file.originalname,
        userId
      ]);
    }
  }
};

// Helper function to upsert detail records
const upsertDetailRecord = async (client, table, vehicleId, data, userId) => {
  if (!data || Object.keys(data).length === 0) return;

  // Check if record exists
  const existingRecord = await client.query(
    `SELECT id FROM ${table} WHERE vehicle_id = $1 AND status = 'ACTIVE'`,
    [vehicleId]
  );

  if (existingRecord.rows.length > 0) {
    // Update existing record
    const updateFields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const updateValues = [vehicleId, ...Object.values(data)];
    
    await client.query(
      `UPDATE ${table} SET ${updateFields}, updated_at = NOW() WHERE vehicle_id = $1 AND status = 'ACTIVE'`,
      updateValues
    );
  } else {
    // Insert new record
    const fields = ['vehicle_id', ...Object.keys(data), 'status', 'created_by', 'created_at'];
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const values = [vehicleId, ...Object.values(data), 'ACTIVE', userId, new Date()];
    
    await client.query(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }
};

// Create new vehicle with documents
router.post('/', authenticateToken, uploadDocuments, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vehicleData = req.body;
    
    // Convert empty strings to null for optional fields
    Object.keys(vehicleData).forEach(key => {
      if (vehicleData[key] === '') vehicleData[key] = null;
    });

    // Insert vehicle
    const vehicleQuery = `
      INSERT INTO vehicles (
        registration_number, date_of_registration, registration_valid_upto, subject, registering_authority, type, chassis_number, body_type, engine_number, colour, vehicle_class, fuel_used, makers_name, cubic_capacity, makers_classification, seating_capacity, month_year_of_manufacture, ulw, gvw, created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'ACTIVE'
      ) RETURNING id
    `;
    const vehicleValues = [
      vehicleData.registrationNumber, vehicleData.dateOfRegistration, vehicleData.registrationValidUpto, vehicleData.subject, vehicleData.registeringAuthority, vehicleData.type, vehicleData.chassisNumber, vehicleData.bodyType, vehicleData.engineNumber, vehicleData.colour, vehicleData.vehicleClass, vehicleData.fuelUsed, vehicleData.makersName, vehicleData.cubicCapacity, vehicleData.makersClassification, vehicleData.seatingCapacity, vehicleData.monthYearOfManufacture, vehicleData.ulw, vehicleData.gvw, req.user.id
    ];
    const vehicleResult = await client.query(vehicleQuery, vehicleValues);
    const vehicleId = vehicleResult.rows[0].id;

    // Insert owner details
    const ownerQuery = `
      INSERT INTO vehicle_owner_details (
        vehicle_id, aadhar_number, mobile_number, registered_owner_name, guardian_info, address, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, NOW())
    `;
    await client.query(ownerQuery, [
      vehicleId,
      vehicleData.aadharNumber,
      vehicleData.mobileNumber,
      vehicleData.registeredOwnerName,
      vehicleData.guardianInfo,
      vehicleData.address,
      req.user.id
    ]);

    // Insert Hypothecation details if provided
    if (vehicleData.isHPA === 'true' || vehicleData.hypothecatedTo) {
      await upsertDetailRecord(client, 'hypothication_details', vehicleId, {
        is_hpa: vehicleData.isHPA === 'true',
        hypothicated_to: vehicleData.hypothecatedTo || null
      }, req.user.id);
    }

    // Save uploaded documents
    await saveDocumentFiles(client, vehicleId, req.files, req.user.id);

    // Insert PUC details if provided
    if (vehicleData.pucNumber) {
      await upsertDetailRecord(client, 'puc_details', vehicleId, {
        puc_number: vehicleData.pucNumber,
        puc_date: vehicleData.pucDate,
        puc_tenure: vehicleData.pucTenure,
        puc_from: vehicleData.pucFrom,
        puc_to: vehicleData.pucTo,
        puc_contact_no: vehicleData.pucContactNo,
        puc_address: vehicleData.pucAddress
      }, req.user.id);
    }

    // Insert Insurance details if provided
    if (vehicleData.insuranceCompanyName) {
      await upsertDetailRecord(client, 'insurance_details', vehicleId, {
        company_name: vehicleData.insuranceCompanyName,
        policy_number: vehicleData.policyNumber,
        insurance_type: vehicleData.insuranceType,
        insurance_date: vehicleData.insuranceDate,
        insurance_tenure: vehicleData.insuranceTenure,
        insurance_from: vehicleData.insuranceFrom,
        insurance_to: vehicleData.insuranceTo,
        insurance_contact_no: vehicleData.insuranceContactNo,
        insurance_address: vehicleData.insuranceAddress
      }, req.user.id);
    }

    // Insert Fitness details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.fcNumber) {
      await upsertDetailRecord(client, 'fitness_details', vehicleId, {
        fc_number: vehicleData.fcNumber,
        fc_tenure_from: vehicleData.fcTenureFrom,
        fc_tenure_to: vehicleData.fcTenureTo,
        fc_contact_no: vehicleData.fcContactNo,
        fc_address: vehicleData.fcAddress
      }, req.user.id);
    }

    // Insert Permit details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.permitNumber) {
      await upsertDetailRecord(client, 'permit_details', vehicleId, {
        permit_number: vehicleData.permitNumber,
        permit_tenure_from: vehicleData.permitTenureFrom,
        permit_tenure_to: vehicleData.permitTenureTo,
        permit_contact_no: vehicleData.permitContactNo,
        permit_address: vehicleData.permitAddress
      }, req.user.id);
    }

    // Insert Tax details if provided
    if (vehicleData.taxNumber) {
      await upsertDetailRecord(client, 'tax_details', vehicleId, {
        tax_number: vehicleData.taxNumber,
        tax_tenure_from: vehicleData.taxTenureFrom,
        tax_tenure_to: vehicleData.taxTenureTo,
        tax_contact_no: vehicleData.taxContactNo,
        tax_address: vehicleData.taxAddress
      }, req.user.id);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: {
        id: vehicleId,
        registrationNumber: vehicleData.registrationNumber
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  } finally {
    client.release();
  }
});

// Update vehicle by ID
router.put('/:id', authenticateToken, uploadDocuments, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const vehicleData = req.body;

    // Convert empty strings to null for optional fields
    Object.keys(vehicleData).forEach(key => {
      if (vehicleData[key] === '') vehicleData[key] = null;
    });

    // Update vehicle
    const vehicleQuery = `
      UPDATE vehicles
      SET
        registration_number = $1,
        date_of_registration = $2,
        registration_valid_upto = $3,
        subject = $4,
        registering_authority = $5,
        type = $6,
        chassis_number = $7,
        body_type = $8,
        engine_number = $9,
        colour = $10,
        vehicle_class = $11,
        fuel_used = $12,
        makers_name = $13,
        cubic_capacity = $14,
        makers_classification = $15,
        seating_capacity = $16,
        month_year_of_manufacture = $17,
        ulw = $18,
        gvw = $19,
        updated_by = $20,
        updated_at = NOW()
      WHERE id = $21
    `;
    const vehicleValues = [
      vehicleData.registrationNumber, vehicleData.dateOfRegistration, vehicleData.registrationValidUpto, vehicleData.subject, vehicleData.registeringAuthority, vehicleData.type, vehicleData.chassisNumber, vehicleData.bodyType, vehicleData.engineNumber, vehicleData.colour, vehicleData.vehicleClass, vehicleData.fuelUsed, vehicleData.makersName, vehicleData.cubicCapacity, vehicleData.makersClassification, vehicleData.seatingCapacity, vehicleData.monthYearOfManufacture, vehicleData.ulw, vehicleData.gvw, req.user.id, id
    ];
    await client.query(vehicleQuery, vehicleValues);

    // Update owner details
    const ownerQuery = `
      UPDATE vehicle_owner_details
      SET
        aadhar_number = $1,
        mobile_number = $2,
        registered_owner_name = $3,
        guardian_info = $4,
        address = $5,
        updated_at = NOW()
      WHERE vehicle_id = $6 AND status = 'ACTIVE'
    `;
    await client.query(ownerQuery, [
      vehicleData.aadharNumber,
      vehicleData.mobileNumber,
      vehicleData.registeredOwnerName,
      vehicleData.guardianInfo,
      vehicleData.address,
      id
    ]);

    // Update Hypothecation details if provided
    if (vehicleData.isHPA === 'true' || vehicleData.hypothecatedTo) {
      await upsertDetailRecord(client, 'hypothication_details', id, {
        is_hpa: vehicleData.isHPA === 'true',
        hypothicated_to: vehicleData.hypothecatedTo || null
      }, req.user.id);
    }

    // Save uploaded documents
    await saveDocumentFiles(client, id, req.files, req.user.id);

    // Update PUC details if provided
    if (vehicleData.pucNumber) {
      await upsertDetailRecord(client, 'puc_details', id, {
        puc_number: vehicleData.pucNumber,
        puc_date: vehicleData.pucDate,
        puc_tenure: vehicleData.pucTenure,
        puc_from: vehicleData.pucFrom,
        puc_to: vehicleData.pucTo,
        puc_contact_no: vehicleData.pucContactNo,
        puc_address: vehicleData.pucAddress
      }, req.user.id);
    }

    // Update Insurance details if provided
    if (vehicleData.insuranceCompanyName) {
      await upsertDetailRecord(client, 'insurance_details', id, {
        company_name: vehicleData.insuranceCompanyName,
        policy_number: vehicleData.policyNumber,
        insurance_type: vehicleData.insuranceType,
        insurance_date: vehicleData.insuranceDate,
        insurance_tenure: vehicleData.insuranceTenure,
        insurance_from: vehicleData.insuranceFrom,
        insurance_to: vehicleData.insuranceTo,
        insurance_contact_no: vehicleData.insuranceContactNo,
        insurance_address: vehicleData.insuranceAddress
      }, req.user.id);
    }

    // Update Fitness details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.fcNumber) {
      await upsertDetailRecord(client, 'fitness_details', id, {
        fc_number: vehicleData.fcNumber,
        fc_tenure_from: vehicleData.fcTenureFrom,
        fc_tenure_to: vehicleData.fcTenureTo,
        fc_contact_no: vehicleData.fcContactNo,
        fc_address: vehicleData.fcAddress
      }, req.user.id);
    }

    // Update Permit details if Transport vehicle
    if (vehicleData.type === 'Transport' && vehicleData.permitNumber) {
      await upsertDetailRecord(client, 'permit_details', id, {
        permit_number: vehicleData.permitNumber,
        permit_tenure_from: vehicleData.permitTenureFrom,
        permit_tenure_to: vehicleData.permitTenureTo,
        permit_contact_no: vehicleData.permitContactNo,
        permit_address: vehicleData.permitAddress
      }, req.user.id);
    }

    // Update Tax details if provided
    if (vehicleData.taxNumber) {
      await upsertDetailRecord(client, 'tax_details', id, {
        tax_number: vehicleData.taxNumber,
        tax_tenure_from: vehicleData.taxTenureFrom,
        tax_tenure_to: vehicleData.taxTenureTo,
        tax_contact_no: vehicleData.taxContactNo,
        tax_address: vehicleData.taxAddress
      }, req.user.id);
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

// Delete vehicle by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    // Check if vehicle exists
    const vehicleCheckQuery = 'SELECT id FROM vehicles WHERE id = $1';
    const vehicleCheckResult = await client.query(vehicleCheckQuery, [id]);

    if (vehicleCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Delete related documents
    await client.query('DELETE FROM vehicle_documents WHERE vehicle_id = $1', [id]);

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

module.exports = router;