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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile } from "../../../services/userService";
import { deleteToken, getToken } from "../../../services/secureStore";
import { useRouter } from "expo-router";
import BottomNav from "../../components/bottomNav";
import { acceptInvitation } from "../../../services/invitationService";
import { logoutUser } from "../../../services/userService";

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

const PerfilScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/(rutas)/login"); // redirige al login
  };

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error: any) {
      console.error(
        "Error cargando perfil:",
        error.response?.data || error.message
      );
      if (
        error.response?.data?.code === "token_not_valid" ||
        error.message?.includes("No hay token de acceso")
      ) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
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
        Alert.alert("Error", "Debes ingresar un código válido");
        return;
      }

      const result = await acceptInvitation(token, inviteCode.trim());
      Alert.alert("¡Éxito!", "Invitación aceptada correctamente");
      setInviteCode("");
      setModalVisible(false);
      fetchProfile(); // refresca el perfil
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.code) {
        Alert.alert("Error", error.response.data.code);
      } else if (error.response?.data?.detail) {
        Alert.alert("Error", error.response.data.detail);
      } else {
        Alert.alert("Error", "No se pudo aceptar la invitación");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  const fullName = `${profile.first_name || ""} ${profile.second_name || ""} ${
    profile.last_name || ""
  } ${profile.second_last_name || ""}`.trim();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName
              ? fullName[0].toUpperCase()
              : profile.email[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.first_name || "Sin nombre"}</Text>
      </View>

      <Text style={styles.email}>{profile.email}</Text>
      <Text style={styles.info}>Rol: {profile.role}</Text>

      {/* BOTÓN INGRESAR CÓDIGO SOLO PARA ATHLETE */}
      {profile.role.toUpperCase() === "ATHLETE" && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#EF233C" }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="key-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Ingresar Código de Coach</Text>
        </TouchableOpacity>
      )}

      {/* Modal para ingresar código */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ingresar Código del Coach</Text>
            <TextInput
              style={styles.input}
              placeholder="Código"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 15,
              }}
            >
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleAcceptCode}
              >
                <Text style={styles.generateButtonText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#888" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.generateButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Botones de acciones */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Ionicons name="settings-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <BottomNav />
    </View>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    paddingTop: 80,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#d00000",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },

  email: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 10,
  },

  info: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
  },

  buttonContainer: {
    marginTop: 40,
    width: "80%",
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },

  logoutButton: {
    backgroundColor: "#d00000",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },

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

  modalButton: {
    flex: 1,
    backgroundColor: "#EF233C",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },

  generateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
