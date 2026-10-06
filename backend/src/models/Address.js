const mongoose = require('mongoose');
const POSTAL = { IN: /^\d{6}$/, NP: /^\d{5}$/ };

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    houseNumber: { type: String, required: true },
    street: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, enum: ['IN', 'NP'], default: 'IN' },
    district: { type: String },
    ward: { type: String },
    pinCode: {
      type: String,
      required: true,
      validate: {
        validator(v) { return (POSTAL[this.country || 'IN']).test(v); },
        message: 'Invalid postal code for this country',
      },
    },
    landmark: { type: String },
    location: { lat: Number, lng: Number },
    addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);
