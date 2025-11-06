import { useEffect, useMemo, useState } from "react";
import "./Clientes.css";
import { getClientes, inactivarCliente, can } from "../services/clientesService";
import ClientModal from "../components/ClientModal";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selected, setSelected] = useState(null);

  const loadClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error clientes:", e);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return clientes.filter(c => {
      const line = `${c.nombre} ${c.nit ?? ""} ${c.direccion ?? ""} ${c.coordenadas ?? ""} ${c.correo ?? ""}`.toLowerCase();
      return line.includes(t);
    });
  }, [clientes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setSelected(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setSelected(c);
    setModalMode("edit");
    setModalOpen(true);
  };

  const doInactivar = async (c) => {
    if (!confirm(`¿Inactivar al cliente "${c.nombre}"?`)) return;
    try {
      await inactivarCliente(c.id_cliente);
      loadClientes();
    } catch (e) {
      alert("No se pudo inactivar el cliente");
    }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canEdit = user?.rol?.codigo === "ADMIN" || user?.rol?.codigo === "SUP";

  return (
    <div className="clientes-page">
      {/* Encabezado */}
      <div className="clientes-header">
        <h1>Gestión de Clientes</h1>
        <div className="clientes-actions">
          <input
            className="input search"
            placeholder="Buscar por nombre, NIT, dirección, correo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {can("create") && (
            <button className="btn primary" onClick={openCreate}>➕ Crear Cliente</button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="data-table">
        <div className="dt-head">
          <div>Nombre</div>
          <div>NIT</div>
          <div>Dirección</div>
          <div>Coordenadas</div>
          <div>Correo</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        {pageData.length === 0 ? (
          <div className="dt-row" style={{ justifyContent: "center" }}>No hay clientes</div>
        ) : (
          pageData.map(c => (
            <div key={c.id_cliente} className={`dt-row ${!c.activo ? "inactive" : ""}`}>
              <div>{c.nombre}</div>
              <div>{c.nit ?? "—"}</div>
              <div>{c.direccion ?? "—"}</div>
              <div>{c.coordenadas ?? "—"}</div>
              <div>{c.correo ?? "—"}</div>
              <div>
                <span className={`badge ${c.activo ? "badge-ok" : "badge-off"}`}>
                  {c.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* ACCIONES */}
              <div style={{ display: "flex", gap: 8 }}>
                {/* 🗺️ Ver Mapa (Disponible para TODOS los roles) */}
                {c.coordenadas ? (
                  <button
                    className="btn sm map"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${c.coordenadas}`;
                      window.open(url, "_blank");
                    }}
                  >
                    🗺️ Mapa
                  </button>
                ) : (
                  <button className="btn sm disabled" disabled>Sin mapa</button>
                )}

                {/* ✏️ Editar para roles con permiso */}
                {can("edit") && (
                  <button className="btn sm" onClick={() => openEdit(c)}>✏️ Editar</button>
                )}

                {/* 🗑 Inactivar solo Admin */}
                {can("delete") && (
                  <button className="btn sm" onClick={() => doInactivar(c)}>🗑 Inactivar</button>
                )}
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

      {/* Modal Crear/Editar */}
      <ClientModal
        open={modalOpen}
        mode={modalMode}
        initialData={selected}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadClientes();
        }}
      />
    </div>
  );
}
