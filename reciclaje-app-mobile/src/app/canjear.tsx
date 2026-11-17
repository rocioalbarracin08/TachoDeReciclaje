import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { obtenerDniDeSesion } from "@/lib/sesion";
import { buscarUsuarioPorDni } from "@/lib/usuarios";
import {
  alcanzanLosPuntos,
  filtrarPremiosPorBusqueda,
  obtenerPremiosDisponibles,
} from "@/lib/premios";
import { solicitarCanje } from "@/lib/canjes";
import type { Usuario } from "@/lib/tipos";
import type { CanjeSolicitado, Premio } from "@/lib/tiposCanje";

type CanjeConPremio = { canje: CanjeSolicitado; premio: Premio };

type PropsTarjetaPremio = {
  premio: Premio;
  puntosDelUsuario: number;
  hayCanjeEnProceso: boolean;
  alCanjear: () => void;
};

function TarjetaPremio({ premio, puntosDelUsuario, hayCanjeEnProceso, alCanjear }: PropsTarjetaPremio) {
  const alcanzanLosPuntosDelPremio = alcanzanLosPuntos(puntosDelUsuario, premio);
  const puedeCanjear = alcanzanLosPuntosDelPremio && !hayCanjeEnProceso;
  const puntosQueFaltan = premio.puntos - puntosDelUsuario;

  return (
    <View style={styles.tarjeta}>
      {premio.foto_url ? (
        <Image source={{ uri: premio.foto_url }} style={styles.foto} resizeMode="contain" />
      ) : (
        <View style={styles.foto} />
      )}
      <Text style={styles.nombrePremio} numberOfLines={2}>
        {premio.nombre}
      </Text>
      <Text style={styles.descripcionPremio} numberOfLines={2}>
        {premio.descripcion}
      </Text>
      <Text style={styles.puntosPremio}>{premio.puntos} puntos</Text>
      {!alcanzanLosPuntosDelPremio && (
        <Text style={styles.avisoPuntosFaltantes}>Te faltan {puntosQueFaltan} puntos</Text>
      )}
      <TouchableOpacity
        style={[styles.botonCanjear, !puedeCanjear && styles.botonCanjearDeshabilitado]}
        disabled={!puedeCanjear}
        onPress={alCanjear}
      >
        <Text style={styles.textoBotonCanjear}>Canjear</Text>
      </TouchableOpacity>
    </View>
  );
}

type PropsPantallaDelQr = {
  canjeConPremio: CanjeConPremio;
  alVolver: () => void;
};

function PantallaDelQr({ canjeConPremio, alVolver }: PropsPantallaDelQr) {
  const { canje, premio } = canjeConPremio;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contenedorQr}>
        <Text style={styles.titulo}>{premio.nombre}</Text>
        <Text style={styles.textoAyuda}>
          Mostrale este codigo al encargado del kiosco para confirmar el canje.
        </Text>
        <View style={styles.marcoQr}>
          <QRCode value={canje.id_canje} size={220} />
        </View>
        <Text style={styles.textoAyuda}>
          Vale por {canje.minutos_validez} minutos. Costo: {premio.puntos} puntos.
        </Text>
        <TouchableOpacity style={styles.botonSecundario} onPress={alVolver}>
          <Text style={styles.textoBotonSecundario}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function PaginaCanjear() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [textoBuscado, setTextoBuscado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [idPremioEnProceso, setIdPremioEnProceso] = useState<string | null>(null);
  const [canjeActivo, setCanjeActivo] = useState<CanjeConPremio | null>(null);

  async function cargarDatos() {
    try {
      const dni = await obtenerDniDeSesion();
      if (!dni) {
        router.replace("/");
        return;
      }
      const usuarioActual = await buscarUsuarioPorDni(dni);
      if (!usuarioActual) {
        router.replace("/");
        return;
      }
      const premiosDisponibles = await obtenerPremiosDisponibles();
      setUsuario(usuarioActual);
      setPremios(premiosDisponibles);
    } catch (error) {
      Alert.alert("No se pudieron cargar los premios", mensajeDelError(error));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function handleCanjear(premio: Premio) {
    if (!usuario) return;
    setIdPremioEnProceso(premio.id);
    try {
      const canje = await solicitarCanje(usuario.dni, premio.id);
      setCanjeActivo({ canje, premio });
    } catch (error) {
      Alert.alert("No se pudo canjear", mensajeDelError(error));
    } finally {
      setIdPremioEnProceso(null);
    }
  }

  function handleVolverDelQr() {
    setCanjeActivo(null);
    cargarDatos();
  }

  if (cargando) {
    return (
      <View style={[styles.safeArea, styles.centro]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!usuario) return null;

  if (canjeActivo) {
    return <PantallaDelQr canjeConPremio={canjeActivo} alVolver={handleVolverDelQr} />;
  }

  const premiosFiltrados = filtrarPremiosPorBusqueda(premios, textoBuscado);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contenedor}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.enlaceVolver}>← Volver al perfil</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Canjear puntos</Text>
        <Text style={styles.textoAyuda}>Tenes {usuario.puntos} puntos</Text>

        <TextInput
          style={styles.buscador}
          placeholder="Buscar por nombre o codigo"
          value={textoBuscado}
          onChangeText={setTextoBuscado}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FlatList
          data={premiosFiltrados}
          keyExtractor={(premio) => premio.id}
          numColumns={2}
          columnWrapperStyle={styles.filaDeTarjetas}
          contentContainerStyle={styles.listaDePremios}
          ListEmptyComponent={<Text style={styles.textoAyuda}>No hay premios que coincidan.</Text>}
          renderItem={({ item }) => (
            <TarjetaPremio
              premio={item}
              puntosDelUsuario={usuario.puntos}
              hayCanjeEnProceso={idPremioEnProceso !== null}
              alCanjear={() => handleCanjear(item)}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function mensajeDelError(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado";
}

// 2. Actualizá los estilos al final del archivo:
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f7f2" },
  centro: { justifyContent: "center", alignItems: "center" },
  contenedor: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,        // Despega el encabezado de la cámara / barra superior
    paddingBottom: 16,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  contenedorQr: {
    flex: 1,
    justifyContent: "center", // Centra el QR verticalmente en toda la altura
    paddingHorizontal: 24,
    paddingVertical: 32,      // Aire arriba y abajo
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  enlaceVolver: { color: "#2e7d32", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  titulo: { fontSize: 26, fontWeight: "bold", color: "#1b2a1b", marginBottom: 4 },
  textoAyuda: { color: "#555666", fontSize: 14, marginBottom: 12 },
  buscador: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  listaDePremios: { paddingBottom: 24 },
  filaDeTarjetas: { justifyContent: "space-between" },
  tarjeta: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  foto: { width: "100%", height: 110, backgroundColor: "#f2f7f2", borderRadius: 6, marginBottom: 8 },
  nombrePremio: { fontSize: 15, fontWeight: "700", color: "#1b2a1b" },
  descripcionPremio: { fontSize: 12, color: "#555666", opacity: 0.7, marginBottom: 6 },
  puntosPremio: { fontSize: 16, fontWeight: "800", color: "#2e7d32", marginBottom: 4 },
  avisoPuntosFaltantes: { fontSize: 11, color: "#b00020", marginBottom: 4 },
  botonCanjear: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  botonCanjearDeshabilitado: { backgroundColor: "#b9c4b9" },
  textoBotonCanjear: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  marcoQr: {
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  botonSecundario: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  textoBotonSecundario: { color: "#2e7d32", fontSize: 16, fontWeight: "bold" },
});