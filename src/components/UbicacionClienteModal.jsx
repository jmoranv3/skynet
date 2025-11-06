import "./ClientModal.css";

export default function UbicacionClienteModal({ open, coords, onUse, onPick, onClose }) {
  if (!open) return null;

  return (
    <div className="cm-backdrop">
      <div className="cm-modal small">
        <div className="cm-header">
          <h3>📍 Ubicación encontrada</h3>
          <button className="cm-close" onClick={onClose}>✖</button>
        </div>

        <div className="cm-body" style={{ textAlign: "center" }}>
          <p>¿Deseas usar esta ubicación para la visita?</p>
          <p style={{ fontWeight: "600" }}>{coords}</p>
        </div>

        <div className="cm-actions column">
          <button className="btn primary" onClick={onUse}>Usar ubicación</button>
          <button className="btn" onClick={onPick}>Elegir en mapa</button>
          <button className="btn danger" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
