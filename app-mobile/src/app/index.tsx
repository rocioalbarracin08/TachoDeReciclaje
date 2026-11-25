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
import { guardarDniEnSesion, guardarClaveAdminEnSesion } from "@/lib/sesion";
import { validarYListarCanjesAdmin } from "@/lib/admin";

function IconoOjito({ visible }: { visible: boolean }) {
  return (
    <View style={styles.iconoOjoContenedor}>
      <View style={styles.iconoOjoContorno}>
        <View style={styles.iconoOjoPupila} />
      </View>
      {!visible && <View style={styles.iconoOjoTachado} />}
    </View>
  );
}

export default function PaginaIniciarSesion() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const [avisoDeEscaneo, setAvisoDeEscaneo] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estados para ingreso de Admin
  const [modoAdmin, setModoAdmin] = useState(false);
  const [claveAdmin, setClaveAdmin] = useState("");
  const [mostrarClaveAdmin, setMostrarClaveAdmin] = useState(false);
  const [errorAdmin, setErrorAdmin] = useState("");
  const [cargandoAdmin, setCargandoAdmin] = useState(false);

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

  async function handleIngresarAdmin() {
    setErrorAdmin("");
    if (!claveAdmin.trim()) {
      setErrorAdmin("Ingresá la clave de administrador");
      return;
    }

    setCargandoAdmin(true);
    try {
      await validarYListarCanjesAdmin(claveAdmin.trim());
      await guardarClaveAdminEnSesion(claveAdmin.trim());
      router.replace("./admin");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de conexión";
      setErrorAdmin(msg === "No autorizado" ? "Clave incorrecta" : msg);
    } finally {
      setCargandoAdmin(false);
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
            placeholderTextColor="#7a8c7a"
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

        {/* --- SECCIÓN ACCESO ADMIN --- */}
        <View style={styles.separadorAdmin}>
          <TouchableOpacity
            onPress={() => {
              setModoAdmin(!modoAdmin);
              setMostrarClaveAdmin(false);
              setErrorAdmin("");
            }}
          >
            <Text style={styles.textoLinkAdmin}>
              {modoAdmin ? "Ocultar acceso administrador" : "Soy administrador / Kiosco"}
            </Text>
          </TouchableOpacity>

          {modoAdmin && (
            <View style={styles.cajaAdmin}>
              <Text style={styles.label}>Clave de administrador</Text>
              <View style={styles.inputConIcono}>
                <TextInput
                  style={styles.inputPassword}
                  value={claveAdmin}
                  onChangeText={setClaveAdmin}
                  secureTextEntry={!mostrarClaveAdmin}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Ingresá la clave"
                  placeholderTextColor="#7a8c7a"
                />
                <TouchableOpacity
                  style={styles.botonOjito}
                  onPress={() => setMostrarClaveAdmin(!mostrarClaveAdmin)}
                  accessibilityLabel={
                    mostrarClaveAdmin ? "Ocultar clave" : "Mostrar clave"
                  }
                >
                  <IconoOjito visible={mostrarClaveAdmin} />
                </TouchableOpacity>
              </View>

              {errorAdmin ? <Text style={styles.error}>{errorAdmin}</Text> : null}

              <TouchableOpacity
                style={[styles.botonSecundario, cargandoAdmin && styles.botonDeshabilitado]}
                onPress={handleIngresarAdmin}
                disabled={cargandoAdmin}
              >
                <Text style={styles.textoBotonSecundario}>
                  {cargandoAdmin ? "Verificando..." : "Entrar al panel"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  campo: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#1b2a1b", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    color: "#1b2a1b",
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#9bb59b",
    borderRadius: 8,
  },
  inputConIcono: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9bb59b",
    borderRadius: 8,
  },
  inputPassword: {
    flex: 1,
    color: "#1b2a1b",
    padding: 12,
    fontSize: 16,
  },
  botonOjito: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconoOjoContenedor: {
    width: 24,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  iconoOjoContorno: {
    width: 22,
    height: 13,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: "#555666",
    justifyContent: "center",
    alignItems: "center",
  },
  iconoOjoPupila: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#555666",
  },
  iconoOjoTachado: {
    position: "absolute",
    width: 24,
    height: 2,
    backgroundColor: "#555666",
    transform: [{ rotate: "-32deg" }],
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
  error: { color: "#b00020", marginTop: 6, marginBottom: 8 },
  linkWrapper: { marginTop: 20, alignItems: "center" },
  textoLink: { color: "#1b2a1b", fontSize: 15 },
  linkBold: { color: "#2e7d32", fontWeight: "bold" },
  separadorAdmin: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#d5e2d5",
    alignItems: "center",
  },
  textoLinkAdmin: { color: "#555666", fontSize: 13, fontWeight: "600" },
  cajaAdmin: { width: "100%", marginTop: 14 },
  botonSecundario: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotonSecundario: { color: "#2e7d32", fontSize: 15, fontWeight: "bold" },
});