// Tool results come from our DB, but several fields are free text that users or
// staff can write (item names, FAQ answers, address lines, cancel reasons).
// Before anything reaches the model we neutralise text that tries to act as
// instructions, cap sizes, and drop fields the model never needs.

const INJECTION_PATTERNS = [
  /ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|messages|rules)/gi,
  /disregard (all |any )?(the )?(previous|prior|above|earlier|system) [a-z ]{0,20}/gi,
  /(reveal|print|show|repeat) (me )?(your|the) (system )?(prompt|instructions)/gi,
  /you are now [a-z ]{0,40}/gi,
  /new instructions?:/gi,
  /<\/?\s*(system|assistant|user|instructions?|tool_result|tool_use)[^>]*>/gi,
  /\b(system|assistant)\s*:/gi,
];

const MAX_STRING = 500;
const MAX_ARRAY = 30;
const DROP_KEYS = new Set(['password', 'resetPasswordToken', 'resetPasswordExpires', '__v', 'email']);

function cleanString(str) {
  let out = String(str);
  for (const re of INJECTION_PATTERNS) out = out.replace(re, '[removed]');
  return out.length > MAX_STRING ? `${out.slice(0, MAX_STRING)}…` : out;
}

function sanitizeForModel(value, depth = 0) {
  if (depth > 6) return null;
  if (value == null) return value;
  if (typeof value === 'string') return cleanString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY).map((v) => sanitizeForModel(v, depth + 1));
  if (typeof value === 'object') {
    if (typeof value.toHexString === 'function') return value.toHexString();
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (DROP_KEYS.has(k)) continue;
      out[k] = sanitizeForModel(v, depth + 1);
    }
    return out;
  }
  return null;
}

module.exports = { sanitizeForModel, cleanString };
