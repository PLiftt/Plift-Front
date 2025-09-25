import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const API_URL = "http://:8000";

// Función para obtener perfil del usuario
export const getUserProfile = async () => {
  let token = await AsyncStorage.getItem("access");
  if (!token) token = await SecureStore.getItemAsync("accessToken");
  if (!token) throw new Error("No hay token de acceso guardado");

  const response = await axios.get(`${API_URL}/profile/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Función de login
export const loginUser = async (data: {
  email: string;
  password: string;
  remember_me?: boolean;
}) => {
  const response = await axios.post(`${API_URL}/token/`, data);

  if (data.remember_me) {
    // Guardar tokens persistentes
    await AsyncStorage.setItem("access", response.data.access);
    await AsyncStorage.setItem("refresh", response.data.refresh);
  } else {
    // Guardar tokens temporales
    await SecureStore.setItemAsync("accessToken", response.data.access);
    await SecureStore.setItemAsync("refreshToken", response.data.refresh);
  }

  return response.data;
};

export const logoutUser = async () => {
  try {
    // Borrar tokens de AsyncStorage
    await AsyncStorage.removeItem("access");
    await AsyncStorage.removeItem("refresh");

    // Borrar tokens de SecureStore
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");

    console.log("Tokens eliminados correctamente");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};

export const validateToken = async () => {
  const token = await AsyncStorage.getItem("access");
  if (token) {
    return true; // Hay token → ir al home
  } else {
    return false; // No hay token → ir al login
  }
};
