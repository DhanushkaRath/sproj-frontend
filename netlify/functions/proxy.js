const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Log the incoming request
  console.log('Incoming request:', {
    path: event.path,
    method: event.httpMethod,
    headers: event.headers,
    query: event.queryStringParameters,
    body: event.body
  });

  try {
    // Extract the path after /api/
    const path = event.path.replace('/.netlify/functions/proxy/api', '');
    const backendUrl = `https://fed-storefront-backend-dhanushka.onrender.com/api${path}`;
    
    console.log('Proxying to backend:', backendUrl);

    // Prepare headers for the backend request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://fed-storefront-frontend-dhanushka.netlify.app'
    };

    // Add Authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }

    // Make the request to the backend
    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.body
    });

    // Log the response details
    console.log('Backend response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers.raw(),
      url: response.url
    });

    // Get the content type
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    // Handle the response based on content type
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Unexpected content type:', {
        contentType,
        responseText: text,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    // Return the successful response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://fed-storefront-frontend-dhanushka.netlify.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // Log the error with more details
    console.error('Proxy error:', {
      message: error.message,
      stack: error.stack,
      path: event.path,
      method: event.httpMethod,
      url: `https://fed-storefront-backend-dhanushka.onrender.com/api${event.path.replace('/.netlify/functions/proxy/api', '')}`
    });

    // Return an error response with more details
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://fed-storefront-frontend-dhanushka.netlify.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch data from backend',
        details: error.message,
        path: event.path,
        method: event.httpMethod,
        timestamp: new Date().toISOString()
      }),
    };
  }
}; 