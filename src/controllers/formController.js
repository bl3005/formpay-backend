const Form = require('../models/Form');
const { emitNewSubmission } = require('../socket');

exports.createForm = async (req, res) => {
  try {
    const { title, description, fields, requiresPayment, price } = req.body;
    
    const form = new Form({
      user: req.user._id,
      title,
      description,
      fields,
      requiresPayment,
      price
    });

    const savedForm = await form.save();
    res.status(201).json(savedForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getForms = async (req, res) => {
  try {
    const forms = await Form.find({ user: req.user._id }).lean();

    const Submission = require('../models/Submission');

    // Aggregate submission counts and payment totals for each form
    const formIds = forms.map(f => f._id);
    const stats = await Submission.aggregate([
      { $match: { form: { $in: formIds } } },
      { $group: {
        _id: '$form',
        submissionCount: { $sum: 1 },
      }}
    ]);

    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id.toString()] = {
        submissionCount: s.submissionCount,
      };
    });

    const formsWithStats = forms.map(form => ({
      ...form,
      submissionCount: statsMap[form._id.toString()]?.submissionCount || 0,
      totalPayments: form.requiresPayment
        ? (statsMap[form._id.toString()]?.submissionCount || 0) * form.price
        : 0,
    }));

    res.status(200).json(formsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    
    // Check if form belongs to user
    if (form.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    
    // Check if form belongs to user
    if (form.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    
    // Check if form belongs to user
    if (form.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await form.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id).select('-user -createdAt -updatedAt');
    if (!form) return res.status(404).json({ message: 'Form not found' });
    
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    const { answers, paymentId } = req.body;

    // For paid forms, verify the mock payment actually succeeded before accepting the submission
    if (form.requiresPayment) {
      if (!paymentId) {
        return res.status(400).json({ message: 'Payment is required for this form' });
      }

      const Payment = require('../models/Payment');
      const payment = await Payment.findById(paymentId);

      if (!payment || payment.status !== 'succeeded') {
        return res.status(402).json({ message: 'Payment has not been completed' });
      }

      if (payment.form.toString() !== form._id.toString()) {
        return res.status(400).json({ message: 'Payment does not match this form' });
      }
    }
    
    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !answers[field.name]) {
        return res.status(400).json({ message: `Field ${field.label} is required` });
      }
    }

    const Submission = require('../models/Submission');
    const newSubmission = new Submission({
      form: form._id,
      answers
    });

    await newSubmission.save();

    // Notify the form owner's dashboard in real time
    emitNewSubmission(form.user.toString(), {
      formId: form._id.toString(),
      submission: {
        _id: newSubmission._id,
        answers: newSubmission.answers,
        createdAt: newSubmission.createdAt,
      },
      amount: form.requiresPayment ? form.price : 0,
    });

    res.status(201).json({ message: 'Form submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFormSubmissions = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });

    // Check if form belongs to user
    if (form.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const Submission = require('../models/Submission');
    const submissions = await Submission.find({ form: form._id }).sort({ createdAt: -1 });

    res.status(200).json({ form, submissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
