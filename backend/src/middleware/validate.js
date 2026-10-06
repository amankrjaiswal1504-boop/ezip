const { z } = require('zod');

// Lightweight field-presence validator (kept for older routes).
// Usage: validateBody(['name','email','password'])
function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = requiredFields.filter((f) => {
      const val = req.body?.[f];
      return val === undefined || val === null || val === '';
    });
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(', ')}`,
      });
    }
    next();
  };
}

// Zod validation: replaces req[part] with the parsed (coerced, stripped) value.
function validate(schema, part = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join('.');
      return res.status(400).json({
        success: false,
        message: field ? `${field}: ${issue.message}` : issue.message,
        errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
    }
    if (part === 'query') {
      // req.query is a getter in some Express setups; copy values over instead.
      Object.keys(req.query).forEach((k) => delete req.query[k]);
      Object.assign(req.query, result.data);
    } else {
      req[part] = result.data;
    }
    next();
  };
}

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?91(?=\d{10}$)/, ''))
  .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const pinCode = z.string().trim().regex(/^\d{5,6}$/, 'Postal code must be 5 or 6 digits');const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

module.exports = { validateBody, validate, z, phone, objectId, pinCode, isoDate, password };
