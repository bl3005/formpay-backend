const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  form: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Form',
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
