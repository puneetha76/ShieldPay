// frontend/src/api/client.js
const BASE_URL = import.meta.env.VITE_API_URL || "https://shieldpay-backend-xa7r.onrender.com";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      detail: res.statusText,
    }));

    throw new Error(err.detail || `API error ${res.status}`);
  }

  return res.json();
}

export const checkHealth = () => request("/health");

export const predictTransaction = (t) =>
  request("/predict", {
    method: "POST",
    body: JSON.stringify(t),
  });

export const getHistory = (limit = 50, fraudOnly = false) =>
  request(`/history?limit=${limit}&fraud_only=${fraudOnly}`);

export const getStats = () => request("/stats");

export const batchPredict = (file, threshold = 0.5) => {
  const form = new FormData();
  form.append("file", file);

  return fetch(`${BASE_URL}/batch-predict?threshold=${threshold}`, {
    method: "POST",
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({
        detail: res.statusText,
      }));

      throw new Error(err.detail);
    }

    return res.json();
  });
};