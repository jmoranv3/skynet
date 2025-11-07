// Mapeo para convertir roles del backend a roles internos estándar
export const roleMap = {
  "ADMINISTRADOR": "ADMIN",
  "ADMIN": "ADMIN",
  "SUPERVISOR": "SUPERVISOR",
  "TÉCNICO": "TECNICO",  // si alguna vez viene con tilde
  "TECNICO": "TECNICO"
};

// Menús por rol interno estandarizado
const menuByRole = {
  ADMIN: [
    { name: "Inicio", icon: "🏠", path: "/dashboard" },
    { name: "Usuarios", icon: "👤", path: "/usuarios" },
    { name: "Clientes", icon: "📍", path: "/clientes" },
    { name: "Visitas", icon: "🗓️", path: "/visitas" },
    // { name: "Configuración", icon: "⚙️", path: "/configuracion" }
  ],

  SUPERVISOR: [
    { name: "Inicio", icon: "🏠", path: "/dashboard" },
    { name: "Clientes", icon: "📍", path: "/clientes" },
    { name: "Visitas", icon: "🗓️", path: "/visitas" }
  ],

  TECNICO: [
    { name: "Inicio", icon: "🏠", path: "/dashboard" },
    { name: "Clientes", icon: "📍", path: "/clientes" },
    { name: "Visitas", icon: "🗓️", path: "/visitas" }
  ],
};

export default menuByRole;
