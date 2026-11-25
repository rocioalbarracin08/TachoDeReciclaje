import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE_SESION_DNI = "dni_sesion";
const CLAVE_SESION_ADMIN = "admin_clave_sesion";

export async function guardarDniEnSesion(dni: string) {
  await AsyncStorage.setItem(CLAVE_SESION_DNI, dni);
}

export async function obtenerDniDeSesion() {
  return await AsyncStorage.getItem(CLAVE_SESION_DNI);
}

export async function borrarSesion() {
  await AsyncStorage.removeItem(CLAVE_SESION_DNI);
}

// --- NUEVO: Sesión de Administrador ---
export async function guardarClaveAdminEnSesion(clave: string) {
  await AsyncStorage.setItem(CLAVE_SESION_ADMIN, clave);
}

export async function obtenerClaveAdminDeSesion() {
  return await AsyncStorage.getItem(CLAVE_SESION_ADMIN);
}

export async function borrarSesionAdmin() {
  await AsyncStorage.removeItem(CLAVE_SESION_ADMIN);
}