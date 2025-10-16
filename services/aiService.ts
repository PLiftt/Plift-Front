// app/services/aiService.ts
import axios, { AxiosError } from "axios";
import { API_URL } from "@env";
import { getToken, saveToken, deleteToken } from "./secureStore";

// ---------- Tipos ----------
export type PlannedExercise = {
  name: string;
  sets: number;
  reps: number;
  load: number;       // kg
  rpe_target?: number;
};

export type ExerciseAdjustment = {
  name: string;
  percent_change_load: number; // ej: -10
  new_load: number;
  new_sets: number;
  new_reps: number;
  new_rpe_target: number;
  notes: string;
};

export type AdjustSessionOutput = {
  overall_modifier: "maintain" | "taper_10" | "taper_20" | "overreach_5";
  session_message: string;
  adjustments: ExerciseAdjustment[];
};

// ---------- Axios base ----------
const api = axios.create({
  baseURL: API_URL?.replace(/\/+$/, "") || "http://localhost:8000",
  timeout: 20000,
});

// Bandera para evitar loops infinitos
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

// Obtiene access de SecureStore y lo inyecta
api.interceptors.request.use(async (config) => {
  const access = await getToken("accessToken");
  if (access) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${access}`;
  }
  (config.headers as any)["Content-Type"] = "application/json";
  return config;
});

// Si 401, intenta refresh y reintenta UNA vez
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    // Si no es 401 o ya se reintentó, rechaza
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    // Marca para evitar reintentos múltiples del mismo request
    original._retry = true;

    // Espera a que otro refresh termine si ya está en curso
    if (isRefreshing) {
      await new Promise<void>((resolve) => pendingRequests.push(resolve));
      return api(original); // reintenta tras refresh ajeno
    }

    // Ejecuta refresh
    isRefreshing = true;
    try {
      const refresh = await getToken("refreshToken");
      if (!refresh) throw new Error("No refresh token");

      const refreshRes = await axios.post(
        `${api.defaults.baseURL}/token/refresh/`,
        { refresh },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccess = (refreshRes.data as any)?.access;
      const newRefresh = (refreshRes.data as any)?.refresh ?? refresh;

      if (!newAccess) throw new Error("Refresh sin access");

      // Guarda tokens
      await saveToken("accessToken", newAccess);
      if (newRefresh) await saveToken("refreshToken", newRefresh);

      // Despierta a los que esperaban
      pendingRequests.forEach((cb) => cb());
      pendingRequests = [];
      isRefreshing = false;

      // Reintenta request original con nuevo token
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      // Refresh falló: limpiar tokens
      await deleteToken("accessToken");
      await deleteToken("refreshToken");
      pendingRequests.forEach((cb) => cb());
      pendingRequests = [];
      isRefreshing = false;
      return Promise.reject(e);
    }
  }
);

// ---------- Servicio: ajustar sesión ----------
export async function adjustSession(payload: {
  sleep: number;                  // 1..10
  fatigue: number;                // 1..10
  stress: number;                 // 1..10
  rpe_last: number;               // 1..10
  pain?: string;
  goal?: "strength" | "hypertrophy" | "technique";
  planned_session: PlannedExercise[];
}): Promise<AdjustSessionOutput> {
  try {
    const { data } = await api.post<AdjustSessionOutput>(
      "/ai/adjust-session/",
      payload
    );
    return data;
  } catch (err: any) {
    // Mensaje legible para el widget
    const msg =
      err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Error desconocido";
    throw new Error(`Error al ajustar sesión: ${msg}`);
  }
}
