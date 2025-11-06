import { useEffect, useMemo, useState } from "react";
import "./VisitaModal.css"; // Nuevo CSS
import MapPickerModal from "./MapPickerModal";
import { createVisita, updateVisita } from "../services/visitasService";
import UbicacionClienteModal from "./UbicacionClienteModal";





export default function VisitaModal({
  open,
  mode = "create",
  initialData,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const roleCode = user?.rol?.codigo || "TEC";
  const isAdmin = roleCode === "ADMIN";
  const isSupervisor = roleCode === "SUP";
  const [showLocationModal, setShowLocationModal] = useState(false);
const [clienteCoords, setClienteCoords] = useState("");

  const [clientes, setClientes] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [form, setForm] = useState({
    id_cliente: "",
    id_supervisor: "",
    id_tecnico: "",
    fecha_visita: "",
    coordenadas_planificadas: "",
    estado: "PENDIENTE",
  });

  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Carga catálogos
useEffect(() => {
  async function loadFormData() {
    try {
      let url = "https://skynet-api-auth.onrender.com/api/visitas/form-data";

      // si el que está creando es SUPERVISOR, enviamos su ID para filtrar técnicos
      if (isSupervisor) {
        url += `?supervisorId=${user.id_usuario}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      setClientes(data.clientes || []);
      setSupervisores(data.supervisores || []);
      setTecnicos(data.tecnicos || []);
    } catch (e) {
      console.error("Error cargando datos del formulario:", e);
    }
  }

  if (open) loadFormData();
}, [open, isSupervisor, user.id_usuario]);

  // Inicializar/Reset
useEffect(() => {
  if (!open) return;

  if (isEdit && initialData) {
    setForm({
      id_cliente: String(initialData.id_cliente ?? ""),
      id_supervisor: String(initialData.id_supervisor ?? (isSupervisor ? user.id_usuario : "")),
      id_tecnico: String(initialData.id_tecnico ?? ""),
      fecha_visita: initialData.fecha_visita ?? "",
      coordenadas_planificadas: initialData.coordenadas_planificadas ?? "",
      estado: initialData.estado ?? "PENDIENTE",
    });
  } else {
    setForm({
      id_cliente: "",
      id_supervisor: isSupervisor ? String(user.id_usuario) : "",
      id_tecnico: "",
      fecha_visita: "",
      coordenadas_planificadas: "",
      estado: "PENDIENTE",
    });
  }

  setError("");
}, [open, isEdit, initialData]); 


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleClienteChange = (e) => {
  const value = e.target.value;
  setForm(f => ({ ...f, id_cliente: value }));

  const selected = clientes.find(c => String(c.id_cliente) === value);

  if (selected?.coordenadas) {
    setClienteCoords(selected.coordenadas);
    setShowLocationModal(true);
  }
};

  const supervisorSelected = useMemo(() => {
    if (isAdmin) return form.id_supervisor;
    if (isSupervisor) return String(user.id_usuario || "");
    return "";
  }, [form.id_supervisor, isAdmin, isSupervisor, user]);

  const filteredTecnicos = useMemo(() => tecnicos, [tecnicos]);

  const validate = () => {
    if (!form.id_cliente) return "Selecciona un cliente";
    if (isAdmin && !form.id_supervisor) return "Selecciona un supervisor";
    if (isSupervisor && !supervisorSelected) return "Supervisor inválido";
    if (!form.id_tecnico) return "Selecciona un técnico";
    if (!form.fecha_visita) return "Selecciona la fecha de visita";
    return "";
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    setError("");

    const payload = {
      id_cliente: Number(form.id_cliente),
      id_supervisor: Number(supervisorSelected),
      id_tecnico: Number(form.id_tecnico),
      fecha_visita: form.fecha_visita,
      coordenadas_planificadas: form.coordenadas_planificadas || null,
      ...(isAdmin ? { estado: form.estado } : {}),
    };

    try {
      if (isEdit && initialData?.id_visita) {
        await updateVisita(initialData.id_visita, payload);
      } else {
        await createVisita(payload);
      }
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError("Error al guardar la visita");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="vm-backdrop">
      <div className="vm-modal">
        <div className="vm-header">
          <h3>{isEdit ? "Editar Visita" : "Crear Visita"}</h3>
          <button className="vm-close" onClick={onClose}>✖</button>
        </div>

        <div className="vm-body">
          {error && <div className="vm-error">{error}</div>}

          <div className="vm-grid">
            <div className="vm-field">
              <label>Cliente *</label>
              <select name="id_cliente" value={form.id_cliente} onChange={handleClienteChange}>
                    <option value="">-- Selecciona cliente --</option>
                    {clientes.map(c => (
                        <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
                    ))}
                    </select>

            </div>

            <div className="vm-field">
              <label>Supervisor *</label>
              {isAdmin ? (
                <select name="id_supervisor" value={form.id_supervisor} onChange={handleChange}>
                  <option value="">-- Selecciona supervisor --</option>
                  {supervisores.map(s => (
                    <option key={s.id_usuario} value={s.id_usuario}>
                      {s.nombre} ({s.usuario})
                    </option>
                  ))}
                </select>
              ) : (
                <input value={`${user.usuario} (ID: ${user.id_usuario})`} disabled readOnly />
              )}
            </div>

            <div className="vm-field">
              <label>Técnico *</label>
              <select name="id_tecnico" value={form.id_tecnico} onChange={handleChange}>
                <option value="">-- Selecciona técnico --</option>
                {filteredTecnicos.map(t => (
                  <option key={t.id_usuario} value={t.id_usuario}>
                    {t.nombre} ({t.usuario})
                  </option>
                ))}
              </select>
            </div>

                    <div className="vm-field">
                    <label htmlFor="fecha_visita_input">Fecha de Visita *</label>
                    <input
                        id="fecha_visita_input"
                        type="date"
                        name="fecha_visita"
                        value={form.fecha_visita}
                        onChange={handleChange}
                        required
                    />
                    </div>

            <div className="vm-field" style={{ gridColumn: "1 / span 2" }}>
              <label>Coordenadas planificadas (lat,lng)</label>
              <div className="vm-row">
                <input
                  name="coordenadas_planificadas"
                  value={form.coordenadas_planificadas}
                  onChange={handleChange}
                  placeholder="14.6349,-90.5069"
                />
                <button type="button" className="btn" onClick={() => setShowMap(true)}>📍 Elegir en mapa</button>
              </div>
            </div>

            {isAdmin && (
              <div className="vm-field">
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_PROGRESO">EN_PROGRESO</option>
                  <option value="COMPLETADA">COMPLETADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>
            )}
          </div>
        </div>

        

        <div className="vm-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={saving} onClick={handleSave}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Modal mapa */}
      <MapPickerModal
        open={showMap}
        initialCoords={form.coordenadas_planificadas}
        onClose={() => setShowMap(false)}
        onSave={(coords) => {
          setForm((f) => ({ ...f, coordenadas_planificadas: coords }));
          setShowMap(false);
        }}
      />

      <UbicacionClienteModal
                open={showLocationModal}
                coords={clienteCoords}
                onUse={() => {
                    setForm(f => ({ ...f, coordenadas_planificadas: clienteCoords }));
                    setShowLocationModal(false);

                    // ✅ Colocar foco en el campo fecha
                    setTimeout(() => {
                    document.getElementById("fecha_visita_input")?.focus();
                    }, 50);
                }}
                onPick={() => {
                    setShowLocationModal(false);
                    setShowMap(true); // luego el usuario abrirá mapa
                }}
                onClose={() => setShowLocationModal(false)}
                />

    </div>
  );
}
