export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`Test API called: ${req.method} at ${new Date().toISOString()}`);

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Test API is working!',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({
      message: 'Test API POST is working!',
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not supported`,
    allowedMethods: ['GET', 'POST']
  });
} 