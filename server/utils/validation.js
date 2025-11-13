const Joi = require('joi');

/**
 * Validation schemas for request data
 */

// Student validation schema
const studentSchema = Joi.object({
  student_number: Joi.string().trim().min(3).max(50).required(),
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  id_number: Joi.string()
    .trim()
    .pattern(/^[0-9]{13}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID number must be exactly 13 digits',
    }),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{10,20}$/)
    .required(),
  nsfas_beneficiary: Joi.boolean().default(false),
  nsfas_reference: Joi.string().trim().max(100).allow('', null),
  institution: Joi.string().trim().min(2).max(200).required(),
  campus: Joi.string().trim().min(2).max(200).required(),
  distance_from_campus_km: Joi.number().min(0).max(1000).required(),
  emergency_contact_name: Joi.string().trim().max(100).allow('', null),
  emergency_contact_phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]{10,20}$/)
    .allow('', null),
});

// Property validation schema
const propertySchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  address: Joi.string().trim().min(5).max(500).required(),
  total_beds: Joi.number().integer().min(1).max(10000).required(),
  available_beds: Joi.number().integer().min(0).max(10000).optional(),
  proof_of_ownership: Joi.string().trim().max(500).allow('', null),
  registration_status: Joi.string().valid('pending', 'approved', 'rejected').default('pending'),
  nsfas_accredited: Joi.boolean().default(false),
  accreditation_date: Joi.date().iso().allow(null),
  contract_start_date: Joi.date().iso().allow(null),
  contract_end_date: Joi.date().iso().allow(null),
});

// Room validation schema
const roomSchema = Joi.object({
  property_id: Joi.number().integer().positive().required(),
  room_number: Joi.string().trim().min(1).max(50).required(),
  room_type: Joi.string().valid('single', 'shared', 'studio').required(),
  size_sqm: Joi.number().min(1).max(1000).required(),
  max_occupants: Joi.number().integer().min(1).max(20).required(),
  current_occupants: Joi.number().integer().min(0).max(20).default(0),
  monthly_rate: Joi.number().min(0).max(100000).required(),
  status: Joi.string().valid('available', 'occupied', 'maintenance').default('available'),
});

// Lease validation schema
const leaseSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  room_id: Joi.number().integer().positive().required(),
  property_id: Joi.number().integer().positive().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  monthly_amount: Joi.number().min(0).max(10000).required(),
  lease_agreement_path: Joi.string().trim().max(500).allow('', null),
  signed_date: Joi.date().iso().allow(null),
});

// Maintenance request validation schema
const maintenanceSchema = Joi.object({
  property_id: Joi.number().integer().positive().required(),
  room_id: Joi.number().integer().positive().allow(null),
  student_id: Joi.number().integer().positive().allow(null),
  category: Joi.string()
    .valid('washing_machine', 'plumbing', 'electrical', 'security', 'cleaning', 'other')
    .required(),
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  assigned_to: Joi.string().trim().max(100).allow('', null),
  status: Joi.string().valid('open', 'in_progress', 'completed', 'cancelled').default('open'),
  cost: Joi.number().min(0).allow(null),
  notes: Joi.string().trim().max(2000).allow('', null),
});

// Access log validation schema
const accessLogSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  property_id: Joi.number().integer().positive().required(),
  access_type: Joi.string().valid('entry', 'exit').required(),
  access_method: Joi.string().valid('key_card', 'pin', 'biometric', 'manual').default('manual'),
  notes: Joi.string().trim().max(500).allow('', null),
});

// User validation schema
const userSchema = Joi.object({
  username: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  email: Joi.string().trim().email().lowercase().required(),
  role: Joi.string().valid('admin', 'manager', 'maintenance', 'viewer').default('viewer'),
  full_name: Joi.string().trim().min(2).max(100).required(),
});

// Login validation schema
const loginSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});

/**
 * Validate request body against a schema
 * @param {object} data - Data to validate
 * @param {object} schema - Joi schema
 * @returns {object} - Validation result
 */
const validate = (data, schema) => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};

/**
 * Express middleware for validation
 * @param {object} schema - Joi schema to validate against
 * @returns {function} - Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = validate(req.body, schema);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

module.exports = {
  studentSchema,
  propertySchema,
  roomSchema,
  leaseSchema,
  maintenanceSchema,
  accessLogSchema,
  userSchema,
  loginSchema,
  validate,
  validateRequest,
};
