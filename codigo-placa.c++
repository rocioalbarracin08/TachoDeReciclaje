#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "PEINE-3";
const char* WIFI_PASS = "etecPeine3";

const String URL_SERVIDOR = "http://10.56.16.22:5000";

void conectarWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("WiFi conectado");
}

void consultarUsuario(const String& dni) {
  HTTPClient http;
  http.begin(URL_SERVIDOR + "/usuario?dni=" + dni);
  int codigoHttp = http.GET();

  if (codigoHttp == HTTP_CODE_OK) {
    JsonDocument usuario;
    deserializeJson(usuario, http.getString());
    Serial.printf("El DNI %s pertenece a: %s\n", dni.c_str(), usuario["nombre"].as<const char*>());
  } else if (codigoHttp == HTTP_CODE_NOT_FOUND) {
    Serial.println("DNI no registrado");
  } else if (codigoHttp < 0) {
    Serial.printf("No se pudo conectar al servidor (error %d)\n", codigoHttp);
  } else {
    Serial.printf("Error HTTP %d\n", codigoHttp);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  conectarWifi();
  consultarUsuario("48594871");
}

void loop() {}