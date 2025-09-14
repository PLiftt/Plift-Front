import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; 

export const registerUser = async (data: any) => {
  const response = await axios.post(`${API_URL}/register/`, data);
  console.log(response)
  return response.data;
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    console.log(data)
    const response = await axios.post(`${API_URL}/token/`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error en loginUser:", error.response?.data || error.message);
    throw error;
  }
};