const crypto = require('crypto');
const SupportTicket = require('../../models/SupportTicket');
const { cleanString } = require('./sanitize');

function generateTicketId() {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

// Creates (or reuses) the open ticket for a chat session and flags the session
// as escalated. Escalations are logged so ops can see them in server logs too.
async function escalateSession(session, { summary, reason, pickupId }) {
  let ticket = await SupportTicket.findOne({ session: session._id, status: { $ne: 'resolved' } });
  if (!ticket) {
    ticket = await SupportTicket.create({
      ticketId: generateTicketId(),
      user: session.user || null,
      session: session._id,
      pickupId: pickupId || null,
      summary: cleanString(summary).slice(0, 2000),
      reason,
    });
  }
  session.escalated = true;
  session.resolved = false;
  session.consecutiveFailures = 0;
  await session.save();
  console.log(
    `[chat] escalation: ticket=${ticket.ticketId} reason=${reason} session=${session._id} user=${session.user || 'anonymous'}`
  );
  return ticket;
}

module.exports = { escalateSession, generateTicketId };
