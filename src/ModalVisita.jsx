import { useEffect, useMemo, useState } from "react";
import "./ModalVisita.css";
import MapPickerModal from "./MapPickerModal";

export default function ModalVisita({
  open,
  mode = "create",               // "create" | "edit"
  initialData = null,            // si edit, objeto visita
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rolCode = user?.rol?.codigo || "TEC";     // "ADMIN" | "SUP" | "TEC"
  const loggedId = user?.id_usuario;

  const [form, setForm] = useState({
    id_cliente: "",
    id_supervisor: "",
    id_tecnico: "",
    fecha_visita: "",
    coordenadas_planificadas: "",
  });

  const [clientes, setClientes] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showMap, setShowMap] = useState(false);

  // Helpers
  const isAdmin = rolCode === "ADMIN";
  const isSup   = rolCode === "SUP";

  // Carga de datos para selects
  const loadFormData = async (supIdOpt) => {
    setLoading(true);
    setError("");
    try {
      const qs = supIdOpt ? `?supervisorId=${supIdOpt}` : "";
      const res = await fetch(`https://skynet-api-auth.onrender.com/api/visitas/form-data${qs}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setClientes(data.clientes || []);
      setSupervisores(data.supervisores || []);
      setTecnicos(data.tecnicos || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar datos del formulario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isSup) {
        // Supervisor → fija su id y trae técnicos filtrados
        await loadFormData(loggedId);
        setForm((f) => ({ ...f, id_supervisor: String(loggedId) }));
      } else {
        // Admin / otros: trae todo
        await loadFormData();
      }

      if (isEdit && initialData) {
        setForm({
          id_cliente: String(initialData.id_cliente ?? ""),
          id_supervisor: String(initialData.id_supervisor ?? (isSup ? loggedId : "")),
          id_tecnico: String(initialData.id_tecnico ?? ""),
          fecha_visita: (initialData.fecha_visita ?? "").substring(0,10), // "yyyy-MM-dd"
          coordenadas_planificadas: initialData.coordenadas_planificadas ?? "",
        });
      } else {
        setForm({
          id_cliente: "",
          id_supervisor: isSup ? String(loggedId) : "",
          id_tecnico: "",
          fecha_visita: "",
          coordenadas_planificadas: "",
        });
      }
    };
    if (open) init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  // Si ADMIN cambia supervisor → recarga técnicos filtrados
  const onChangeSupervisor = async (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, id_supervisor: value, id_tecnico: "" }));
    if (value) {
      await loadFormData(value);
    } else {
      await loadFormData(); // sin filtro
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.id_cliente) return "El cliente es obligatorio.";
    if (!form.id_supervisor) return "El supervisor es obligatorio.";
    if (!form.id_tecnico) return "El técnico es obligatorio.";
    if (!form.fecha_visita) return "La fecha de visita es obligatoria.";
    if (!form.coordenadas_planificadas?.trim()) return "Las coordenadas son obligatorias.";
    // Validar formato rápido: lat,lng
    const parts = form.coordenadas_planificadas.split(",");
    if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
      return "Coordenadas inválidas. Formato: lat,lng";
    }
    return "";
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        id_cliente: Number(form.id_cliente),
        id_supervisor: Number(form.id_supervisor),
        id_tecnico: Number(form.id_tecnico),
        fecha_visita: form.fecha_visita, // yyyy-MM-dd
        coordenadas_planificadas: form.coordenadas_planificadas,
      };

      let url = "https://skynet-api-auth.onrender.com/api/visitas";
      let method = "POST";
      if (isEdit && initialData?.id_visita) {
        url = `https://skynet-api-auth.onrender.com/api/visitas/${initialData.id_visita}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      onSaved?.();
    } catch (e) {
      console.error(e);
      setError("Error al guardar la visita.");
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
            {/* Cliente */}
            <div className="vm-field">
              <label>Cliente *</label>
              <select name="id_cliente" value={form.id_cliente} onChange={handleChange} disabled={loading}>
                <option value="">— Selecciona —</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor */}
            <div className="vm-field">
              <label>Supervisor *</label>
              <select
                name="id_supervisor"
                value={form.id_supervisor}
                onChange={isAdmin ? onChangeSupervisor : undefined}
                disabled={loading || isSup}   // supervisor logueado no puede cambiar
              >
                <option value="">— Selecciona —</option>
                {supervisores.map(s => (
                  <option key={s.id_usuario} value={s.id_usuario}>
                    {s.usuario} — {s.nombre}
                  </option>
                ))}
              </select>
              {isSup && <small className="vm-note">Fijado por tu rol</small>}
            </div>

            {/* Técnico */}
            <div className="vm-field">
              <label>Técnico *</label>
              <select name="id_tecnico" value={form.id_tecnico} onChange={handleChange} disabled={loading}>
                <option value="">— Selecciona —</option>
                {tecnicos.map(t => (
                  <option key={t.id_usuario} value={t.id_usuario}>
                    {t.usuario} — {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha visita */}
            <div className="vm-field">
              <label>Fecha de visita *</label>
              <input type="date" name="fecha_visita" value={form.fecha_visita} onChange={handleChange} />
            </div>

            {/* Coordenadas */}
            <div className="vm-field" style={{ gridColumn: "1 / span 2" }}>
              <label>Coordenadas planificadas (lat,lng) *</label>
              <div className="vm-row">
                <input
                  name="coordenadas_planificadas"
                  value={form.coordenadas_planificadas}
                  onChange={handleChange}
                  placeholder="14.634900,-90.506900"
                />
                <button type="button" className="btn" onClick={() => setShowMap(true)}>📍 Seleccionar en mapa</button>
              </div>
            </div>
          </div>
        </div>

        <div className="vm-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={saving} onClick={handleSave}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Modal de mapa */}
      <MapPickerModal
        open={showMap}
        initialCoords={form.coordenadas_planificadas}
        onClose={() => setShowMap(false)}
        onSave={(coords) => {
          setForm((f) => ({ ...f, coordenadas_planificadas: coords }));
          setShowMap(false);
        }}
      />
    </div>
  );
}
