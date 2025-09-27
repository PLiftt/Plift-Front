import axios from "axios";
import { saveToken, deleteToken, getToken } from "./secureStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://8000";

export const registerUser = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, data);
    console.log("Respuesta del servidor:", response.data);

    // Guardamos en SecureStore si existen tokens
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

export const loginUser = async (
  data: { email: string; password: string },
  rememberMe: boolean // 👈 nuevo parámetro
) => {
  try {
    const response = await axios.post(`${API_URL}/token/`, data);
    console.log("Respuesta login:", response.data);

    if (rememberMe) {
      // Guardado persistente
      await AsyncStorage.setItem("access", response.data.access);
      await AsyncStorage.setItem("refresh", response.data.refresh);
    } else {
      // Guardado temporal en SecureStore
      await saveToken("accessToken", response.data.access);
      await saveToken("refreshToken", response.data.refresh);
    }

    return response.data;
  } catch (error: any) {
    console.error("Error en loginUser:", error.response?.data || error.message);
    throw error;
  }
};

// Función para cerrar sesión
export const logoutUser = async () => {
  await AsyncStorage.removeItem("access");
  await AsyncStorage.removeItem("refresh");
  await deleteToken("accessToken");
  await deleteToken("refreshToken");
};
