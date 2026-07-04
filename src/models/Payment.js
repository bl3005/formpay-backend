const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  form: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Form',
  },
  amount: {
    type: Number,
    required: true, // in cents
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending',
  },
  cardLast4: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
