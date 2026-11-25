import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="registro" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="canjear" />
      <Stack.Screen name="historial" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}