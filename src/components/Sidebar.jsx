import { useState } from "react";
import { NavLink } from "react-router-dom";
import menuByRole, { roleMap } from "../config/menuConfig";
import "./Sidebar.css";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // Obtener usuario de sesión
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🔹 Normalizar rol (soporta string o {codigo, nombre})
  let userRole = "";

  if (typeof user.rol === "string") {
    userRole = user.rol.toUpperCase();
  } else if (user.rol && typeof user.rol === "object") {
    userRole = (user.rol.codigo || user.rol.nombre || "").toUpperCase();
  }

  const normalizedRole = roleMap[userRole] || "TECNICO";
  const menu = menuByRole[normalizedRole] || [];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <h2 className="logo">{collapsed ? "S" : "SkyNet"}</h2>

        <button className="collapse-btn" onClick={toggleSidebar}>
          {collapsed ? "🡆" : "🡄"}
        </button>
      </div>

      <ul className="menu-list">
        {menu.map((item, index) => (
          <li key={index}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? "menu-item active" : "menu-item"
              }
            >
              <span className="icon">{item.icon}</span>
              {!collapsed && <span className="label">{item.name}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        🔴 {!collapsed && "Cerrar Sesión"}
      </button>
    </aside>
  );
}

export default Sidebar;
