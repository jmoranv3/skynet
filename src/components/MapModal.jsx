import "./MapModal.css";

export default function MapModal({ open, onClose, data }) {
  if (!open || !data) return null;

  const { cliente, direccion, tecnico, estado, fecha_visita, coords } = data;

  // coords en formato "lat,lng"
  let mapUrl = "";
  if (coords && typeof coords === "string" && coords.includes(",")) {
    const [latStr, lngStr] = coords.split(",");
    const lat = latStr.trim();
    const lng = lngStr.trim();
    mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }

  const externalUrl = coords
  
    ? `https://www.google.com/maps?q=${encodeURIComponent(coords)}&z=16`
    : null;
  return (
    <div className="mapmodal-backdrop" onClick={onClose}>
      <div className="mapmodal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mapmodal-header">
          <h3>📍 Ubicación del Cliente</h3>
          <button className="mapmodal-close" onClick={onClose}>✖</button>
        </div>

        <div className="mapmodal-info">
          <div><strong>Cliente:</strong> {cliente || "—"}</div>
          <div><strong>Dirección:</strong> {direccion || "—"}</div>
          <div><strong>Técnico:</strong> {tecnico || "—"}</div>
          <div><strong>Estado:</strong> {estado || "—"}</div>
          <div><strong>Fecha de visita:</strong> {fecha_visita || "—"}</div>
        </div>

        <div className="mapmodal-map">
          {mapUrl ? (
            <iframe
              title="mapa"
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: 8 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="mapmodal-error">
              No hay coordenadas válidas para este cliente.
            </div>
          )}
        </div>

        <div className="mapmodal-footer">
          {externalUrl && (
            <a className="mapmodal-btn" href={externalUrl} target="_blank" rel="noreferrer">
              🗺️ Abrir en Google Maps
            </a>
          )}
          <button className="mapmodal-btn outline" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
