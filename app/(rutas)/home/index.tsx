import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUserProfile } from "../../../services/userService";
import { deleteToken } from "../../../services/secureStore";
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
    watermark: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
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
  const initials = fullName
    ? fullName[0].toUpperCase()
    : profile.email[0].toUpperCase();

  // Render nav button
  const renderNavButton = (
    name: string,
    icon: React.ReactNode,
    label: string,
    route: string
  ) => (
    <TouchableOpacity
      key={name}
      onPress={() => router.push(route)}
      style={styles.navButton}
    >
      {icon}
      <Text style={[styles.navText, { color: colors.navText }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Watermark */}
      <Text style={[styles.watermark, { color: colors.watermark }]}>PL</Text>

      {/* Switch modo oscuro */}
      {/* <View style={styles.modeSwitch}>
        {isDarkMode ? (
          <Ionicons
            name="moon"
            size={24}
            color={colors.textPrimary}
            style={{ marginRight: 8 }}
          />
        ) : (
          <Ionicons
            name="sunny"
            size={24}
            color={colors.textPrimary}
            style={{ marginRight: 8 }}
          />
        )}
        <Switch value={isDarkMode} onValueChange={toggleMode} />
      </View> */}

      <ScrollView contentContainerStyle={{ paddingBottom: 20, paddingTop: 5 }}>
        {/* Avatar arriba */}
        <View style={styles.avatarContainer}>
          <View
            style={[styles.avatar, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
              {initials}
            </Text>
          </View>
          <Text
            style={[styles.userName, { color: colors.textPrimary }]}
          >{`Hola, ${profile.first_name || "Sin nombre"}`}</Text>
        </View>

        {/* Dashboard según rol */}
        <View
          style={[styles.mainRectangle, { backgroundColor: colors.rectangle }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {profile.role.toUpperCase() === "ATHLETE"
              ? "Mi Progreso"
              : profile.role.toUpperCase() === "COACH"
              ? "Mis Atletas"
              : "Panel Principal"}
          </Text>

          {/* ATHLETE: ver Entrenamientos y Tracking */}
          {profile.role.toUpperCase() === "ATHLETE" && (
            <View>
              {profile.coach?.coach?.email && (
                <Text style={[styles.info, { color: colors.textPrimary }]}>
                  Coach: {profile.coach.coach.email}
                </Text>
              )}

              <View
                style={[
                  styles.block,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Ionicons name="barbell-outline" size={22} color="#EF233C" />
                <Text style={[styles.blockText, { color: colors.textPrimary }]}>
                  Entrenamientos
                </Text>
              </View>

              <View
                style={[
                  styles.block,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Ionicons name="pulse-outline" size={22} color="#EF233C" />
                <Text style={[styles.blockText, { color: colors.textPrimary }]}>
                  Tracking
                </Text>
              </View>
            </View>
          )}

          {/* COACH: ver Atletas en bloques */}
          {profile.role.toUpperCase() === "COACH" &&
            profile.athletes?.length && (
              <View>
                {profile.athletes.map((a) => (
                  <View
                    key={a.id}
                    style={[
                      styles.block,
                      { backgroundColor: colors.cardBackground },
                    ]}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={22}
                      color="#EF233C"
                    />
                    <View>
                      <Text
                        style={[
                          styles.blockText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {a.athlete_name}
                      </Text>
                      <Text
                        style={[styles.info, { color: colors.textPrimary }]}
                      >
                        {a.athlete_email}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
        </View>
      </ScrollView>

      {/* Bottom nav */}

      {/* <View
        style={[styles.bottomNav, { backgroundColor: colors.navBackground }]}
      >
        {renderNavButton(
          "home",
          <Ionicons name="home-outline" size={28} color="#EF233C" />,
          "Home",
          "/home"
        )}
        {renderNavButton(
          "stats",
          <Ionicons name="stats-chart-outline" size={28} color="#EF233C" />,
          "Estadísticas",
          "/estadisticas"
        )}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { backgroundColor: colors.floatingButton },
          ]}
          onPress={() => router.push("/fit")}
        >
          <FontAwesome5 name="dumbbell" size={36} color="#fff" />
        </TouchableOpacity>
        {renderNavButton(
          "chat",
          <MaterialIcons name="chat" size={28} color="#EF233C" />,
          "Chat Coach",
          "/chat"
        )}
        {renderNavButton(
          "perfil",
          <Ionicons name="person-circle-outline" size={28} color="#EF233C" />,
          "Perfil",
          "/perfil"
        )}
      </View> */}

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
  },

  avatarText: { fontWeight: "bold", fontSize: 40 },

  userName: { fontSize: 18, fontWeight: "600", marginTop: 8 },

  info: { fontSize: 14, marginBottom: 5 },

  mainRectangle: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
    zIndex: 1,
  },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },

  block: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
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
