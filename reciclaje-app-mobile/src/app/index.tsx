import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { EscanerDni } from "@/components/EscanerDni";
import { extraerDatosDeCodigoPdf417 } from "@/lib/dni";
import { buscarUsuarioPorDni } from "@/lib/usuarios";
import { guardarDniEnSesion } from "@/lib/sesion";

export default function PaginaIniciarSesion() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const [avisoDeEscaneo, setAvisoDeEscaneo] = useState("");
  const [cargando, setCargando] = useState(false);

  function completarDniDesdeCodigo(textoDelCodigo: string) {
    const datos = extraerDatosDeCodigoPdf417(textoDelCodigo);
    setAvisoDeEscaneo(datos ? "" : "No pude leer ese código. Probá de nuevo.");
    if (datos) setDni(datos.dni);
  }

  async function handleIniciarSesion() {
    setError("");
    if (!dni.trim() || !/^\d{7,8}$/.test(dni)) {
      setError("Ingresá un DNI válido (7 u 8 dígitos)");
      return;
    }

    setCargando(true);
    try {
      const usuario = await buscarUsuarioPorDni(dni);
      if (!usuario) {
        setError("Usuario no registrado");
        setCargando(false);
        return;
      }

      await guardarDniEnSesion(dni);
      router.replace("/perfil");
    } catch (e) {
      setError("Error de conexión al servidor");
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Iniciar sesión</Text>

        <EscanerDni alDetectarCodigo={completarDniDesdeCodigo} />
        {avisoDeEscaneo ? <Text style={styles.error}>{avisoDeEscaneo}</Text> : null}

        <View style={styles.campo}>
          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={styles.input}
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
            placeholder="Ingrese DNI"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.botonPrincipal, cargando && styles.botonDeshabilitado]}
          onPress={handleIniciarSesion}
          disabled={cargando}
        >
          <Text style={styles.textoBotonPrincipal}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkWrapper}
          onPress={() => router.push("/registro")}
        >
          <Text style={styles.textoLink}>
            ¿Primera vez? <Text style={styles.linkBold}>Registrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f7f2" },
  container: { 
      flexGrow: 1,                // Permite expandirse a lo largo de toda la pantalla
      justifyContent: "center",    // Centra el contenido verticalmente en la pantalla
      paddingHorizontal: 24, 
      paddingVertical: 32,         // Da aire arriba y abajo para que no choque la status bar / notch
      maxWidth: 420, 
      alignSelf: "center", 
      width: "100%" 
    },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#1b2a1b", marginBottom: 16 },
  campo: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#1b2a1b", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#9bb59b",
    borderRadius: 8,
  },
  botonPrincipal: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBotonPrincipal: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  error: { color: "#b00020", marginBottom: 12 },
  linkWrapper: { marginTop: 20, alignItems: "center" },
  textoLink: { color: "#1b2a1b", fontSize: 15 },
  linkBold: { color: "#2e7d32", fontWeight: "bold" },
});