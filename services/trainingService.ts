import axios from "axios";
import { getToken } from "./secureStore";
import { API_URL } from "@env";

// -------------------- BLOQUES --------------------

export const getBlocks = async () => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.get(`${API_URL}/trainingblocks/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en getBlocks:", error.response?.data || error.message);
        throw error;
    }
};

export const getBlockById = async (id: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.get(`${API_URL}/trainingblocks/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en getBlockById:", error.response?.data || error.message);
        throw error;
    }
};

export const createBlock = async (data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.post(`${API_URL}/trainingblocks/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en createBlock:", error.response?.data || error.message);
        throw error;
    }
};

export const updateBlock = async (id: number, data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.put(`${API_URL}/trainingblocks/${id}/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en updateBlock:", error.response?.data || error.message);
        throw error;
    }
};

export const deleteBlock = async (id: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.delete(`${API_URL}/trainingblocks/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en deleteBlock:", error.response?.data || error.message);
        throw error;
    }
};

// -------------------- SESIONES --------------------

export const getSessions = async (blockId: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.get(`${API_URL}/trainingsessions/?block=${blockId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en getSessions:", error.response?.data || error.message);
        throw error;
    }
};

export const createSession = async (data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.post(`${API_URL}/trainingsessions/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en createSession:", error.response?.data || error.message);
        throw error;
    }
};

export const updateSession = async (id: number, data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.put(`${API_URL}/trainingsessions/${id}/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en updateSession:", error.response?.data || error.message);
        throw error;
    }
};

export const deleteSession = async (id: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.delete(`${API_URL}/trainingsessions/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en deleteSession:", error.response?.data || error.message);
        throw error;
    }
};

// -------------------- EJERCICIOS --------------------

export const getExercises = async (sessionId: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.get(`${API_URL}/exercises/?session=${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en getExercises:", error.response?.data || error.message);
        throw error;
    }
};

export const createExercise = async (data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.post(`${API_URL}/exercises/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en createExercise:", error.response?.data || error.message);
        throw error;
    }
};

export const updateExercise = async (id: number, data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.put(`${API_URL}/exercises/${id}/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en updateExercise:", error.response?.data || error.message);
        throw error;
    }
};

export const deleteExercise = async (id: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.delete(`${API_URL}/exercises/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en deleteExercise:", error.response?.data || error.message);
        throw error;
    }
};

// -------------------- PROGRESO DEL ATLETA --------------------

export const getProgress = async () => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.get(`${API_URL}/athleteprogress/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en getProgress:", error.response?.data || error.message);
        throw error;
    }
};

export const createProgress = async (data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.post(`${API_URL}/athleteprogress/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en createProgress:", error.response?.data || error.message);
        throw error;
    }
};

export const updateProgress = async (id: number, data: any) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.put(`${API_URL}/athleteprogress/${id}/`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en updateProgress:", error.response?.data || error.message);
        throw error;
    }
};

export const deleteProgress = async (id: number) => {
    try {
        const token = await getToken("accessToken");
        const response = await axios.delete(`${API_URL}/athleteprogress/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error en deleteProgress:", error.response?.data || error.message);
        throw error;
    }
};
