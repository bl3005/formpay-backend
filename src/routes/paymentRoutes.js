const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// @route   POST /api/payments/create-payment-intent
// @desc    Create a mock payment intent for a form submission
// @access  Public
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// @route   POST /api/payments/:id/confirm
// @desc    Confirm a mock payment with card details
// @access  Public
router.post('/:id/confirm', paymentController.confirmPayment);

module.exports = router;
