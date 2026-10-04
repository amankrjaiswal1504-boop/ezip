const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    price: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapPrice', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapItem', required: true },
    city: { type: String, required: true },
    oldMinPrice: { type: Number },
    oldMaxPrice: { type: Number },
    newMinPrice: { type: Number, required: true },
    newMaxPrice: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
