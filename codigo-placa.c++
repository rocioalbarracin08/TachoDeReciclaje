#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "PEINE-2";
const char* WIFI_PASS = "etecPeine2";

const String URL_SERVIDOR = "http://10.56.2.7:5000";

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

    const char* nombre = usuario["nombre"].as<const char*>();
    const char* apellido = usuario["apellido"].as<const char*>();

    Serial.printf("El DNI %s pertenece a: %s %s\n", dni.c_str(), nombre, apellido);

  } else if (codigoHttp == HTTP_CODE_NOT_FOUND) {
    Serial.println("DNI no registrado");
  } else if (codigoHttp < 0) {
    Serial.printf("No se pudo conectar al servidor (error %d)\n", codigoHttp);
  } else {
    Serial.printf("Error HTTP %d\n", codigoHttp);
  }

  http.end();
}

void consultarProducto(const String& codigoBarras) {
  HTTPClient http;
  http.begin(URL_SERVIDOR + "/producto?codigo_barras=" + codigoBarras);
  int codigoHttp = http.GET();

  if (codigoHttp == HTTP_CODE_OK) {
    JsonDocument producto;
    deserializeJson(producto, http.getString());

    const char* nombre = producto["nombre"].as<const char*>();
    bool reciclable = producto["reciclable"].as<bool>();
    int puntos = producto["puntos"].as<int>();

    Serial.printf("Producto encontrado (%s): %s\n", codigoBarras.c_str(), nombre);
    
    /*
    if (reciclable) {
      Serial.printf(" -> Estado: APROBADO. Suma %d puntos.\n", puntos);
    } else {
      Serial.println(" -> Estado: PENDIENTE. Aún no está aprobado para sumar puntos.");
    }
    */

  } else if (codigoHttp == HTTP_CODE_NOT_FOUND) {
    Serial.printf("El producto %s NO esta registrado en la base de datos.\n", codigoBarras.c_str());
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
  
  Serial.println("\n--- Probando Usuario ---");
  consultarUsuario("48594871");

  Serial.println("\n--- Probando Producto ---");
  // Usamos el código de la Smartwater Sin Gas (591 ml) para probar
  consultarProducto("fsf"); 
}

void loop() {}