// Vercel serverless function for Razorpay payment links API
export default async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`Payment Links API called: ${req.method} at ${new Date().toISOString()}`);

  // Check if method is supported
  const supportedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!supportedMethods.includes(req.method)) {
    console.log(`Method ${req.method} not allowed`);
    return res.status(405).json({ 
      error: 'Method Not Allowed', 
      message: `Method ${req.method} is not supported`,
      allowedMethods: supportedMethods
    });
  }

  // Construct the Razorpay API URL
  const razorpayUrl = 'https://api.razorpay.com/v1/payment_links';

  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Aaryavart-Invoice-App/1.0',
    };

    // Add Authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
      console.log('Authorization header present');
    } else {
      console.log('No Authorization header found');
    }

    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      requestOptions.body = JSON.stringify(req.body);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }

    console.log(`Proxying ${req.method} request to: ${razorpayUrl}`);

    // Make request to Razorpay API
    const response = await fetch(razorpayUrl, requestOptions);
    
    console.log(`Razorpay response status: ${response.status}`);

    // Get response data
    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error(`Invalid JSON response from Razorpay: ${responseText}`);
    }

    console.log(`Returning response with status: ${response.status}`);

    // Return the response
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    
    res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message,
      details: error.stack
    });
  }
} 