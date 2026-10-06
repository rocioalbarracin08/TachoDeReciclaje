#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "PEINE-3";
const char* WIFI_PASS = "etecPeine3";

const String URL_SERVIDOR = "http://10.56.16.22:5000";  
const String RUTA_USUARIO = "/usuario";

const String DNI_DE_ROCIO = "48594871";  

void conectarWifi() {
  Serial.print("Conectando a WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Conectado. IP de la placa: ");
  Serial.println(WiFi.localIP());
}

int pedirUsuario(const String& dni, String& cuerpoRespuesta) {
  HTTPClient http;
  http.begin(URL_SERVIDOR + RUTA_USUARIO + "?dni=" + dni);
  int codigoHttp = http.GET();
  cuerpoRespuesta = http.getString();
  http.end();
  return codigoHttp;
}

void mostrarNombre(const String& cuerpo) {
  JsonDocument usuario;
  deserializeJson(usuario, cuerpo);
  Serial.printf("El DNI %s pertenece a: %s\n", DNI_DE_ROCIO.c_str(), usuario["nombre"].as<const char*>() );
}

void mostrarResultado(int codigoHttp, const String& cuerpo) {
  if (codigoHttp == HTTP_CODE_OK) {
    mostrarNombre(cuerpo);
  } else if (codigoHttp == HTTP_CODE_NOT_FOUND) {
    Serial.println("El servidor respondio: DNI no registrado");
  } else if (codigoHttp < 0) {
    Serial.printf("No se pudo conectar al servidor (error %d)\n", codigoHttp);
  } else {
    Serial.printf("El servidor respondio con error HTTP %d\n", codigoHttp);
  }
}

void setup() {
  Serial.begin(115200);
  conectarWifi();

  Serial.println("Enviando request al servidor...");
  String cuerpo;
  int codigoHttp = pedirUsuario(DNI_DE_ROCIO, cuerpo);
  mostrarResultado(codigoHttp, cuerpo);
}

void loop() {}