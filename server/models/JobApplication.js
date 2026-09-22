const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'test_assigned', 'interview_scheduled', 'interview_completed', 'offer_sent', 'offer_accepted', 'hired', 'rejected'],
    default: 'pending',
  },
  coverLetter: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  stageTracking: {
    testType: { type: String, enum: ['external', 'assignment', 'internal_quiz'], default: 'external' },
    testLink: { type: String, default: '' },
    testInstructions: { type: String, default: '' },
    assignmentInstructions: { type: String, default: '' },
    assignmentStudentSubmissionUrl: { type: String, default: '' },
    internalQuiz: [{
      questionText: String,
      options: [String],
      correctAnswerIndex: Number
    }],
    quizScoreSubmitted: { type: Number, default: null },
    interviewDate: { type: Date },
    interviewTime: { type: String, default: '' },
    interviewRoomId: { type: String, default: '' },
    studentJoinedAt: { type: Date, default: null },
    employerJoinedAt: { type: Date, default: null }
  },
  offerDetails: {
    salary: { type: String, default: '' },
    startDate: { type: Date },
    duration: { type: String, default: '' },
    terms: { type: String, default: '' }
  },
}, { timestamps: true });

// Prevent duplicate applications for the same job by the same student
jobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
