import { Stack } from "expo-router";

export default function RutasLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Oculta el header por defecto
      }}
    >
      <Stack.Screen name="home/index" options={{ title: "Home" }} />
      <Stack.Screen name="login/index" options={{ title: "Login" }} />
      <Stack.Screen name="register/index" options={{ title: "Registro" }} />
      <Stack.Screen name="perfil/index" options={{ title: "Perfil" }} />
      <Stack.Screen name="fit/index" options={{ title: "Fit" }} />
      <Stack.Screen name="estadisticas/index" options={{ title: "Estadísticas" }} />
      <Stack.Screen name="chat/index" options={{ title: "Chat" }} />
    </Stack>
  );
}