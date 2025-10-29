// app/_layout.tsx
import React, { useEffect, useRef } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type {
  Subscription,
  Notification as ExpoNotification,
  NotificationResponse,
} from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppProvider } from "app/context/appContext";
import { AIChatProvider } from "./context/aiChatContext";
import { useAppContext } from "app/context/appContext";
import { emit } from "./lib/eventBus";
import { ToastProvider } from "./components/TopToast";
import { registerForPushNotificationsAsync } from "services/notificationService";
import { API_URL } from "@env";

// ✅ Handler actualizado (sin shouldShowAlert deprecado)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // iOS
    shouldShowList: true, // iOS
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Evita setup duplicado en dev / hot reload
let __NOTIF_SETUP__ = false;

function InnerLayout() {
  const { isDarkMode } = useAppContext();
  const receivedSub = useRef<Subscription | null>(null);
  const responseSub = useRef<Subscription | null>(null);

  useEffect(() => {
    if (__NOTIF_SETUP__) return;
    __NOTIF_SETUP__ = true;

    (async () => {
      try {
        // 1️⃣ Obtener token de notificaciones
        const token = await registerForPushNotificationsAsync();

        if (token) {
          // 2️⃣ Guardar localmente
          await AsyncStorage.setItem("my_expo_push_token", token);
          console.log("Expo push token:", token);

          // 3️⃣ Enviar token al backend
          const accessToken = await AsyncStorage.getItem("accessToken"); // o usa getToken("accessToken") si ya lo tienes importado
          if (accessToken) {
            try {
              const res = await fetch(
                `${API_URL.replace(/\/$/, "")}/notifications/register-token/`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ token }),
                }
              );

              if (!res.ok) {
                console.warn(
                  "Error registrando token en backend:",
                  await res.text()
                );
              } else {
                console.log("✅ Token registrado en backend correctamente");
              }
            } catch (err) {
              console.warn("Error de red al registrar token:", err);
            }
          }
        }
      } catch (e) {
        console.warn("No se pudo obtener el push token:", e);
      }
    })();

    // 4️⃣ Listener: notificación recibida en foreground
    receivedSub.current = Notifications.addNotificationReceivedListener(
      (n: ExpoNotification) => {
        const data: any = n.request.content.data;
        if (data?.__local) return; // evita eco
        emit("coach-event", data);
      }
    );

    // 5️⃣ Listener: usuario tocó la notificación
    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      (r: NotificationResponse) => {
        const data: any = r.notification.request.content.data;
        if (data?.__local) return;
        emit("coach-event", data);
        // Si quieres redirigir al tocar la notificación:
        // if (data?.route) router.push(data.route);
      }
    );

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
      receivedSub.current = null;
      responseSub.current = null;
      __NOTIF_SETUP__ = false;
    };
  }, []);

  const bg = isDarkMode ? "#000" : "#fff";
  const barStyle = isDarkMode ? "light" : "dark";

  return (
    <>
      <StatusBar
        style={barStyle}
        backgroundColor={bg}
        translucent={false}
        hidden={false}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
        <Slot />
      </SafeAreaView>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <AIChatProvider>
            <InnerLayout />
          </AIChatProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </AppProvider>
  );
}
