// services/contactService.ts
import axios from "axios";
import { API_URL } from "@env";

export type ContactAttachment = { uri: string; name?: string; type?: string };

export type ContactPayload = {
  email?: string;
  subject: string;
  message: string;
  attachments?: ContactAttachment[];
  client_request_id?: string;
  locale?: string;
};

const buildEndpoint = () => {
  // Quita slash final de API_URL si viene con slash y agrega la ruta exacta
  // Asegúrate que tu Django tenga esta ruta en urls.py: path("api/contact/", ...)
  const base = (API_URL || "").replace(/\/$/, "");
  return `${base}/api/contact/`; // <-- slash final obligatorio en DRF si configuraste así
};

export async function sendContactMessage(
  payload: ContactPayload,
  token?: string
) {
  const form = new FormData();

  if (payload.email) form.append("email", payload.email);
  form.append("subject", payload.subject);
  form.append("message", payload.message);

  if (payload.client_request_id) {
    form.append("client_request_id", payload.client_request_id);
  }
  if (payload.locale) {
    form.append("locale", payload.locale);
  }

  if (payload.attachments?.length) {
    payload.attachments.forEach((f, i) => {
      // Formato de archivo en React Native (Expo): { uri, name, type }
      // @ts-ignore: RN FormData
      form.append("attachments", {
        uri: f.uri,
        name: f.name || `attachment-${i}.jpg`,
        type: f.type || "image/jpeg",
      } as any);
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "multipart/form-data",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const ENDPOINT = buildEndpoint();

  // Logs útiles para depurar si aparece 404/Network Error
  // console.log("API_URL:", API_URL);
  // console.log("POST to:", ENDPOINT);

  const { data } = await axios.post(ENDPOINT, form, {
    headers,
    timeout: 15000,
  });
  return data;
}
