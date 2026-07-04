const Form = require('../models/Form');
const Payment = require('../models/Payment');

// Luhn algorithm — validates card number checksum, same check real card networks use
const isValidCardNumber = (number) => {
  const digits = number.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// @desc    Create a mock payment intent for a form
// @route   POST /api/payments/create-payment-intent
// @access  Public
exports.createPaymentIntent = async (req, res) => {
  try {
    const { formId } = req.body;
    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (!form.requiresPayment) {
      return res.status(400).json({ message: 'Form does not require payment' });
    }

    const payment = await Payment.create({
      form: form._id,
      amount: form.price,
      status: 'pending',
    });

    res.json({
      paymentId: payment._id,
      amount: payment.amount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm a mock payment using card details
// @route   POST /api/payments/:id/confirm
// @access  Public
exports.confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'succeeded') {
      return res.json({ status: 'succeeded', paymentId: payment._id });
    }

    const { cardNumber, expiry, cvc } = req.body;

    if (!cardNumber || !expiry || !cvc) {
      return res.status(400).json({ message: 'Card details are required' });
    }

    // Basic mock validation — mirrors the kind of client-side checks Stripe Elements does
    if (!isValidCardNumber(cardNumber)) {
      payment.status = 'failed';
      await payment.save();
      return res.status(402).json({ message: 'Your card number is invalid.' });
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry.trim())) {
      payment.status = 'failed';
      await payment.save();
      return res.status(402).json({ message: 'Your card expiry date is invalid.' });
    }

    if (!/^\d{3,4}$/.test(cvc.trim())) {
      payment.status = 'failed';
      await payment.save();
      return res.status(402).json({ message: 'Your card security code is invalid.' });
    }

    // Mock decline rule, same pattern Stripe test cards use: a specific number always declines
    const digits = cardNumber.replace(/\s+/g, '');
    if (digits === '4000000000000002') {
      payment.status = 'failed';
      await payment.save();
      return res.status(402).json({ message: 'Your card was declined.' });
    }

    payment.status = 'succeeded';
    payment.cardLast4 = digits.slice(-4);
    await payment.save();

    res.json({ status: 'succeeded', paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
