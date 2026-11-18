import axios from 'axios';

// Base URL for API calls. In development you can point it to the local PHP server:
//   VITE_API_URL=http://localhost:8000
// In production (Netlify) you can set VITE_API_URL to the remote API host or leave it empty
// and use Netlify Function redirects (see netlify.toml).
const base = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    // When VITE_API_URL is set we call the full URL (e.g. http://localhost:8000/auth/...)
    // When it is empty we fall back to a relative path (e.g. /api/auth/...), which works
    // with the redirects we added for Netlify Functions.
    baseURL: `${base}`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;


import axios from 'axios';

// Base URL for API calls. In development you can point it to the local PHP server:
//   VITE_API_URL=http://localhost:8000
// In production (Netlify) you can set VITE_API_URL to the remote API host or leave it empty
// and use Netlify Function redirects (see netlify.toml).
const base = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    // When VITE_API_URL is set we call the full URL (e.g. http://localhost:8000/auth/...)
    // When it is empty we fall back to a relative path (e.g. /api/auth/...), which works
    // with the redirects we added for Netlify Functions.
    baseURL: `${base}`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;


// Base URL can be supplied via Vite env variable (VITE_API_URL). For local development
// you might run the PHP backend on localhost:8000, otherwise leave it empty to use a
// relative path (which works when Netlify redirects /api/* to Netlify Functions or a
// separate host).
const base = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${base}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;

    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
