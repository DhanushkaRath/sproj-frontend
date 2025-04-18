const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const path = event.path.replace('/.netlify/functions/proxy', '');
  const backendUrl = `https://fed-storefront-backend-dhanushka.onrender.com${path}`;
  
  try {
    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers: {
        ...event.headers,
        'Content-Type': 'application/json',
      },
      body: event.body,
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': 'https://fed-storefront-frontend-dhanushka.netlify.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from backend' }),
    };
  }
}; 