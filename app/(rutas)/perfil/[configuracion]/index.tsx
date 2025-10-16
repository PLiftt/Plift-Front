import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "app/context/appContext";
import { logoutUser } from "services/userService";
import { deleteToken } from "services/secureStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, setIsDarkMode, language, setLanguage } = useAppContext();

  const [notifications, setNotifications] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const notif = await AsyncStorage.getItem("notifications");
        if (notif !== null) setNotifications(JSON.parse(notif));
      } catch (e) {
        console.error("Error cargando configuración:", e);
      }
    };
    loadSettings();
  }, []);

  // --- DARK MODE ---
  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem("isDarkMode", JSON.stringify(value));
  };

  // --- NOTIFICACIONES ---
  const toggleNotifications = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem("notifications", JSON.stringify(value));
  };

  // --- IDIOMA ---
  const handleLanguageChange = async () => {
    const nextLang = language === "es" ? "en" : "es";
    setLanguage(nextLang);
    await AsyncStorage.setItem("language", nextLang);
  };

  // --- CERRAR SESIÓN REAL ---
  const handleLogout = async () => {
    Alert.alert(
      language === "es" ? "Cerrar sesión" : "Log out",
      language === "es"
        ? "¿Estás seguro de que deseas cerrar sesión?"
        : "Are you sure you want to log out?",
      [
        {
          text: language === "es" ? "Cancelar" : "Cancel",
          style: "cancel",
        },
        {
          text: language === "es" ? "Cerrar sesión" : "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutUser();
              await deleteToken("accessToken");
              await deleteToken("refreshToken");
              router.replace("/(rutas)/login");
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert(
                language === "es" ? "Error" : "Error",
                language === "es"
                  ? "No se pudo cerrar la sesión correctamente."
                  : "Could not log out properly."
              );
            }
          },
        },
      ]
    );
  };

  // --- MODAL DE SOPORTE / PRIVACIDAD / INFO ---
  const openModal = (title: string, message: string) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const handleSupportPress = (option: string) => {
    if (option === "help") {
      openModal(
        language === "es" ? "Centro de ayuda" : "Help Center",
        language === "es"
          ? "📩 Contáctanos en Instagram @plift_power para recibir soporte o resolver tus dudas.\n\nNuestro equipo estará encantado de ayudarte con cualquier problema o consulta relacionada con el uso de la app."
          : "📩 Contact us on Instagram @plift_power for support or any questions.\n\nOur team will be happy to help you with any issue or inquiry regarding the app."
      );
    } else if (option === "privacy") {
      openModal(
        language === "es" ? "Política de privacidad" : "Privacy Policy",
        language === "es"
          ? "En PLift valoramos tu privacidad.\n\nTu información personal se utiliza únicamente para mejorar tu experiencia dentro de la aplicación. No compartimos tus datos con terceros sin tu consentimiento.\n\nAl usar nuestra app, aceptas nuestras políticas de tratamiento de datos y seguridad.\n\nSi tienes preguntas, contáctanos a través de nuestras redes sociales o correo de soporte."
          : "At PLift, we value your privacy.\n\nYour personal information is used solely to enhance your experience within the app. We do not share your data with third parties without your consent.\n\nBy using our app, you agree to our data handling and security policies.\n\nIf you have any questions, contact us via social media or support email."
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#fff" },
      ]}
    >
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={26}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: isDarkMode ? "#fff" : "#000" }]}
        >
          {language === "es" ? "Configuración" : "Settings"}
        </Text>
      </View>

      {/* --- CONTENIDO --- */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* --- CUENTA --- */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#aaa" : "#555" },
            ]}
          >
            {language === "es" ? "Cuenta" : "Account"}
          </Text>

          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF233C" />
            <Text style={[styles.itemText, { color: "#EF233C" }]}>
              {language === "es" ? "Cerrar sesión" : "Log out"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- PREFERENCIAS --- */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#aaa" : "#555" },
            ]}
          >
            {language === "es" ? "Preferencias" : "Preferences"}
          </Text>

          <View style={styles.item}>
            <Ionicons name="moon-outline" size={22} color="#EF233C" />
            <Text
              style={[styles.itemText, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {language === "es" ? "Modo oscuro" : "Dark Mode"}
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              thumbColor={"#fff"}
              trackColor={{ true: "#EF233C", false: "#d9d9d9" }}
            />
          </View>

          <View style={styles.item}>
            <Ionicons name="notifications-outline" size={22} color="#EF233C" />
            <Text
              style={[styles.itemText, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {language === "es" ? "Notificaciones" : "Notifications"}
            </Text>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              thumbColor={"#fff"}
              trackColor={{ true: "#EF233C", false: "#d9d9d9" }}
            />
          </View>

          <TouchableOpacity style={styles.item} onPress={handleLanguageChange}>
            <Ionicons name="language-outline" size={22} color="#EF233C" />
            <Text
              style={[styles.itemText, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {language === "es" ? `Idioma: Español` : `Language: English`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- SOPORTE --- */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: isDarkMode ? "#aaa" : "#555" }]}
          >
            {language === "es" ? "Soporte" : "Support"}
          </Text>

          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSupportPress("help")}
          >
            <Ionicons name="help-circle-outline" size={22} color="#EF233C" />
            <Text
              style={[styles.itemText, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {language === "es" ? "Centro de ayuda" : "Help Center"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSupportPress("privacy")}
          >
            <Ionicons name="document-text-outline" size={22} color="#EF233C" />
            <Text
              style={[styles.itemText, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {language === "es" ? "Política de privacidad" : "Privacy Policy"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => openModal("PLift", "Versión 1.0.0")}
          >
            <Ionicons name="information-circle-outline" size={22} color="#EF233C" />
            <Text
              style={[styles.itemText, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              Versión 1.0.0
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- MODAL --- */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
              {modalContent.title}
            </Text>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalMessage, { color: isDarkMode ? "#ddd" : "#333" }]}>
                {modalContent.message}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>
                {language === "es" ? "Cerrar" : "Close"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 18 },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  section: { marginTop: 25, borderTopWidth: 1, borderTopColor: "#2a2a2a", paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, marginVertical: 10 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  itemText: { fontSize: 16, marginLeft: 15, flex: 1 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)", padding: 25 },
  modalContainer: { width: "100%", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalScroll: { alignItems: "center" },
  modalMessage: { fontSize: 15, lineHeight: 22, marginBottom: 20, textAlign: "center", paddingHorizontal: 10 },
  modalButton: { alignSelf: "center", backgroundColor: "#EF233C", paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
  modalButtonText: { color: "#fff", fontWeight: "bold" },
});
