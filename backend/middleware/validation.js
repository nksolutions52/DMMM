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
    registrationValidUpto: Joi.date().allow('', null),
    taxUpto: Joi.date().allow('', null),
    insuranceUpto: Joi.date().allow('', null),
    fcValidUpto: Joi.date().allow('', null),
    hypothecatedTo: Joi.string().allow('', null),
    permitUpto: Joi.date().allow('', null),
    chassisNumber: Joi.string().required(),
    bodyType: Joi.string().allow('', null),
    engineNumber: Joi.string().required(),
    colour: Joi.string().allow('', null),
    vehicleClass: Joi.string().allow('', null),
    fuelUsed: Joi.string().allow('', null),
    makersName: Joi.string().allow('', null),
    cubicCapacity: Joi.string().allow('', null),
    makersClassification: Joi.string().allow('', null),
    seatingCapacity: Joi.string().allow('', null),
    monthYearOfManufacture: Joi.string().allow('', null),
    ulw: Joi.string().allow('', null),
    gvw: Joi.string().allow('', null),
    subject: Joi.string().allow('', null),
    registeringAuthority: Joi.string().allow('', null),
    type: Joi.string().valid('Transport', 'Non Transport').required(),
    
    // PUC Details - all optional
    pucNumber: Joi.string().allow('', null),
    pucDate: Joi.date().allow('', null),
    pucTenure: Joi.string().allow('', null),
    pucFrom: Joi.date().allow('', null),
    pucTo: Joi.date().allow('', null),
    pucContactNo: Joi.string().allow('', null),
    pucAddress: Joi.string().allow('', null),
    
    // Insurance Details - all optional
    insuranceCompanyName: Joi.string().allow('', null),
    insuranceType: Joi.string().allow('', null),
    policyNumber: Joi.string().allow('', null),
    insuranceDate: Joi.date().allow('', null),
    insuranceTenure: Joi.string().allow('', null),
    insuranceFrom: Joi.date().allow('', null),
    insuranceTo: Joi.date().allow('', null),
    insuranceContactNo: Joi.string().allow('', null),
    insuranceAddress: Joi.string().allow('', null),
    
    // Fitness Details - all optional
    fcNumber: Joi.string().allow('', null),
    fcTenureFrom: Joi.date().allow('', null),
    fcTenureTo: Joi.date().allow('', null),
    fcContactNo: Joi.string().allow('', null),
    fcAddress: Joi.string().allow('', null),
    
    // Permit Details - all optional
    permitNumber: Joi.string().allow('', null),
    permitTenureFrom: Joi.date().allow('', null),
    permitTenureTo: Joi.date().allow('', null),
    permitContactNo: Joi.string().allow('', null),
    permitAddress: Joi.string().allow('', null),
    
    // Tax Details - all optional
    taxNumber: Joi.string().allow('', null),
    taxTenureFrom: Joi.date().allow('', null),
    taxTenureTo: Joi.date().allow('', null),
    taxContactNo: Joi.string().allow('', null),
    taxAddress: Joi.string().allow('', null)
  }),

  serviceOrder: Joi.object({
    vehicleId: Joi.string().uuid().required(),
    serviceType: Joi.string().required(),
    actualAmount: Joi.number().positive().required(),
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