export function hasActiveSession() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
