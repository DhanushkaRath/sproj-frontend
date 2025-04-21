import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Backend URL configuration with fallback
const BACKEND_URL = process.env.BACKEND_URL || "https://sproj-backend.onrender.com";
console.log('Using backend URL:', BACKEND_URL);

// Common headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept, Cookie',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

export const handler = async (event, context) => {
  console.log('Products proxy function invocation:', {
    functionId: context.functionID,
    requestId: event.requestContext?.requestId,
    timestamp: new Date().toISOString(),
    path: event.path,
    method: event.httpMethod,
    userAgent: event.headers['user-agent'],
    headers: event.headers
  });

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Extract the path after /api/
    let path = event.path;
    if (path.startsWith('/.netlify/functions/products-proxy/api/')) {
      path = path.replace('/.netlify/functions/products-proxy/api/', '');
    } else if (path.startsWith('/api/')) {
      path = path.replace('/api/', '');
    }

    // Ensure path doesn't start with a slash
    path = path.replace(/^\/+/, '');

    const backendUrl = `${BACKEND_URL}/api/${path}`;
    console.log('Making request to backend:', backendUrl);

    // Prepare headers for backend request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': event.headers['user-agent'] || 'Netlify-Products-Proxy'
    };

    // Add Authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }

    // Add Cookie header if present
    if (event.headers.cookie) {
      headers['Cookie'] = event.headers.cookie;
    }

    // Add Origin header if present
    if (event.headers.origin) {
      headers['Origin'] = event.headers.origin;
    }

    // Add Referer header if present
    if (event.headers.referer) {
      headers['Referer'] = event.headers.referer;
    }

    // Make request to backend with a simple timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(backendUrl, {
      method: event.httpMethod,
      headers: headers,
      body: event.body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    // Get response content
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response
    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Products proxy error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', error.name);
    console.error('Error code:', error.code);
    
    // Try to get more information about the error
    let errorDetails = error.message;
    if (error.cause) {
      errorDetails += `\nCause: ${error.cause}`;
    }
    if (error.code) {
      errorDetails += `\nCode: ${error.code}`;
    }
    
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Bad Gateway',
        message: 'Products proxy error occurred',
        details: errorDetails,
        timestamp: new Date().toISOString(),
        path: event.path,
        backendUrl: `${BACKEND_URL}/api/${event.path.replace(/^\/+/, '')}`
      })
    };
  }
}; 