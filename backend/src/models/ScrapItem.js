const mongoose = require('mongoose');

const scrapItemSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapCategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, enum: ['kg', 'piece', 'unit'], default: 'kg' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

scrapItemSchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ScrapItem', scrapItemSchema);
