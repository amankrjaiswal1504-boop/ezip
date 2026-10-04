const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', default: null, index: true },
    pickupId: { type: String, default: null },
    summary: { type: String, required: true, maxlength: 2000 },
    reason: {
      type: String,
      enum: ['user_request', 'frustration', 'bot_failed', 'assistant_handoff', 'other'],
      default: 'other',
    },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
