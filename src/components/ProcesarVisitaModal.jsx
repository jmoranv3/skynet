import { useEffect, useState } from "react";
import MapPickerModal from "./MapPickerModal";

export default function ProcesarVisitaModal({ open, onClose, visita, onSaved }) {
  if (!open) return null;

  const [estado, setEstado] = useState("EN_PROGRESO");
  const [usarPlanificadas, setUsarPlanificadas] = useState(true);
  const [coordenadasFinales, setCoordenadasFinales] = useState(""); // ⭐ Campo que se usará para guardar
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (open && visita) {
      setEstado("EN_PROGRESO");
      setUsarPlanificadas(true);
      setCoordenadasFinales(visita.coordenadas_planificadas || ""); // cargar coord inicial
      setObservaciones("");
    }
  }, [open, visita]);

  const handleSave = async () => {
    if (!estado) return alert("Selecciona un estado.");
    if (!observaciones.trim()) return alert("Las observaciones son obligatorias.");
    if (!coordenadasFinales) return alert("Las coordenadas no pueden quedar vacías.");

    const body = {
      nuevo_estado: estado,
      coordenadas_visita: coordenadasFinales,
      observaciones
    };

    try {
      setSaving(true);

      const res = await fetch(`https://skynet-api-auth.onrender.com/api/visitas/${visita.id_visita}/procesar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("No se pudo procesar la visita.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="umodal-backdrop" onMouseDown={onClose}>
        <div className="umodal" onMouseDown={(e) => e.stopPropagation()}>

          <div className="umodal-header">
            <h2>Procesar Visita #{visita?.id_visita}</h2>
            <button className="umodal-close" onClick={onClose}>✕</button>
          </div>

          <div className="umodal-body">
            <div className="grid2">

              {/* Estado */}
              <div className="field">
                <label>Nuevo Estado</label>
                <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="EN_PROGRESO">EN PROGRESO</option>
                  <option value="COMPLETADA">COMPLETADA</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>

              {/* Coordenadas */}
              <div className="field">
                <label>¿Qué coordenadas desea guardar?</label>

                <label className="radio">
                  <input
                    type="radio"
                    checked={usarPlanificadas}
                    onChange={() => {
                      setUsarPlanificadas(true);
                      setCoordenadasFinales(visita.coordenadas_planificadas || "");
                    }}
                  />
                  <span>Usar las planificadas</span>
                </label>

                <label className="radio">
                  <input
                    type="radio"
                    checked={!usarPlanificadas}
                    onChange={() => setUsarPlanificadas(false)}
                  />
                  <span>Seleccionar nuevas en mapa</span>
                </label>

                {/* Input visible siempre */}
                <input
                  className="input"
                  style={{ marginTop: 6 }}
                  value={coordenadasFinales}
                  onChange={(e) => setCoordenadasFinales(e.target.value)}
                  placeholder="lat,lng"
                />

                {/* Botón para abrir mapa solo si NO usa planificadas */}
                {!usarPlanificadas && (
                  <button
                    className="btn sm"
                    style={{ marginTop: 6 }}
                    onClick={() => setMapOpen(true)}
                  >
                    📍 Elegir en mapa
                  </button>
                )}
              </div>

              {/* Observaciones */}
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Observaciones *</label>
                <textarea
                  className="input"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

            </div>
          </div>

          <div className="umodal-footer">
            <button className="btn ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal del Mapa */}
      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSave={(coords) => {
          setCoordenadasFinales(coords);
          setMapOpen(false);
        }}
      />
    </>
  );
}
