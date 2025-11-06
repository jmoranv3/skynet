import { useEffect, useState } from "react";
import "./Usuarios.css";
import UserModal from "../components/UserModal";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsuarios = async () => {
    try {
      const res = await fetch("https://skynet-api-auth.onrender.com/api/usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Búsqueda
  const filtered = usuarios.filter((u) => {
    const text = `${u.nombre} ${u.usuario} ${u.correo} ${u.rol}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Abrir modal Crear
  const openCreate = () => {
    setSelectedUser(null);
    setModalMode("create");
    setModalOpen(true);
  };

  // Abrir modal Editar
  const openEdit = (u) => {
    setSelectedUser(u);
    setModalMode("edit");
    setModalOpen(true);
  };

  return (
    <div className="usuarios-page light">
      {/* ✅ Encabezado + buscador */}
      <div className="usuarios-header">
        <h1>Gestión de Usuarios</h1>

        <div className="usuarios-actions">
          <input
            className="input search"
            placeholder="Buscar por nombre, usuario, correo o rol..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <button className="btn primary" onClick={openCreate}>➕ Crear Usuario</button>
        </div>
      </div>

      {/* ✅ Tabla */}
      <div className="data-table">
        <div className="dt-head">
          <div>Nombre</div>
          <div>Usuario</div>
          <div>Correo</div>
          <div>Rol</div>
          <div>Supervisor</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        {pageData.length === 0 ? (
          <div className="dt-row" style={{ justifyContent: "center" }}>No hay usuarios</div>
        ) : (
          pageData.map((u) => (
            <div key={u.id_usuario} className={`dt-row ${!u.activo ? "inactive" : ""}`}>
              <div>{u.nombre}</div>
              <div>{u.usuario}</div>
              <div>{u.correo}</div>
              <div>{u.rol}</div>
              <div>{u.supervisor_nombre ?? "—"}</div>
              <div>
                <span className={`badge ${u.activo ? "badge-ok" : "badge-off"}`}>
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div>
                <button className="btn sm" onClick={() => openEdit(u)}>✏️ Editar</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ Paginación */}
      <div className="pagination">
        <button
          className="btn"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ⬅
        </button>
        <span>Página {page} de {totalPages}</span>
        <button
          className="btn"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          ➡
        </button>
      </div>

      {/* ✅ Modal Crear/Editar Usuario */}
      <UserModal
        open={modalOpen}
        mode={modalMode}
        initialData={selectedUser}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadUsuarios();
        }}
      />
    </div>
  );
}

export default Usuarios;
