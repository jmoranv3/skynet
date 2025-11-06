import { useEffect, useState, useMemo } from "react";
import KpiCard from "../components/KpiCard";
import MapModal from "../components/MapModal";
import {
  getVisitasProgramadas,
  getVisitasCompletadas,
  getVisitasPendientes,
} from "../services/dashboardService";
import { getClientes } from "../services/apiService";
import "./Dashboard.css";

function Dashboard() {
  const [programadas, setProgramadas] = useState([]);
  const [completadas, setCompletadas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProg, resComp, resPend, cliList] = await Promise.all([
          getVisitasProgramadas(),
          getVisitasCompletadas(),
          getVisitasPendientes(),
          getClientes(),
        ]);
        setProgramadas(resProg.visitas || []);
        setCompletadas(resComp.visitas || []);
        setPendientes(resPend.visitas || []);
        setClientes(cliList || []);
      } catch (error) {
        console.error("Error cargando KPIs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Índice de clientes por nombre
  const clienteByName = useMemo(() => {
    const map = new Map();
    (clientes || []).forEach(c =>
      map.set((c.nombre || "").trim().toUpperCase(), c)
    );
    return map;
  }, [clientes]);

  const openMapForVisit = v => {
    const key = (v.cliente || "").trim().toUpperCase();
    const c = clienteByName.get(key) || {};
    const dataForModal = {
      cliente: v.cliente,
      tecnico: v.tecnico,
      estado: v.estado,
      fecha_visita: v.fecha_visita,
      direccion: c.direccion || "",
      coords: c.coordenadas || "",
    };
    setSelectedVisit(dataForModal);
    setModalOpen(true);
  };

  if (loading) return <p>Cargando datos...</p>;

  // 🔹 Función para mostrar badges de estado
  const renderEstadoBadge = estado => {
    const upper = estado?.toUpperCase();
    if (upper === "PENDIENTE")
      return <span className="badge badge-pendiente">🟠 Pendiente</span>;
    if (upper === "COMPLETADA")
      return <span className="badge badge-completada">✅ Completada</span>;
    if (upper === "PROGRAMADA")
      return <span className="badge badge-programada">📅 Programada</span>;
    if (upper === "EN_PROGRESO")
      return <span className="badge badge-progreso">📅 Programada</span>;
    return <span className="badge">{estado}</span>;
  };

  const renderItem = v => {
    const c = clienteByName.get((v.cliente || "").trim().toUpperCase());
    const direccion = c?.direccion || "—";
    return (
      <div key={v.id_visita} className="kpi-row">
        <div><strong>{v.cliente}</strong></div>
        <div>{v.tecnico}</div>
        <div>{direccion}</div>
        <div>{v.fecha_visita}</div>
        <div>{renderEstadoBadge(v.estado)}</div>
        <div style={{ textAlign: "center" }}>
          <button className="btn-map" onClick={() => openMapForVisit(v)}>
            🗺️ Ver ubicación
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <h1>Bienvenido, {user.usuario}</h1>
      <p>Rol: {user.rol?.nombre}</p>

      <br />

      <KpiCard icon="📅" title="Visitas Programadas Hoy" count={programadas.length} className="kpi-programadas">
        <div className="kpi-table-head">
          <div>Cliente</div>
          <div>Técnico</div>
          <div>Dirección</div>
          <div>Fecha</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>
        {programadas.length === 0 ? (
          <p>No hay visitas programadas.</p>
        ) : (
          programadas.map(renderItem)
        )}
      </KpiCard>

      <KpiCard icon="✅" title="Visitas Completadas Hoy" count={completadas.length} className="kpi-completadas">
        <div className="kpi-table-head">
          <div>Cliente</div>
          <div>Técnico</div>
          <div>Dirección</div>
          <div>Fecha</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>
        {completadas.length === 0 ? (
          <p>No hay visitas completadas.</p>
        ) : (
          completadas.map(renderItem)
        )}
      </KpiCard>

      <KpiCard icon="🕒" title="Visitas Pendientes" count={pendientes.length} className="kpi-pendientes">
        <div className="kpi-table-head">
          <div>Cliente</div>
          <div>Técnico</div>
          <div>Dirección</div>
          <div>Fecha</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>
        {pendientes.length === 0 ? (
          <p>No hay visitas pendientes.</p>
        ) : (
          pendientes.map(renderItem)
        )}
      </KpiCard>

      <MapModal open={modalOpen} onClose={() => setModalOpen(false)} data={selectedVisit} />
    </div>
  );
}

export default Dashboard;
