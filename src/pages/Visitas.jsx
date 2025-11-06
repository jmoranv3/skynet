// src/pages/Visitas.jsx
import { useEffect, useMemo, useState } from "react";
import "./Visitas.css";
import VisitaModal from "../components/VisitaModal";
import { getVisitas, inactivarVisita, canVisit } from "../services/visitasService";
import ProcesarVisitaModal from "../components/ProcesarVisitaModal";
// ...

export default function Visitas() {
  const [visitas, setVisitas] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState(""); 
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [processOpen, setProcessOpen] = useState(false);
  const [toProcess, setToProcess] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selected, setSelected] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = user?.rol?.codigo || "TEC";

  const loadVisitas = async () => {
    try {
      const params = {};
      if (estado) params.estado = estado;

      const data = await getVisitas(params);

      // Normalizamos para asegurar que existan los campos
      const normalized = (Array.isArray(data) ? data : (data?.visitas || [])).map(v => ({
        ...v,
        cliente_direccion: v.cliente_direccion ?? "Sin dirección",
        cliente_coordenadas: v.cliente_coordenadas ?? "",
      }));

      setVisitas(normalized);
    } catch (e) {
      console.error("Error visitas:", e);
    }
  };

  useEffect(() => { loadVisitas(); }, [estado]);

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return visitas.filter(v => {
      const line = `${v.supervisor ?? ""} ${v.cliente ?? ""} ${v.cliente_direccion ?? ""} ${v.cliente_coordenadas ?? ""} ${v.tecnico ?? ""} ${v.estado ?? ""}`.toLowerCase();
      return line.includes(t);
    });
  }, [visitas, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => { setSelected(null); setModalMode("create"); setModalOpen(true); };
  const openEdit = (v) => { setSelected(v); setModalMode("edit"); setModalOpen(true); };

  const doInactivar = async (v) => {
    if (!confirm(`¿Inactivar la visita #${v.id_visita}?`)) return;
    try {
      await inactivarVisita(v.id_visita);
      loadVisitas();
    } catch (e) {
      alert("No se pudo inactivar la visita");
    }
  };

  const openGoogleMaps = (coords) => {
    if (!coords) return alert("Este cliente no tiene coordenadas registradas");
    const [lat, lng] = String(coords).split(",").map(s => s.trim());
    if (!lat || !lng) return alert("Coordenadas inválidas");
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noopener");
  };

  const stateIcon = (st) => {
    const s = (st || "").toUpperCase();
    if (s === "PENDIENTE") return "🟠";
    if (s === "EN_PROGRESO") return "🟡";
    if (s === "COMPLETADA") return "🟢";
    if (s === "CANCELADA") return "🔴";
    return "⚪";
  };

  return (
    <div className="visitas-page">
      <div className="visitas-header">
        <h1>Gestión de Visitas</h1>
        <div className="visitas-actions">
          <input
            className="input search"
            placeholder="Buscar por cliente, técnico, supervisor, estado..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Estado: Todos</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN_PROGRESO">EN_PROGRESO</option>
            <option value="COMPLETADA">COMPLETADA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
          {canVisit("create") && (
            <button className="btn primary" onClick={openCreate}>➕ Crear Visita</button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="data-table">
        <div className="dt-head">
          <div>Supervisor</div>
          <div>Cliente</div>
          <div>F. Creación</div>
          <div>Dirección Cliente</div>
          <div>Coords Cliente</div>
          <div>F. Visita</div>
          <div>Técnico</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        {pageData.length === 0 ? (
          <div className="dt-row" style={{ justifyContent: "center" }}>No hay visitas</div>
        ) : (
          pageData.map(v => (
            <div key={v.id_visita} className="dt-row">
              <div>{v.supervisor ?? "—"}</div>
              <div>{v.cliente ?? "—"}</div>
              <div>{v.fecha_creacion ?? "—"}</div>
              <div>{v.cliente_direccion}</div>
              <div>{v.cliente_coordenadas || "—"}</div>
              <div>{v.fecha_visita ?? "—"}</div>
              <div>{v.tecnico ?? "—"}</div>
              <div>
                <span className={`badge state ${String(v.estado || "").toLowerCase()}`}>
                  {stateIcon(v.estado)} {v.estado}
                </span>
              </div>
              <div className="row-actions">
                <button className="btn sm" onClick={() => openGoogleMaps(v.cliente_coordenadas)}>🗺 Ver mapa</button>

               {canVisit("process") && (
                    <button
                      className="btn sm"
                      onClick={() => { setToProcess(v); setProcessOpen(true); }}
                    >
                      ⚙ Procesar
                    </button>
                  )}


                {canVisit("edit") && <button className="btn sm" onClick={() => openEdit(v)}>✏️ Editar</button>}
                {canVisit("delete") && <button className="btn sm" onClick={() => doInactivar(v)}>🗑 Inactivar</button>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      <div className="pagination">
        <button className="btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>⬅</button>
        <span>Página {page} de {totalPages}</span>
        <button className="btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>➡</button>
      </div>

      {/* Modal */}
      <VisitaModal
        open={modalOpen}
        mode={modalMode}
        initialData={selected}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadVisitas(); }}
      />
      <ProcesarVisitaModal
        open={processOpen}
        visita={toProcess}
        onClose={() => { setProcessOpen(false); setToProcess(null); }}
        onSaved={() => { setProcessOpen(false); setToProcess(null); loadVisitas(); }}
      />

    </div>
  );
}
