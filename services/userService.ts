import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL } from "@env";

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

export const updateProfile = async (data: {
  first_name?: string;
  second_name?: string;
  last_name?: string;
  second_last_name?: string;
  peso?: number;
  rm1?: {
    squat?: number;
    benchPress?: number;
    deadlift?: number;
  };
}) => {
  try {
    let token = await AsyncStorage.getItem("access");
    if (!token) token = await SecureStore.getItemAsync("accessToken");

    const res = await fetch(`${API_URL}/update-profile/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error al actualizar perfil");

    return await res.json();
  } catch (err) {
    console.error("Error en updateProfile:", err);
    throw err;
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
