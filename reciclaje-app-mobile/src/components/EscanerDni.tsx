import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

type Props = {
  alDetectarCodigo: (textoDelCodigo: string) => void;
};

export function EscanerDni({ alDetectarCodigo }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [camaraActiva, setCamaraActiva] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted && camaraActiva) {
    return (
      <View style={styles.contenedorAlerta}>
        <Text style={styles.textoError}>Se necesitan permisos de cámara</Text>
        <TouchableOpacity style={styles.botonSecundario} onPress={requestPermission}>
          <Text style={styles.textoBotonSecundario}>Otorgar Permisos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {camaraActiva && (
        <View style={styles.camaraWrapper}>
          <CameraView
            style={styles.camara}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["pdf417"],
            }}
            onBarcodeScanned={(resultado) => {
              if (resultado.data) {
                setCamaraActiva(false);
                alDetectarCodigo(resultado.data);
              }
            }}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => setCamaraActiva(!camaraActiva)}
      >
        <Text style={styles.textoBotonSecundario}>
          {camaraActiva ? "Cancelar escaneo" : "📷 Escanear DNI (dorso)"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginVertical: 12,
  },
  camaraWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#000",
  },
  camara: {
    flex: 1,
  },
  botonSecundario: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotonSecundario: {
    color: "#2e7d32",
    fontSize: 16,
    fontWeight: "600",
  },
  contenedorAlerta: {
    padding: 12,
    alignItems: "center",
  },
  textoError: {
    color: "#b00020",
    marginBottom: 8,
  },
});