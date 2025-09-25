import { Slot } from "expo-router";
import { StatusBar } from "react-native";

const RootLayout = () => {
  return (
    <>
      <StatusBar
        barStyle="light-content" // iconos blancos
        backgroundColor="transparent" // transparente para que se vea el fondo
        translucent={true} // que el contenido suba debajo de la barra
      />
      <Slot />
    </>
  );
};

export default RootLayout;
