// import axios from "axios";
// const api = axios.create({
//     baseURL: import.meta.env.VITE_API_BASE_URL,
//     headers: {
//         "Content-Type": "application/json"
//     }
// });

// export default api;

import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    // Nginx strips the first /api from the URL. The Spring Boot controllers 
    // are inconsistently mapped: most admin/student routes are mapped to /api/admin/... 
    // and /api/student/..., BUT /student/resume-match is missing the /api prefix!
    if (config.url) {
        if (config.url.startsWith('/admin/') ||
            config.url.startsWith('/ai/') ||
            config.url.startsWith('/public/') ||
            config.url.startsWith('/auth/') ||
            (config.url.startsWith('/student/') && !config.url.includes('resume-match'))) {
            config.url = `/api${config.url}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config || config._retryCount >= 2) {
            return Promise.reject(error);
        }

        const isNetworkError = !error.response;
        const isServerError = error.response && error.response.status >= 500;

        if (isNetworkError || isServerError) {
            config._retryCount = (config._retryCount || 0) + 1;
            await new Promise((resolve) => setTimeout(resolve, 600));
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;


// import.meta.env.VITE_API_BASE_URL
