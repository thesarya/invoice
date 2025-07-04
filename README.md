# Invoice Management System with Razorpay Integration

A modern invoice management system built with React, TypeScript, and Tailwind CSS, featuring Razorpay payment gateway integration for seamless payment processing.

## Features

- 📊 **Dashboard Analytics**: Comprehensive charts and statistics for revenue tracking
- 🧾 **Invoice Management**: View and manage invoices from multiple centers (GKP & LKO)
- 💳 **Payment Links**: Generate Razorpay payment links with advanced customization
- 🔔 **Reminder System**: Automated SMS and email reminders for pending payments
- ✏️ **Link Editing**: Edit payment links before and after creation
- 📱 **Responsive Design**: Modern UI that works on all devices
- 🔄 **Real-time Updates**: Live data synchronization

## Payment Gateway Features

### Razorpay Integration
- **UPI Payment Links**: Generate UPI-enabled payment links
- **Customizable Settings**: Configure amount, expiry, notifications
- **Reminder System**: Automated payment reminders via SMS and email
- **Link Management**: Edit, resend notifications, and track payment status
- **Callback Handling**: Process payment responses and show status

### Payment Link Capabilities
- ✅ Create payment links with customer details
- ✅ Set custom expiry periods (1-365 days)
- ✅ Enable/disable SMS and email notifications
- ✅ Configure payment reminders
- ✅ Edit payment link details after creation
- ✅ Resend notifications manually
- ✅ Copy payment links to clipboard
- ✅ Track payment status in real-time

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Shadcn/ui, Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Payment Gateway**: Razorpay API
- **Charts**: Recharts
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Razorpay account with API keys

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL=https://care.kidaura.in/api/graphql
   
   # Authentication Tokens
   VITE_GKP_TOKEN=your_gkp_token_here
   VITE_LKO_TOKEN=your_lko_token_here
   
   # Razorpay Configuration
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   ```

4. **Get Razorpay API Keys**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Go to Settings → API Keys
   - Generate a new key pair
   - Copy the Key ID and Key Secret to your `.env` file

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Usage

### Generating Payment Links

1. **Navigate to the dashboard** and select an invoice
2. **Click "Pay Link"** button next to the invoice
3. **Fill in customer details**:
   - Customer name (required)
   - Phone number (required, 10 digits)
   - Email address (required)
4. **Configure payment settings**:
   - Amount (auto-filled from invoice)
   - Description
   - Expiry period (default: 7 days)
   - Enable/disable reminders
   - SMS and email notifications
5. **Generate the payment link**
6. **Share the link** with customers via SMS, email, or WhatsApp

### Managing Payment Links

After creating a payment link, you can:

- **Edit the link**: Modify amount, expiry, customer details
- **Resend notifications**: Send SMS or email reminders
- **Copy link**: Copy to clipboard for sharing
- **Open link**: Preview the payment page
- **Track status**: Monitor payment completion

### Payment Callback

The system automatically handles payment responses:
- **Success**: Shows payment confirmation with receipt
- **Failed**: Displays error message with support contact
- **Pending**: Shows processing status
- **Expired**: Indicates link expiration

## API Integration

### Razorpay API Endpoints Used

- `POST /v1/payment_links` - Create payment link
- `PATCH /v1/payment_links/:id` - Update payment link
- `POST /v1/payment_links/:id/notify_by/:medium` - Resend notifications
- `GET /v1/payment_links/:id` - Fetch payment link details
- `POST /v1/payment_links/:id/cancel` - Cancel payment link

### Payment Link Parameters

```typescript
{
  upi_link: true,
  amount: 1000, // in paise (₹10.00)
  currency: "INR",
  accept_partial: false,
  expire_by: 1691097057, // Unix timestamp
  reference_id: "INV001",
  description: "Payment for invoice #INV001",
  customer: {
    name: "John Doe",
    contact: "+919876543210",
    email: "john@example.com"
  },
  notify: {
    sms: true,
    email: true
  },
  reminder_enable: true,
  notes: {
    invoice_id: "123",
    policy_name: "Kidaura Care"
  },
  callback_url: "https://yourdomain.com/payment-callback",
  callback_method: "get"
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | GraphQL API endpoint | Yes |
| `VITE_GKP_TOKEN` | GKP center authentication token | Yes |
| `VITE_LKO_TOKEN` | LKO center authentication token | Yes |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID | Yes |
| `VITE_RAZORPAY_KEY_SECRET` | Razorpay Secret Key | Yes |

## Security Considerations

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use `.env` files for sensitive data
- **HTTPS**: Always use HTTPS in production
- **Input Validation**: All user inputs are validated
- **Error Handling**: Comprehensive error handling for API calls

## Troubleshooting

### Common Issues

1. **Payment link not generating**
   - Check Razorpay API keys in `.env`
   - Verify network connectivity
   - Check browser console for errors

2. **Notifications not sending**
   - Ensure customer phone/email is valid
   - Check Razorpay account settings
   - Verify notification permissions

3. **Callback not working**
   - Ensure callback URL is accessible
   - Check domain configuration in Razorpay
   - Verify route is properly configured

### Debug Mode

Enable debug logging by adding to `.env`:
```env
VITE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check Razorpay documentation: [https://razorpay.com/docs/](https://razorpay.com/docs/)
