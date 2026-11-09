// Python FastAPI Authentication Client
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiRegister = async (studentData) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || data.message || "Registration failed");
        }
        return data;
    } catch (err) {
        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('fetch')) {
            throw new Error("SERVER_OFFLINE");
        }
        throw err;
    }
};

export const apiLogin = async (credentials) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                confirmPassword: credentials.confirmPassword,
                rememberMe: Boolean(credentials.rememberMe)
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || data.message || "Invalid email or password");
        }
        return data;
    } catch (err) {
        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('fetch')) {
            throw new Error("SERVER_OFFLINE");
        }
        throw err;
    }
};

export const apiForgotPassword = async (email) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || data.message || "Failed to send reset link");
        }
        return data;
    } catch (err) {
        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('fetch')) {
            throw new Error("SERVER_OFFLINE");
        }
        throw err;
    }
};

export const apiResetPassword = async (resetData) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resetData),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || data.message || "Failed to reset password");
        }
        return data;
    } catch (err) {
        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('fetch')) {
            throw new Error("SERVER_OFFLINE");
        }
        throw err;
    }
};
