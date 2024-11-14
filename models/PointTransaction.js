const mongoose = require('mongoose');

// PointTransaction schema
const pointTransactionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the 'User' model
        required: true,
      },
    test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test', // Reference the 'Test' model,
    required: false
    },
    set_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Set', // Reference the 'Test' model,
      required: false
      },
    status: {
      type: String,
      required: true,
      enum: ['created', 'attempted', 'paid', 'expired'],
      default: 'paid'
    },
  initial_points: {
    type: Number,
    required: true,
  },
  final_points: {
    type: Number,
    required: true,
  },
  difference: {
    type: Number,
    required: true,
  },
  action: {
    type: String,
    enum: ['1', '2'],
    // 1 to add ,2 for substract
    required: true,
  },
  reason: {
    type: String,
  },
  comment: {
    type: String,
  },
});

// Step 3: Create the PointTransaction model
const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);

// Export the model for use in your application
module.exports = PointTransaction;
