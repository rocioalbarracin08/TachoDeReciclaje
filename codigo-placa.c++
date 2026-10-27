#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "PEINE-2";
const char* WIFI_PASS = "etecPeine2";
const String URL_SERVIDOR = "http://10.56.31.30:5000";

const int PIN_MOTOR = 2; // Pin donde se conecta el motor de la compuerta

void conectarWifi() {       
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("WiFi conectado");
}

void abrirCompuerta() {
  Serial.println("ACEPTADO: Abriendo compuerta del tacho...");
  digitalWrite(PIN_MOTOR, HIGH);
  delay(3000); 
  digitalWrite(PIN_MOTOR, LOW);
  Serial.println("CERRANDO COMPUERTA.");
}

void consultarUsuario(const String& dni) {
  HTTPClient http;
  http.begin(URL_SERVIDOR + "/usuario?dni=" + dni);
  int codigoHttp = http.GET();

  if (codigoHttp == HTTP_CODE_OK) {
    JsonDocument usuario;
    deserializeJson(usuario, http.getString());

    const char* nombre = usuario["nombre"].as<const char*>();
    const char* apellido = usuario["apellido"].as<const char*>();

    Serial.printf("El DNI %s pertenece a: %s %s\n", dni.c_str(), nombre, apellido);

  } else if (codigoHttp == HTTP_CODE_NOT_FOUND) {
    Serial.println("Rechazo: DNI no registrado");
  } else if (codigoHttp < 0) {
    Serial.printf("No se pudo conectar al servidor (error %d)\n", codigoHttp);
  } else {
    Serial.printf("Error HTTP %d\n", codigoHttp);
  }

  http.end();
}

void consultarProducto(const String& codigoBarras) {
  HTTPClient http;
  http.begin(URL_SERVIDOR + "/producto?codigo_de_barras=" + codigoBarras);
  int codigoHttp = http.GET();

  if (codigoHttp == HTTP_CODE_OK) {
    JsonDocument producto;
    deserializeJson(producto, http.getString());

    const char* nombre = producto["nombre"].as<const char*>();
    bool reciclable = producto["reciclable"].as<bool>();

    if (reciclable) {
      Serial.printf("Producto válido (%s): %s.\n", codigoBarras.c_str(), nombre);
      abrirCompuerta(); // Uso lafunción del motor para brir compuertas
    } else {
      Serial.printf("RECHAZO: El producto '%s' (%s) existe pero NO es reciclable.\n", nombre, codigoBarras.c_str());
    }

  } else if (codigoHttp == HTTP_CODE_NOT_FOUND) {
    Serial.printf("❌ RECHAZO: El producto %s NO está registrado en la base de datos.\n", codigoBarras.c_str());
  } else if (codigoHttp == HTTP_CODE_BAD_REQUEST) {
    Serial.println("❌ RECHAZO: Formato inválido (el código no es numérico).");
  } else if (codigoHttp < 0) {
    Serial.printf("No se pudo conectar al servidor (error %d)\n", codigoHttp);
  } else {
    Serial.printf("Error HTTP %d\n", codigoHttp);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTOR, OUTPUT);
  digitalWrite(PIN_MOTOR, LOW); 
  delay(1000);
  
  Serial.println("\nIniciando ESP32");
  conectarWifi();
  
  Serial.println("\n--- Probando Usuario ---");
  consultarUsuario("48594871");

  Serial.println("\n--- Probando Producto ---");
  consultarProducto("7790895645778"); 
}

void loop() {}