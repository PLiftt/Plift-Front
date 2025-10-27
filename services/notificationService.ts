// services/notificationService.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Asset } from "expo-asset";

// ====== ANDROID: canal por defecto (recomendado) ======
async function ensureAndroidChannelAsync() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    sound: "default",
  });
}

// ====== REGISTRO PUSH (Expo Push Token) ======
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  try {
    // Permisos
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("Notificaciones: permiso denegado");
      return null;
    }

    // Android: canal
    await ensureAndroidChannelAsync();

    // Token Expo (sin projectId -> Opción B)
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data ?? null;
  } catch (e) {
    console.warn("Error registrando notificaciones:", e);
    return null;
  }
}

// ====== NOTIFICACIÓN LOCAL (GENÉRICA) ======
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      // iOS foreground override (puedes omitir si ya usas setNotificationHandler)
      // sound: true,
    },
    trigger: null, // inmediata
  });
}

// ====== NOTIFICACIÓN LOCAL CON LOGO (iOS attachments) ======
export async function scheduleLocalNotificationWithLogo(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  // 1) Carga el asset local del logo
  const asset = Asset.fromModule(require("../assets/logoplift.png"));
  try {
    await asset.downloadAsync();
  } catch {
    // si falla, seguimos sin adjunto
  }

  // 2) Tipo extendido para incluir 'attachments' (solo iOS)
  type IOSAttachment = { identifier: string; url: string; type?: string };
  type ContentWithAttachments = Notifications.NotificationContentInput & {
    attachments?: IOSAttachment[];
  };

  // 3) Construir el contenido base
  const content: ContentWithAttachments = {
    title,
    body,
    data,
    // sound: true,
  };

  // 4) Agregar attachment únicamente en iOS si tenemos localUri
  if (Platform.OS === "ios" && asset.localUri) {
    content.attachments = [
      {
        identifier: "logo",
        url: asset.localUri,
        type: "image/png", // o "jpeg" según tu archivo
      },
    ];
  }

  // 5) Programar la notificación
  return Notifications.scheduleNotificationAsync({
    content: content as Notifications.NotificationContentInput, // cast seguro
    trigger: null, // inmediata
  });
}

// ====== “Notificar al atleta” (wrapper local para no romper tu flujo) ======
type AthleteNotifPayload = {
  event: "NEW_BLOCK" | "NEW_SESSION" | string;
  athleteId?: number;
  blockId?: number;
  sessionId?: number;
};

export async function triggerAthleteNotification(payload: AthleteNotifPayload) {
  try {
    const isNewBlock = payload.event === "NEW_BLOCK";
    const title = isNewBlock
      ? "Nuevo bloque asignado"
      : "Nueva sesión disponible";
    const body = isNewBlock
      ? "Tu coach ha creado un nuevo bloque."
      : "Tu coach ha agregado una nueva sesión.";

    // Adjuntar logo en iOS; en Android se usa el small icon global del app.json
    await scheduleLocalNotificationWithLogo(title, body, {
      ...payload,
      route: isNewBlock ? "/fit" : undefined,
    });
  } catch (e) {
    console.warn("triggerAthleteNotification error:", e);
    // fallback sin logo
    await scheduleLocalNotification(
      "Notificación",
      "Tienes una actualización.",
      payload as any
    );
  }
}
