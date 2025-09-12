import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Dimensions, Image } from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

const IndexScreen: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const toggleMode = () => setIsDarkMode(!isDarkMode);

  const colors = {
    background: isDarkMode ? "#000" : "#f9f9f9",
    rectangle: isDarkMode ? "rgba(26,26,26,0.9)" : "#fff",
    textPrimary: isDarkMode ? "#fff" : "#000",
    textSecondary: "#EF233C",
    cardBackground: isDarkMode ? "#1a1a1a" : "#e0e0e0",
    navBackground: isDarkMode ? "#1a1a1a" : "#ddd",
    navText: isDarkMode ? "#fff" : "#000",
    floatingButton: "#EF233C",
    watermark: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    hoverRed: "rgba(239,35,60,0.2)",
  };

  const renderNavButton = (name: string, icon: React.ReactNode, label: string, route: string) => {
    const isHovered = hoveredButton === name;
    return (
      <Pressable
        key={name}
        onPress={() => router.push(route)}
        onHoverIn={() => setHoveredButton(name)}
        onHoverOut={() => setHoveredButton(null)}
        style={({ pressed }) => [
          styles.navButton,
          (pressed || isHovered) && {
            backgroundColor: colors.hoverRed,
            borderRadius: 10,
            shadowColor: "#EF233C",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          },
        ]}
      >
        {icon}
        <Text style={[styles.navText, { color: colors.navText }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Watermark */}
      <Text style={[styles.watermark, { color: colors.watermark }]}>PL</Text>

      {/* Switch modo oscuro/claro */}
      <View style={styles.modeSwitch}>
        {isDarkMode ? (
          <Ionicons name="moon" size={24} color={colors.textPrimary} style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="sunny" size={24} color={colors.textPrimary} style={{ marginRight: 8 }} />
        )}
        <Switch value={isDarkMode} onValueChange={toggleMode} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingTop: 5 }}>
        <View style={[styles.header, { zIndex: 2 }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>JP</Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>Hola, Juan Perez</Text>
        </View>

        <View style={[styles.mainRectangle, { backgroundColor: colors.rectangle }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DASHBOARD</Text>
          <Text style={[styles.time, { color: colors.textPrimary }]}>11:00</Text>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONAL RECORDS</Text>
          <View style={[styles.records, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.recordItem}>
              <Text style={[styles.recordName, { color: colors.textPrimary }]}>SQUAT</Text>
              <Text style={[styles.recordValue, { color: colors.textSecondary }]}>160 kg</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordName, { color: colors.textPrimary }]}>BENCH</Text>
              <Text style={[styles.recordValue, { color: colors.textSecondary }]}>125 kg</Text>
            </View>
            <View style={styles.recordItem}>
              <Text style={[styles.recordName, { color: colors.textPrimary }]}>DEADLIFT</Text>
              <Text style={[styles.recordValue, { color: colors.textSecondary }]}>200 kg</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENTRENAMIENTOS RECIENTES</Text>
          <View style={[styles.recentWorkout, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.workoutDate, { color: colors.textPrimary }]}>Mar 8, 2024</Text>
            <Text style={[styles.workoutName, { color: colors.textPrimary }]}>SQUAT</Text>
            <Text style={[styles.workoutDetails, { color: colors.textSecondary }]}>4 sets x 5 reps @ 160 kg</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HISTORIAL</Text>
          <View style={[styles.history, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.historyText, { color: colors.textPrimary }]}>5 7 8 1 9 6</Text>
          </View>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logoplift.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: colors.navBackground }]}>
        {renderNavButton("home", <Ionicons name="home-outline" size={28} color="#EF233C" />, "Home", "/home")}
        {renderNavButton("stats", <Ionicons name="stats-chart-outline" size={28} color="#EF233C" />, "Estadísticas", "/stats")}

        <Pressable
          onPress={() => router.push("/fit")}
          style={({ pressed }) => [
            styles.floatingButton,
            { backgroundColor: colors.floatingButton },
            pressed && { backgroundColor: colors.hoverRed, shadowColor: "#EF233C", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 },
          ]}
        >
          <FontAwesome5 name="dumbbell" size={36} color="#fff" />
        </Pressable>

        {renderNavButton("chat", <MaterialIcons name="chat" size={28} color="#EF233C" />, "Chat Coach", "/chat")}
        {renderNavButton("perfil", <Ionicons name="person-circle-outline" size={28} color="#EF233C" />, "Perfil", "/perfil")}
      </View>
    </View>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: "absolute",
    fontSize: 200,
    fontWeight: "bold",
    alignSelf: "center",
    top: height / 3,
    textAlign: "center",
    zIndex: 0,
  },
  modeSwitch: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    alignItems: "center",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontWeight: "bold", fontSize: 18 },
  userName: { fontSize: 18, fontWeight: "600" },
  mainRectangle: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
    zIndex: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  time: { fontSize: 16 },
  records: { borderRadius: 12, padding: 15 },
  recordItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  recordName: { fontWeight: "500" },
  recordValue: { fontWeight: "bold" },
  recentWorkout: { borderRadius: 12, padding: 15 },
  workoutDate: { marginBottom: 5 },
  workoutName: { fontWeight: "500", marginBottom: 3 },
  workoutDetails: { fontWeight: "bold" },
  history: { borderRadius: 12, padding: 15, marginBottom: 10 },
  historyText: { fontWeight: "500" },
  logoContainer: { alignItems: "center", marginTop: 5, marginBottom: 20 },
  logo: { width: 80, height: 40 },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navButton: { flex: 1, alignItems: "center", paddingVertical: 5 },
  floatingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  navText: { fontSize: 12, marginTop: 4, fontWeight: "500" },
});
