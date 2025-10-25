// models/HR.js
const mongoose = require('mongoose');

const hrSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
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
  position: String,
  companyWebsite: String,
  companyDescription: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Hr', hrSchema);