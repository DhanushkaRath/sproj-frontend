import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import serverless from 'serverless-http';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Backend URL configuration with fallback
const BACKEND_URL = process.env.BACKEND_URL || "https://sproj-backend.onrender.com";
console.log('Using backend URL:', BACKEND_URL);

// Create Express app
const app = express();

// Configure proxy
const proxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/.netlify/functions/proxy/api/': '/api/',
    '^/api/': '/api/'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request:', {
      method: req.method,
      path: req.path,
      target: `${BACKEND_URL}${req.path.replace(/^\/.netlify\/functions\/proxy\/api\//, '/api/').replace(/^\/api\//, '/api/')}`
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response:', {
      status: proxyRes.statusCode,
      path: req.path
    });
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Proxy error occurred',
      details: err.message
    });
  }
});

// Use proxy for all routes
app.use('/', proxy);

// Export handler for Netlify
export const handler = serverless(app);