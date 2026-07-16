const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getQuizConfig() {
  return request("/api/quiz-config");
}

export function getProducts(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return request(`/api/products${query ? `?${query}` : ""}`);
}

export function getProduct(id) {
  return request(`/api/products/${id}`);
}

export function createRoutine(answers) {
  return request("/api/routines", {
    method: "POST",
    body: JSON.stringify(answers),
  });
}

export function getRoutine(slug) {
  return request(`/api/routines/${slug}`);
}
