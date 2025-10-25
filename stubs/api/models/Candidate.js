// models/candidateRoutes.js
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  resume: String,
  skills: [String],
  experience: String,
  education: String
}, {
  timestamps: true
});

module.exports = mongoose.model('candidate', candidateSchema);