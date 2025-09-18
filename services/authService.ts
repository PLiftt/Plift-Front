import axios from "axios";
import { saveToken, deleteToken, getToken } from "./secureStore";

const API_URL = "http://:8000";

export const registerUser = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, data);
    console.log("Respuesta del servidor:", response.data);

    // Guardamos solo si existen
    if (response.data.access)
      await saveToken("accessToken", response.data.access);
    if (response.data.refresh)
      await saveToken("refreshToken", response.data.refresh);

    return response.data;
  } catch (error: any) {
    console.error(
      "Error en registerUser:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const response = await axios.post(`${API_URL}/token/`, data);
    console.log("Respuesta login:", response.data);

    // Guardamos tokens en SecureStore
    if (response.data.access)
      await saveToken("accessToken", response.data.access);
    if (response.data.refresh)
      await saveToken("refreshToken", response.data.refresh);

    return response.data;
  } catch (error: any) {
    console.error("Error en loginUser:", error.response?.data || error.message);
    throw error;
  }
};
