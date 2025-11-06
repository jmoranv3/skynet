
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://skynet-api-auth.onrender.com";

// Sesión normalizada (igual a como lo usas en apiService)
function getSession() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    const id_usuario = u.id_usuario ?? u.idUsuario ?? u.id ?? null;
    let rol_codigo = null, rol_nombre = null;

    if (u.rol && typeof u.rol === "object") {
      rol_codigo = u.rol.codigo || null;
      rol_nombre = u.rol.nombre || null;
    } else if (typeof u.rol === "string") {
      const up = u.rol.toUpperCase();
      if (["ADMIN", "SUP", "TEC"].includes(up)) {
        rol_codigo = up;
        rol_nombre = up === "ADMIN" ? "ADMINISTRADOR" : up === "SUP" ? "SUPERVISOR" : "TECNICO";
      } else {
        rol_nombre = up;
        rol_codigo = up === "ADMINISTRADOR" ? "ADMIN" : up === "SUPERVISOR" ? "SUP" : up === "TECNICO" ? "TEC" : up;
      }
    }
    return { id_usuario, rol_codigo, rol_nombre, usuario: u.usuario || "" };
  } catch { return null; }
}

async function httpGet(path, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function httpPost(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function httpPut(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function httpDelete(path, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Permisos por rol
export function canVisit(action) {
  const s = getSession();
  const role = s?.rol_codigo || "TEC";
  const map = {
    create: ["ADMIN", "SUP"],
    edit: ["ADMIN", "SUP"],
    delete: ["ADMIN", "SUP"],
    process: ["TEC"],
    read: ["ADMIN", "SUP", "TEC"],
  };
  return map[action]?.includes(role);
}

// Listado (el backend puede filtrar por rol con headers si lo deseas)
export async function getVisitas(params = {}) {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");

  const q = new URLSearchParams(params).toString();
  const path = q ? `/api/visitas?${q}` : `/api/visitas`;

  return httpGet(path, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
  });
}

// Crear
export async function createVisita(dto) {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  return httpPost(`/api/visitas`, dto, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
  });
}

// Actualizar
export async function updateVisita(id, dto) {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  return httpPut(`/api/visitas/${id}`, dto, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
  });
}

// Inactivar (baja lógica)
export async function inactivarVisita(id) {
  const s = getSession();
  if (!s) throw new Error("Sesión no encontrada");
  return httpDelete(`/api/visitas/${id}`, {
    rol: s.rol_codigo || "ADMIN",
    id_usuario: String(s.id_usuario || "1"),
  });
}



export async function processVisita(id_visita, payload) {
  // payload: { nuevo_estado, observaciones, usar_planificadas, coordenadas_nuevas? }
  const s = getSession();
  const res = await fetch(`${BASE_URL}/api/visitas/${id_visita}/procesar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // cabezales si los necesitas p/ auditoría:
      rol: s?.rol_codigo || "ADMIN",
      id_usuario: String(s?.id_usuario ?? ""),
      usuario: s?.usuario || ""
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
