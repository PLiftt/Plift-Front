import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { getUserProfile } from "../../../services/userService";
import BottomNav from "../../components/bottomNav";

const { width, height } = Dimensions.get("window");

interface UserProfile {
  first_name?: string;
  second_name?: string | null;
  last_name?: string;
  second_last_name?: string | null;
  bodyweight_kg?: number;
  squat_1rm?: number;
  bench_1rm?: number;
  deadlift_1rm?: number;
}

export default function EstadisticasPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const colors = {
    background: "#000",
    rectangle: "#1a1a1a",
    textPrimary: "#fff",
    textSecondary: "#EF233C",
    cardBackground: "#111",
  };

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      // 🔹 Mapear la respuesta a un formato consistente
      const mappedProfile: UserProfile = {
        first_name: data.first_name,
        second_name: data.second_name,
        last_name: data.last_name,
        second_last_name: data.second_last_name,
        bodyweight_kg: data.bodyweight_kg,
        squat_1rm: data.squat_1rm,
        bench_1rm: data.bench_1rm,
        deadlift_1rm: data.deadlift_1rm,
      };
      setProfile(mappedProfile);
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>
          No se pudo cargar el perfil.
        </Text>
      </View>
    );
  }

  const fullName = `${profile.first_name || ""} ${profile.second_name || ""} ${
    profile.last_name || ""
  } ${profile.second_last_name || ""}`.trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingTop: 20 }}>
        <View
          style={[
            styles.mainRectangle,
            { backgroundColor: colors.rectangle, alignItems: "center" },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Mi Información
          </Text>

          <View
            style={[
              styles.block,
              { backgroundColor: colors.cardBackground, alignItems: "center" },
            ]}
          >
            <Text style={[styles.blockText, { color: colors.textPrimary }]}>
              Nombre: {fullName || "—"}
            </Text>
            <Text style={[styles.blockText, { color: colors.textPrimary }]}>
              Peso: {profile.bodyweight_kg ?? "—"} kg
            </Text>
            <Text style={[styles.blockText, { color: colors.textPrimary }]}>
              1RM Squat: {profile.squat_1rm ?? "—"} kg
            </Text>
            <Text style={[styles.blockText, { color: colors.textPrimary }]}>
              1RM Bench: {profile.bench_1rm ?? "—"} kg
            </Text>
            <Text style={[styles.blockText, { color: colors.textPrimary }]}>
              1RM Deadlift: {profile.deadlift_1rm ?? "—"} kg
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  mainRectangle: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
  },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  block: {
    flexDirection: "column",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },

  blockText: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
});
