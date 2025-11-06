import API_BASE_URL from "../config/apiConfig";

export async function login(usuario, clave) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, clave }),
  });

  return response;
}
