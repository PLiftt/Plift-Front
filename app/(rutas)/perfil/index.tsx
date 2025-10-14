import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile } from "../../../services/userService";
import { deleteToken, getToken } from "../../../services/secureStore";
import { useRouter } from "expo-router";
import BottomNav from "../../components/bottomNav";
import { acceptInvitation } from "../../../services/invitationService";
import { logoutUser } from "../../../services/userService";
import { useAppContext } from "app/context/appContext";
import { FontAwesome5 } from "@expo/vector-icons";

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
    athlete: number;
    athlete_name: string;
    athlete_email: string;
    coach: number;
    coach_name: string;
    coach_email: string;
    start_date: string;
    end_date?: string | null;
  }[];
}

// ⬇️ Localización de etiquetas para PR (en vez de statsData estático)
const getStatsData = (lang: "es" | "en") => [
  {
    label: lang === "es" ? "Sentadilla" : "Squat",
    value: "180",
    unit: "kg",
    icon: "dumbbell",
    color: "#EF233C",
  },
  {
    label: lang === "es" ? "Press Banca" : "Bench Press",
    value: "135",
    unit: "kg",
    icon: "dumbbell",
    color: "#EF233C",
  },
  {
    label: lang === "es" ? "Peso Muerto" : "Deadlift",
    value: "210",
    unit: "kg",
    icon: "weight-hanging",
    color: "#EF233C",
  },
  {
    label: lang === "es" ? "Total" : "Total",
    value: "525",
    unit: "kg",
    icon: "trophy",
    color: "#EF233C",
  },
];

const PerfilScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const router = useRouter();
  const { isDarkMode, language } = useAppContext();

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/(rutas)/login");
  };

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error: any) {
      console.error(error);
      if (
        error.response?.data?.code === "token_not_valid" ||
        error.message?.includes("No hay token de acceso")
      ) {
        Alert.alert(
          language === "es" ? "Sesión expirada" : "Session expired",
          language === "es"
            ? "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
            : "Your session has expired. Please log in again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await deleteToken("accessToken");
                await deleteToken("refreshToken");
                navigation.replace("login");
              },
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCode = async () => {
    try {
      const token = await getToken("accessToken");
      if (!token) throw new Error("Token no disponible");

      if (!inviteCode.trim()) {
        Alert.alert(
          language === "es" ? "Error" : "Error",
          language === "es"
            ? "Debes ingresar un código válido"
            : "You must enter a valid code"
        );
        return;
      }

      await acceptInvitation(token, inviteCode.trim());
      Alert.alert(
        language === "es" ? "¡Éxito!" : "Success!",
        language === "es"
          ? "Invitación aceptada correctamente"
          : "Invitation accepted successfully"
      );
      setInviteCode("");
      setModalVisible(false);
      fetchProfile();
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.code ||
        error.response?.data?.detail ||
        (language === "es"
          ? "No se pudo aceptar la invitación"
          : "Could not accept invitation");
      Alert.alert(language === "es" ? "Error" : "Error", errorMessage);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? "#0F0F0F" : "#F9F9F9",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#EF233C" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#0F0F0F" : "#F9F9F9" },
        ]}
      >
        <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
          {language === "es"
            ? "No se pudo cargar el perfil."
            : "Could not load profile."}
        </Text>
      </View>
    );
  }

  const fullName = `${profile.first_name || ""} ${profile.second_name || ""} ${
    profile.last_name || ""
  } ${profile.second_last_name || ""}`.trim();

  // ⬇️ stats dependientes del idioma
  const statsData = getStatsData(language === "es" ? "es" : "en");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#0F0F0F" : "#F9F9F9" },
      ]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: "#EF233C" }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {fullName
                  ? fullName[0].toUpperCase()
                  : profile.email[0].toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.name, { color: "#fff" }]}>
              {fullName || profile.email}
            </Text>
            <Text style={{ color: "#FFD6D6", fontSize: 14 }}>
              {language === "es"
                ? `Rol: ${profile.role}`
                : `Role: ${profile.role}`}
            </Text>
          </View>
        </View>

        {/* TITULO RECORDS PERSONALES */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginTop: 20,
            marginLeft: 15,
            color: isDarkMode ? "#fff" : "#000",
          }}
        >
          {language === "es" ? "Records Personales" : "Personal Records"}
        </Text>

        {/* STATS */}
        <View style={styles.statsGrid}>
          {statsData.map((stat) => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                { backgroundColor: isDarkMode ? "#1A1A1A" : "#fff" },
              ]}
            >
              <FontAwesome5
                name={stat.icon as any}
                size={24}
                color={stat.color}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  marginTop: 5,
                }}
              >
                <Text
                  style={[
                    styles.statValue,
                    { color: isDarkMode ? "#fff" : "#000" },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text
                  style={[
                    styles.statUnit,
                    { color: isDarkMode ? "#bbb" : "#555" },
                  ]}
                >
                  {stat.unit}
                </Text>
              </View>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDarkMode ? "#bbb" : "#555" },
                ]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* BOTONES */}
        <View style={styles.buttonContainer}>
          {profile.role.toUpperCase() === "ATHLETE" && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#EF233C" }]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="key-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {language === "es"
                  ? "Ingresar Código de Coach"
                  : "Enter Coach Code"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/perfil/historial")}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {language === "es" ? "Historial" : "History"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/editarperfil")}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {language === "es" ? "Editar Perfil" : "Edit Profile"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/perfil/configuracion")}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {language === "es" ? "Configuración" : "Settings"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {language === "es"
                ? "Ingresar Código del Coach"
                : "Enter Coach Code"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={language === "es" ? "Código" : "Code"}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAcceptCode}
              >
                <Text style={styles.generateButtonText}>
                  {language === "es" ? "Aceptar" : "Accept"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#888" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.generateButtonText}>
                  {language === "es" ? "Cancelar" : "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNavWrapper}>
        <BottomNav />
      </View>
    </View>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  header: {
    paddingVertical: 25,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarContainer: { alignItems: "center" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#900",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 40, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", marginTop: 8 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginTop: 20,
  },
  statCard: {
    width: "45%",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statValue: { fontSize: 18, fontWeight: "bold" },
  statUnit: { fontSize: 12, marginLeft: 2 },
  statLabel: { fontSize: 14, marginTop: 3 },
  buttonContainer: { marginTop: 20, paddingHorizontal: 20 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },
  bottomNavWrapper: { position: "absolute", bottom: 0, width: "100%" },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#EF233C",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  generateButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
