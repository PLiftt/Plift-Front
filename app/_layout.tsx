// app/_layout.tsx
import { Slot } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000" translucent={false} />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
