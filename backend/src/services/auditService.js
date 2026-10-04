const { AuditLog } = require('../models/platform');
const logger = require('../utils/logger');

// Records a sensitive action (price change, payout, role change, settings...).
// Never throws: an audit failure must not break the request that triggered it.
async function audit(req, action, { entity, entityId, before, after } = {}) {
  try {
    await AuditLog.create({
      actor: req?.user?._id,
      actorName: req?.user?.name,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      before,
      after,
      ip: req?.ip,
    });
  } catch (err) {
    logger.error({ err, action }, 'audit log write failed');
  }
}

module.exports = { audit };
