const Test = require('../models/Test');
const Result = require('../models/Result');
const Module = require('../models/Module');

const QUIZ_RETRY_LOCK_MS = 24 * 60 * 60 * 1000;

// @desc   Create test
// @route  POST /api/tests
const createTest = async (req, res) => {
  try {
    const { title, type, courseId, moduleId, questions, passingScore } = req.body;
    const test = await Test.create({ title, type, courseId, moduleId, questions, passingScore });

    // Link to module if module test
    if (type === 'module' && moduleId) {
      await Module.findByIdAndUpdate(moduleId, { testId: test._id });
    }

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get tests for a course
// @route  GET /api/tests/course/:courseId
const getTestsByCourse = async (req, res) => {
  try {
    const tests = await Test.find({ courseId: req.params.courseId });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single test (strips correct answers for students)
// @route  GET /api/tests/:id
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    // Strip correct answers for students
    if (req.user.role === 'student') {
      const safeTest = {
        _id: test._id,
        title: test.title,
        type: test.type,
        passingScore: test.passingScore,
        questions: test.questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
        })),
      };
      return res.json({ success: true, data: safeTest });
    }

    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Submit test answers (allows retries)
// @route  POST /api/tests/:id/submit
const submitTest = async (req, res) => {
  try {
    const { answers, courseId } = req.body;
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const latestAttempt = await Result.findOne({
      studentId: req.user._id,
      testId: test._id,
    }).sort({ createdAt: -1 });

    if (latestAttempt && !latestAttempt.passed) {
      const retryAt = new Date(latestAttempt.createdAt.getTime() + QUIZ_RETRY_LOCK_MS);
      if (Date.now() < retryAt.getTime()) {
        return res.status(429).json({
          success: false,
          message: `You did not pass this quiz. Please read again and try again after ${retryAt.toLocaleString()}.`,
          code: 'QUIZ_RETRY_LOCKED',
          data: {
            retryAt,
            cooldownHours: 24,
          },
        });
      }
    }

    if (!Array.isArray(answers) || answers.length !== test.questions.length) {
      return res.status(400).json({ success: false, message: 'Please answer all quiz questions before submitting.' });
    }

    // Calculate score
    let correct = 0;
    test.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / test.questions.length) * 100);
    const passed = score >= (test.passingScore || 70);

    const result = await Result.create({
      studentId: req.user._id,
      testId: test._id,
      courseId,
      score,
      passed,
      answers,
    });

    // Fire notification
    const { createNotification } = require('./notificationController');
    await createNotification({
      userId: req.user._id,
      type: passed ? 'quiz_passed' : 'quiz_failed',
      title: passed ? `Quiz Passed! 🎉 (${score}%)` : `Quiz Not Passed (${score}%)`,
      message: passed
        ? `You scored ${score}% on "${test.title}" — great job! The next module is now unlocked.`
        : `You scored ${score}% on "${test.title}" (need ${test.passingScore || 70}%). Please read again and try again after 24 hours.`,
      link: courseId ? `/student/course/${courseId}` : '',
    });

    // Return correct answers after submission so student can learn
    const correctAnswers = test.questions.map((q, i) => ({
      questionIndex: i,
      correctAnswer: q.correctAnswer,
      studentAnswer: answers[i],
      isCorrect: answers[i] === q.correctAnswer,
    }));

    res.json({
      success: true,
      data: {
        score, passed, total: test.questions.length, correct,
        passingScore: test.passingScore || 70,
        retryAvailableAt: passed ? null : new Date(Date.now() + QUIZ_RETRY_LOCK_MS),
        correctAnswers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get results for a student in a course
// @route  GET /api/tests/results/:courseId
const getResults = async (req, res) => {
  try {
    const results = await Result.find({
      studentId: req.user._id,
      courseId: req.params.courseId,
    })
      .populate('testId', 'title type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update test (mentor)
// @route  PUT /api/tests/:id
const updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTest, getTestsByCourse, getTestById, submitTest, getResults, updateTest };
