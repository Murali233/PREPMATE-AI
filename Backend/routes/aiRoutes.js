const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddlewares');
const { 
    generateInterviewQuestions, 
    generateConceptExplanation 
} = require('../controllers/aiController');

// Apply protect middleware to all routes in this router
router.use(protect);

// POST /api/ai/generate-questions
router.post('/generate-questions', async (req, res, next) => {
    try {
        console.log('Generating questions with data:', req.body);
        await generateInterviewQuestions(req, res);
    } catch (error) {
        console.error('Error in generate-questions route:', error);
        next(error);
    }
});

// POST /api/ai/generate-explanation
router.post('/generate-explanation', async (req, res, next) => {
    try {
        console.log('Generating explanation with data:', req.body);
        await generateConceptExplanation(req, res);
    } catch (error) {
        console.error('Error in generate-explanation route:', error);
        next(error);
    }
});

module.exports = router;
