const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [{
    type: String
  }]
});

const formSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  requiresPayment: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  fields: [fieldSchema],
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);
