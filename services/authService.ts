import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToken, deleteToken, getToken } from "./secureStore";
import { API_URL } from "@env";

// Helper: guardar tokens tanto en SecureStore como en AsyncStorage (opcional)
const storeTokens = async (
  access: string,
  refresh: string,
  persistent: boolean
) => {
  // Siempre guardamos en SecureStore para que el service pueda refrescar tokens
  await saveToken("accessToken", access);
  await saveToken("refreshToken", refresh);

  // Si el usuario eligió "recordarme", también guardamos en AsyncStorage
  if (persistent) {
    await AsyncStorage.setItem("access", access);
    await AsyncStorage.setItem("refresh", refresh);
  }
};

// Registrar usuario
export const registerUser = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, data);
    console.log("Respuesta del servidor:", response.data);

    if (response.data.access && response.data.refresh) {
      await storeTokens(response.data.access, response.data.refresh, false);
    }

    return response.data;
  } catch (error: any) {
    console.error(
      "Error en registerUser:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Login usuario
export const loginUser = async (
  data: { email: string; password: string },
  rememberMe: boolean
) => {
  try {
    const response = await axios.post(`${API_URL}/token/`, data);
    console.log("Respuesta login:", response.data);

    await storeTokens(response.data.access, response.data.refresh, rememberMe);

    return response.data;
  } catch (error: any) {
    console.error("Error en loginUser:", error.response?.data || error.message);
    throw error;
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  await AsyncStorage.removeItem("access");
  await AsyncStorage.removeItem("refresh");
  await deleteToken("accessToken");
  await deleteToken("refreshToken");
};

// Solicitar código de recuperación
export async function requestPasswordResetCode(email: string) {
  return axios.post(`${API_URL}/reset-password-request/`, { email });
}

// Confirmar código y cambiar contraseña
export async function confirmPasswordResetCode(
  email: string,
  code: string,
  new_password: string
) {
  return axios.post(`${API_URL}/reset-password-confirm/`, {
    email,
    code,
    new_password,
  });
}

// Función para obtener tokens (access + refresh) de manera segura
export const getTokens = async () => {
  const access = await getToken("accessToken");
  const refresh = await getToken("refreshToken");
  if (!access || !refresh) throw new Error("No hay tokens disponibles");
  return { access, refresh };
};