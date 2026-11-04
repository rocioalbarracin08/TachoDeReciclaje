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
import { buscarUsuarioPorDni, crearUsuarioSinPuntos } from "@/lib/usuarios";
import { guardarDniEnSesion } from "@/lib/sesion";

export default function PaginaRegistro() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [error, setError] = useState("");
  const [avisoDeEscaneo, setAvisoDeEscaneo] = useState("");
  const [cargando, setCargando] = useState(false);
  
  // Estado para controlar la visibilidad del cuadro verde
  const [registroExitoso, setRegistroExitoso] = useState(false);

  function completarCamposDesdeCodigo(textoDelCodigo: string) {
    const datos = extraerDatosDeCodigoPdf417(textoDelCodigo);
    if (!datos) return setAvisoDeEscaneo("No pude leer ese código. Probá de nuevo.");
    setAvisoDeEscaneo("Datos cargados. Verificá que estén bien antes de registrarte.");
    setDni(datos.dni);
    setNombre(datos.nombre);
    setApellido(datos.apellido);
  }

  async function handleRegistrar() {
    setError("");
    setRegistroExitoso(false);

    if (!dni || !nombre || !apellido || !/^\d{7,8}$/.test(dni)) {
      setError("Completá DNI, nombre y apellido válidos");
      return;
    }

    setCargando(true);
    try {
      const existe = await buscarUsuarioPorDni(dni);
      if (existe) {
        setError("El usuario ya está registrado");
        setCargando(false);
        return;
      }

      await crearUsuarioSinPuntos({ dni, nombre, apellido });
      await guardarDniEnSesion(dni);

      // Mostramos el cuadro verde de éxito
      setRegistroExitoso(true);

      // Redirigimos al perfil después de 2 segundos
      setTimeout(() => {
        router.replace("/perfil");
      }, 2000);

    } catch (e: any) {
      if (e?.message === "USUARIO_YA_REGISTRADO") {
        setError("El usuario ya está registrado");
      } else {
        setError("Error de conexión al servidor");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Registro</Text>

        {/* CUADRO VERDE: Solo se muestra si el registro fue exitoso */}
        {registroExitoso && (
          <View style={styles.cuadroExito}>
            <Text style={styles.textoExito}>
              ¡Usuario registrado correctamente! Redirigiendo...
            </Text>
          </View>
        )}

        <EscanerDni alDetectarCodigo={completarCamposDesdeCodigo} />
        {avisoDeEscaneo ? <Text style={styles.aviso}>{avisoDeEscaneo}</Text> : null}

        <View style={styles.campo}>
          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={styles.input}
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        </View>

        <View style={styles.campo}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={apellido} onChangeText={setApellido} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.botonPrincipal, (cargando || registroExitoso) && styles.botonDeshabilitado]}
          onPress={handleRegistrar}
          disabled={cargando || registroExitoso}
        >
          <Text style={styles.textoBotonPrincipal}>
            {cargando ? "Registrando..." : "Registrarse"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkWrapper}
          onPress={() => router.push("/")}
        >
          <Text style={styles.textoLink}>
            ¿Ya tenés cuenta? <Text style={styles.linkBold}>Iniciá sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f2f7f2" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#1b2a1b", marginBottom: 16 },
  
  /* ESTILOS DEL CUADRO VERDE */
  cuadroExito: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  textoExito: {
    color: "#155724",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  campo: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "600", color: "#1b2a1b", marginBottom: 4 },
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
  aviso: { color: "#2e7d32", marginBottom: 12 },
  error: { color: "#b00020", marginBottom: 12 },
  linkWrapper: { marginTop: 20, alignItems: "center" },
  textoLink: { color: "#1b2a1b", fontSize: 15 },
  linkBold: { color: "#2e7d32", fontWeight: "bold" },
});