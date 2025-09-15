import * as SecureStore from "expo-secure-store";

export async function saveToken(key: string, value: any) {
  if (value === undefined || value === null) {
    console.warn(`saveToken: valor de ${key} es nulo o undefined`);
    return;
  }
  try {
    // Convertimos a string por si es objeto
    await SecureStore.setItemAsync(key, typeof value === "string" ? value : JSON.stringify(value));
    console.log(`Token guardado: ${key}`);
  } catch (e) {
    console.error("Error guardando token:", e);
  }
}

export async function getToken(key: string) {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return null;
    try {
      // Intentamos parsear si es JSON
      return JSON.parse(value);
    } catch {
      return value; // si no es JSON, devolvemos el string
    }
  } catch (e) {
    console.error("Error obteniendo token:", e);
    return null;
  }
}

export async function deleteToken(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
    console.log(`Token eliminado: ${key}`);
  } catch (e) {
    console.error("Error eliminando token:", e);
  }
}