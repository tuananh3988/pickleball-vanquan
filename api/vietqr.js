/**
 * Vercel Serverless Function: VietQR Image Proxy with CORS enabled
 */
module.exports = async (req, res) => {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url } = req.query;
    if (!url || !url.startsWith('https://img.vietqr.io/')) {
      return res.status(400).send('Invalid or missing image URL');
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('VietQR Proxy Error:', error);
    return res.status(500).send('Proxy internal error: ' + error.message);
  }
};
