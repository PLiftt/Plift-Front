import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "app/context/appContext";

interface Message {
  id: number;
  text?: string;
  imageUri?: string;
  sender: "user" | "coach";
  timestamp: string;
}

const initialMessages: Message[] = [
  { id: 1, text: "¿En qué puedo ayudarte hoy?", sender: "coach", timestamp: "10:30" },
  { id: 2, text: "Hola, tengo una pregunta sobre mi rutina", sender: "user", timestamp: "10:32" },
];

export default function ChatPage() {
  const navigation = useNavigation();
  const { isDarkMode, language } = useAppContext();

  // Paleta según tema (NO cambia tu lógica, solo colores)
  const palette = isDarkMode
    ? {
        background: "#0F0F0F",
        header: "#1E1E1E",
        headerText: "#FFFFFF",
        text: "#FFFFFF",
        subtext: "#AAAAAA",
        coachBubble: "#333333",
        coachText: "#FFFFFF",
        userBubble: "#EF233C",
        userText: "#FFFFFF",
        inputBg: "#22262E",
        inputText: "#FFFFFF",
        placeholder: "#AAAAAA",
        barBorder: "#2A2A2A",
        modalOverlay: "rgba(0,0,0,0.95)",
      }
    : {
        background: "#F9F9F9",
        header: "#FFFFFF",
        headerText: "#111111",
        text: "#111111",
        subtext: "#555555",
        coachBubble: "#E5E7EB",
        coachText: "#111111",
        userBubble: "#EF233C",
        userText: "#FFFFFF",
        inputBg: "#FFFFFF",
        inputText: "#111111",
        placeholder: "#888888",
        barBorder: "#E5E7EB",
        modalOverlay: "rgba(0,0,0,0.5)",
      };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState<string | null>(null);

  // --- Cargar mensajes guardados al iniciar ---
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem("chatMessages");
        if (stored) setMessages(JSON.parse(stored));
        else setMessages(initialMessages);
      } catch (e) {
        console.error("Error cargando mensajes:", e);
        setMessages(initialMessages);
      }
    };
    loadMessages();
  }, []);

  // --- Guardar mensajes cada vez que cambian + autoscroll ---
  useEffect(() => {
    AsyncStorage.setItem("chatMessages", JSON.stringify(messages)).catch((e) =>
      console.error("Error guardando mensajes:", e)
    );
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(language === "es" ? "es-CL" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, message]);
    setNewMessage("");

    setTimeout(() => {
      const coachMessage: Message = {
        id: message.id + 1,
        text:
          language === "es"
            ? "Entiendo. Recuerda trabajar en la técnica y progresar gradualmente."
            : "Got it. Remember to focus on technique and progress gradually.",
        sender: "coach",
        timestamp: new Date().toLocaleTimeString(language === "es" ? "es-CL" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, coachMessage]);
    }, 1500);
  };

  const requestCameraPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      Alert.alert(language === "es" ? "Permiso denegado" : "Permission denied",
        language === "es" ? "Necesitamos acceso a la cámara." : "We need camera access.");
      return false;
    }

    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== "granted") {
      Alert.alert(language === "es" ? "Permiso denegado" : "Permission denied",
        language === "es" ? "Necesitamos acceso a tus fotos." : "We need access to your photos.");
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const imageMessage: Message = {
        id: messages.length + 1,
        imageUri,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(language === "es" ? "es-CL" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, imageMessage]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const imageMessage: Message = {
        id: messages.length + 1,
        imageUri,
        sender: "user",
        timestamp: new Date().toLocaleTimeString(language === "es" ? "es-CL" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, imageMessage]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.header, borderBottomColor: palette.barBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={palette.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.headerText }]}>
          {language === "es" ? "Coach Juan" : "Coach John"}
        </Text>
      </View>

      {/* Chat messages */}
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollRef}
        contentContainerStyle={{ paddingVertical: 10 }}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const bubbleStyle = isUser
            ? { backgroundColor: palette.userBubble, alignSelf: "flex-end" as const }
            : { backgroundColor: palette.coachBubble, alignSelf: "flex-start" as const };
          const textColor = isUser ? palette.userText : palette.coachText;
          const timeColor = isUser ? "#ffd1d1" : palette.subtext;

          return (
            <View key={msg.id} style={[styles.messageBubble, bubbleStyle]}>
              {!!msg.text && <Text style={[styles.messageText, { color: textColor }]}>{msg.text}</Text>}
              {!!msg.imageUri && (
                <TouchableOpacity
                  onPress={() => {
                    setModalImageUri(msg.imageUri!);
                    setModalVisible(true);
                  }}
                >
                  <Image source={{ uri: msg.imageUri }} style={styles.image} />
                </TouchableOpacity>
              )}
              <Text style={[styles.timestamp, { color: timeColor, textAlign: isUser ? "right" : "left" }]}>{msg.timestamp}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: palette.header, borderTopColor: palette.barBorder }]}>
        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#EF233C" />
        </TouchableOpacity>

        <TouchableOpacity onPress={takePhoto} style={{ marginLeft: 10 }}>
          <Ionicons name="camera-outline" size={28} color="#EF233C" />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { backgroundColor: palette.inputBg, color: palette.inputText }]}
          placeholder={language === "es" ? "Escribe tu mensaje..." : "Type your message..."}
          placeholderTextColor={palette.placeholder}
          value={newMessage}
          onChangeText={setNewMessage}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal para imagen */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalBackground, { backgroundColor: palette.modalOverlay }]}>
            {modalImageUri && <Image source={{ uri: modalImageUri }} style={styles.modalImage} />}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 16 },

  messagesContainer: { flex: 1, paddingHorizontal: 10 },

  messageBubble: {
    maxWidth: "70%",
    borderRadius: 12,
    padding: 10,
    marginVertical: 5,
  },
  messageText: { fontSize: 16 },
  timestamp: { fontSize: 10, marginTop: 4 },

  image: { width: 150, height: 150, borderRadius: 12, marginTop: 5 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    height: 40,
  },
  sendButton: {
    backgroundColor: "#EF233C",
    padding: 10,
    borderRadius: 20,
  },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "90%", height: "70%", borderRadius: 12 },
});
