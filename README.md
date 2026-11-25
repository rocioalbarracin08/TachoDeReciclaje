# ♻️ Tacho de reciclaje automatizado

Un tacho inteligente que **reconoce botellas de plástico por su código de barras** y **da puntos** a quien las recicla. La persona se identifica con su DNI, recicla en el tacho y consulta sus puntos desde una app en el celular. Con esos puntos puede **canjear premios del kiosco**.

---

## 📎 Documentos

| Qué | Dónde |
|---|---|
| APK de la app (versión que funciona bien) | [**Releases**](../../releases) |
| Manual de usuario | [**Releases**](../../releases) |
| Diagrama de bloques del sistema | PDF de presentación: `TacherV2 - Reciclaje inteligente.pdf` |

> 📂 **Los documentos (manual de usuario y PDF de presentación) hay que abrirlos desde el explorador de archivos del sistema**, haciendo doble clic sobre el archivo. No se ven desde el editor de código ni desde la terminal.
> - **Linux:** el administrador de archivos ("Archivos", Nautilus, Dolphin, etc.)
> - **Windows:** el Explorador de archivos
> - **macOS:** el Finder

---

## 🔧 Cómo funciona

1. La persona **abre la puerta principal** del tacho y escanea su **DNI**. El ESP32 le pregunta al servidor si está registrada (`GET /usuario`).
2. Escanea el **código de barras de la botella**. El ESP32 consulta si es reciclable (`GET /producto`).
3. Si lo es, la pantalla LCD le indica que **deposite la botella y cierre la puerta**.
4. Un **sensor reed** detecta que la puerta se cerró y el tacho **vuelve a escanear el código por dentro**, para evitar que se cambie la botella. Si no coincide, se cancela.
5. El ESP32 llama a `POST /reciclar` y el servidor **suma los puntos**. La LCD muestra los puntos sumados y los totales, y las **compuertas se abren unos segundos** para que la botella caiga.

La **app** sirve para **registrarse**, **ver los puntos**, **ver los premios** y **canjearlos**: al pedir un canje se genera un **QR con validez limitada**, que el kiosco escanea y confirma. El reciclaje se hace siempre en el tacho.

---

## 🧰 Tecnologías

- **Base de datos:** PocketBase
- **Servidor:** Python + Flask
- **App:** React Native (Expo), con Bun
- **Tacho:** ESP32 NodeMCU-32S programado en C++ con Arduino IDE 2
- **Pruebas de la API:** Postman

---

## 📁 Qué hay en el repositorio

- `pocketbase_0.40.4_linux_amd64/` → PocketBase (la base de datos)
- `servidor/` → servidor Python (Flask)
- `reciclaje-app-mobile/` → app del usuario (React Native)
- `codigo-placa.c++` → código del ESP32 (el tacho)

---

## 🚀 Cómo usarlo

Hay dos formas: **desde el colegio** (no hay que instalar nada) o **en tu propia PC**.

### Forma A: desde el colegio

El servidor ya está armado y configurado en el colegio. Solo hay que:

1. Instalar la **APK** que está en [Releases](../../releases) (celular **Android**).
2. Conectar el celular a la red WiFi **`PEINE-2`** o **`PEINE-3`** (las dos están conectadas a la red del servidor).
3. Con el servidor encendido, **abrir la app y usarla**. Para reciclar, ir al tacho.

> ⚠️ Esta forma **solo funciona conectado a `PEINE-2` o `PEINE-3`**. Con datos móviles u otra red WiFi, la app no llega al servidor. Si el servidor del colegio está apagado, ni la app ni el tacho funcionan.

### Forma B: en tu propia PC

Para armar todo en tu casa. Necesitás **Python 3**, **Bun** y **Arduino IDE 2**, y que la **PC, el celular y el ESP32 estén en la misma red WiFi** (el ESP32 solo se conecta a redes de 2,4 GHz). Los comandos son para Linux/macOS.

**1. Clonar el repositorio y averiguar la IP de tu PC**

```bash
hostname -I              # Linux
ipconfig getifaddr en0   # macOS
```

Vas a obtener algo como `192.168.1.35`. No uses `localhost`: para el celular y el ESP32, `localhost` son ellos mismos.

**2. Terminal 1: PocketBase** (parada en la carpeta de PocketBase)

```bash
cd pocketbase_0.40.4_linux_amd64
./pocketbase serve --http="ip.de.la.pc:8090"
```

Reemplazá `ip.de.la.pc` por la IP de tu PC. Para ver todas las opciones: `./pocketbase serve --help`.

> **Usá nuestro superusuario:** la carpeta de PocketBase ya trae la base armada, así que **no hay que crear colecciones ni otro superusuario** (si creás uno nuevo, se arma una base vacía). Si querés entrar al panel, está en `http://ip.de.la.pc:8090/_/` con:
> - **Email:** `area@gmail.com`
> - **Contraseña:** `area2026`

**3. Terminal 2: servidor Python** (parada en la raíz del proyecto, tal como queda al clonarlo)

```bash
cd servidor
python3 -m venv venv
source venv/bin/activate
pip install flask requests
source .env.sh
python app.py
```

> ⚠️ **No te olvides de cambiar el `.env.sh` según tu IP local** **antes** de ejecutar `source .env.sh`.

**4. Cambiar las IP** en la app y en el ESP32 (ver la sección siguiente).

**5. Usar la app.** La APK del Release apunta al servidor del colegio, así que para usar tu PC corré la app con `bun install` y `bunx expo start` (con **Expo Go**) o generá una APK nueva (la configuración está en `eas.json`).

> Esta forma solo funciona mientras tu PC esté prendida con las dos terminales abiertas.

---

## 📍 Dónde cambiar las IP

**Solo hay que cambiarlas si estás fuera del alcance de la red del colegio** (Forma B). Con la Forma A no se toca nada.

| Archivo | Qué cambiar |
|---|---|
| `reciclaje-app-mobile/src/lib/api.ts` | La dirección del servidor (la IP de tu PC con el puerto `5000`) |
| `servidor/.env.sh` | La conexión a PocketBase (la IP de tu PC con el puerto `8090`) |
| `codigo-placa.c++` | `WIFI_SSID`, `WIFI_PASS` y `URL_SERVIDOR` (la IP de tu PC con el puerto `5000`) |

---

## 🗄️ Base de datos

| Colección | Campos principales |
|---|---|
| `usuarios` | `nombre`, `apellido`, `dni` (único), `puntos`, `created`, `updated` |
| `productos` | `codigo_de_barras` (único), `nombre`, `tamano_ml`, `puntos`, `es_reciclable` |
| `premios` | `codigo`, `nombre_producto`, `descripcion`, `puntos`, `disponible`, `foto` |
| `canjes` | `usuario`, `premio`, `puntos`, `confirmado` |

Todas las reglas de acceso están en `null`: solo el superusuario puede acceder. Por eso el servidor Python se autentica como superusuario.

---

## 🔌 Endpoints

Servidor Flask en el puerto `5000`. Todos responden en formato JSON.

### Tacho y app

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/usuario?dni=` | Sí: objeto con los datos del usuario |
| `POST` | `/usuario` | Sí: objeto con el usuario creado |
| `GET` | `/producto?codigo_de_barras=` | Sí: objeto (`nombre`, `reciclable`, `puntos`) |
| `POST` | `/reciclar` | Sí: objeto (`nombre`, `puntos_sumados`, `puntos`, `mensaje`) |
| `GET` | `/premios` | Sí: lista de premios |
| `POST` | `/canjes` | Sí: objeto (`id_canje`, `minutos_validez`) |
| `GET` | `/canjes?dni=` | Sí: lista de canjes confirmados del usuario |

### Administración

Requieren la cabecera `X-Admin-Clave` con el valor de `CLAVE_ADMIN` (definido en `.env.sh`).

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/admin/canjes` | Sí: lista de los últimos canjes confirmados |
| `GET` | `/admin/canjes/<id>` | Sí: objeto con los datos del canje |
| `POST` | `/admin/canjes/<id>/confirmar` | Sí: objeto (`mensaje`, `puntos_restantes`) |
| `GET` | `/admin/productos` | Sí: lista de productos |
| `POST` | `/admin/productos` | Sí: objeto con el producto creado |
| `PATCH` | `/admin/productos/<id>` | Sí: objeto con el producto actualizado |
| `DELETE` | `/admin/productos/<id>` | Sí: objeto con un mensaje |
| `POST` | `/admin/premios` | Sí: objeto con el premio creado (acepta JSON o formulario con foto) |
| `POST` | `/admin/premios/<id>/editar` | Sí: objeto con el premio actualizado |
| `PATCH` | `/admin/premios/<id>` | Sí: objeto con el premio actualizado |
| `DELETE` | `/admin/premios/<id>` | Sí: objeto con un mensaje |

---

## 🔩 Hardware del tacho

| Componente | Función | Conexión |
|---|---|---|
| ESP32 NodeMCU-32S | Cerebro del tacho | — |
| Lector GM65 | Lee DNI y códigos de barras | RX 26, TX 27 (9600 baudios) |
| LCD 16x2 I2C (dirección `0x27`) | Muestra mensajes | SDA 21, SCL 22 |
| Sensor reed | Detecta la puerta cerrada | Pin 23 |
| Servos (compuerta izquierda y derecha) | Abren y cierran las compuertas | Pin 33 |

**Librerías de Arduino necesarias:** `WiFi`, `HTTPClient`, `ArduinoJson`, `LiquidCrystal_I2C` y `ESP32Servo`.

Los mensajes de la LCD no llevan tildes y entran en 16 caracteres por línea.

---

## 👥 Equipo

Rocío Albarracín, Ayelen Quispe y Evelyn Villarreal · Proyecto escolar 2026