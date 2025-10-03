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

interface Message {
  id: number;
  text?: string;
  imageUri?: string;
  sender: "user" | "coach";
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "¿En qué puedo ayudarte hoy?",
    sender: "coach",
    timestamp: "10:30",
  },
  {
    id: 2,
    text: "Hola, tengo una pregunta sobre mi rutina",
    sender: "user",
    timestamp: "10:32",
  },
];

export default function ChatPage() {
  const navigation = useNavigation();
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
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          setMessages(initialMessages);
        }
      } catch (e) {
        console.error("Error cargando mensajes:", e);
        setMessages(initialMessages);
      }
    };
    loadMessages();
  }, []);

  // --- Guardar mensajes cada vez que cambian ---
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
      timestamp: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, message]);
    setNewMessage("");

    setTimeout(() => {
      const coachMessage: Message = {
        id: messages.length + 2,
        text: "Entiendo. Recuerda trabajar en la técnica y progresar gradualmente.",
        sender: "coach",
        timestamp: new Date().toLocaleTimeString("es-ES", {
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
      Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
      return false;
    }

    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos acceso a tus fotos.");
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
        timestamp: new Date().toLocaleTimeString("es-ES", {
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
        timestamp: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, imageMessage]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Juan</Text>
      </View>

      {/* Chat messages */}
      <ScrollView
        style={styles.messagesContainer}
        ref={scrollRef}
        contentContainerStyle={{ paddingVertical: 10 }}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === "user" ? styles.userBubble : styles.coachBubble,
            ]}
          >
            {msg.text && <Text style={styles.messageText}>{msg.text}</Text>}
            {msg.imageUri && (
              <TouchableOpacity
                onPress={() => {
                  if (msg.imageUri) {
                    setModalImageUri(msg.imageUri);
                    setModalVisible(true);
                  }
                }}
              >
                <Image source={{ uri: msg.imageUri }} style={styles.image} />
              </TouchableOpacity>
            )}
            <Text
              style={[
                styles.timestamp,
                msg.sender === "user"
                  ? styles.userTimestamp
                  : styles.coachTimestamp,
              ]}
            >
              {msg.timestamp}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#EF233C" />
        </TouchableOpacity>

        <TouchableOpacity onPress={takePhoto} style={{ marginLeft: 10 }}>
          <Ionicons name="camera-outline" size={28} color="#EF233C" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor="#aaa"
          value={newMessage}
          onChangeText={setNewMessage}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal para imagen */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            {modalImageUri && (
              <Image source={{ uri: modalImageUri }} style={styles.modalImage} />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E1E1E",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
  },
  messagesContainer: { flex: 1, paddingHorizontal: 10 },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: 12,
    padding: 10,
    marginVertical: 5,
  },
  userBubble: {
    backgroundColor: "#EF233C",
    alignSelf: "flex-end",
  },
  coachBubble: {
    backgroundColor: "#333",
    alignSelf: "flex-start",
  },
  messageText: { color: "#fff", fontSize: 16 },
  timestamp: { fontSize: 10, marginTop: 4 },
  userTimestamp: { color: "#ffd1d1", textAlign: "right" },
  coachTimestamp: { color: "#aaa", textAlign: "left" },
  image: { width: 150, height: 150, borderRadius: 12, marginTop: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#1E1E1E",
  },
  input: {
    flex: 1,
    color: "#fff",
    backgroundColor: "#2A2A2A",
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
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: { width: "90%", height: "70%", borderRadius: 12 },
});
