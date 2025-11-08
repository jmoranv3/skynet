// src/services/apiService.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://skynet-api-auth.onrender.com";

// Normaliza el objeto user guardado en localStorage (soporta respuestas antiguas o nuevas)
export function getSession() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const u = JSON.parse(raw);

    // Normalizar ID
    let id_usuario =
      u.id_usuario ?? u.idUsuario ?? u.id ?? null;

    if (typeof id_usuario === "string") {
      const parsed = parseInt(id_usuario);
      id_usuario = isNaN(parsed) ? null : parsed;
    }

    // Normalizar Rol
    let rol_codigo = null;
    let rol_nombre = null;

    if (u.rol && typeof u.rol === "object") {
      rol_codigo = u.rol.codigo || null;
      rol_nombre = u.rol.nombre || null;
    } else if (typeof u.rol === "string") {
      const up = u.rol.toUpperCase();
      if (["ADMIN", "SUP", "TEC"].includes(up)) {
        rol_codigo = up;
        rol_nombre =
          up === "ADMIN"
            ? "ADMINISTRADOR"
            : up === "SUP"
            ? "SUPERVISOR"
            : "TECNICO";
      } else {
        rol_nombre = up;
        rol_codigo =
          up === "ADMINISTRADOR"
            ? "ADMIN"
            : up === "SUPERVISOR"
            ? "SUP"
            : up === "TECNICO"
            ? "TEC"
            : up;
      }
    }

    // Normalizar usuario (username)
    const usuario = u.usuario || u.username || u.user || "";

    return { id_usuario, rol_codigo, rol_nombre, usuario };

  } catch {
    return null;
  }
}

async function httpGet(path, headers = {}) {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });

  if (!res.ok) {
    let txt = "";
    try { txt = await res.text(); } catch {}
    throw new Error(txt || `Error ${res.status} al llamar: ${url}`);
  }
  return res.json();
}

export async function getClientes() {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  // Este endpoint espera rol NOMBRE (ADMINISTRADOR/SUPERVISOR/TECNICO)
  return httpGet(`/api/clientes`, { rol: s.rol_nombre || "ADMINISTRADOR" });
}

// KPIs: estos headers requieren rol CÓDIGO y id_usuario
// KPIs: envía rol, id_usuario y usuario
export async function getKpiProgramadas() {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  return httpGet(`/api/dashboard/visitas/programadas`, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
    usuario: s.usuario || ""
  });
}

export async function getKpiCompletadas() {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  return httpGet(`/api/dashboard/visitas/completadas`, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
    usuario: s.usuario || ""
  });
}

export async function getKpiPendientes() {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  return httpGet(`/api/dashboard/visitas/pendientes`, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
    usuario: s.usuario || ""
  });
}
