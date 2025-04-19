import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "https://sproj-backend.onrender.com";
const NODE_ENV = process.env.NODE_ENV || "production";
const FRONTEND_URL = "https://fed-storefront-frontend-dhanushka.netlify.app";

console.log('Proxy function environment:', {
  BACKEND_URL,
  NODE_ENV,
  FRONTEND_URL
});

// Common headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': FRONTEND_URL,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Vary': 'Origin'
};

export const handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Log incoming request
    console.log('Incoming request:', {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      query: event.queryStringParameters,
      body: event.body,
      origin: event.headers.origin || event.headers.Origin
    });

    // Extract the path after /api/
    let path = event.path;
    if (path.startsWith('/.netlify/functions/proxy/api/')) {
      path = path.replace('/.netlify/functions/proxy/api/', '');
    } else if (path.startsWith('/api/')) {
      path = path.replace('/api/', '');
    } else {
      path = path.replace('/.netlify/functions/proxy/', '');
    }

    const backendUrl = `${BACKEND_URL}/api/${path}`;

    console.log('Making request to backend:', {
      url: backendUrl,
      method: event.httpMethod,
      path,
      originalPath: event.path
    });

    // Prepare headers for backend request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': FRONTEND_URL
    };

    // Add Authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }

    // Make request to backend with timeout and retry logic
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    const timeout = 10000; // 10 second timeout

    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        console.log(`Attempt ${retryCount + 1} to fetch from backend:`, backendUrl);
        
        // Use a more direct approach to check if the backend is accessible
        if (retryCount === 0) {
          try {
            // First, try a simple HEAD request to check if the backend is accessible
            const headResponse = await fetch(backendUrl, {
              method: 'HEAD',
              headers: {
                'Accept': '*/*',
                'Origin': FRONTEND_URL
              },
              signal: controller.signal
            });
            
            console.log('HEAD request response:', {
              status: headResponse.status,
              statusText: headResponse.statusText,
              ok: headResponse.ok,
              headers: Object.fromEntries(headResponse.headers.entries())
            });
            
            if (!headResponse.ok) {
              console.error('HEAD request failed:', {
                status: headResponse.status,
                statusText: headResponse.statusText
              });
              
              // If the HEAD request fails, return a more specific error
              return {
                statusCode: headResponse.status || 500,
                headers: corsHeaders,
                body: JSON.stringify({
                  error: 'Backend unavailable',
                  status: headResponse.status,
                  message: headResponse.statusText || 'Backend server is not responding correctly',
                  details: 'The backend server returned an error status for a HEAD request'
                })
              };
            }
          } catch (headError) {
            console.error('HEAD request error:', headError);
            
            // If the HEAD request throws an error, return a more specific error
            return {
              statusCode: 503,
              headers: corsHeaders,
              body: JSON.stringify({
                error: 'Service Unavailable',
                message: 'Backend service is not accessible',
                details: headError.message || 'The backend server is not responding to HEAD requests'
              })
            };
          }
        }
        
        // If the HEAD request succeeds, proceed with the actual request
        response = await fetch(backendUrl, {
          method: event.httpMethod,
          headers: headers,
          body: event.body,
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // Log response status
        console.log(`Backend response status: ${response.status} ${response.statusText}`);
        
        // If we got a response, break the retry loop
        break;
      } catch (fetchError) {
        retryCount++;
        console.error(`Fetch attempt ${retryCount} failed:`, fetchError);
        
        if (retryCount === maxRetries) {
          console.error('All fetch attempts failed');
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Fetch error',
              message: fetchError.message,
              details: fetchError.stack,
              retryCount,
              backendUrl
            })
          };
        }
        
        // Wait before retrying (exponential backoff)
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${backoffTime}ms before retry ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    // Log backend response
    console.log('Backend response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Get response content type
    const contentType = response.headers.get('content-type');
    let data;

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        console.log('Unexpected content type:', contentType);
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Parse error',
          message: error.message,
          details: error.stack,
          contentType
        })
      };
    }

    // Log response data
    console.log('Response data:', data);

    // If backend returned an error, return it with proper status code
    if (response.status >= 400) {
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Backend error',
          status: response.status,
          message: data.message || response.statusText,
          details: data
        })
      };
    }

    // Return successful response
    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Proxy error',
        message: error.message,
        details: error.stack
      })
    };
  }
}; 