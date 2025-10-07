import { Slot } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "app/context/appContext"; // <- Importa tu provider

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#000" translucent={false} />
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
          <Slot />
        </SafeAreaView>
      </SafeAreaProvider>
    </AppProvider>
  );
}
