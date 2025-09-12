import React from "react";
import { router } from "expo-router";
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground, } from "react-native";

const IndexScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Imagen de fondo */}
      <ImageBackground
        source={require("../../assets/fondobg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover" // ajusta la imagen sin deformarla
      ></ImageBackground>

      <View style={styles.overlay}>     
     {/* Logo grande en el centro */}
          <Image
            source={require("../../assets/logoplift.png")}
            style={styles.logoMain}
            resizeMode="contain"
          />
      </View>

      {/* Parte inferior con opciones */}
      <View style={styles.bottomSection}>
        <Image
          source={require("../../assets/logoplift.png")}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <Text style={styles.title}>PLift</Text>

        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createText}>Crear tu cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")} style={styles.loginButton}>
          <Text style={styles.loginText}>Iniciar sesión</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // de respaldo
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoMain: {
    width: 150,
    height: 150,
  },
  bottomSection: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logoSmall: {
    width: 90,
    height: 90,
    marginBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#d00000",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  createText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginButton: {
    borderColor: "#d00000",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
