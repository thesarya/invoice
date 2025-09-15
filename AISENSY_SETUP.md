# Aisensy WhatsApp Integration Setup

This document explains how to set up Aisensy for sending WhatsApp payment reminders to parents.

## Required Environment Variables

Add the following variables to your `.env` file:

```env
# Aisensy WhatsApp API configuration
VITE_AISENSY_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YWQ1ZTI0ZWY4Y2Q4MGM0YzA5ZTUyMiIsIm5hbWUiOiJBQVJZQVZBUlRDRU5UUkUgRk9SIEFVVElTTSBBTkQgU1BFQ0lBTCBORUVEUyBGT1VOREFUSU9OIiwiYXBwTmFtZSI6IkFpU2Vuc3kiLCJjbGllbnRJZCI6IjY4YWQ1ZTI0ZWY4Y2Q4MGM0YzA5ZTUxYyIsImFjdGl2ZVBsYW4iOiJGUkVFX0ZPUkVWRVIiLCJpYXQiOjE3NTYxOTIyOTJ9.AxQcj9S5p8QTlQeaxdh1lxeB3w2Fu6zeF28Uucupi8g
VITE_AISENSY_BASE_URL=https://backend.aisensy.com/campaign/t1/api
VITE_AISENSY_TEMPLATE_NAME=fees_payment_remind
```

**Note:** The system now automatically fetches the template ID from Aisensy API, so you don't need to manually find it!

## Setup Steps

### 1. Sign Up for Aisensy
- Visit [https://aisensy.com](https://aisensy.com)
- Create an account and set up a project for your business

### 2. Apply for WhatsApp Business API
- Within Aisensy, apply for the WhatsApp Business API
- Approval typically takes 10 minutes to 6 hours
- This enables official WhatsApp communications

### 3. Create WhatsApp Template Message
Create a template message for payment reminders with the following placeholders:

```
Dear {{parent_name}},

This is a payment reminder for {{child_name}}'s fees at {{centre_name}}.

💰 Amount: {{amount}}
📅 Due Date: {{due_date}}
🔗 Payment Link: {{payment_link}}

⚠️ IMPORTANT: Please make the payment before the due date to avoid any inconvenience.

Thank you for your cooperation.

Best regards,
{{centre_name}} Team
```

**Required Template Variables:**
- `{{parent_name}}` - Parent's name
- `{{child_name}}` - Child's name
- `{{amount}}` - Payment amount
- `{{due_date}}` - Payment due date
- `{{payment_link}}` - Razorpay payment link
- `{{centre_name}}` - Centre name (Aaryavart Centre for Autism)

### 4. Submit Template for Approval
- Submit your template message for approval
- Approval usually takes 15 minutes to 4 hours
- Once approved, note down the template ID

### 5. Get API Credentials
- Go to your Aisensy dashboard
- Navigate to API settings
- Copy your API key
- Update the `VITE_AISENSY_API_KEY` in your environment variables

### 6. Update Configuration
- Set `VITE_AISENSY_TEMPLATE_NAME` to match your template name (e.g., `fees_payment_remind`)
- The system will automatically fetch the template ID from Aisensy API
- No need to manually find or set the template ID!

## Features

### Automatic Template ID Fetching
- **No Manual Template ID Required**: The system automatically fetches your template ID from Aisensy API
- **Smart Template Matching**: Finds templates by name (case-insensitive, partial matching)
- **Caching**: Template ID is cached for better performance
- **Fallback Support**: If template not found, uses any approved template
- **Error Handling**: Graceful fallback to WhatsApp Web if API fails

### Bulk WhatsApp Reminders
- Send payment reminders to multiple parents at once
- Automatically generates Razorpay payment links
- Fetches invoice data for each parent
- Tracks sending status for each reminder

### Individual Reminders
- Send reminders to individual parents
- Same functionality as bulk, but for single parent

### Fallback Mode
- If Aisensy API is not configured, falls back to WhatsApp Web
- Opens individual WhatsApp chat windows
- Uses the same message template

## Usage

### In Active Parents Table
1. Select parents using checkboxes
2. Click "Send Payment Reminders" button
3. Choose between Aisensy API or WhatsApp Web
4. Monitor sending status in the dialog

### Individual Parent Reminders
1. Click "Reminder" button next to any parent
2. Follow the same process as bulk reminders

## Message Template

The system automatically:
- Fetches invoice data for selected parents
- Generates Razorpay payment links
- Calculates total amounts per child
- Sets due date (10th of next month)
- Sends personalized messages with all details

## Troubleshooting

### Common Issues
1. **API Key Not Working**: Verify your Aisensy API key is correct
2. **Template Not Found**: Ensure template ID matches your approved template
3. **Rate Limiting**: Aisensy has rate limits; the system adds delays between messages
4. **Phone Number Format**: System automatically formats phone numbers with +91 prefix

### Fallback Mode
If Aisensy integration fails:
- System automatically falls back to WhatsApp Web
- Opens individual chat windows for each parent
- Uses the same message content
- No API configuration required

## Support

For Aisensy-specific issues:
- Check Aisensy documentation
- Contact Aisensy support
- Verify your WhatsApp Business API status

For application issues:
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure Razorpay integration is working
