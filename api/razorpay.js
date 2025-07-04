export default async function handler(req, res) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  // Get the path from the URL
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname.replace('/api/razorpay', '');

  // Construct the Razorpay API URL
  const razorpayUrl = `https://api.razorpay.com/v1${path}`;

  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Aaryavart-Invoice-App/1.0',
    };

    // Add Authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      requestOptions.body = JSON.stringify(req.body);
    }

    console.log(`Proxying ${req.method} ${path} to ${razorpayUrl}`);

    // Make request to Razorpay API
    const response = await fetch(razorpayUrl, requestOptions);
    
    // Get response data
    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log(`Response status: ${response.status}`);

    // Return the response
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Set CORS headers for error response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
} 