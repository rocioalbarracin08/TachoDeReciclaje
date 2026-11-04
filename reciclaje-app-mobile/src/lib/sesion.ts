import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE_SESION_DNI = "dni_sesion";

export async function guardarDniEnSesion(dni: string) {
  await AsyncStorage.setItem(CLAVE_SESION_DNI, dni);
}

export async function obtenerDniDeSesion() {
  return await AsyncStorage.getItem(CLAVE_SESION_DNI);
}

export async function borrarSesion() {
  await AsyncStorage.removeItem(CLAVE_SESION_DNI);
}