import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Backend URL configuration with fallback and validation
const BACKEND_URL = process.env.BACKEND_URL || "https://sproj-backend.onrender.com";
console.log('Using backend URL:', BACKEND_URL);

// Validate backend URL format
try {
  new URL(BACKEND_URL);
} catch (error) {
  console.error('Invalid backend URL:', BACKEND_URL);
  throw new Error('Invalid backend URL configuration');
}

const NODE_ENV = process.env.NODE_ENV || "production";
const FRONTEND_URL = "https://fed-storefront-frontend-dhanushka.netlify.app";

// Log environment configuration
console.log('Proxy function environment:', {
  BACKEND_URL,
  NODE_ENV,
  FRONTEND_URL
});

// Common headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // Allow all origins for now
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept, Cookie',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Vary': 'Origin'
};

// Function to check backend health
async function checkBackendHealth() {
  try {
    // Use the products endpoint for health check since /api/health doesn't exist
    const healthUrl = `${BACKEND_URL}/api/products`;
    console.log('Checking backend health endpoint:', healthUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
    
    const healthResponse = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Origin': FRONTEND_URL,
        'User-Agent': 'Netlify-Proxy-Health-Check'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Backend health check response:', {
      status: healthResponse.status,
      statusText: healthResponse.statusText,
      ok: healthResponse.ok,
      headers: Object.fromEntries(healthResponse.headers.entries())
    });

    if (!healthResponse.ok) {
      // If the service is starting up, wait a bit and retry
      if (healthResponse.status === 503) {
        console.log('Backend service might be starting up, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await checkBackendHealth();
      }
    }

    return healthResponse.ok;
  } catch (error) {
    console.error('Backend health check failed:', {
      error: error.message,
      type: error.name,
      code: error.code,
      url: BACKEND_URL
    });
    return false;
  }
}

export const handler = async (event, context) => {
  // Log environment and request details
  console.log('Function invocation:', {
    functionId: context.functionID,
    requestId: event.requestContext?.requestId,
    timestamp: new Date().toISOString(),
    backendUrl: BACKEND_URL,
    path: event.path,
    method: event.httpMethod,
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
    // Check backend health first with detailed logging
    console.log('Starting backend health check...');
    const isBackendHealthy = await checkBackendHealth();
    console.log('Backend health check result:', isBackendHealthy);

    if (!isBackendHealthy) {
      console.error('Backend is not healthy, returning 503');
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Service Unavailable',
          message: 'Backend service is not accessible',
          details: 'The backend service might be in a cold start state. Please try again in a few moments.',
          backendUrl: BACKEND_URL
        })
      };
    }

    // Log incoming request
    console.log('Incoming request:', {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
      query: event.queryStringParameters,
      body: event.body,
      origin: event.headers.origin || event.headers.Origin,
      cookies: event.headers.cookie
    });

    // Extract the path after /api/
    let path = event.path;
    if (path.startsWith('/.netlify/functions/proxy/api/')) {
      path = path.replace('/.netlify/functions/proxy/api/', '');
    } else if (path.startsWith('/api/')) {
      path = path.replace('/api/', '');
    } else if (path.startsWith('/.netlify/functions/proxy/')) {
      path = path.replace('/.netlify/functions/proxy/', '');
    }

    // Ensure path doesn't start with a slash
    path = path.replace(/^\/+/, '');

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
      'Origin': FRONTEND_URL,
      'User-Agent': 'Netlify-Proxy'
    };

    // Add Authorization header if present
    if (event.headers.authorization) {
      headers['Authorization'] = event.headers.authorization;
    }

    // Add Cookie header if present
    if (event.headers.cookie) {
      headers['Cookie'] = event.headers.cookie;
    }

    // Make request to backend with timeout and retry logic
    let response;
    let retryCount = 0;
    const maxRetries = 2; // Reduce max retries to avoid timeouts
    const timeout = 8000; // 8 second timeout to avoid Netlify function timeout

    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        console.log(`Attempt ${retryCount + 1} to fetch from backend:`, {
          url: backendUrl,
          method: event.httpMethod,
          headers: headers
        });
        
        response = await fetch(backendUrl, {
          method: event.httpMethod,
          headers: headers,
          body: event.body,
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // Log response status
        console.log(`Backend response status:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // If we got a non-503 response, break the retry loop
        if (response.status !== 503) {
          break;
        }
        
        // If we got a 503, wait and retry
        retryCount++;
        if (retryCount < maxRetries) {
          const backoffTime = Math.pow(2, retryCount) * 1000;
          console.log(`Got 503, waiting ${backoffTime}ms before retry ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      } catch (fetchError) {
        retryCount++;
        console.error(`Fetch attempt ${retryCount} failed:`, {
          error: fetchError.message,
          type: fetchError.name,
          code: fetchError.code,
          url: backendUrl
        });
        
        if (retryCount === maxRetries) {
          console.error('All fetch attempts failed');
          return {
            statusCode: 502,
            headers: corsHeaders,
            body: JSON.stringify({
              error: 'Bad Gateway',
              message: 'Unable to connect to backend service',
              details: 'The backend service is not responding. It might be in a cold start state.',
              error: fetchError.message,
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
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Gateway',
          message: 'Error parsing backend response',
          details: error.message,
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
    console.error('Proxy error:', {
      error: error.message,
      stack: error.stack,
      type: error.name,
      code: error.code,
      url: BACKEND_URL
    });

    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Bad Gateway',
        message: 'Proxy error occurred',
        details: 'An unexpected error occurred while trying to reach the backend service.',
        error: error.message,
        type: error.name,
        code: error.code,
        backendUrl: BACKEND_URL,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 