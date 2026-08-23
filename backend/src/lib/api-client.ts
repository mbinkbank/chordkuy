// Client-side API helper
const BASE = "";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message: string; pagination?: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });
  const json = await res.json();
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, formData: FormData) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      body: formData,
      credentials: "include",
    }).then((r) => r.json()) as Promise<{
      success: boolean;
      data: T;
      message: string;
    }>,
};
