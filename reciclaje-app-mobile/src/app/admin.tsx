import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { borrarSesionAdmin, obtenerClaveAdminDeSesion } from "@/lib/sesion";
import {
  confirmarCanjeAdmin,
  consultarDetalleCanjeAdmin,
  validarYListarCanjesAdmin,
} from "@/lib/admin";
import { formatearFechaCompleta } from "@/lib/fechas";
import type { Canje, DetalleCanje } from "@/lib/tiposCanje";

export default function PaginaAdmin() {
  const router = useRouter();
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();

  const [claveAdmin, setClaveAdmin] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(false);

  const [idCanjeInput, setIdCanjeInput] = useState("");
  const [detalleCanje, setDetalleCanje] = useState<DetalleCanje | null>(null);
  const [ultimosCanjes, setUltimosCanjes] = useState<Canje[]>([]);
  const [procesando, setProcesando] = useState(false);

  async function cargarPanel(clave: string) {
    try {
      const lista = await validarYListarCanjesAdmin(clave);
      setUltimosCanjes(lista);
    } catch (error) {
      await borrarSesionAdmin();
      router.replace("/");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    async function iniciar() {
      const clave = await obtenerClaveAdminDeSesion();
      if (!clave) {
        router.replace("/");
        return;
      }
      setClaveAdmin(clave);
      await cargarPanel(clave);
    }
    iniciar();
  }, []);

  async function handleAbrirCamara() {
    if (!permisoCamara?.granted) {
      const resultado = await pedirPermisoCamara();
      if (!resultado.granted) {
        Alert.alert("Permiso requerido", "Habilitá la cámara para escanear el QR del alumno.");
        return;
      }
    }
    setCamaraActiva(!camaraActiva);
  }

  async function buscarCanje(idCanje: string) {
    if (!claveAdmin || !idCanje.trim()) return;
    setProcesando(true);
    setDetalleCanje(null);
    try {
      const detalle = await consultarDetalleCanjeAdmin(claveAdmin, idCanje.trim());
      setDetalleCanje(detalle);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se encontró el canje";
      Alert.alert("Error al consultar canje", msg);
    } finally {
      setProcesando(false);
    }
  }

  async function handleConfirmarEntrega() {
    if (!claveAdmin || !detalleCanje) return;
    setProcesando(true);
    try {
      const res = await confirmarCanjeAdmin(claveAdmin, detalleCanje.id);
      Alert.alert("¡Canje confirmado!", `${res.mensaje}\nPuntos restantes del alumno: ${res.puntos_restantes}`);
      setDetalleCanje(null);
      setIdCanjeInput("");
      await cargarPanel(claveAdmin);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo confirmar";
      Alert.alert("Error", msg);
    } finally {
      setProcesando(false);
    }
  }

  async function handleCerrarSesionAdmin() {
    await borrarSesionAdmin();
    router.replace("/");
  }

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
        <View style={styles.header}>
          <Text style={styles.titulo}>Panel Kiosco</Text>
          <TouchableOpacity onPress={handleCerrarSesionAdmin}>
            <Text style={styles.enlaceSalir}>Salir</Text>
          </TouchableOpacity>
        </View>

        {camaraActiva && (
          <View style={styles.camaraWrapper}>
            <CameraView
              style={styles.camara}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={(resultado) => {
                if (resultado.data) {
                  setCamaraActiva(false);
                  setIdCanjeInput(resultado.data);
                  buscarCanje(resultado.data);
                }
              }}
            />
          </View>
        )}

        <TouchableOpacity style={styles.botonPrincipal} onPress={handleAbrirCamara}>
          <Text style={styles.textoBotonPrincipal}>
            {camaraActiva ? "Cerrar cámara" : "📷 Escanear QR de canje"}
          </Text>
        </TouchableOpacity>

        <View style={styles.filaBusqueda}>
          <TextInput
            style={styles.inputCodigo}
            value={idCanjeInput}
            onChangeText={setIdCanjeInput}
            placeholder="O ingresá ID de canje"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.botonBuscar}
            onPress={() => buscarCanje(idCanjeInput)}
            disabled={procesando}
          >
            <Text style={styles.textoBotonBuscar}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {detalleCanje && (
          <View style={styles.tarjetaDetalle}>
            <Text style={styles.detalleTitulo}>{detalleCanje.nombre_premio}</Text>
            <Text style={styles.detalleTexto}>
              Alumno: {detalleCanje.nombre_usuario} (DNI {detalleCanje.dni})
            </Text>
            <Text style={styles.detalleTexto}>
              Costo: {detalleCanje.puntos} pts (Tiene: {detalleCanje.puntos_del_usuario} pts)
            </Text>

            {detalleCanje.confirmado ? (
              <Text style={styles.estadoError}>Este canje ya fue entregado.</Text>
            ) : detalleCanje.vencido ? (
              <Text style={styles.estadoError}>El QR venció. Pedile que genere uno nuevo.</Text>
            ) : (
              <TouchableOpacity
                style={[styles.botonConfirmar, procesando && styles.deshabilitado]}
                onPress={handleConfirmarEntrega}
                disabled={procesando}
              >
                <Text style={styles.textoBotonPrincipal}>
                  {procesando ? "Confirmando..." : "Confirmar entrega y descontar puntos"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.subtitulo}>Últimos canjes entregados</Text>
        <FlatList
          data={ultimosCanjes}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.textoVacio}>Todavía no hay canjes confirmados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.tarjetaHistorial}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemPremio}>{item.nombre_premio}</Text>
                <Text style={styles.itemAlumno}>
                  {item.nombre_usuario} • {formatearFechaCompleta(item.fecha)}
                </Text>
              </View>
              <Text style={styles.itemPuntos}>-{item.puntos} pts</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f7f2" },
  centro: { justifyContent: "center", alignItems: "center" },
  contenedor: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: { fontSize: 26, fontWeight: "bold", color: "#1b2a1b" },
  enlaceSalir: { color: "#b00020", fontSize: 15, fontWeight: "700" },
  camaraWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#000",
  },
  camara: { flex: 1 },
  botonPrincipal: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  textoBotonPrincipal: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  filaBusqueda: { flexDirection: "row", gap: 8, marginBottom: 16 },
  inputCodigo: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9bb59b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  botonBuscar: {
    backgroundColor: "#1b2a1b",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  textoBotonBuscar: { color: "#fff", fontWeight: "bold" },
  tarjetaDetalle: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2e7d32",
    marginBottom: 16,
  },
  detalleTitulo: { fontSize: 18, fontWeight: "bold", color: "#1b2a1b", marginBottom: 6 },
  detalleTexto: { fontSize: 14, color: "#333", marginBottom: 4 },
  estadoError: { color: "#b00020", fontWeight: "bold", marginTop: 8 },
  botonConfirmar: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deshabilitado: { opacity: 0.6 },
  subtitulo: { fontSize: 17, fontWeight: "bold", color: "#1b2a1b", marginBottom: 8 },
  textoVacio: { color: "#555666", fontSize: 14 },
  tarjetaHistorial: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemPremio: { fontSize: 15, fontWeight: "700", color: "#1b2a1b" },
  itemAlumno: { fontSize: 12, color: "#555666", marginTop: 2 },
  itemPuntos: { fontSize: 15, fontWeight: "800", color: "#2e7d32" },
});