import { useState } from "react";
import { login } from "../services/authService";
import "./Login.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [status, setStatus] = useState(""); // success | error | ""

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await login(usuario, clave);

        if (response.ok) {
        const data = await response.json();

        // Guardar sesión
          localStorage.setItem("user", JSON.stringify({
            id_usuario: data.id_usuario,
            usuario: data.usuario,
            rol: data.rol
          }));

        setStatus("success");
        setUsuario("");
        setClave("");

        setTimeout(() => {
            setStatus("");
            window.location.href = "/dashboard";
        }, 1000);
        }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />

          {/* Ícono animado */}
          {status === "success" && <div className="icon success">👍</div>}
          {status === "error" && <div className="icon error">👎</div>}

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
