# ♻️ Tacho de reciclaje automatizado

Un tacho inteligente que **reconoce botellas de plástico por su código de barras** y **da puntos** a quien las recicla. La persona se identifica con su DNI, tira la botella y consulta sus puntos desde una app en el celular.

Este README está pensado como **guía técnica y de deploy** para que otros alumnos de 6to puedan armar y replicar el proyecto.

---

## 📖 Índice

1. [Documentación en otros archivos](#-documentación-en-otros-archivos)
2. [Manual de usuario → ver Release](#-manual-de-usuario--ver-release)
3. [Cómo funciona (resumen)](#-cómo-funciona-resumen)
4. [Tecnologías usadas](#-tecnologías-usadas)
5. [Estructura del repositorio](#-estructura-del-repositorio)
6. [Deploy paso a paso](#-deploy-paso-a-paso)
7. [Dónde se configura cada IP](#-dónde-se-configura-cada-ip)
8. [Base de datos (PocketBase)](#-base-de-datos-pocketbase)
9. [Endpoints del servidor](#-endpoints-del-servidor)
10. [Pruebas con Postman](#-pruebas-con-postman)
11. [Hardware del tacho](#-hardware-del-tacho)
12. [Alcance y limitaciones](#-alcance-y-limitaciones)
13. [Problemas frecuentes](#-problemas-frecuentes)
14. [Equipo](#-equipo)

---

## 📎 Documentación en otros archivos

| Qué | Dónde |
|---|---|
| APK de la app (versión que funciona bien) | [**Releases**](../../releases) |
| Manual de usuario | [**Releases**](../../releases) |
| Diagrama de bloques del sistema | PDF de presentación (`TacherV2 - Reciclaje inteligente.pdf`) |

---

## 👤 Manual de usuario → [ver Release](../../releases)

El paso a paso para **usar** el tacho (instalar la APK, registrarse, reciclar y ver los puntos) está en el manual de usuario que se encuentra en la sección **[Releases](../../releases)**, junto con la APK.

**Lo único que tiene que saber el usuario antes de empezar:**

- Necesita un celular **Android** con **internet**.
- La app se conecta al **servidor de nuestro colegio de la UBA**. Ese servidor es **local** (está físicamente en el colegio) pero es **público localmente**: la app funciona solo estando conectado auna red WiFi del colegio que este relacionada/conectada a la red del servidor.
- Si el servidor del colegio está apagado, **ni la app ni el tacho funcionan**.

---

## 🔧 Cómo funciona (resumen)

> El diagrama de bloques completo está en el PDF de presentación: Tacher V2 - Reciclaje inteligente en la Escuela.

1. La persona escanea su **DNI** en el tacho. El ESP32 le pregunta al servidor (`GET /usuario`) si está registrada.
2. Escanea el **código de barras de la botella**. El ESP32 consulta al servidor (`GET /producto`) si es reciclable.
3. Si lo es, la persona recibe un mensaje por el lcd para depositar la botella.
4. Un **sensor reed** detecta que la puerta principal se cerró y el tacho **vuelve a escanear el código internamente**, para evitar que se cambie la botella.
5. El ESP32 llama a `POST /reciclar` y el servidor **suma los puntos** al usuario.
6. La LCD muestra *"Felicitaciones [Nombre] sumaste X puntos"*.

La **app** sirve para **registrarse** (`POST /usuario`) y **consultar los puntos** (`GET /usuario`). El reciclaje se hace siempre en el tacho.

---

## 🧰 Tecnologías usadas

| Parte | Tecnología |
|---|---|
| Base de datos | **PocketBase** |
| Servidor | **Python** + **Flask** (librería `requests` para hablar con PocketBase) |
| Dónde corre el servidor | Una **máquina virtual (VM)** Linux |
| App de usuarios | **React Native**, con **Bun** como gestor/ejecutor |
| Firmware del tacho | **C++** con **Arduino IDE 2** |
| Placa | **ESP32 NodeMCU-32S** |
| Pruebas de la API | **Postman** |

---

## 📁 Estructura del repositorio

```
TachoDeReciclaje/
├── pocketbase_0.40.4_linux_amd64/   ← PocketBase (la base de datos), versión 0.40.4 para Linux
│
├── reciclaje-app-mobile/            ← App del usuario (Expo / React Native)
│   ├── assets/                      ← imágenes e íconos de la app
│   ├── scripts/                     ← scripts auxiliares del proyecto Expo
│   ├── src/
│   │   ├── app/                     ← pantallas de la app
│   │   │   ├── _layout.tsx          ← estructura general de la navegación
│   │   │   ├── index.tsx            ← pantalla de inicio (ingreso con DNI)
│   │   │   ├── registro.tsx         ← pantalla para registrarse
│   │   │   └── perfil.tsx           ← perfil del usuario con sus puntos
│   │   ├── components/
│   │   │   └── EscanerDni.tsx       ← componente que escanea el DNI con la cámara
│   │   ├── lib/                     ← lógica de la app (sin pantallas)
│   │   │   ├── api.ts               ← ⭐ acá se define la IP/URL del servidor
│   │   │   ├── pocketbase.ts        ← conexión con PocketBase
│   │   │   ├── usuarios.ts          ← funciones para consultar y registrar usuarios
│   │   │   ├── sesion.ts            ← manejo de la sesión iniciada
│   │   │   ├── dni.ts               ← lectura y validación del DNI
│   │   │   ├── fechas.ts            ← formato de fechas
│   │   │   └── tipos.ts             ← tipos de TypeScript
│   │   └── global.css               ← estilos globales
│   ├── app.json                     ← configuración de la app Expo
│   ├── eas.json                     ← configuración para generar la APK (EAS Build)
│   ├── package.json / bun.lock      ← dependencias (Bun)
│   ├── tsconfig.json / expo-env.d.ts
│   └── README.md
│
├── servidor/                        ← Servidor Python (Flask)
│   ├── app.py                       ← endpoints de Flask
│   ├── pocketbase.py                ← conexión con PocketBase
│   ├── usuarios.py                  ← acceso a la colección "usuarios"
│   ├── productos.py                 ← acceso a la colección "productos"
│   ├── reciclajes.py                ← lógica de sumar puntos al reciclar
│   ├── open_food_facts.py           ← no se usa en esta versión (ver "Alcance y limitaciones")
│   ├── Dockerfile                   ← para correr el servidor en un contenedor
│   └── .env.sh                      ← ⭐ variables de entorno (conexión a PocketBase, clave admin)
│
├── codigo-placa.c++                 ← ⭐ código del ESP32 (WiFi, IP del servidor, lector, LCD, servos)
├── docker-compose.yml               ← levanta los servicios con Docker
├── backup_tacho_reciclaje.bin       ← backup del proyecto
└── README.md                        ← este archivo
```

---

## 🚀 Deploy paso a paso

Hacer los pasos **en este orden**: primero la base, después el servidor, después la app y por último el tacho.

### 1️⃣ Preparar la máquina virtual

Usamos una **VM Linux** para alojar PocketBase y el servidor de Python.

- Tiene que tener **IP accesible** desde donde se vayan a conectar el tacho y los celulares.
- Tienen que estar **abiertos los puertos** que se usan:
  - el de **PocketBase** (por defecto `8090`),
  - el del **servidor Flask** (por defecto `5000`).
- Anotá la **IP de la VM**: la vas a necesitar en los pasos 4, 5 y 6.

### 2️⃣ Levantar PocketBase

1. Descargá PocketBase para Linux desde [pocketbase.io](https://pocketbase.io/docs/) y descomprimilo en la VM.
2. Ejecutalo indicando que escuche en todas las interfaces:

   ```bash
   ./pocketbase serve --http="0.0.0.0:8090"
   ```
3. Entrá al panel de administración desde el navegador: `http://IP_DE_LA_VM:8090/_/`
4. La primera vez te pide crear el **superusuario** (ver [credenciales](#-credenciales-del-superusuario)).

### 3️⃣ Crear las colecciones

Dentro del panel de PocketBase creá las colecciones **`usuarios`** y **`productos`** con los campos de la sección [Base de datos](#-base-de-datos-pocketbase).

Puntos importantes:

- Todas las reglas de acceso (list/view/create/update/delete) están en **`null`**, es decir, **solo el superusuario puede acceder**. Por eso el servidor Python se autentica como superusuario.
- Los índices **únicos** son obligatorios:
  - `usuarios.dni` único
  - `productos.codigo_de_barras` único
- Cargá a mano en `productos` los **códigos de barras de las botellas que querés aceptar**, con su `nombre`, `tamano_ml`, `puntos` y `es_reciclable` en `true`.

> 💡 PocketBase permite **importar colecciones** pegando un JSON desde *Settings → Import collections*, así que no hace falta crearlas a mano.

### 4️⃣ Configurar y levantar el servidor Python

1. Instalá las dependencias en la VM:

   ```bash
   pip install flask requests
   ```
2. Abrí el archivo **`/servidor/.env.sh`** y completá la **conexión al servidor donde está alojado PocketBase** (la IP/URL de la VM y las credenciales del superusuario), además de la clave de administrador. Es un archivo de variables de entorno:

   ```bash
   # Ejemplo de formato (usá los nombres de variables que ya trae tu .env.sh)
   export CLAVE_ADMIN="una_clave_segura"
   export HOST="0.0.0.0"
   export PUERTO="5000"
   # + las variables de conexión a PocketBase (URL y credenciales)
   ```
3. Cargá las variables y ejecutá el servidor:

   ```bash
   cd servidor
   source .env.sh
   python app.py
   ```
4. Si todo salió bien, Flask queda escuchando en `http://0.0.0.0:5000`.

### 5️⃣ Probar el servidor con Postman

Antes de tocar la app o el tacho, **probá los endpoints** (ver [Pruebas con Postman](#-pruebas-con-postman)). Si Postman funciona, el servidor y la base están bien.

### 6️⃣ Configurar la app

1. Abrí el archivo **`/src/lib/api.ts`** y cambiá la dirección del servidor por la IP/URL de **tu** VM y el puerto de Flask:

   ```ts
   // Ejemplo: usar la IP de tu VM
   const URL_SERVIDOR = "http://IP_DE_LA_VM:5000";
   ```
2. Para probarla en modo desarrollo:

   ```bash
   bun install
   bun dev
   ```
3. Para instalar la app en un celular Android, usá la **APK que está en [Releases](../../releases)**. Si cambiaste la IP del servidor, tenés que **volver a generar la APK** con tu IP. COMPLETAR_COMANDO_O_PASOS_PARA_GENERAR_LA_APK

### 7️⃣ Configurar y cargar el ESP32

1. Instalá **Arduino IDE 2** y el soporte para placas ESP32.
2. Abrí el sketch y completá:
   - el **nombre y contraseña del WiFi** al que se va a conectar el tacho,
   - la **IP y el puerto del servidor** (la IP de la VM).
3. Elegí la placa **NodeMCU-32S**, el puerto COM correcto y cargá el sketch.
4. Mirá el **Monitor Serie** para ver los mensajes de depuración.

> ⚠️ El ESP32 y el servidor tienen que poder verse por red. Si el WiFi del tacho no tiene salida a la IP del servidor, no va a funcionar.

---

## 📍 Dónde se configura cada IP

| Quién se conecta | A quién | Dónde se configura |
|---|---|---|
| App (celular) | Servidor Python | `/src/lib/api.ts` |
| Servidor Python | PocketBase | `/servidor/.env.sh` |
| ESP32 (tacho) | Servidor Python | En el sketch de Arduino (`COMPLETAR_ARCHIVO`) |

Si cambiás la IP de la VM, **tenés que actualizar los tres lugares**.

---

## 🗄️ Base de datos (PocketBase)

Dos colecciones:

### `usuarios`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | texto (15 caracteres) | Automático |
| `nombre` | texto | |
| `apellido` | texto | |
| `dni` | texto | **Obligatorio y único** |
| `puntos` | número | Puntos acumulados |
| `created` | fecha automática | Se completa al crear el usuario |
| `updated` | fecha automática | Se actualiza en cada modificación. La app la muestra como **"último reciclaje"** |

### `productos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | texto | Automático |
| `codigo_de_barras` | texto | **Obligatorio y único** |
| `nombre` | texto | |
| `tamano_ml` | número | Tamaño de la botella en ml |
| `puntos` | número | Puntos que da reciclarla |
| `es_reciclable` | booleano | Si el tacho la acepta |

---

## 🔌 Endpoints del servidor

Servidor **Flask** (por defecto en `0.0.0.0:5000`). Variables de entorno: `HOST`, `PUERTO`, `CLAVE_ADMIN`.

### Activos (versión actual)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/usuario?dni=...` | Devuelve los datos de un usuario |
| `POST` | `/usuario` | Registra un usuario nuevo (empieza con 0 puntos) |
| `GET` | `/producto?codigo_de_barras=...` | Informa si un producto es reciclable |
| `POST` | `/reciclar` | Suma los puntos del producto al usuario |

#### `GET /usuario?dni=12345678`

```json
{
  "id": "abc123def456ghi",
  "dni": "12345678",
  "nombre": "Rocío",
  "apellido": "Pérez",
  "puntos": 30,
  "created": "2026-11-01 10:00:00.000Z",
  "updated": "2026-11-10 15:30:00.000Z"
}
```
Errores: `400` DNI inválido · `404` usuario no registrado.

#### `POST /usuario`

Cuerpo:
```json
{ "dni": "12345678", "nombre": "Rocío", "apellido": "Pérez" }
```
Respuesta `201` con los datos del usuario creado. Errores: `400` faltan datos · `409` usuario ya registrado.

#### `GET /producto?codigo_de_barras=7790000000000`

```json
{ "nombre": "Botella 500 ml", "reciclable": true, "puntos": 10 }
```
Errores: `400` falta el código de barras · `404` producto no registrado.

#### `POST /reciclar`

Cuerpo:
```json
{ "dni": "12345678", "codigo_de_barras": "7790000000000" }
```
Respuesta `200`:
```json
{
  "nombre": "Rocío",
  "puntos_sumados": 10,
  "puntos": 40,
  "mensaje": "Felicitaciones Rocío sumaste 10 puntos"
}
```
Errores: `400` faltan datos · `404` usuario o producto no registrado · `422` producto no reciclable.

### Inactivos (para un 2do release)

Están **comentados** en `app.py` y no se usan en esta versión:

- `POST /admin/aprobar-producto` — el administrador aprueba un producto y le asigna puntos (protegido con la cabecera `X-Admin-Clave`).
- `PATCH /sumar_puntos` — versión alternativa para sumar puntos.

---

## 🧪 Pruebas con Postman

Probamos todos los endpoints con **Postman** antes de conectar la app y el tacho. Para replicarlo:

1. Creá una colección nueva con la URL base `http://IP_DE_LA_VM:5000`.
2. Probá en este orden:
   1. `POST /usuario` → crear un usuario de prueba.
   2. `GET /usuario?dni=...` → debería devolver ese usuario.
   3. `GET /producto?codigo_de_barras=...` → con un código cargado en la base.
   4. `POST /reciclar` → debería sumar puntos.
   5. `GET /usuario?dni=...` otra vez → los puntos tienen que haber subido.
3. Probá también los **casos de error**: DNI inexistente, producto no cargado, cuerpo sin datos.

---

## 🔩 Hardware del tacho

| Componente | Función | Conexión |
|---|---|---|
| ESP32 NodeMCU-32S | Cerebro del tacho | — |
| Lector GM65 | Lee DNI y códigos de barras | Serial2: RX 26, TX 27, 9600 baudios |
| LCD 16x2 I2C | Muestra mensajes | SDA 21, SCL 22 |
| Sensor reed | Detecta compuerta cerrada | Pin 23 (`INPUT_PULLUP`) |
| Servos (compuerta izquierda y derecha) | Abren y cierran la compuerta | Pin 33 |

Los mensajes de la LCD **no llevan tildes** y entran en **16 caracteres por línea**.

---

## 🚧 Alcance y limitaciones

- Solo recicla **botellas de plástico** (no latas), distinguidas por tamaño.
- **No hay búsqueda en bases externas** (por ejemplo Open Food Facts). El servidor busca el código **solo en nuestra base**: si el producto no existe, **se rechaza y no se guarda en ninguna tabla**. Para aceptar un producto nuevo hay que **cargarlo a mano en PocketBase**.
- Depende de que el **servidor del colegio** esté encendido.
- La app es solo para **Android**.
- El lector GM65 puede **pitar** mientras la compuerta está abierta (no logramos configurarlo por comandos HEX por falta de tiempo).
- Es un **prototipo escolar**.

---

## 🛠️ Problemas frecuentes

| Problema | Posible causa |
|---|---|
| La app dice que no se puede conectar | IP incorrecta en `/src/lib/api.ts`, servidor apagado o puerto cerrado en la VM |
| El servidor responde error al consultar la base | Mal configurado `/servidor/.env.sh` o PocketBase apagado |
| `Usuario no registrado` en el tacho | El DNI no fue registrado desde la app |
| `Producto no registrado` | El código de barras no está cargado en `productos` |
| `Producto no reciclable` | El producto está cargado, pero con `es_reciclable` en `false` |
| La LCD se queda en "Bienvenido!" | El ESP32 no recibe datos del lector: revisar cables RX/TX (26 y 27) y la velocidad (9600) |
| El ESP32 no llega al servidor | WiFi incorrecto, IP del servidor mal puesta en el sketch o red sin acceso a la VM |

---

## 🔐 Credenciales del superusuario

Para entrar al panel de PocketBase (`http://TU_IP:8090/_/`) usamos:

- **Email:** `area@gmail.com`
- **Contraseña:** `area2026`

> ⚠️ Son datos del superusuario de **nuestro entorno de prueba**. Si vas a hacer tu propio deploy, **creá tu propio superusuario con otra contraseña**.

---

## 👥 Equipo

- Rocío Albarracín, Ayelen Quispe y Evelyn Villarreal

**Colegio:** NOMBRE_DEL_COLEGIO_AQUI (UBA) · **Año:** 2026