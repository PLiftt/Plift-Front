import React from "react";
import { View, Text, StyleSheet } from "react-native";

const EstadisticasScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Estadísticas</Text>
      <Text style={styles.subtitle}>Aquí verás tu progreso y métricas</Text>
    </View>
  );
};

export default EstadisticasScreen;

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
