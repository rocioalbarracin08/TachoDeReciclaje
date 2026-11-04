import PocketBase from "pocketbase";

// ⚠️ Cambiá esta IP por la IP real de tu computadora en la red Wi-Fi
const IP_DE_TU_COMPUTADORA = "192.168.0.32";

// Exportamos la instancia cliente directa para React Native
export const pocketbase = new PocketBase(`http://${IP_DE_TU_COMPUTADORA}:8090`);