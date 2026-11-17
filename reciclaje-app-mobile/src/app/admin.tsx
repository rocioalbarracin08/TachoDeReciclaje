import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
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
  actualizarProductoAdmin,
  cambiarDisponibilidadPremioAdmin,
  confirmarCanjeAdmin,
  consultarDetalleCanjeAdmin,
  crearPremioAdmin,
  crearProductoAdmin,
  eliminarPremioAdmin,
  eliminarProductoAdmin,
  listarProductosAdmin,
  listarTodosLosPremiosAdmin,
  validarYListarCanjesAdmin,
  type ProductoTacho,
} from "@/lib/admin";
import { formatearFechaCompleta } from "@/lib/fechas";
import type { Canje, DetalleCanje, Premio } from "@/lib/tiposCanje";

type Pestana = "canjes" | "productos" | "premios";

export default function PaginaAdmin() {
  const router = useRouter();
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();

  const [claveAdmin, setClaveAdmin] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana>("canjes");
  const [procesando, setProcesando] = useState(false);

  // --- Estados Canjes ---
  const [camaraQrActiva, setCamaraQrActiva] = useState(false);
  const [idCanjeInput, setIdCanjeInput] = useState("");
  const [detalleCanje, setDetalleCanje] = useState<DetalleCanje | null>(null);
  const [ultimosCanjes, setUltimosCanjes] = useState<Canje[]>([]);

  // --- Estados Productos del Tacho ---
  const [productosTacho, setProductosTacho] = useState<ProductoTacho[]>([]);
  const [camaraBarrasActiva, setCamaraBarrasActiva] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoTacho | null>(null);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [nombreProd, setNombreProd] = useState("");
  const [tamanoMl, setTamanoMl] = useState("");
  const [puntosProd, setPuntosProd] = useState("");
  const [esReciclable, setEsReciclable] = useState(true);

  // --- Estados Premios Canjeables ---
  const [premiosKiosco, setPremiosKiosco] = useState<Premio[]>([]);
  const [codigoPremio, setCodigoPremio] = useState("");
  const [nombrePremio, setNombrePremio] = useState("");
  const [descPremio, setDescPremio] = useState("");
  const [puntosPremio, setPuntosPremio] = useState("");
  const [disponiblePremio, setDisponiblePremio] = useState(true);

  async function cargarTodo(clave: string) {
    try {
      const [canjes, prods, prems] = await Promise.all([
        validarYListarCanjesAdmin(clave),
        listarProductosAdmin(clave),
        listarTodosLosPremiosAdmin(clave),
      ]);
      setUltimosCanjes(canjes);
      setProductosTacho(prods);
      setPremiosKiosco(prems);
    } catch {
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
      await cargarTodo(clave);
    }
    iniciar();
  }, []);

  async function verificarPermisoCamara(): Promise<boolean> {
    if (permisoCamara?.granted) return true;
    const res = await pedirPermisoCamara();
    if (!res.granted) {
      Alert.alert("Permiso requerido", "Habilitá la cámara para escanear códigos.");
      return false;
    }
    return true;
  }

  // --- Handlers Canjes ---
  async function buscarCanje(idCanje: string) {
    if (!claveAdmin || !idCanje.trim()) return;
    setProcesando(true);
    setDetalleCanje(null);
    try {
      const detalle = await consultarDetalleCanjeAdmin(claveAdmin, idCanje.trim());
      setDetalleCanje(detalle);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se encontró el canje");
    } finally {
      setProcesando(false);
    }
  }

  async function handleConfirmarEntrega() {
    if (!claveAdmin || !detalleCanje) return;
    setProcesando(true);
    try {
      const res = await confirmarCanjeAdmin(claveAdmin, detalleCanje.id);
      Alert.alert("¡Canje confirmado!", `${res.mensaje}\nPuntos restantes: ${res.puntos_restantes}`);
      setDetalleCanje(null);
      setIdCanjeInput("");
      await cargarTodo(claveAdmin);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo confirmar");
    } finally {
      setProcesando(false);
    }
  }

  // --- Handlers Productos del Tacho ---
  function limpiarFormProducto() {
    setProductoEditando(null);
    setCodigoBarras("");
    setNombreProd("");
    setTamanoMl("");
    setPuntosProd("");
    setEsReciclable(true);
  }

  function seleccionarProductoParaEditar(prod: ProductoTacho) {
    setProductoEditando(prod);
    setCodigoBarras(prod.codigo_de_barras);
    setNombreProd(prod.nombre);
    setTamanoMl(prod.tamano_ml ? String(prod.tamano_ml) : "");
    setPuntosProd(String(prod.puntos));
    setEsReciclable(prod.es_reciclable);
  }

  async function handleGuardarProducto() {
    if (!claveAdmin) return;
    const puntosNum = parseInt(puntosProd || "0", 10);
    const tamanoNum = parseInt(tamanoMl || "0", 10);

    if (!codigoBarras.trim() || !/^\d+$/.test(codigoBarras.trim())) {
      Alert.alert("Dato inválido", "Ingresá un código de barras numérico.");
      return;
    }
    if (esReciclable && (isNaN(puntosNum) || puntosNum <= 0)) {
      Alert.alert("Dato inválido", "Un producto reciclable debe valer más de 0 puntos.");
      return;
    }

    setProcesando(true);
    try {
      if (productoEditando) {
        await actualizarProductoAdmin(claveAdmin, productoEditando.id, {
          nombre: nombreProd.trim() || productoEditando.nombre,
          tamano_ml: isNaN(tamanoNum) ? 0 : tamanoNum,
          puntos: esReciclable ? puntosNum : 0,
          es_reciclable: esReciclable,
        });
        Alert.alert("Actualizado", "Producto modificado correctamente.");
      } else {
        await crearProductoAdmin(claveAdmin, {
          codigo_de_barras: codigoBarras.trim(),
          nombre: nombreProd.trim(),
          tamano_ml: isNaN(tamanoNum) ? 0 : tamanoNum,
          puntos: esReciclable ? puntosNum : 0,
          es_reciclable: esReciclable,
        });
        Alert.alert("Guardado", "Producto registrado en el tacho.");
      }
      limpiarFormProducto();
      await cargarTodo(claveAdmin);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setProcesando(false);
    }
  }

  function confirmarBorrarProducto(prod: ProductoTacho) {
    Alert.alert("Eliminar producto", `¿Borrar "${prod.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          if (!claveAdmin) return;
          try {
            await eliminarProductoAdmin(claveAdmin, prod.id);
            if (productoEditando?.id === prod.id) limpiarFormProducto();
            await cargarTodo(claveAdmin);
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "No se pudo borrar");
          }
        },
      },
    ]);
  }

  // --- Handlers Premios ---
  async function handleCrearPremio() {
    if (!claveAdmin) return;
    const puntosNum = parseInt(puntosPremio || "0", 10);
    if (!codigoPremio.trim() || !nombrePremio.trim() || isNaN(puntosNum) || puntosNum <= 0) {
      Alert.alert("Faltan datos", "Completá código, nombre y puntos mayores a 0.");
      return;
    }

    setProcesando(true);
    try {
      await crearPremioAdmin(claveAdmin, {
        codigo: codigoPremio.trim(),
        nombre_producto: nombrePremio.trim(),
        descripcion: descPremio.trim(),
        puntos: puntosNum,
        disponible: disponiblePremio,
      });
      Alert.alert("Premio creado", "Ya aparece en el catálogo de canje.");
      setCodigoPremio("");
      setNombrePremio("");
      setDescPremio("");
      setPuntosPremio("");
      setDisponiblePremio(true);
      await cargarTodo(claveAdmin);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo crear el premio");
    } finally {
      setProcesando(false);
    }
  }

  async function handleToggleDisponibilidadPremio(premio: Premio) {
    if (!claveAdmin) return;
    try {
      await cambiarDisponibilidadPremioAdmin(claveAdmin, premio.id, !premio.disponible);
      await cargarTodo(claveAdmin);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo actualizar");
    }
  }

  function confirmarBorrarPremio(premio: Premio) {
    Alert.alert("Eliminar premio", `¿Borrar "${premio.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: async () => {
          if (!claveAdmin) return;
          try {
            await eliminarPremioAdmin(claveAdmin, premio.id);
            await cargarTodo(claveAdmin);
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "No se pudo borrar");
          }
        },
      },
    ]);
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
          <Text style={styles.titulo}>CONTROL Kiosco</Text>
          <TouchableOpacity onPress={handleCerrarSesionAdmin}>
            <Text style={styles.enlaceSalir}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* --- SELECTOR DE PESTAÑAS --- */}
        <View style={styles.tabs}>
          {(["canjes", "productos", "premios"] as Pestana[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, pestana === tab && styles.tabActiva]}
              onPress={() => {
                setPestana(tab);
                setCamaraQrActiva(false);
                setCamaraBarrasActiva(false);
              }}
            >
              <Text style={[styles.textoTab, pestana === tab && styles.textoTabActiva]}>
                {tab === "canjes" ? "Canjes" : tab === "productos" ? "Tacho" : "Premios"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ================= PESTAÑA 1: CANJES ================= */}
        {pestana === "canjes" && (
          <View style={{ flex: 1 }}>
            {camaraQrActiva && (
              <View style={styles.camaraWrapper}>
                <CameraView
                  style={styles.camara}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={(res) => {
                    if (res.data) {
                      setCamaraQrActiva(false);
                      setIdCanjeInput(res.data);
                      buscarCanje(res.data);
                    }
                  }}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.botonPrincipal}
              onPress={async () => {
                if (camaraQrActiva) return setCamaraQrActiva(false);
                if (await verificarPermisoCamara()) setCamaraQrActiva(true);
              }}
            >
              <Text style={styles.textoBotonPrincipal}>
                {camaraQrActiva ? "Cerrar cámara" : "📷 Escanear QR de canje"}
              </Text>
            </TouchableOpacity>

            <View style={styles.filaBusqueda}>
              <TextInput
                style={styles.inputInline}
                value={idCanjeInput}
                onChangeText={setIdCanjeInput}
                placeholder="ID del canje"
                placeholderTextColor="#7a8c7a"
                autoCapitalize="none"
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
                  <Text style={styles.estadoError}>El QR venció.</Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.botonConfirmar, procesando && styles.deshabilitado]}
                    onPress={handleConfirmarEntrega}
                    disabled={procesando}
                  >
                    <Text style={styles.textoBotonPrincipal}>
                      {procesando ? "Confirmando..." : "Confirmar entrega"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.subtitulo}>Últimos canjes entregados</Text>
            <FlatList
              data={ultimosCanjes}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.textoVacio}>Sin canjes confirmados.</Text>}
              renderItem={({ item }) => (
                <View style={styles.tarjetaItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo}>{item.nombre_premio}</Text>
                    <Text style={styles.itemSub}>
                      {item.nombre_usuario} • {formatearFechaCompleta(item.fecha)}
                    </Text>
                  </View>
                  <Text style={styles.itemPuntos}>-{item.puntos} pts</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* ================= PESTAÑA 2: PRODUCTOS DEL TACHO ================= */}
        {pestana === "productos" && (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.formulario}>
              <Text style={styles.subtitulo}>
                {productoEditando ? "Editar envase del tacho" : "Registrar envase del tacho"}
              </Text>

              {camaraBarrasActiva && (
                <View style={styles.camaraWrapper}>
                  <CameraView
                    style={styles.camara}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
                    onBarcodeScanned={(res) => {
                      if (res.data) {
                        setCamaraBarrasActiva(false);
                        setCodigoBarras(res.data);
                      }
                    }}
                  />
                </View>
              )}

              <View style={styles.filaBusqueda}>
                <TextInput
                  style={[styles.inputInline, productoEditando && styles.deshabilitado]}
                  value={codigoBarras}
                  onChangeText={setCodigoBarras}
                  editable={!productoEditando}
                  keyboardType="numeric"
                  placeholder="Código de barras (EAN)"
                  placeholderTextColor="#7a8c7a"
                />
                {!productoEditando && (
                  <TouchableOpacity
                    style={styles.botonBuscar}
                    onPress={async () => {
                      if (camaraBarrasActiva) return setCamaraBarrasActiva(false);
                      if (await verificarPermisoCamara()) setCamaraBarrasActiva(true);
                    }}
                  >
                    <Text style={styles.textoBotonBuscar}>
                      {camaraBarrasActiva ? "Cerrar" : "📷 Leer"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                value={nombreProd}
                onChangeText={setNombreProd}
                placeholder="Nombre (opcional, busca online)"
                placeholderTextColor="#7a8c7a"
              />

              <View style={styles.filaDosColumnas}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={tamanoMl}
                  onChangeText={setTamanoMl}
                  keyboardType="numeric"
                  placeholder="Tamaño (ml)"
                  placeholderTextColor="#7a8c7a"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }, !esReciclable && styles.deshabilitado]}
                  value={esReciclable ? puntosProd : "0"}
                  onChangeText={setPuntosProd}
                  editable={esReciclable}
                  keyboardType="numeric"
                  placeholder="Puntos"
                  placeholderTextColor="#7a8c7a"
                />
              </View>

              <View style={styles.filaSwitch}>
                <Text style={styles.labelSwitch}>¿Es reciclable (abre compuerta)?</Text>
                <Switch
                  value={esReciclable}
                  onValueChange={setEsReciclable}
                  trackColor={{ true: "#2e7d32" }}
                />
              </View>

              <TouchableOpacity
                style={[styles.botonPrincipal, procesando && styles.deshabilitado]}
                onPress={handleGuardarProducto}
                disabled={procesando}
              >
                <Text style={styles.textoBotonPrincipal}>
                  {productoEditando ? "Guardar cambios" : "Agregar producto al tacho"}
                </Text>
              </TouchableOpacity>

              {productoEditando && (
                <TouchableOpacity style={styles.botonCancelar} onPress={limpiarFormProducto}>
                  <Text style={styles.textoCancelar}>Cancelar edición</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.subtitulo}>Productos registrados ({productosTacho.length})</Text>
            {productosTacho.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={styles.tarjetaItem}
                onPress={() => seleccionarProductoParaEditar(prod)}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemTitulo}>{prod.nombre || "Sin nombre"}</Text>
                  <Text style={styles.itemSub}>
                    EAN: {prod.codigo_de_barras} {prod.tamano_ml ? `• ${prod.tamano_ml} ml` : ""}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[styles.itemPuntos, !prod.es_reciclable && { color: "#b00020" }]}>
                    {prod.es_reciclable ? `+${prod.puntos} pts` : "No reciclable"}
                  </Text>
                  <TouchableOpacity
                    style={styles.botonBorrar}
                    onPress={() => confirmarBorrarProducto(prod)}
                  >
                    <Text style={styles.textoBotonBorrar}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ================= PESTAÑA 3: PREMIOS CANJEABLES ================= */}
        {pestana === "premios" && (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={styles.formulario}>
              <Text style={styles.subtitulo}>Nuevo premio del kiosco</Text>

              <View style={styles.filaDosColumnas}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={codigoPremio}
                  onChangeText={setCodigoPremio}
                  placeholder="Cód (ej: ALF01)"
                  placeholderTextColor="#7a8c7a"
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={puntosPremio}
                  onChangeText={setPuntosPremio}
                  keyboardType="numeric"
                  placeholder="Costo (pts)"
                  placeholderTextColor="#7a8c7a"
                />
              </View>

              <TextInput
                style={styles.input}
                value={nombrePremio}
                onChangeText={setNombrePremio}
                placeholder="Nombre (ej: Alfajor Jorgito)"
                placeholderTextColor="#7a8c7a"
              />

              <TextInput
                style={styles.input}
                value={descPremio}
                onChangeText={setDescPremio}
                placeholder="Descripción (opcional)"
                placeholderTextColor="#7a8c7a"
              />

              <View style={styles.filaSwitch}>
                <Text style={styles.labelSwitch}>Disponible para canjear ahora</Text>
                <Switch
                  value={disponiblePremio}
                  onValueChange={setDisponiblePremio}
                  trackColor={{ true: "#2e7d32" }}
                />
              </View>

              <TouchableOpacity
                style={[styles.botonPrincipal, procesando && styles.deshabilitado]}
                onPress={handleCrearPremio}
                disabled={procesando}
              >
                <Text style={styles.textoBotonPrincipal}>Sumar premio</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitulo}>Catálogo de premios ({premiosKiosco.length})</Text>
            {premiosKiosco.map((premio) => (
              <View key={premio.id} style={styles.tarjetaItem}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemTitulo}>{premio.nombre}</Text>
                  <Text style={styles.itemSub}>
                    Cód: {premio.codigo} • {premio.puntos} pts
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.badgeEstado,
                      { backgroundColor: premio.disponible ? "#e8f5e9" : "#ffebee" },
                    ]}
                    onPress={() => handleToggleDisponibilidadPremio(premio)}
                  >
                    <Text
                      style={{
                        color: premio.disponible ? "#2e7d32" : "#b00020",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {premio.disponible ? "Activo" : "Pausado"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botonBorrar}
                    onPress={() => confirmarBorrarPremio(premio)}
                  >
                    <Text style={styles.textoBotonBorrar}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
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
    marginBottom: 12,
  },
  titulo: { fontSize: 26, fontWeight: "bold", color: "#517e51" },
  enlaceSalir: { color: "#b00020", fontSize: 15, fontWeight: "700" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#dce8dc",
    borderRadius: 8,
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActiva: { backgroundColor: "#2e7d32" },
  textoTab: { fontWeight: "600", color: "#1b2a1b", fontSize: 14 },
  textoTabActiva: { color: "#fff", fontWeight: "bold" },
  camaraWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#000",
  },
  camara: { flex: 1 },
  formulario: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d5e2d5",
  },
  input: {
    backgroundColor: "#f9fbf9",
    borderWidth: 1,
    borderColor: "#9bb59b",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1b2a1b",
    marginBottom: 10,
  },
  inputInline: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9bb59b",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: "#1b2a1b",
  },
  filaBusqueda: { flexDirection: "row", gap: 8, marginBottom: 10 },
  filaDosColumnas: { flexDirection: "row", gap: 8 },
  filaSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelSwitch: { fontSize: 14, fontWeight: "600", color: "#1b2a1b" },
  botonPrincipal: {
    backgroundColor: "#2e7d32",
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  textoBotonPrincipal: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  botonBuscar: {
    backgroundColor: "#1b2a1b",
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: "center",
  },
  textoBotonBuscar: { color: "#fff", fontWeight: "bold" },
  botonCancelar: { alignItems: "center", paddingVertical: 8 },
  textoCancelar: { color: "#555666", fontWeight: "600" },
  tarjetaDetalle: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2e7d32",
    marginBottom: 16,
  },
  detalleTitulo: { fontSize: 18, fontWeight: "bold", color: "#2e7d32", marginBottom: 6 },
  detalleTexto: { fontSize: 14, color: "#333", marginBottom: 4 },
  estadoError: { color: "#b00020", fontWeight: "bold", marginTop: 8 },
  botonConfirmar: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deshabilitado: { opacity: 0.5 },
  subtitulo: { fontSize: 16, fontWeight: "bold", color: "#1b2a1b", marginBottom: 8 },
  textoVacio: { color: "#555666", fontSize: 14 },
  tarjetaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2e7d32",
  },
  itemTitulo: { fontSize: 15, fontWeight: "700", color: "#2e7d32" },
  itemSub: { fontSize: 12, color: "#555666", marginTop: 2 },
  itemPuntos: { fontSize: 14, fontWeight: "800", color: "#1b5e20" },
  badgeEstado: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  botonBorrar: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoBotonBorrar: {
    color: "#b00020",
    fontWeight: "bold",
    fontSize: 12,
  },
});