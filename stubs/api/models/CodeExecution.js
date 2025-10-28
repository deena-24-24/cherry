const mongoose = require('mongoose');

const codeExecutionSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  output: String,
  error: String,
  executionTime: Number,
  status: {
    type: String,
    enum: ['success', 'error', 'timeout'],
    default: 'success'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CodeExecution', codeExecutionSchema);