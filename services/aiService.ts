// services/aiService.ts
import { API_URL } from "@env";
import { getToken } from "./secureStore";

export interface CheckinData {
  sleep_quality: number;
  fatigue: number;
  stress: number;
  soreness: string;
  last_rpe: number;
}

async function authHeaders() {
  const token = await getToken("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// --- 1️⃣ Enviar feedback diario a la IA ---
export async function sendCheckin(data: CheckinData) {
  try {
    const res = await fetch(`${API_URL}/feedback/`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Error en backend: ${res.status} - ${text}` };
    }

    const result = await res.json();
    return result; // contiene adjustments, modified_exercises, session_id
  } catch (error: any) {
    return { error: error.message || "Error desconocido" };
  }
}

// --- 2️⃣ Confirmar los ajustes sugeridos ---
export async function confirmAdjustments(
  sessionId: number,
  accepted: Record<string, boolean>
) {
  try {
    const res = await fetch(`${API_URL}/feedback/confirm/`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ session_id: sessionId, accepted }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Error en backend: ${res.status} - ${text}` };
    }

    const result = await res.json();
    return result;
  } catch (error: any) {
    return { error: error.message || "Error desconocido" };
  }
}

// --- 3️⃣ Función auxiliar para mostrar texto legible ---
export function formatExerciseAdjustments(
  modifiedExercises: any[],
  adjustments: any
) {
  return modifiedExercises
    .map((ex) => {
      const aiName = Object.keys(adjustments).find(
        (k) =>
          ex.name.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(ex.name.toLowerCase())
      );

      const adj = aiName ? adjustments[aiName] : null;
      if (!adj) return `${ex.name}: sin cambios sugeridos`;

      const parts: string[] = [];

      if (adj.weight !== undefined) parts.push(`Peso: ${adj.weight} kg`);
      if (adj.reps !== undefined) parts.push(`Reps: ${adj.reps}`);
      if (adj.sets !== undefined) parts.push(`Sets: ${adj.sets}`);
      if (adj.rpe !== undefined) parts.push(`RPE: ${adj.rpe}`);
      if (adj.reason) parts.push(`Motivo: ${adj.reason}`);

      return `${ex.name} → ${parts.join(", ")}`;
    })
    .join("\n");
}