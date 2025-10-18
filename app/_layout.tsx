// app/_layout.tsx (o donde tengas tu RootLayout)
import { Slot } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "app/context/appContext";
import { AIChatProvider } from "./context/aiChatContext";
import { useAppContext } from "app/context/appContext";
import React from "react";

function InnerLayout() {
  const { isDarkMode } = useAppContext();
  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={isDarkMode ? "#000" : "#fff"} translucent={false} />
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }} edges={["top"]}>
        <Slot />
      </SafeAreaView>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AIChatProvider>
        <SafeAreaProvider>
          <InnerLayout />
        </SafeAreaProvider>
      </AIChatProvider>
    </AppProvider>
  );
}
