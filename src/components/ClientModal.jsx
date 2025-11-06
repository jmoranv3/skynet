import { useEffect, useState } from "react";
import "./ClientModal.css";
import MapPickerModal from "./MapPickerModal";
import { createCliente, updateCliente } from "../services/clientesService";

export default function ClientModal({ open, mode = "create", initialData, onClose, onSaved }) {
  const isEdit = mode === "edit";

  // Obtener rol del usuario logueado
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.rol?.codigo; // "ADMIN" | "SUP" | "TEC"

  const [form, setForm] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    coordenadas: "",
    correo: "",
    activo: true,
  });

  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        nombre: initialData.nombre || "",
        nit: initialData.nit || "",
        direccion: initialData.direccion || "",
        coordenadas: initialData.coordenadas || "",
        correo: initialData.correo || "",
        activo: !!initialData.activo,
      });
    } else {
      setForm({ nombre: "", nit: "", direccion: "", coordenadas: "", correo: "", activo: true });
    }
    setError("");
  }, [isEdit, initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError("El nombre del cliente es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit && initialData?.id_cliente) {
        await updateCliente(initialData.id_cliente, {
          nombre: form.nombre,
          nit: form.nit || null,
          direccion: form.direccion || null,
          coordenadas: form.coordenadas || null,
          correo: form.correo || null,
          activo: form.activo
        });
      } else {
        await createCliente({
          nombre: form.nombre,
          nit: form.nit || null,
          direccion: form.direccion || null,
          coordenadas: form.coordenadas || null,
          correo: form.correo || null
        });
      }
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el cliente");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="cm-backdrop">
      <div className="cm-modal">
        <div className="cm-header">
          <h3>{isEdit ? "Editar Cliente" : "Crear Cliente"}</h3>
          <button className="cm-close" onClick={onClose}>✖</button>
        </div>

        <div className="cm-body">
          {error && <div className="cm-error">{error}</div>}

          <div className="cm-grid">
            <div className="cm-field">
              <label>Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre del cliente" />
            </div>

            <div className="cm-field">
              <label>NIT</label>
              <input name="nit" value={form.nit} onChange={handleChange} placeholder="Ej. 1234567-8" />
            </div>

            <div className="cm-field">
              <label>Correo</label>
              <input name="correo" value={form.correo} onChange={handleChange} placeholder="cliente@dominio.com" />
            </div>

            <div className="cm-field" style={{ gridColumn: "1 / span 2" }}>
              <label>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección del cliente" />
            </div>

            <div className="cm-field">
              <label>Coordenadas (lat,lng)</label>
              <div className="cm-row">
                <input
                  name="coordenadas"
                  value={form.coordenadas}
                  onChange={handleChange}
                  placeholder="14.634900,-90.506900"
                />
                <button type="button" className="btn" onClick={() => setShowMap(true)}>📍 Ubicación Exacta</button>
              </div>
            </div>

            {/* ✅ Switch Activo con reglas por rol */}
            {isEdit && role !== "TEC" && (
              <div className="cm-field switch-field">
                <label>Activo</label>

                <label className={`switch ${role === "SUP" ? "disabled" : ""}`}>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={role === "SUP" ? undefined : handleChange}
                    disabled={role === "SUP"}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="cm-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={saving} onClick={handleSave}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Modal del mapa */}
      <MapPickerModal
        open={showMap}
        initialCoords={form.coordenadas}
        onClose={() => setShowMap(false)}
        onSave={(coords) => {
          setForm((f) => ({ ...f, coordenadas: coords }));
          setShowMap(false);
        }}
      />
    </div>
  );
}
