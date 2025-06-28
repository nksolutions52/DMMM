const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all appointments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, u.name as agent_name
      FROM appointments a
      LEFT JOIN users u ON a.agent_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (a.vehicle_number ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    query += ` ORDER BY a.appointment_date DESC, a.time_slot DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM appointments a WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (a.vehicle_number ILIKE $${countParamCount} OR a.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        appointments: result.rows,
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
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get appointment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT a.*, u.name as agent_name
      FROM appointments a
      LEFT JOIN users u ON a.agent_id = u.id
      WHERE a.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new appointment
router.post('/', authenticateToken, validateRequest(schemas.appointment), async (req, res) => {
  try {
    const { vehicleNumber, appointmentDate, timeSlot, description } = req.body;

    // Check if time slot is available
    const existingAppointment = await pool.query(
      'SELECT id FROM appointments WHERE appointment_date = $1 AND time_slot = $2 AND status != $3',
      [appointmentDate, timeSlot, 'cancelled']
    );

    if (existingAppointment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    const query = `
      INSERT INTO appointments (
        vehicle_number, appointment_date, time_slot, description, 
        status, agent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const values = [vehicleNumber, appointmentDate, timeSlot, description, 'scheduled', req.user.id];
    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update appointment
router.put('/:id', authenticateToken, validateRequest(schemas.appointment), async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleNumber, appointmentDate, timeSlot, description } = req.body;

    // Check if appointment exists
    const existingAppointment = await pool.query('SELECT id FROM appointments WHERE id = $1', [id]);
    if (existingAppointment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if new time slot is available (excluding current appointment)
    const conflictingAppointment = await pool.query(
      'SELECT id FROM appointments WHERE appointment_date = $1 AND time_slot = $2 AND status != $3 AND id != $4',
      [appointmentDate, timeSlot, 'cancelled', id]
    );

    if (conflictingAppointment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    const query = `
      UPDATE appointments SET
        vehicle_number = $1, appointment_date = $2, time_slot = $3, 
        description = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `;

    await pool.query(query, [vehicleNumber, appointmentDate, timeSlot, description, id]);

    res.json({
      success: true,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update appointment status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be scheduled, completed, or cancelled'
      });
    }

    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully'
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available time slots for a date
router.get('/available-slots/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    // Define all possible time slots
    const allTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30'
    ];

    // Get booked time slots for the date
    const bookedSlots = await pool.query(
      'SELECT time_slot FROM appointments WHERE appointment_date = $1 AND status != $2',
      [date, 'cancelled']
    );

    const bookedTimeSlots = bookedSlots.rows.map(row => row.time_slot);
    const availableSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots: bookedTimeSlots
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;