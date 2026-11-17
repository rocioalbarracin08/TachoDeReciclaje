import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { obtenerDniDeSesion } from "@/lib/sesion";
import { obtenerHistorialDelUsuario } from "@/lib/canjes";
import { formatearFechaCompleta } from "@/lib/fechas";
import type { Canje } from "@/lib/tiposCanje";

export default function PaginaHistorial() {
  const router = useRouter();
  const [canjes, setCanjes] = useState<Canje[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarHistorial() {
      try {
        const dni = await obtenerDniDeSesion();
        if (!dni) {
          router.replace("/");
          return;
        }
        setCanjes(await obtenerHistorialDelUsuario(dni));
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "Error inesperado";
        Alert.alert("No se pudo cargar el historial", mensaje);
      } finally {
        setCargando(false);
      }
    }
    cargarHistorial();
  }, []);

  if (cargando) {
    return (
      <View style={[styles.safeArea, styles.centro]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contenedor}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.enlaceVolver}>← Volver al perfil</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Historial de canjes</Text>

        <FlatList
          data={canjes}
          keyExtractor={(canje) => canje.id}
          contentContainerStyle={
            canjes.length === 0 ? styles.listaVacia : styles.listaConDatos
          }
          ListEmptyComponent={
            <Text style={styles.textoAyuda}>Todavía no canjeaste nada.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <View style={styles.datosDelCanje}>
                <Text style={styles.nombrePremio}>{item.nombre_premio}</Text>
                <Text style={styles.fecha}>
                  {formatearFechaCompleta(item.fecha)}
                </Text>
              </View>
              <Text style={styles.puntosGastados}>-{item.puntos} pts</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f7f2",
  },
  centro: {
    justifyContent: "center",
    alignItems: "center",
  },
  contenedor: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  enlaceVolver: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1b2a1b",
    marginBottom: 16,
  },
  listaConDatos: {
    paddingBottom: 24,
  },
  listaVacia: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textoAyuda: {
    color: "#555666",
    fontSize: 15,
    textAlign: "center",
  },
  tarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,        // <-- Borde verde izquierdo
    borderLeftColor: "#2e7d32", // <-- Mismo verde que en el panel admin
  },
  datosDelCanje: {
    flex: 1,
    marginRight: 12,
  },
  nombrePremio: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e7d32",
  },
  fecha: {
    fontSize: 12,
    color: "#555666",
    marginTop: 2,
  },
  puntosGastados: {
    fontSize: 16,
    fontWeight: "800",
    color: "#b00020",
  },
});