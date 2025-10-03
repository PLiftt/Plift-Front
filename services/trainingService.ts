// services/trainingService.ts
import { API_URL } from "@env";
import { getToken } from "./secureStore";

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
