import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ProtectedRoute from "./components/ProtectedRoute";
import PrivateLayout from "./layouts/PrivateLayout";
import Usuarios from "./pages/Usuarios";
import Visitas from "./pages/Visitas";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* RUTA PUBLICA */}
        <Route path="/" element={<Login />} />

        {/* RUTAS PRIVADAS CON LAYOUT */}
        <Route
          element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="visitas" element={<Visitas />} />

          {/* Luego agregaremos: Usuarios, Visitas, Configuración */}
        </Route>

                  <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <PrivateLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Usuarios />} />
          </Route>


      </Routes>


    </BrowserRouter>
  );
}

export default App;
