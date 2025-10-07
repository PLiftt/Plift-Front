import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppContextType {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  language: string;
  setLanguage: (value: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("es");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const storedDark = await AsyncStorage.getItem("darkMode");
      const storedLang = await AsyncStorage.getItem("language");
      const storedNotif = await AsyncStorage.getItem("notifications");
      if (storedDark) setIsDarkMode(storedDark === "true");
      if (storedLang) setLanguage(storedLang);
      if (storedNotif) setNotificationsEnabled(storedNotif === "true");
    })();
  }, []);

  const updateDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    AsyncStorage.setItem("darkMode", value.toString());
  };

  const updateLanguage = (value: string) => {
    setLanguage(value);
    AsyncStorage.setItem("language", value);
  };

  const updateNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    AsyncStorage.setItem("notifications", value.toString());
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode: updateDarkMode,
        language,
        setLanguage: updateLanguage,
        notificationsEnabled,
        setNotificationsEnabled: updateNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext debe usarse dentro de un AppProvider");
  return context;
};
