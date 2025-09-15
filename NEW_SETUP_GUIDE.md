# New Simplified Setup Guide

## 🎯 **Easy-to-Use Notification System**

Your invoice management system has been redesigned to focus on **sending notifications easily**. Here's how to get started:

## 🚀 **Quick Start (3 Steps)**

### 1. **Configure API Keys**
- Go to **Settings** page (click "Settings" in the navigation)
- Add your API keys:
  - **GKP Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmNkNDUzNTNlZjhjOGNkNDViMmNjNDUiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNjQ3OTg2YTAwMzY5ZWIyYWY2NGJhNDA1IiwibmFtZSI6IkFhcnlhdmFydCBDZW50cmUgLUdvcmFraFB1ciJ9LCJpYXQiOjE3NTA4NTQyMDIsImV4cCI6MTc2NjQwNjIwMn0.Y_h4TPoVFmrBydu3bTRgDYg1Cwm7VgsJ0vxRGwhISQs`
  - **LKO Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmNkNDUzNTNlZjhjOGNkNDViMmNjNDUiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNjJjZDQ1ODczZWY4YzhjZDQ1YjJjYzUyIiwibmFtZSI6ImFhcnlhdmFydCBDZW50ZXIgRm9yIEF1dGlzbSBBbmQgU3BlY2lhbCBOZWVkcyBGb3VuZGF0aW9uIn0sImlhdCI6MTc1MTM3NTgyNywiZXhwIjoxNzY2OTI3ODI3fQ.GpKtSO6WxxSHnHyvWCZnxy3edA1Yo7jFFhVV9zMCanM`
  - **API URL**: `https://care.kidaura.in/api/graphql`
  - **Aisensy Key**: Your WhatsApp API key
- Click **"Save All Settings"**

### 2. **Select Centre & Load Data**
- Choose **GKP** or **Lucknow** from the dropdown
- Click **"Refresh"** to load parent data
- The system will show all parents with pending payments

### 3. **Send Notifications**
- **Select parents** using checkboxes (or "Select All")
- Click **"Send Notifications"**
- The system will:
  - Generate payment links automatically
  - Send WhatsApp messages via Aisensy API
  - Show sending status for each parent

## 🎨 **New Interface Features**

### **Main Dashboard**
- **Clean, focused design** for sending notifications
- **Parent list** with pending payment amounts
- **One-click selection** and bulk sending
- **Real-time status** updates during sending

### **Settings Page**
- **Organized tabs** for different API keys
- **Test connections** to verify API keys work
- **Secure storage** - keys saved locally in browser
- **Show/hide** API keys for security

### **Smart Features**
- **Auto-generates payment links** for each parent
- **Fallback to WhatsApp Web** if Aisensy API fails
- **Tracks sending status** for each notification
- **Filters and search** to find specific parents

## 🔧 **API Keys You Need**

### **Required Keys**
1. **GKP Token** - For Gorakhpur centre data
2. **LKO Token** - For Lucknow centre data  
3. **API URL** - Your GraphQL endpoint
4. **Aisensy Key** - For WhatsApp notifications

### **Optional Keys**
- **ChatGPT Key** - For AI features (future)
- **Gemini Key** - For AI features (future)
- **DeepSeek Key** - For AI features (future)

## 📱 **How Notifications Work**

### **WhatsApp Messages Include:**
- Parent name and child name
- Total pending amount
- Payment link (auto-generated)
- Due date (10 days from now)
- Centre information

### **Two Sending Methods:**
1. **Aisensy API** (preferred) - Official WhatsApp Business API
2. **WhatsApp Web** (fallback) - Opens individual chat windows

## 🎯 **Workflow Example**

1. **Open the app** → Dashboard loads
2. **Select centre** → GKP or Lucknow
3. **Click Refresh** → Loads parents with pending payments
4. **Select parents** → Check boxes for parents to notify
5. **Click Send** → System sends WhatsApp messages
6. **Monitor status** → See which messages were sent successfully

## 🔒 **Security Features**

- **API keys stored locally** in your browser
- **No keys sent to external servers** (except for API calls)
- **Show/hide functionality** for sensitive keys
- **Test connections** to verify keys work

## 🆘 **Troubleshooting**

### **"Configuration Required" Message**
- Go to Settings and add your API keys
- Make sure to save the settings

### **"Failed to fetch parent data"**
- Check your API keys are correct
- Test the connection using the test buttons
- Verify the API URL is accessible

### **WhatsApp messages not sending**
- Check your Aisensy API key
- Test the Aisensy connection
- System will fallback to WhatsApp Web if needed

## 🎉 **Benefits of New Design**

- **Faster setup** - Just add keys and start sending
- **Easier to use** - Focus on notification sending
- **Better organization** - Clear separation of settings and actions
- **More reliable** - Fallback options for sending
- **Real-time feedback** - See what's happening as you send

## 📞 **Support**

If you need help:
1. Check the **Settings** page for configuration issues
2. Use the **test buttons** to verify API connections
3. Check browser console for error messages
4. Ensure all required API keys are configured

---

**Ready to start sending notifications?** Just add your API keys in Settings and you're good to go! 🚀
