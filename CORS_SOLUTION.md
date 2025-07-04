# CORS Solution for Razorpay Integration

## Problem
The browser blocks direct API calls to Razorpay due to CORS (Cross-Origin Resource Sharing) policy. This is a security feature that prevents frontend applications from making requests to external domains.

## Solution Implemented

We've implemented a **proxy-based solution** that works in both development and production environments.

### 1. Development Environment (Vite Proxy)

**How it works:**
- Vite development server acts as a proxy
- Frontend requests go to `/api/razorpay/*`
- Vite forwards these to `https://api.razorpay.com/v1/*`
- CORS headers are handled automatically

**Configuration:**
```javascript
// vite.config.ts
server: {
  proxy: {
    '/api/razorpay': {
      target: 'https://api.razorpay.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/razorpay/, '/v1'),
    },
  },
}
```

### 2. Production Environment (Express Proxy Server)

**How it works:**
- Dedicated Express server handles Razorpay API calls
- Frontend communicates with proxy server
- Proxy server forwards requests to Razorpay
- CORS headers are properly configured

**Files:**
- `server/proxy.js` - Express proxy server
- `server/package.json` - Proxy server dependencies

## Setup Instructions

### Option 1: Development Only (Recommended for Testing)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```env
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test payment links:**
   - The Vite proxy will handle CORS automatically
   - No additional setup required

### Option 2: Full Setup (Development + Production)

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install proxy server dependencies:**
   ```bash
   npm run proxy:install
   ```

3. **Set up environment variables:**
   ```env
   # Frontend (.env)
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   
   # Proxy server (server/.env)
   PORT=3001
   FRONTEND_URL=http://localhost:8080
   ```

4. **Start both servers:**
   ```bash
   npm run dev:full
   ```

   This will start:
   - Frontend on `http://localhost:8080`
   - Proxy server on `http://localhost:3001`

## How the Proxy Works

### Request Flow

1. **Frontend makes request:**
   ```javascript
   fetch('/api/razorpay/payment_links', {
     method: 'POST',
     headers: {
       'Authorization': 'Basic ' + btoa(keyId + ':' + keySecret),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(paymentData)
   })
   ```

2. **Development (Vite Proxy):**
   - Request goes to `http://localhost:8080/api/razorpay/payment_links`
   - Vite forwards to `https://api.razorpay.com/v1/payment_links`
   - Response is returned to frontend

3. **Production (Express Proxy):**
   - Request goes to `http://your-domain.com/api/razorpay/payment_links`
   - Express server forwards to `https://api.razorpay.com/v1/payment_links`
   - Response is returned to frontend

### CORS Headers

The proxy automatically adds necessary CORS headers:
```
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Production Deployment

### Option 1: Separate Proxy Server

1. **Deploy proxy server:**
   ```bash
   cd server
   npm install --production
   npm start
   ```

2. **Update frontend configuration:**
   ```javascript
   // In production, update the baseUrl in razorpay.ts
   this.baseUrl = 'https://your-proxy-domain.com/api/razorpay';
   ```

3. **Set environment variables:**
   ```env
   PORT=3001
   FRONTEND_URL=https://your-frontend-domain.com
   ```

### Option 2: Same Domain (Recommended)

1. **Configure reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # API proxy
       location /api/razorpay/ {
           proxy_pass http://localhost:3001/api/razorpay/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Deploy both frontend and proxy:**
   - Frontend: Static files served by nginx
   - Proxy: Node.js process running on port 3001

## Testing

### Test the Proxy

1. **Health check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test Razorpay API:**
   ```bash
   curl -X GET http://localhost:3001/api/razorpay/payment_links \
     -H "Authorization: Basic $(echo -n 'your_key_id:your_secret' | base64)"
   ```

### Test Payment Link Creation

1. **Start the application:**
   ```bash
   npm run dev:full
   ```

2. **Create a payment link:**
   - Navigate to an invoice
   - Click "Pay Link"
   - Fill in test customer details
   - Generate payment link

3. **Check browser console:**
   - No CORS errors should appear
   - API calls should succeed

## Troubleshooting

### Common Issues

1. **Proxy server not starting:**
   ```bash
   # Check if port is in use
   lsof -i :3001
   
   # Kill process if needed
   kill -9 <PID>
   ```

2. **CORS still showing:**
   - Ensure you're using the proxy URL (`/api/razorpay`)
   - Check that the proxy server is running
   - Verify environment variables are set

3. **Authentication errors:**
   - Check Razorpay API keys
   - Verify key format and encoding
   - Test with Razorpay dashboard

### Debug Mode

Enable debug logging:
```javascript
// In razorpay.ts
console.log('Base URL:', this.baseUrl);
console.log('Making request to:', `${this.baseUrl}/payment_links`);
```

## Security Considerations

1. **API Keys:**
   - Never expose API keys in frontend code
   - Use environment variables
   - Rotate keys regularly

2. **Proxy Security:**
   - Limit proxy to specific endpoints
   - Add rate limiting
   - Implement request validation

3. **CORS Configuration:**
   - Restrict origins to your domain
   - Use HTTPS in production
   - Validate request headers

## Alternative Solutions

### 1. Backend API
Create a full backend API that handles Razorpay calls:
```javascript
// POST /api/payment-links
app.post('/api/payment-links', async (req, res) => {
  // Handle Razorpay API call
  // Return response to frontend
});
```

### 2. Serverless Functions
Use serverless functions (Vercel, Netlify, AWS Lambda):
```javascript
// api/create-payment-link.js
export default async function handler(req, res) {
  // Handle Razorpay API call
  // Return response
}
```

### 3. CORS Proxy Service
Use a third-party CORS proxy (not recommended for production):
```javascript
const response = await fetch('https://cors-anywhere.herokuapp.com/https://api.razorpay.com/v1/payment_links', {
  // ... request config
});
```

## Conclusion

The proxy solution provides:
- ✅ CORS-free development
- ✅ Production-ready deployment
- ✅ Secure API key handling
- ✅ Easy testing and debugging
- ✅ Scalable architecture

Choose the setup that best fits your deployment strategy and requirements. 