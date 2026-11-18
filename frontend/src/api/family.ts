export async function familyRequest<T>(
  path = "",
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Войдите в аккаунт");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`http://localhost:3001/api/family${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error(data?.message || "Не удалось выполнить запрос");
  }

  return data as T;
}