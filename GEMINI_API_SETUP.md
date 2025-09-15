# Gemini API Setup Guide

## Getting Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Choose "Create API key in new project" or select an existing project
   - Copy the generated API key (it starts with `AIza...`)

3. **Configure in Your Application**
   - Open your invoice application at http://localhost:8081
   - Go to Settings page
   - Find the "AI Configuration" section
   - Paste your Gemini API key in the "Gemini API Key" field
   - Click "Save Settings"
   - Click "Test Connection" to verify it works

## Troubleshooting

### Connection Failed Error
If you see "Connection Failed" for Gemini API:

1. **Check API Key Format**
   - Ensure your key starts with `AIza`
   - Make sure there are no extra spaces
   - The key should be about 39 characters long

2. **Verify API Key Permissions**
   - Go back to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Make sure the API key is active
   - Check if there are any usage restrictions

3. **Check Network Connection**
   - Ensure you have internet connectivity
   - Check if your firewall allows connections to `generativelanguage.googleapis.com`

4. **API Quotas**
   - Gemini API has free tier limits
   - Check your usage at [Google Cloud Console](https://console.cloud.google.com/)

## API Key Security

⚠️ **Important Security Notes:**
- Never share your API key publicly
- Don't commit API keys to version control
- The application stores keys securely in Firebase/local storage
- You can regenerate your key anytime if compromised

## Free Tier Limits

- **Gemini Pro**: 60 requests per minute
- **Daily limit**: Varies by region
- **Rate limiting**: May cause temporary failures

For production use, consider upgrading to a paid plan.