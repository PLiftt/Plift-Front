// app/_layout.tsx
import React, { useEffect, useRef } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { Subscription, Notification as ExpoNotification, NotificationResponse } from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppProvider } from "app/context/appContext";
import { AIChatProvider } from "./context/aiChatContext";
import { useAppContext } from "app/context/appContext";
import { emit } from "./lib/eventBus";
import { ToastProvider } from "./components/TopToast";
import { registerForPushNotificationsAsync } from "services/notificationService";

// ✅ Handler actualizado (sin shouldShowAlert deprecado)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // iOS
    shouldShowList: true,   // iOS
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
        // 1) Obtener Expo Push Token (Opción B)
        const token = await registerForPushNotificationsAsync();
        if (token) {
          // 2) Guardar localmente (si quieres mostrarlo/compartir)
          await AsyncStorage.setItem("my_expo_push_token", token);

          // 3) Avisar al resto de la app (opcional)
          emit("push-token-ready", { token });
        }
      } catch (e) {
        console.warn("No se pudo obtener el push token:", e);
      }
    })();

    // 4) Listener: notificación recibida en foreground
    receivedSub.current = Notifications.addNotificationReceivedListener((n: ExpoNotification) => {
      const data: any = n.request.content.data;
      // ⛔ evita eco si marcaste notificaciones locales
      if (data?.__local) return;
      emit("coach-event", data);
    });

    // 5) Listener: usuario tocó la notificación
    responseSub.current = Notifications.addNotificationResponseReceivedListener((r: NotificationResponse) => {
      const data: any = r.notification.request.content.data;
      if (data?.__local) return; // ⛔ evita eco
      emit("coach-event", data);
      // si envías { route, params } desde el push, puedes navegar:
      // import { router } from "expo-router";
      // if (data?.route) router.push(data?.params ? { pathname: data.route, params: data.params } : data.route);
    });

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
      <StatusBar style={barStyle} backgroundColor={bg} translucent={false} hidden={false} />
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
