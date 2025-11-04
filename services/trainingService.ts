// services/trainingService.ts
import { API_URL } from "@env";
import { getToken } from "./secureStore";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from "react-native";
import * as WebBrowser from 'expo-web-browser';


async function authHeaders() {
  const token = await getToken("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ---- Blocks ----
export async function getBlocks() {
  const res = await fetch(`${API_URL}/blocks/`, {
    headers: await authHeaders(),
  });
  return res.json();
}
export async function createBlock(data: any) {
  const res = await fetch(`${API_URL}/blocks/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}
export async function deleteBlock(id: number) {
  return fetch(`${API_URL}/blocks/${id}/`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
}

// ---- Sessions ----
export async function getSessions(blockId: number) {
  const res = await fetch(`${API_URL}/sessions/?block=${blockId}`, {
    headers: await authHeaders(),
  });
  return res.json();
}
export async function createSession(data: any) {
  const res = await fetch(`${API_URL}/sessions/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}
export async function deleteSession(id: number) {
  return fetch(`${API_URL}/sessions/${id}/`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
}

// ---- Exercises ----
export async function getExercises(sessionId: number) {
  const res = await fetch(`${API_URL}/exercises/?session=${sessionId}`, {
    headers: await authHeaders(),
  });
  return res.json();
}
export async function createExercise(data: any) {
  const res = await fetch(`${API_URL}/exercises/`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}
export async function deleteExercise(id: number) {
  return fetch(`${API_URL}/exercises/${id}/`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
}

// Servicios para progreso por bloque y graficos de la evolucion de fuerza

export async function getBlockProgress(blockId: number) {
  const res = await fetch(`${API_URL}/progress/block_progress/?block=${blockId}`, {
    headers: await authHeaders(),
  });
  return res.json();
}

export async function getStrengthChart() {
  const res = await fetch(`${API_URL}/progress/strength_chart/`, {
    headers: await authHeaders(),
  });
  return res.json();
}

// Descargar reporte de progreso en PDF

export async function getAthleteProgressReport(athleteId: number) {
  const headers = await authHeaders();
  const url = `${API_URL}/progress/progress_report/?athlete=${athleteId}`;

  const response = await fetch(url, { method: "GET", headers });

  if (!response.ok) {
    const errorDetail = await response.text();
    throw new Error(`Error al obtener el reporte: ${errorDetail}`);
  }

  const data = await response.json();

  // El endpoint devuelve un array de bloques
  if (!Array.isArray(data)) {
    return [];
  }

  return data;
}
