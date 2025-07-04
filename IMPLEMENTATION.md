# Razorpay Payment Gateway Implementation

## Overview

This document details the complete implementation of Razorpay payment gateway integration in the invoice management system. The integration provides a comprehensive payment solution with UPI payment links, reminder systems, and real-time status tracking.

## Architecture

### Core Components

1. **RazorpayService** (`src/lib/razorpay.ts`)
   - Handles all Razorpay API interactions
   - Manages authentication and request formatting
   - Provides helper methods for common operations

2. **PaymentLinkDialog** (`src/components/PaymentLinkDialog.tsx`)
   - Main UI component for payment link creation and management
   - Supports editing existing payment links
   - Includes reminder and notification controls

3. **PaymentCallback** (`src/pages/PaymentCallback.tsx`)
   - Handles payment response processing
   - Shows payment status to users
   - Provides receipt printing functionality

4. **Type Definitions** (`src/types/payment.ts`)
   - Comprehensive TypeScript interfaces
   - Ensures type safety across the application

## Implementation Details

### 1. Razorpay Service Layer

The service layer abstracts all Razorpay API interactions:

```typescript
class RazorpayService {
  // Core API methods
  async createPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse>
  async updatePaymentLink(id: string, data: Partial<CreatePaymentLinkRequest>): Promise<PaymentLinkResponse>
  async resendNotification(id: string, medium: 'sms' | 'email'): Promise<ResendNotificationResponse>
  async getPaymentLink(id: string): Promise<PaymentLinkResponse>
  async cancelPaymentLink(id: string): Promise<PaymentLinkResponse>
  
  // Helper method for invoice-specific payment links
  async createInvoicePaymentLink(invoice: Invoice, customerData: CustomerData): Promise<PaymentLinkResponse>
}
```

**Key Features:**
- Automatic amount conversion (rupees to paise)
- Default expiry setting (7 days)
- UPI link generation
- Reminder system integration
- Callback URL configuration

### 2. Payment Link Creation Flow

1. **User clicks "Pay Link"** on an invoice
2. **Dialog opens** with pre-filled invoice data
3. **User configures**:
   - Customer details (name, phone, email)
   - Payment amount (auto-filled from invoice)
   - Description and expiry
   - Notification preferences
   - Reminder settings
4. **System validates** all inputs
5. **API call** to Razorpay creates payment link
6. **Success response** shows payment link details
7. **User can** copy, edit, or resend notifications

### 3. Payment Link Management

After creation, users can:

- **Edit Payment Link**: Modify amount, expiry, customer details
- **Resend Notifications**: Send SMS or email reminders
- **Copy Link**: Copy to clipboard for sharing
- **Open Link**: Preview payment page
- **Track Status**: Monitor payment completion

### 4. Reminder System

The reminder system includes:

- **Automatic Reminders**: Enabled by default for all payment links
- **SMS Notifications**: Send payment reminders via SMS
- **Email Notifications**: Send payment reminders via email
- **Manual Resend**: Users can manually resend notifications
- **Configurable**: Can be enabled/disabled per payment link

### 5. Payment Callback Handling

The callback system processes payment responses:

```typescript
// Supported payment statuses
- 'paid': Payment completed successfully
- 'cancelled': Payment was cancelled by user
- 'expired': Payment link has expired
- 'pending': Payment is being processed
```

**Callback Features:**
- Real-time status updates
- Payment receipt generation
- Error handling and user feedback
- Support contact information

## API Integration

### Razorpay Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/payment_links` | POST | Create payment link |
| `/v1/payment_links/:id` | PATCH | Update payment link |
| `/v1/payment_links/:id/notify_by/:medium` | POST | Resend notifications |
| `/v1/payment_links/:id` | GET | Fetch payment link details |
| `/v1/payment_links/:id/cancel` | POST | Cancel payment link |

### Request/Response Examples

**Create Payment Link Request:**
```json
{
  "upi_link": true,
  "amount": 100000,
  "currency": "INR",
  "accept_partial": false,
  "expire_by": 1691097057,
  "reference_id": "INV001",
  "description": "Payment for invoice #INV001",
  "customer": {
    "name": "John Doe",
    "contact": "+919876543210",
    "email": "john@example.com"
  },
  "notify": {
    "sms": true,
    "email": true
  },
  "reminder_enable": true,
  "notes": {
    "invoice_id": "123",
    "policy_name": "Kidaura Care"
  },
  "callback_url": "https://yourdomain.com/payment-callback",
  "callback_method": "get"
}
```

**Payment Link Response:**
```json
{
  "id": "plink_Et2G7ymGcTTuM5",
  "short_url": "https://rzp.io/i/abc123",
  "amount": 100000,
  "currency": "INR",
  "customer": {
    "name": "John Doe",
    "contact": "+919876543210",
    "email": "john@example.com"
  },
  "expire_by": 1691097057,
  "created_at": 1691097057
}
```

## Security Features

### Authentication
- Basic authentication using API key and secret
- Environment variable storage for sensitive data
- Automatic credential encoding

### Input Validation
- Phone number format validation (10 digits)
- Email format validation
- Amount validation (positive numbers)
- Required field validation

### Error Handling
- Comprehensive error catching and display
- User-friendly error messages
- Console logging for debugging
- Graceful fallbacks

## User Experience Features

### 1. Intuitive Interface
- Tabbed interface for organized data entry
- Pre-filled customer information from invoice
- Real-time validation feedback
- Loading states and progress indicators

### 2. Payment Link Management
- Visual status indicators
- One-click copy functionality
- Direct link opening
- Edit mode with form validation

### 3. Notification System
- Toggle controls for SMS/email
- Manual resend buttons
- Success/error feedback
- Loading states during sending

### 4. Payment Status Tracking
- Real-time status updates
- Visual status indicators
- Payment receipt generation
- Support contact information

## Testing

### Test Data
- **Test UPI ID**: `success@razorpay`
- **Test Card**: `4111 1111 1111 1111`
- **Test OTP**: `123456`

### Test Scenarios
1. **Payment Link Creation**: Verify all fields and validation
2. **Payment Link Editing**: Test modification of existing links
3. **Notification Sending**: Test SMS and email notifications
4. **Payment Flow**: Complete test payment process
5. **Callback Handling**: Test various payment statuses
6. **Error Handling**: Test invalid inputs and API errors

## Configuration

### Environment Variables
```env
VITE_RAZORPAY_KEY_ID=your_key_id
VITE_RAZORPAY_KEY_SECRET=your_secret_key
```

### Default Settings
- **Expiry**: 7 days
- **Currency**: INR
- **UPI Links**: Enabled
- **Reminders**: Enabled
- **Notifications**: SMS and Email enabled

## Performance Considerations

### Optimization Features
- Lazy loading of payment components
- Efficient API call handling
- Minimal re-renders with React optimization
- Compressed bundle size

### Caching Strategy
- Payment link data caching
- Customer information caching
- API response caching

## Future Enhancements

### Planned Features
1. **Webhook Integration**: Real-time payment status updates
2. **Bulk Payment Links**: Generate multiple links at once
3. **Payment Analytics**: Track payment success rates
4. **Advanced Reminders**: Customizable reminder schedules
5. **Payment Templates**: Pre-configured payment link templates

### Scalability Considerations
- API rate limiting handling
- Bulk operation optimization
- Database integration for payment tracking
- Multi-tenant support

## Troubleshooting

### Common Issues

1. **Payment Link Not Generating**
   - Check API keys in environment variables
   - Verify network connectivity
   - Review browser console for errors
   - Ensure all required fields are filled

2. **Notifications Not Sending**
   - Verify customer phone/email format
   - Check Razorpay account notification settings
   - Ensure notification permissions are enabled
   - Review API response for error details

3. **Callback Not Working**
   - Verify callback URL is accessible
   - Check domain configuration in Razorpay
   - Ensure route is properly configured
   - Test with different payment statuses

### Debug Mode
Enable debug logging by adding `VITE_DEBUG=true` to environment variables.

## Support

For technical support:
- Check Razorpay documentation: https://razorpay.com/docs/
- Review browser console for detailed error messages
- Contact development team with specific error details
- Use test mode for development and debugging 