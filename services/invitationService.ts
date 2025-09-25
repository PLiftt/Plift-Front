import axios from "axios";

const API_URL = "http://:8000";

export const createInvitation = async (token: string, athleteMail?: string) => {
  const payload = athleteMail ? { athlete: athleteMail } : { athlete: "" };
  const response = await axios.post(`${API_URL}/invitations/`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Aceptar invitación (athlete con código)
export const acceptInvitation = async (token: string, code: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/invitations/accept/`,
      { code },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al aceptar la invitación:", error);
    throw error;
  }
};

// (Opcional) Rechazar invitación
export const rejectInvitation = async (token: string, code: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/invitations/reject/`,
      { code },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al rechazar la invitación:", error);
    throw error;
  }
};
