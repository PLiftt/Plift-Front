import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_URL } from "@env";
import { getToken } from "./secureStore";

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permiso de notificaciones denegado");
      return;
    }

    const projectId = "e291c1ec-713c-4355-8356-64e13deae4b6"; // <- lo sacas desde app.json o https://expo.dev/accounts/<usuario>/projects/<proyecto>
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Expo push token:", token);
  } else {
    alert("Debes usar un dispositivo físico para recibir notificaciones");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

export async function sendPushTokenToBackend(token: string) {
  const accessToken = await getToken("accessToken");

  await fetch(`${API_URL}/notifications/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ expo_token: token }),
  });
}
