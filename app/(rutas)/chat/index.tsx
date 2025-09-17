import React from "react";
import { View, Text, StyleSheet } from "react-native";
import bottomNav from "../../components/bottomNav";

export default function ChatPage() {
    return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Chat con tu Coach</Text>
      <Text style={styles.subtitle}>Aquí podrás conversar con tu entrenador</Text>
      {bottomNav()}
    </View> 
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
  },
});