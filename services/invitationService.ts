import axios from "axios";

const API_URL = "http://:8000"; 

export const createInvitation = async (token: string, athleteMail: string) => {
    const response = await axios.post(`${API_URL}/invitations/`,
    { email: athleteMail },
    {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}

export const acceptInvitation = async (token: string, code: number) => {
    const response = await axios.post(`${API_URL}/invitations/accept/`, {code},
    {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
}