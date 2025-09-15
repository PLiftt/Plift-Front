import axios from "axios";
import { getToken } from "./secureStore";

const API_URL = "http://192.168.1.88:8000";

export const getUserProfile = async () => {
  const token = await getToken("accessToken");
  if (!token) throw new Error("No hay token de acceso guardado");

  const response = await axios.get(`${API_URL}/profile/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};