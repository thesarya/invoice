# Setup Guide

## Environment Variables Configuration

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=https://care.kidaura.in/api/graphql

# Authentication Tokens
VITE_GKP_TOKEN=your_gkp_token_here
VITE_LKO_TOKEN=your_lko_token_here

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Optional: Debug Mode
# VITE_DEBUG=true
```

## Getting Razorpay API Keys

1. **Sign up for Razorpay**
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Create an account or sign in

2. **Generate API Keys**
   - Navigate to Settings → API Keys
   - Click "Generate Key Pair"
   - Copy the Key ID and Key Secret

3. **Test Mode vs Live Mode**
   - Use test keys for development
   - Switch to live keys for production
   - Test keys start with `rzp_test_`
   - Live keys start with `rzp_live_`

## Testing the Integration

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test payment link creation**
   - Navigate to an invoice
   - Click "Pay Link"
   - Fill in test customer details
   - Generate payment link

3. **Test payment flow**
   - Use test UPI ID: `success@razorpay`
   - Use test card: `4111 1111 1111 1111`
   - Use test OTP: `123456`

## Production Deployment

1. **Update environment variables**
   - Replace test keys with live keys
   - Update callback URL to production domain
   - Ensure HTTPS is enabled

2. **Configure Razorpay webhooks** (optional)
   - Set up webhook endpoints for payment events
   - Configure signature verification

3. **Domain configuration**
   - Add your domain to Razorpay allowed domains
   - Configure CORS settings if needed

## Security Checklist

- [ ] API keys are in `.env` file (not committed to git)
- [ ] Using HTTPS in production
- [ ] Input validation is working
- [ ] Error handling is comprehensive
- [ ] Payment callbacks are secure
- [ ] Customer data is protected

## Troubleshooting

### Payment Link Issues
- Verify API keys are correct
- Check network connectivity
- Review browser console for errors
- Ensure customer details are valid

### Notification Issues
- Verify phone/email format
- Check Razorpay account settings
- Ensure notification permissions are enabled

### Callback Issues
- Verify callback URL is accessible
- Check domain configuration
- Ensure route is properly set up 