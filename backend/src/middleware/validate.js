// Lightweight field-presence validator (kept dependency-free).
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

module.exports = { validateBody };
