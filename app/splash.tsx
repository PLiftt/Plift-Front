import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { validateToken } from "services/userService";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const token = await validateToken();
      if (token) {
        router.replace("/(rutas)/home"); // Hay token → ir al home
      } else {
        router.replace("/(rutas)/login"); // No hay token → ir al login
      }
    };
    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#EF233C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
