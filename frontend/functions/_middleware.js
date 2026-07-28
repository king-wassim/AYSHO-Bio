// Cloudflare Pages Functions - Advanced routing and API proxy
// This file enables API proxying and custom routing

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // API proxy to backend
  if (url.pathname.startsWith('/api/')) {
    const apiUrl = new URL(request.url);
    apiUrl.hostname = env.STRAPI_API_HOST || 'api.aysho.tn';
    apiUrl.protocol = 'https:';
    
    const apiRequest = new Request(apiUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    const response = await fetch(apiRequest);
    
    // Add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', env.FRONTEND_URL || 'https://aysho.pages.dev');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': env.FRONTEND_URL || 'https://aysho.pages.dev',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return next();
}