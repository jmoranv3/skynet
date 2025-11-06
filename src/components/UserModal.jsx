import { useEffect, useMemo, useState } from "react";
import "./UserModal.css";

// Util: genera usuario a partir del nombre (editable)
function slugifyUsername(fullName) {
  if (!fullName) return "";
  const clean = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (parts.length === 1) return parts[0].toLowerCase();
  const first = parts[0].toLowerCase();
  const last = parts[parts.length - 1].toLowerCase();
  return `${first}.${last}`;
}

const ROLES = ["ADMINISTRADOR", "SUPERVISOR", "TECNICO"];
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://skynet-api-auth.onrender.com";

export default function UserModal({
  open,
  mode = "create", // 'create' | 'edit'
  initialData = null, // {id_usuario, nombre, correo, usuario, rol, activo, id_supervisor?}
  onClose,
  onSaved, // callback tras guardar/crear OK (para recargar lista)
}) {
  const isEdit = mode === "edit";

  // Estado del form
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState("TECNICO");
  const [idSupervisor, setIdSupervisor] = useState("");
  const [activo, setActivo] = useState(true);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // Listas auxiliares
  const [supervisores, setSupervisores] = useState([]);

  // Multi-select técnicos (para rol SUPERVISOR)
  const [tecnicos, setTecnicos] = useState([]); // [{id_usuario, nombre, usuario}]
  const [selectedTecIds, setSelectedTecIds] = useState([]); // [ids]

  // UI
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null); // {type:'ok'|'err', text:''}

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2600);
  };

  // Lee sesión para bloquear edición si no es ADMIN
  const getSession = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const u = JSON.parse(raw);
      const code =
        u?.rol?.codigo || (typeof u.rol === "string" ? u.rol.toUpperCase() : "");
      return { rol_codigo: code || "TEC" };
    } catch {
      return { rol_codigo: "TEC" };
    }
  };
  const session = getSession();
  const isAdmin = session?.rol_codigo === "ADMIN";

  const needsSupervisor = useMemo(() => rol === "TECNICO", [rol]);
  const isSupervisor = useMemo(() => rol === "SUPERVISOR", [rol]);

  // Cargar supervisores y técnicos cuando el modal abra
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        // Supervisores
        const resSup = await fetch(`${BASE_URL}/api/usuarios/supervisores`);
        const dataSup = resSup.ok ? await resSup.json() : [];
        setSupervisores(Array.isArray(dataSup) ? dataSup : []);
      } catch (e) {
        console.error("Error cargando supervisores:", e);
        setSupervisores([]);
      }

      try {
        // Técnicos
        const resTec = await fetch(`${BASE_URL}/api/usuarios/tecnicos`);
        const dataTec = resTec.ok ? await resTec.json() : [];
        setTecnicos(Array.isArray(dataTec) ? dataTec : []);
      } catch (e) {
        console.error("Error cargando técnicos:", e);
        setTecnicos([]);
      }
    })();
  }, [open]);

  // Prefill en edición / reset en creación
  useEffect(() => {
    if (!open) return;

    if (isEdit && initialData) {
      setNombre(initialData.nombre || "");
      setCorreo(initialData.correo || "");
      setUsuario(initialData.usuario || "");
      setRol(initialData.rol || "TECNICO");
      setIdSupervisor(initialData.id_supervisor ?? "");
      setActivo(Boolean(initialData.activo ?? true));
      setPassword("");
      setPassword2("");
      setErrors({});

      // (Opcional) Precargar técnicos asignados para un SUPERVISOR si más adelante creas el endpoint.
      // Intenta, pero si no existe o devuelve error, lo ignora sin romper.
      if ((initialData.rol || "").toUpperCase() === "SUPERVISOR") {
        (async () => {
          try {
            const res = await fetch(
              `${BASE_URL}/api/usuarios/supervisores/${initialData.id_usuario}/tecnicos`
            );
            if (res.ok) {
              const list = await res.json(); // [{id_usuario, ...}]
              const ids = Array.isArray(list)
                ? list.map((t) => Number(t.id_usuario)).filter(Boolean)
                : [];
              setSelectedTecIds(ids);
            } else {
              // Endpoint no existe aún o no implementado: continuar sin error
              setSelectedTecIds([]);
            }
          } catch {
            setSelectedTecIds([]);
          }
        })();
      } else {
        setSelectedTecIds([]);
      }
    } else {
      // crear
      setNombre("");
      setCorreo("");
      setUsuario("");
      setRol("TECNICO");
      setIdSupervisor("");
      setActivo(true);
      setPassword("");
      setPassword2("");
      setErrors({});
      setSelectedTecIds([]); // limpio en creación
    }
  }, [open, isEdit, initialData]);

  // Autogenerar usuario al escribir nombre (pero editable)
  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      const auto = slugifyUsername(nombre);
      setUsuario((prev) => {
        const prevAuto = slugifyUsername(prev);
        const newAuto = auto;
        const shouldReplace = prev === "" || prev === prevAuto;
        return shouldReplace ? newAuto : prev;
      });
    }
  }, [nombre, open, isEdit]);

  // Validación
  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = "Requerido";
    if (!correo.trim()) e.correo = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) e.correo = "Correo inválido";

    if (!usuario.trim()) e.usuario = "Requerido";
    if (!ROLES.includes(rol)) e.rol = "Seleccione un rol válido";

    if (needsSupervisor && !idSupervisor) e.idSupervisor = "Seleccione un supervisor";

    if (!isEdit) {
      if (!password) e.password = "Requerido";
      if (!password2) e.password2 = "Requerido";
      if (password && password2 && password !== password2)
        e.password2 = "Las contraseñas no coinciden";
    } else {
      if ((password || password2) && password !== password2) {
        e.password2 = "Las contraseñas no coinciden";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Toggle de selección de técnicos
  const toggleTecnico = (id) => {
    setSelectedTecIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return Array.from(set);
    });
  };

const handleSave = async () => {
  if (!validate()) {
    showToast("err", "Revisa los campos en rojo");
    return;
  }

  try {
    setSaving(true);

    const isSupervisor = rol === "SUPERVISOR";
    const id_rol = rol === "ADMINISTRADOR" ? 1 : rol === "SUPERVISOR" ? 2 : 3;

    if (!isEdit) {
      // CREAR
      const body = {
        nombre,
        correo,
        usuario,
        clave: password,
        id_rol,
        rol,
        id_supervisor: needsSupervisor ? Number(idSupervisor) : null,
      };

      const res = await fetch(`${BASE_URL}/api/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const newId = data.id_usuario;

      // ✅ Si es SUPERVISOR, asignamos técnicos con endpoint dedicado
      if (isSupervisor) {
        await fetch(`${BASE_URL}/api/supervisores/${newId}/tecnicos`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "rol": "ADMIN", // Necesario para autorización
          },
          body: JSON.stringify({ tecnicos: selectedTecIds }),
        });
      }

      showToast("ok", "Usuario creado correctamente");
      onSaved?.();
      onClose?.();

    } else {
      // EDITAR
      const body = {
        nombre,
        correo,
        usuario,
        id_rol,
        activo,
        clave: password || null,
        rol,
        id_supervisor: needsSupervisor ? Number(idSupervisor) : null,
      };

      const res = await fetch(`${BASE_URL}/api/usuarios/${initialData.id_usuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      // ✅ Si es SUPERVISOR, actualizar asignación de técnicos
      if (isSupervisor) {
        await fetch(`${BASE_URL}/api/supervisores/${initialData.id_usuario}/tecnicos`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "rol": "ADMIN",
          },
          body: JSON.stringify({ tecnicos: selectedTecIds }),
        });
      }

      showToast("ok", "Cambios guardados");
      onSaved?.();
      onClose?.();
    }

  } catch (err) {
    console.error(err);
    showToast("err", "No se pudo guardar. Revisa los datos.");
  } finally {
    setSaving(false);
  }
};

  if (!open) return null;

  return (
    <div className="umodal-backdrop" onMouseDown={onClose}>
      <div className="umodal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="umodal-header">
          <h2>{isEdit ? "Editar Usuario" : "Crear Usuario"}</h2>
          <button className="umodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Form */}
        <div className="umodal-body">
          <div className="grid2">
            {/* Nombre */}
            <div className="field">
              <label>Nombre completo</label>
              <input
                className={`input ${errors.nombre ? "error" : ""}`}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
              {errors.nombre && (
                <div className="hint error">
                  <span>⚠️</span> {errors.nombre}
                </div>
              )}
            </div>

            {/* Correo */}
            <div className="field">
              <label>Correo</label>
              <input
                className={`input ${errors.correo ? "error" : ""}`}
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@empresa.com"
                type="email"
              />
              {errors.correo && (
                <div className="hint error">
                  <span>⚠️</span> {errors.correo}
                </div>
              )}
            </div>

            {/* Usuario */}
            <div className="field">
              <label>Usuario</label>
              <input
                className={`input ${errors.usuario ? "error" : ""}`}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="juan.perez"
              />
              {errors.usuario && (
                <div className="hint error">
                  <span>⚠️</span> {errors.usuario}
                </div>
              )}
            </div>

            {/* Rol */}
            <div className="field">
              <label>Rol</label>
              <select
                className={`input ${errors.rol ? "error" : ""}`}
                value={rol}
                onChange={(e) => setRol(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.rol && (
                <div className="hint error">
                  <span>⚠️</span> {errors.rol}
                </div>
              )}
            </div>

            {/* Supervisor (solo si rol = TECNICO) */}
            {needsSupervisor && (
              <>
                <div className="field">
                  <label>Supervisor</label>
                  <select
                    className={`input ${errors.idSupervisor ? "error" : ""}`}
                    value={idSupervisor}
                    onChange={(e) => setIdSupervisor(e.target.value)}
                  >
                    <option value="">— Seleccionar —</option>
                    {supervisores.map((s) => (
                      <option key={s.id_usuario} value={s.id_usuario}>
                        {s.nombre} ({s.usuario})
                      </option>
                    ))}
                  </select>
                  {errors.idSupervisor && (
                    <div className="hint error">
                      <span>⚠️</span> {errors.idSupervisor}
                    </div>
                  )}
                </div>
                <div />
              </>
            )}

            {/* MULTISELECT TECNICOS (solo si rol = SUPERVISOR) */}
            {isSupervisor && (
              <>
                <div className="field fullwidth">
                  {isEdit && (
                    <div className="subtle-title">Técnicos asignados actualmente:</div>
                  )}
                  <div className="tec-grid-2cols">
                    {tecnicos.length === 0 && (
                      <div className="hint">No hay técnicos disponibles.</div>
                    )}
                    {tecnicos.map((t) => {
                      const id = Number(t.id_usuario);
                      const checked = selectedTecIds.includes(id);
                      return (
                        <label key={id} className="chk-row">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTecnico(id)}
                          />
                          <span>{t.nombre} ({t.usuario})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div />
              </>
            )}

            {/* Contraseña */}
            <div className="field">
              <label>{isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
              <input
                className={`input ${errors.password ? "error" : ""}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Dejar en blanco para no cambiar" : "********"}
              />
              {errors.password && (
                <div className="hint error">
                  <span>⚠️</span> {errors.password}
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                className={`input ${errors.password2 ? "error" : ""}`}
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder={isEdit ? "Dejar en blanco si no cambia" : "********"}
              />
              {errors.password2 && (
                <div className="hint error">
                  <span>⚠️</span> {errors.password2}
                </div>
              )}
            </div>

            {/* Activo (solo en editar) */}
            {isEdit && (
              <div className="field switch">
                <label>Activo</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={!!activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  <span />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="umodal-footer">
          <button className="btn ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type === "ok" ? "ok" : "err"}`}>
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}
