import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUserProfile } from "../../../services/userService";
import { deleteToken, getToken } from "../../../services/secureStore";
import { createInvitation } from "../../../services/invitationService";
import BottomNav from "../../components/bottomNav";

const { width, height } = Dimensions.get("window");

interface UserProfile {
  first_name?: string;
  second_name?: string | null;
  last_name?: string;
  second_last_name?: string | null;
  email: string;
  role: "ATHLETE" | "COACH" | string;
  coach?: { coach?: { email?: string } };
  athletes?: {
    id: number;
    athlete_name: string;
    athlete_email: string;
  }[];
}

const HomeScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [athleteEmail, setAthleteEmail] = useState<string>("");
  const router = useRouter();

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
  };

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      await deleteToken("accessToken");
      await deleteToken("refreshToken");
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const token = await getToken("accessToken");
      if (!token) throw new Error("Token no disponible");

      const payload = athleteEmail.trim() ? athleteEmail.trim() : undefined;

      const result = await createInvitation(token, payload);
      Alert.alert("Código generado", `El código es: ${result.code}`);
      setAthleteEmail(""); // limpiar input
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.athlete) {
        Alert.alert("Error", error.response.data.athlete);
      } else if (error.response?.data?.detail) {
        Alert.alert("Error", error.response.data.detail);
      } else {
        Alert.alert("Error", "No se pudo generar la invitación");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#EF233C" />
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
  const initials = fullName ? fullName[0].toUpperCase() : profile.email[0].toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingTop: 5 }}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>{initials}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {`Hola, ${profile.first_name || "Sin nombre"}`}
          </Text>
        </View>

        {/* Dashboard */}
        <View style={[styles.mainRectangle, { backgroundColor: colors.rectangle }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {profile.role.toUpperCase() === "ATHLETE"
              ? "Mi Progreso"
              : profile.role.toUpperCase() === "COACH"
              ? "Mis Atletas"
              : "Panel Principal"}
          </Text>

          {/* COACH: mostrar atletas y botón */}
          {profile.role.toUpperCase() === "COACH" && (
            <View>
              {profile.athletes?.map((a) => (
                <View key={a.id} style={[styles.block, { backgroundColor: colors.cardBackground }]}>
                  <Ionicons name="person-circle-outline" size={22} color="#EF233C" />
                  <View>
                    <Text style={[styles.blockText, { color: colors.textPrimary }]}>{a.athlete_name}</Text>
                    <Text style={[styles.info, { color: colors.textPrimary }]}>{a.athlete_email}</Text>
                  </View>
                </View>
              ))}

              {/* Input para correo */}
              <TextInput
                style={styles.input}
                placeholder="Correo del atleta (opcional)"
                value={athleteEmail}
                onChangeText={setAthleteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Botón generar código */}
              <TouchableOpacity style={[styles.generateButton]} onPress={handleGenerateCode}>
                <Text style={styles.generateButtonText}>Generar Código</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
};

export default HomeScreen;

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
    opacity: 0.05, 
  },

  modeSwitch: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    alignItems: "center",
    zIndex: 1,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ccc",
  },

  avatarText: { fontWeight: "bold", fontSize: 40 },

  userName: { fontSize: 18, fontWeight: "600", marginTop: 8 },

  info: { fontSize: 14, marginBottom: 5, textAlign: "center" },

  mainRectangle: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
    zIndex: 1,
    backgroundColor: "#fff", // fondo por defecto
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },

  block: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: "#f5f5f5",
  },

  blockText: { fontSize: 16, fontWeight: "600", marginLeft: 10 },

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
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },

  navButton: { flex: 1, alignItems: "center", paddingVertical: 5 },

  floatingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    backgroundColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  navText: { fontSize: 12, marginTop: 4, fontWeight: "500" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginTop: 10,
    backgroundColor: "#fff",
  },

  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },

  generateButton: {
  backgroundColor: "#28a745", 
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 15,
},

generateButtonText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
},
});
