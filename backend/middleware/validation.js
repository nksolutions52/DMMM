const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  vehicle: Joi.object({
    aadharNumber: Joi.string().required(),
    mobileNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
    registeredOwnerName: Joi.string().required(),
    registrationNumber: Joi.string().required(),
    guardianInfo: Joi.string().required(),
    dateOfRegistration: Joi.date().required(),
    address: Joi.string().required(),
    registrationValidUpto: Joi.date().required(),
    taxUpto: Joi.date().allow(''),
    insuranceUpto: Joi.date().allow(''),
    fcValidUpto: Joi.date().allow(''),
    hypothecatedTo: Joi.string().allow(''),
    permitUpto: Joi.date().allow(''),
    chassisNumber: Joi.string().required(),
    bodyType: Joi.string().required(),
    engineNumber: Joi.string().required(),
    colour: Joi.string().required(),
    vehicleClass: Joi.string().required(),
    fuelUsed: Joi.string().required(),
    makersName: Joi.string().required(),
    cubicCapacity: Joi.string().required(),
    makersClassification: Joi.string().required(),
    seatingCapacity: Joi.string().required(),
    monthYearOfManufacture: Joi.string().allow(''),
    ulw: Joi.string().allow(''),
    gvw: Joi.string().allow(''),
    subject: Joi.string().allow(''),
    registeringAuthority: Joi.string().allow(''),
    type: Joi.string().valid('Transport', 'Non Transport').required()
  }),

  serviceOrder: Joi.object({
    vehicleId: Joi.string().uuid().required(),
    serviceType: Joi.string().required(),
    amount: Joi.number().positive().required(),
    customerName: Joi.string().required(),
    discount: Joi.number().min(0).default(0)
  }),

  appointment: Joi.object({
    vehicleNumber: Joi.string().required(),
    appointmentDate: Joi.date().required(),
    timeSlot: Joi.string().required(),
    description: Joi.string().required()
  })
};

module.exports = {
  validateRequest,
  schemas
};