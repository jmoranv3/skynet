import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./PrivateLayout.css";

function PrivateLayout() {
  return (
    <div className="layout-container">
      <Sidebar />

      <main className="layout-content">
        <Outlet /> {/* Aquí se mostrarán las páginas: Dashboard, Clientes, etc. */}
      </main>
    </div>
  );
}

export default PrivateLayout;
