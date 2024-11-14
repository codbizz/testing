const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  min_purchase_amount: {
    type: Number,
    default: 0,
  },
  max_discount_amount: {
    type: Number,
    default: null,
  },
  expiry_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  description: {
    type: String,
  },
},
{ timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
