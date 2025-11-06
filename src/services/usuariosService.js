import { getSession } from "./apiService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://skynet-api-auth.onrender.com";

async function httpGet(path, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function httpPut(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Ya existen, pero por si acaso:
export async function getSupervisores() {
  return httpGet(`/api/usuarios/supervisores`);
}
export async function getTecnicos() {
  return httpGet(`/api/usuarios/tecnicos`);
}

// Nuevo: leer asignaciones del usuario
export async function getAsignacionesUsuario(id) {
  return httpGet(`/api/usuarios/${id}/asignaciones`);
}

// Nuevo: actualizar asignaciones (solo ADMIN)
export async function updateAsignacionesUsuario(id, payload) {
  const s = getSession();
  // Mandamos ambos headers por compatibilidad con tu backend
  const headers = {
    rol: s?.rol_codigo || "ADMIN",
    rol_nombre: s?.rol_nombre || "ADMINISTRADOR",
  };
  return httpPut(`/api/usuarios/${id}/asignaciones`, payload, headers);
}
