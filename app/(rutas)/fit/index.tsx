import React from "react";
import { View, Text, StyleSheet } from "react-native";
import bottomNav from "../../components/bottomNav";

export default function FitPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏋️ Fitness</Text>
      <Text style={styles.subtitle}>Aquí podrás registrar y seguir tus entrenamientos</Text>
      {bottomNav()}
    </View>
  );
};

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
    textAlign: "center",
    paddingHorizontal: 20,
  },
});