/**
 * Vercel Web Analytics Initialization
 * 
 * This script initializes Vercel Web Analytics for the application.
 * It uses the @vercel/analytics package to track page views and custom events.
 */

import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1/+esm';

// Initialize Vercel Analytics
inject({
  mode: 'auto', // Automatically detect environment (production/development)
  debug: false  // Set to true for debugging in development
});
