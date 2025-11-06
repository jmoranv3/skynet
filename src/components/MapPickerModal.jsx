import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPickerModal.css";

// Fix default Leaflet marker icons
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapPickerModal({ open, initialCoords, onClose, onSave }) {
  const [coords, setCoords] = useState([14.6349, -90.5069]); // Default: Guatemala centro
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (!open) return;

    if (initialCoords) {
      const [lat, lng] = initialCoords.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoords([lat, lng]);
        setZoom(16);
      }
    } else {
      setCoords([14.6349, -90.5069]); // Default city center
      setZoom(13);
    }
  }, [open, initialCoords]);

  if (!open) return null;

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setCoords([e.latlng.lat, e.latlng.lng]);
      },
    });
    return <Marker position={coords} />;
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada en este navegador");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setZoom(17);
      },
      () => alert("No se pudo obtener tu ubicación")
    );
  };

  return (
    <div className="mpm-backdrop">
      <div className="mpm-modal">
        <div className="mpm-header">
          <h3>Seleccionar Ubicación Exacta</h3>
          <button className="mpm-close" onClick={onClose}>✖</button>
        </div>

        <div className="mpm-body">
          <MapContainer center={coords} zoom={zoom} scrollWheelZoom={true}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <LocationMarker />
          </MapContainer>
        </div>

        <div className="mpm-footer">
          <button className="btn" onClick={useMyLocation}>📍 Mi Ubicación</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            onClick={() => onSave(`${coords[0]},${coords[1]}`)}
          >
            Guardar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
}
