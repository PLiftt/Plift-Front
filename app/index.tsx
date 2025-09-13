// app/(rutas)/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import LoginPage from './(rutas)/login';

export default function RutasLayout() {
  return (
    <LoginPage/>
  );
}
