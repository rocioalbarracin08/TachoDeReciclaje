#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>

const char* WIFI_SSID = "PEINE-3";
const char* WIFI_PASS = "etecPeine3";
const String URL_SERVIDOR = "http://10.56.31.30:5000";

const int PIN_SDA = 21;
const int PIN_SCL = 22;
const int PIN_REED_SWITCH = 23;
const int PIN_SERVO = 33;
const int PIN_ESCANER_RX = 26;
const int PIN_ESCANER_TX = 27;

const size_t MAX_LARGO_CODIGO = 400;
const unsigned long TIMEOUT_ESCANEO_MS = 30000;
const unsigned long INTERVALO_MENSAJE_MS = 2000;

LiquidCrystal_I2C pantallaLcd(0x27, 16, 2);
Servo compuertaIzquierda;
Servo compuertaDerecha;

String quitarTildes(String texto) {
 texto.replace("á", "a"); texto.replace("é", "e");
 texto.replace("í", "i"); texto.replace("ó", "o");
 texto.replace("ú", "u"); texto.replace("ñ", "n");
 texto.replace("Á", "A"); texto.replace("É", "E");
 texto.replace("Í", "I"); texto.replace("Ó", "O");
 texto.replace("Ú", "U"); texto.replace("Ñ", "N");
 return texto;
}

void mostrarEnPantalla(String linea1, String linea2) {
 linea1 = quitarTildes(linea1);
 linea2 = quitarTildes(linea2);

 pantallaLcd.clear();
 pantallaLcd.setCursor(0, 0);
 pantallaLcd.print(linea1.substring(0, 16));
 pantallaLcd.setCursor(0, 1);
 pantallaLcd.print(linea2.substring(0, 16));
}

// Actualiza únicamente la segunda línea sin borrar "Bienvenido!" de la primera
void actualizarSegundaLinea(String texto) {
 texto = quitarTildes(texto);
 while (texto.length() < 16) {
   texto += " "; // Rellena con espacios para borrar caracteres sobrantes del mensaje anterior
 }
 pantallaLcd.setCursor(0, 1);
 pantallaLcd.print(texto.substring(0, 16));
}

void mostrarMensajeServidor(String mensaje) {
 mensaje.replace('_', ' ');
 if (mensaje.length() <= 16) {
   mostrarEnPantalla(mensaje, "");
 } else {
   int posEspacio = mensaje.indexOf(' ');
   if (posEspacio != -1 && posEspacio < 16) {
     mostrarEnPantalla(mensaje.substring(0, posEspacio), mensaje.substring(posEspacio + 1));
   } else {
     mostrarEnPantalla(mensaje.substring(0, 16), mensaje.substring(16, 32));
   }
 }
}

bool puertaEstaCerrada() {
 return digitalRead(PIN_REED_SWITCH) == LOW;
}

void moverCompuertas(bool abrir) {
 if (abrir) {
   compuertaIzquierda.write(180);
   compuertaDerecha.write(180);
 } else {
   compuertaIzquierda.write(97);
   compuertaDerecha.write(97);
 }
}

void conectarWifi() {
 WiFi.begin(WIFI_SSID, WIFI_PASS);
 mostrarEnPantalla("Conectando WiFi", "Espere...");

 while (WiFi.status() != WL_CONNECTED) {
   delay(500);
   Serial.print(".");
 }
 Serial.println("Conectado a una RED");
 mostrarEnPantalla("WiFi Conectado!", "Sistema Listo");
}

void limpiarLector() {
 while (Serial2.available()) {
   Serial2.read();
 }
}

String leerEscaner(unsigned long tiempoLimiteMs) {
 limpiarLector();
 String buffer = "";
 unsigned long inicio = millis();

 while (tiempoLimiteMs == 0 || millis() - inicio < tiempoLimiteMs) {
   while (Serial2.available()) {
     char c = Serial2.read();

     if (c == '\r' || c == '\n') {
       buffer.trim();
       if (buffer.length() > 0) {
         delay(50);
         limpiarLector();
         return buffer;
       }
     } else if (buffer.length() < MAX_LARGO_CODIGO) {
       buffer += c;
     }
   }
   delay(10);
 }

 return "";
}

// Mantiene "Bienvenido!" fijo arriba y alterna las instrucciones abajo mientras espera el DNI
String esperarLecturaDni() {
 limpiarLector();
 String buffer = "";
 bool mostrarPrimerMensaje = true;
 unsigned long ultimoCambio = millis();

 mostrarEnPantalla("Bienvenido!", "Abri la puerta y");

 while (true) {
   if (millis() - ultimoCambio >= INTERVALO_MENSAJE_MS) {
     mostrarPrimerMensaje = !mostrarPrimerMensaje;
     if (mostrarPrimerMensaje) {
       actualizarSegundaLinea("Abri la puerta y");
     } else {
       actualizarSegundaLinea("escanea tu DNI");
     }
     ultimoCambio = millis();
   }

   while (Serial2.available()) {
     char c = Serial2.read();


     if (c == '\r' || c == '\n') {
       buffer.trim();
       if (buffer.length() > 0) {
         delay(50);
         limpiarLector();
         return buffer;
       }
     } else if (buffer.length() < MAX_LARGO_CODIGO) {
       buffer += c;
     }
   }
   delay(10);
 }
}

String extraerDni(const String& lectura) {
 int arrobas = 0;
 for (size_t i = 0; i < lectura.length(); i++) {
   if (lectura.charAt(i) == '@') arrobas++;
 }
 if (arrobas < 4) return "";

 String campos[9];
 int idx = 0;
 int inicio = 0;
 for (int i = 0; i < (int)lectura.length() && idx < 8; i++) {
   if (lectura.charAt(i) == '@') {
     campos[idx++] = lectura.substring(inicio, i);
     inicio = i + 1;
   }
 }
 campos[idx] = lectura.substring(inicio);

 String dni = campos[4];
 dni.trim();
 if (dni.length() == 0) return "";

 for (size_t i = 0; i < dni.length(); i++) {
   if (!isDigit(dni.charAt(i))) return "";
 }
 return dni;
}

bool consultarUsuario(const String& dni, String& nombreSalida) {
 HTTPClient http;
 http.begin(URL_SERVIDOR + "/usuario?dni=" + dni);
 int codigoHttp = http.GET();
 String respuestaTexto = http.getString();

 if (codigoHttp == HTTP_CODE_OK) {
   JsonDocument doc;
   deserializeJson(doc, respuestaTexto);
   nombreSalida = doc["nombre"].as<String>();
   http.end();
   return true;
 }

 JsonDocument docError;
 deserializeJson(docError, respuestaTexto);
 String error = docError["error"].is<String>() ? docError["error"].as<String>() : "Error usuario";

 Serial.printf("Error HTTP %d: %s\n", codigoHttp, error.c_str());
 mostrarMensajeServidor(error);
 http.end();
 return false;
}

bool consultarProducto(const String& codigoBarras) {
 HTTPClient http;
 http.begin(URL_SERVIDOR + "/producto?codigo_de_barras=" + codigoBarras);
 int codigoHttp = http.GET();
 String respuestaTexto = http.getString();

 if (codigoHttp == HTTP_CODE_OK) {
   http.end();
   return true;
 }

 JsonDocument docError;
 deserializeJson(docError, respuestaTexto);
 String error = docError["error"].is<String>() ? docError["error"].as<String>() : "Error producto";

 Serial.printf("Error HTTP %d: %s\n", codigoHttp, error.c_str());
 mostrarMensajeServidor(error);

 http.end();
 return false;
}

bool ejecutarReciclaje(const String& dni, const String& codigoBarras) {
 HTTPClient http;
 http.begin(URL_SERVIDOR + "/reciclar");
 http.addHeader("Content-Type", "application/json");

 JsonDocument doc;
 doc["dni"] = dni;
 doc["codigo_de_barras"] = codigoBarras;

 String cuerpo;
 serializeJson(doc, cuerpo);

 int codigoHttp = http.sendRequest("POST", cuerpo);
 String respuestaTexto = http.getString();

 if (codigoHttp == HTTP_CODE_OK) {
   JsonDocument respuesta;
   deserializeJson(respuesta, respuestaTexto);

   int puntosSumados = respuesta["puntos_sumados"].as<int>();
   int puntosTotales = respuesta["puntos"].as<int>();

   mostrarEnPantalla("Sumaste " + String(puntosSumados) + " pts!", "Totales: " + String(puntosTotales));
   http.end();
   return true;
 }

 JsonDocument docError;
 deserializeJson(docError, respuestaTexto);
 String error = docError["error"].is<String>() ? docError["error"].as<String>() : "Error reciclaje";

 Serial.printf("Error HTTP %d al reciclar: %s\n", codigoHttp, error.c_str());
 mostrarMensajeServidor(error);

 http.end();
 return false;
}

String leerProductoInterno() {
 return leerEscaner(15000);
}

void procesarCicloReciclaje(const String& dni) {
 String nombreUsuario = "";
 mostrarEnPantalla("Verificando DNI", "Espere...");

 // 1. Validar Usuario
 if (!consultarUsuario(dni, nombreUsuario)) {
   delay(3000);
   return;
 }

 // 2. Esperar y validar Producto Inicial
 mostrarEnPantalla("Hola " + nombreUsuario + "!", "Escanee residuo");
 String codigoInicial = leerEscaner(TIMEOUT_ESCANEO_MS);

 if (codigoInicial == "") {
   mostrarEnPantalla("Tiempo agotado", "Intente de nuevo");
   delay(2500);
   return;
 }

 if (codigoInicial.indexOf('@') != -1) {
   mostrarEnPantalla("Codigo invalido", "Use un producto");
   delay(2500);
   return;
 }

 if (!consultarProducto(codigoInicial)) {
   delay(3000);
   return;
 }

 mostrarEnPantalla("Es reciclable", "Cierre la puerta");
 delay(2500);

 // 3. Esperar que cierre la puerta
 while (!puertaEstaCerrada()) {
   mostrarEnPantalla("Cierre la puerta", "para continuar");
   delay(500);
 }

 mostrarEnPantalla("Verificando...", "Espere un momento");

 // 4. Re-verificación interna
 String codigoReverificado = leerProductoInterno();

 if (codigoReverificado == "") {
   mostrarEnPantalla("Sin lectura int.", "Proceso cancelado");
   delay(3000);
   return;
 }

 if (codigoInicial != codigoReverificado) {
   mostrarEnPantalla("Prod. distinto!", "Proceso cancelado");
   delay(3000);
   return;
 }

 // 5. Enviar a servidor y abrir compuertas SOLO si es exitoso
 if (ejecutarReciclaje(dni, codigoReverificado)) {
   moverCompuertas(true);
   delay(5000);
   moverCompuertas(false);
 } else {
   delay(3000);
 }
}

void setup() {
 Serial.begin(115200);
 Serial2.setRxBufferSize(1024);
 Serial2.begin(9600, SERIAL_8N1, PIN_ESCANER_RX, PIN_ESCANER_TX);
 delay(1000);

 pinMode(PIN_REED_SWITCH, INPUT_PULLUP);
 compuertaIzquierda.attach(PIN_SERVO, 500, 2500);
 compuertaDerecha.attach(PIN_SERVO, 500, 2500);

 moverCompuertas(false);

 Wire.begin(PIN_SDA, PIN_SCL);
 pantallaLcd.init();
 pantallaLcd.backlight();

 conectarWifi();
 delay(1500);

 mostrarEnPantalla("Iniciando...", "Tacho Inteligente");
 delay(2000);
}

void loop() {
 String lectura = esperarLecturaDni();
 String dni = extraerDni(lectura);

 if (dni == "") {
   mostrarEnPantalla("DNI ilegible", "Reintente");
   delay(2000);
   return;
 }

 procesarCicloReciclaje(dni);
}