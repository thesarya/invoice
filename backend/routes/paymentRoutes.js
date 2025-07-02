const express = require('express');
const PhonePeService = require('../services/PhonePeService');
const router = express.Router();

const phonePeService = new PhonePeService();

// Generate payment link
router.post('/generate-payment-link', async (req, res) => {
  try {
    const { amount, phone, name, invoiceNo } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!phone || phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!invoiceNo) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required'
      });
    }

    // Create redirect URL for success/failure
    const redirectUrl = `${process.env.FRONTEND_URL}/payment-status`;

    const customerDetails = {
      name: name.trim(),
      phone,
      invoiceNo
    };

    // Initiate PhonePe payment
    const paymentResponse = await phonePeService.initiateCheckoutPagePayment(
      amount,
      redirectUrl,
      customerDetails
    );

    res.json({
      success: true,
      message: 'Payment link generated successfully',
      data: {
        paymentUrl: paymentResponse.redirectUrl,
        merchantOrderId: paymentResponse.merchantOrderId,
        amount,
        customerDetails
      }
    });

  } catch (error) {
    console.error('Payment link generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment link',
      error: error.message
    });
  }
});

// Check payment status
router.get('/payment-status/:merchantOrderId', async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Merchant order ID is required'
      });
    }

    const statusResponse = await phonePeService.getOrderStatus(merchantOrderId);

    res.json({
      success: true,
      data: statusResponse
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
});

// PhonePe callback endpoint
router.post('/phonepe-callback', async (req, res) => {
  try {
    const { username, password, authorization } = req.headers;
    const responseBodyString = JSON.stringify(req.body);

    const callbackResponse = await phonePeService.validateCallback(
      username,
      password,
      authorization,
      responseBodyString
    );

    // Here you can update your database with payment status
    console.log('Payment callback received:', callbackResponse);

    res.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('PhonePe callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process callback',
      error: error.message
    });
  }
});

module.exports = router;
