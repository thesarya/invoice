export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(302).setHeader('Location', 'https://www.aaryavart.org/').end();
} 