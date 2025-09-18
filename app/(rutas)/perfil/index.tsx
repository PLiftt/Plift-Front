import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile } from "../../../services/userService";
import { deleteToken } from "../../../services/secureStore";
import { useRouter } from "expo-router";
import BottomNav from "../../components/bottomNav";

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
    athlete: number; // ID del atleta
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
  const router = useRouter();

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

  // Nombre completo
  const fullName = `${profile.first_name || ""} ${profile.second_name || ""} ${
    profile.last_name || ""
  } ${profile.second_last_name || ""}`.trim();

  return (
    <View style={styles.container}>
      {/* Avatar con inicial */}
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

      {/* Datos del usuario */}
      <Text style={styles.email}>{profile.email}</Text>
      <Text style={styles.info}>Rol: {profile.role}</Text>

      {/* Si es atleta, muestra su coach
      {profile.role === "ATHLETE" && profile.coach?.coach?.email && (
        <Text style={styles.info}>Coach: {profile.coach.coach.email}</Text>
      )} */}

      {/* Si es coach, muestra sus atletas
      {profile.role.toUpperCase() === "COACH" && profile.athletes?.length ? (
        <View>
          <Text style={styles.info}>Atletas:</Text>
          {profile.athletes.map((a) => (
            <Text key={a.id} style={styles.info}>
              {a.athlete_name} ({a.athlete_email})
            </Text>
          ))}
        </View>
      ) : null} */}
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
          onPress={async () => {
            await deleteToken("accessToken");
            await deleteToken("refreshToken");
            router.replace("/login");
          }}
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

  // Contenedor que engloba el círculo y el nombre
  avatarContainer: {
    alignItems: "center", // centra horizontalmente
    marginBottom: 20, // espacio debajo del avatar
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
    marginTop: 8, // separa el nombre del círculo
  },

  email: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 20,
  },

  info: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 5,
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
});
