const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['junior', 'middle', 'senior'],
    default: 'middle'
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // в минутах
    default: 60
  },
  notes: {
    type: String,
    default: ''
  },
  conversationHistory: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system']
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  evaluation: {
    technicalScore: Number,
    communicationScore: Number,
    problemSolvingScore: Number,
    overallScore: Number,
    feedback: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);