// src/services/clientesService.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://skynet-api-auth.onrender.com";

// Normaliza la sesión (igual que en apiService.js para usar rol y id)
function getSession() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);

    const id_usuario = u.id_usuario ?? u.idUsuario ?? u.id ?? null;
    let rol_codigo = null;
    let rol_nombre = null;

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

    return { id_usuario, rol_codigo, rol_nombre, usuario: u.usuario || u.username || "" };
  } catch {
    return null;
  }
}

async function http(method, path, body) {
  const s = getSession();
  const headers = {
    "Content-Type": "application/json",
    // GET /api/clientes espera rol NOMBRE
    rol: s?.rol_nombre || "ADMINISTRADOR",
    id_usuario: s?.id_usuario ? String(s.id_usuario) : ""
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Error ${res.status}`);
  }
  return res.json();
}

export function getClientes() {
  return http("GET", "/api/clientes");
}

export function createCliente(dto) {
  // { nombre, nit, direccion, coordenadas, correo }
  return http("POST", "/api/clientes", dto);
}

export function updateCliente(id, dto) {
  return http("PUT", `/api/clientes/${id}`, dto);
}

export function inactivarCliente(id) {
  return http("DELETE", `/api/clientes/${id}`);
}

export function can(action) {
  // action: 'create'|'edit'|'delete'|'view'
  const s = getSession();
  const rol = s?.rol_nombre || "TECNICO";
  if (action === "view") return true;
  if (action === "create" || action === "edit") return rol === "ADMINISTRADOR" || rol === "SUPERVISOR";
  if (action === "delete") return rol === "ADMINISTRADOR";
  return false;
}
