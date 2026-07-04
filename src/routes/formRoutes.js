const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/forms/public/:id
// @desc    Get form by ID for public view
// @access  Public
router.get('/public/:id', formController.getPublicFormById);

// @route   POST /api/forms/:id/submit
// @desc    Submit a form
// @access  Public
router.post('/:id/submit', formController.submitForm);

// @route   POST /api/forms
// @desc    Create a form
// @access  Private
router.post('/', protect, formController.createForm);

// @route   GET /api/forms
// @desc    Get all forms for user
// @access  Private
router.get('/', protect, formController.getForms);

// @route   GET /api/forms/:id
// @desc    Get form by ID
// @access  Private
router.get('/:id', protect, formController.getFormById);

// @route   GET /api/forms/:id/submissions
// @desc    Get all submissions for a form, with full field answers
// @access  Private
router.get('/:id/submissions', protect, formController.getFormSubmissions);

// @route   PUT /api/forms/:id
// @desc    Update form
// @access  Private
router.put('/:id', protect, formController.updateForm);

// @route   DELETE /api/forms/:id
// @desc    Delete form
// @access  Private
router.delete('/:id', protect, formController.deleteForm);

module.exports = router;
