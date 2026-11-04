import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { obtenerDniDeSesion, borrarSesion } from "@/lib/sesion";
import { buscarUsuarioPorDni } from "@/lib/usuarios";
import { describirTiempoTranscurrido, formatearFechaCompleta } from "@/lib/fechas";
import type { Usuario } from "@/lib/tipos";

export default function PaginaPerfil() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPerfil() {
      const dni = await obtenerDniDeSesion();
      if (!dni) {
        router.replace("/");
        return;
      }
      const datos = await buscarUsuarioPorDni(dni);
      if (!datos) {
        router.replace("/");
        return;
      }
      setUsuario(datos);
      setCargando(false);
    }
    cargarPerfil();
  }, []);

  async function handleCerrarSesion() {
    await borrarSesion();
    router.replace("/");
  }

  if (cargando) {
    return (
      <View style={[styles.safeArea, styles.centro]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!usuario) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Hola, {usuario.nombre}</Text>

        <Text style={styles.puntos}>
          {usuario.puntos} <Text style={styles.puntosSmall}>puntos</Text>
        </Text>

        <Text style={styles.detalle}>
          Último movimiento: {describirTiempoTranscurrido(usuario.updated)} ({formatearFechaCompleta(usuario.updated)})
        </Text>

        <View style={styles.tabla}>
          <View style={styles.fila}>
            <Text style={styles.dt}>Nombre</Text>
            <Text style={styles.dd}>{usuario.nombre}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.dt}>Apellido</Text>
            <Text style={styles.dd}>{usuario.apellido}</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.dt}>DNI</Text>
            <Text style={styles.dd}>{usuario.dni}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.botonSecundario} onPress={handleCerrarSesion}>
          <Text style={styles.textoBotonSecundario}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f7f2" },
  centro: { justifyContent: "center", alignItems: "center" },
  container: { padding: 24, maxWidth: 420, alignSelf: "center", width: "100%" },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#1b2a1b", marginBottom: 12 },
  puntos: { fontSize: 56, fontWeight: "800", color: "#2e7d32", marginVertical: 4 },
  puntosSmall: { fontSize: 20, fontWeight: "400" },
  detalle: { color: "#555666", marginBottom: 24, fontSize: 14 },
  tabla: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 24 },
  fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  dt: { fontWeight: "600", color: "#1b2a1b" },
  dd: { color: "#1b2a1b" },
  botonSecundario: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotonSecundario: { color: "#2e7d32", fontSize: 16, fontWeight: "bold" },
});