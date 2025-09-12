import React from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";

const IndexScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Imagen de fondo */}
      <ImageBackground
        source={require("../../assets/fondobg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
  {/* Contenedor principal en rectángulo */}
  <View style={styles.mainRectangle}>
    {/* DASHBOARD */}
    <Text style={styles.sectionTitle}>DASHBOARD</Text>
    <Text style={styles.time}>11:00</Text>

    {/* PERSONAL RECORDS */}
    <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
    <View style={styles.records}>
      <View style={styles.recordItem}>
        <Text style={styles.recordName}>SQUAT</Text>
        <Text style={styles.recordValue}>160 kg</Text>
      </View>
      <View style={styles.recordItem}>
        <Text style={styles.recordName}>BENCH</Text>
        <Text style={styles.recordValue}>125 kg</Text>
      </View>
      <View style={styles.recordItem}>
        <Text style={styles.recordName}>DEADLIFT</Text>
        <Text style={styles.recordValue}>200 kg</Text>
      </View>
    </View>

    {/* ENTRENAMIENTOS RECIENTES */}
    <Text style={styles.sectionTitle}>ENTRENAMIENTOS RECIENTES</Text>
    <View style={styles.recentWorkout}>
      <Text style={styles.workoutDate}>Mar 8, 2024</Text>
      <Text style={styles.workoutName}>SQUAT</Text>
      <Text style={styles.workoutDetails}>4 sets x 5 reps @ 160 kg</Text>
    </View>

    {/* HISTORIAL */}
    <Text style={styles.sectionTitle}>HISTORIAL</Text>
    <View style={styles.history}>
      <Text style={styles.historyText}>5 7 8 1 9 6</Text>
    </View>
  </View>
</ScrollView>

      {/* Barra inferior con botones */}
      <View style={styles.bottomNav}>
        {/* Home */}
        <TouchableOpacity style={styles.navButton} onPress={() => router.push("/home")}>
          <Ionicons name="home-outline" size={28} color="#EF233C" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        {/* Estadísticas */}
        <TouchableOpacity style={styles.navButton} onPress={() => router.push("/stats")}>
          <Ionicons name="stats-chart-outline" size={28} color="#EF233C" />
          <Text style={styles.navText}>Estadísticas</Text>
        </TouchableOpacity>

        {/* Botón central flotante con solo el icono de la pesa */}
        <TouchableOpacity style={styles.floatingButton} onPress={() => router.push("/fit")}>
          <FontAwesome5 name="dumbbell" size={36} color="#fff" />
        </TouchableOpacity>

        {/* Chat con Coach */}
        <TouchableOpacity style={styles.navButton} onPress={() => router.push("/chat")}>
          <MaterialIcons name="chat" size={28} color="#EF233C" />
          <Text style={styles.navText}>Chat Coach</Text>
        </TouchableOpacity>

        {/* Perfil */}
        <TouchableOpacity style={styles.navButton} onPress={() => router.push("/perfil")}>
          <Ionicons name="person-circle-outline" size={28} color="#EF233C" />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  backgroundImage: { position: "absolute", width: "100%", height: "100%" },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mainRectangle: {
  backgroundColor: "rgba(26,26,26,0.9)", // rectángulo oscuro semi-transparente
  borderRadius: 20,
  padding: 20,
  margin: 20, // separación de los bordes de la pantalla
},

  contentContainer: {
  backgroundColor: "rgba(26,26,26,0.85)", // rectángulo oscuro semiopaco
  borderRadius: 20,
  padding: 20,
  margin: 20, // margen para que no toque los bordes de la pantalla
},
  container2: {
    flex: 1,
    
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#EF233C",
    marginTop: 20,
    marginBottom: 10,
  },
  time: {
    fontSize: 16,
    color: "#fff",
  },
  records: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
  },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  recordName: {
    color: "#fff",
    fontWeight: "500",
  },
  recordValue: {
    color: "#EF233C",
    fontWeight: "bold",
  },
  recentWorkout: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
  },
  workoutDate: {
    color: "#aaa",
    marginBottom: 5,
  },
  workoutName: {
    color: "#fff",
    fontWeight: "500",
    marginBottom: 3,
  },
  workoutDetails: {
    color: "#EF233C",
    fontWeight: "bold",
  },
  history: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  historyText: {
    color: "#fff",
    fontWeight: "500",
  },

  
  navButton: { flex: 1, alignItems: "center" },
  floatingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EF233C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30, // sobresale sobre la barra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // para Android
  },
  navText: { color: "#fff", fontSize: 12, marginTop: 4, fontWeight: "500" },
});
