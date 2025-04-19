const fetch = require('node-fetch');

const BACKEND_URL = "https://sproj-backend.onrender.com";

exports.handler = async (event, context) => {
  try {
    // Log incoming request
    console.log('Incoming request:', {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      query: event.queryStringParameters,
      body: event.body
    });

    // Extract the path after /api/
    const path = event.path.replace('/.netlify/functions/proxy/api/', '');
    const backendUrl = `${BACKEND_URL}/api/${path}`;

    // Prepare headers for backend request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add Authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }

    // Make request to backend
    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.body,
      credentials: 'include'
    });

    // Log backend response
    console.log('Backend response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Get response content type
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      console.log('Unexpected content type:', contentType);
    }

    // Log response data
    console.log('Response data:', data);

    // If backend returned an error, throw it
    if (response.status >= 400) {
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    // Return successful response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message,
        details: error.stack
      })
    };
  }
}; 