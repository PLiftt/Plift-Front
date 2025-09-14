import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; 

export const registerUser = async (data: any) => {
  const response = await axios.post(`${API_URL}/register/`, data);
  console.log(response)
  return response.data;
};
