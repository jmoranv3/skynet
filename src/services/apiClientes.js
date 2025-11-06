const API_URL = "https://skynet-api-auth.onrender.com/api/clientes"; // ← luego lo haremos dinámico

// Obtener lista de clientes
export const getClientes = async (rol) => {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "rol": rol // enviamos el rol del usuario
      }
    });

    if (!response.ok) {
      throw new Error("No autorizado o error al obtener clientes");
    }

    return await response.json();
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return null;
  }
};
