import os
from http import HTTPStatus
import requests
from flask import Flask, jsonify, request
import canjes, premios, productos, reciclajes, usuarios

CLAVE_ADMIN = os.environ.get("CLAVE_ADMIN", "")
HOST = os.environ.get("HOST", "0.0.0.0")
PUERTO = int(os.environ.get("PUERTO", "5000"))

app = Flask(__name__)

def respuesta_error(mensaje_error, estado_http):
    return jsonify({"error": mensaje_error}), estado_http

def respuesta_reciclaje(usuario, producto, puntos_sumados):
    mensaje = f"Felicitaciones {usuario['nombre']} sumaste {puntos_sumados} puntos"
    cuerpo = {
        "nombre": usuario["nombre"],
        "puntos_sumados": puntos_sumados,
        "puntos": usuario["puntos"],
        "mensaje": mensaje,
    }
    return jsonify(cuerpo), HTTPStatus.OK

def es_administrador():
    clave_recibida = request.headers.get("X-Admin-Clave", "")
    return bool(CLAVE_ADMIN) and clave_recibida == CLAVE_ADMIN

# ENDPOINTS ACTIVOS (MVP)
@app.get("/usuario")
def consultar_usuario():
    dni = request.args.get("dni", "")

    if not dni.isdigit():
        return respuesta_error("DNI invalido", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)

    if usuario is None:
        return respuesta_error("Usuario no registrado", HTTPStatus.NOT_FOUND)

    return jsonify({
        "id": usuario.get("id", ""),
        "dni": usuario.get("dni", ""),
        "nombre": usuario.get("nombre", ""),
        "apellido": usuario.get("apellido", ""),
        "puntos": usuario.get("puntos", 0),
        "created": usuario.get("created", ""), # Fecha de registro del usuario
        "updated": usuario.get("updated") or usuario.get("created", ""),    }), HTTPStatus.OK

@app.post("/usuario")
def registrar_usuario():
    datos = request.get_json(silent=True) or {}

    dni = str(datos.get("dni", ""))
    nombre = str(datos.get("nombre", "")).strip()
    apellido = str(datos.get("apellido", "")).strip()

    if not (dni.isdigit() and nombre and apellido):
        return respuesta_error("Faltan datos", HTTPStatus.BAD_REQUEST)

    if usuarios.buscar_por_dni(dni) is not None:
        return respuesta_error("Usuario ya registrado", HTTPStatus.CONFLICT)

    usuario = usuarios.crear(dni, nombre, apellido)

    # USAR .get() SEGURO PARA EVITAR KeyError EN updated O CUALQUIER CAMPO
    return jsonify({
        "id": usuario.get("id", ""),
        "dni": usuario.get("dni", ""),
        "nombre": usuario.get("nombre", ""),
        "apellido": usuario.get("apellido", ""),
        "puntos": usuario.get("puntos", 0),
        "created": usuario.get("created", ""),
        "updated": usuario.get("updated") or usuario.get("created", ""),
    }), HTTPStatus.CREATED

@app.get("/producto")
def consultar_producto():
    codigo_de_barras = request.args.get("codigo_de_barras") or request.args.get("codigo_barras", "")
    if not codigo_de_barras.isdigit():
        return respuesta_error("Falta el cod de barras", HTTPStatus.BAD_REQUEST)

    producto = productos.buscar_por_codigo(codigo_de_barras)
    if producto is None:
        return respuesta_error("Producto no registrado", HTTPStatus.NOT_FOUND)

    cuerpo = {
        "nombre": producto["nombre"],
        "reciclable": productos.esta_aprobado(producto),
        "puntos": producto["puntos"],
    }
    return jsonify(cuerpo), HTTPStatus.OK

@app.post("/reciclar")
def reciclar():
    datos = request.get_json(silent=True) or {}
    dni = str(datos.get("dni", ""))
    codigo_de_barras = str(datos.get("codigo_de_barras") or datos.get("codigo_de_barras", ""))

    if not (dni.isdigit() and codigo_de_barras.isdigit()):
        return respuesta_error("Faltan datos", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("Usuario no registrado", HTTPStatus.NOT_FOUND)

    producto = productos.buscar_por_codigo(codigo_de_barras)
    if producto is None:
        return respuesta_error("Producto no registrado", HTTPStatus.NOT_FOUND)

    if not productos.esta_aprobado(producto):
        return respuesta_error("Producto no reciclable", HTTPStatus.UNPROCESSABLE_ENTITY)

    puntos_sumados, usuario_actualizado = reciclajes.registrar(usuario, producto)
    return respuesta_reciclaje(usuario_actualizado, producto, puntos_sumados)

# ENDPOINTS DE CANJE DE PUNTOS POR PREMIOS DEL KIOSCO
def url_base_de_fotos():
    url_publica = os.environ.get("POCKETBASE_URL_PUBLICA", "")
    if url_publica:
        return url_publica
    direccion_que_uso_el_celular = request.host.split(":")[0]
    return f"http://{direccion_que_uso_el_celular}:8090"

def respuesta_no_autorizado():
    return respuesta_error("No autorizado", HTTPStatus.UNAUTHORIZED)

@app.get("/premios")
def listar_premios():
    solo_disponibles = not es_administrador()
    lista = premios.listar(solo_disponibles)
    url_base = url_base_de_fotos()
    return jsonify([premios.como_respuesta(p, url_base) for p in lista]), HTTPStatus.OK

@app.post("/canjes")
def solicitar_canje():
    datos = request.get_json(silent=True) or {}
    dni = str(datos.get("dni", ""))
    id_premio = str(datos.get("id_premio", ""))

    if not (dni.isdigit() and id_premio.isalnum()):
        return respuesta_error("Faltan datos", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("Usuario no registrado", HTTPStatus.NOT_FOUND)

    premio = premios.buscar_por_id(id_premio)
    if premio is None:
        return respuesta_error("Premio no encontrado", HTTPStatus.NOT_FOUND)

    if not premio.get("disponible"):
        return respuesta_error("Premio no disponible", HTTPStatus.UNPROCESSABLE_ENTITY)

    if (usuario.get("puntos") or 0) < premio.get("puntos", 0):
        return respuesta_error("No te alcanzan los puntos", HTTPStatus.UNPROCESSABLE_ENTITY)

    canje = canjes.crear_pendiente(usuario, premio)
    return jsonify({
        "id_canje": canje["id"],
        "minutos_validez": canjes.MINUTOS_VALIDEZ_DEL_QR,
    }), HTTPStatus.CREATED

@app.get("/canjes")
def historial_de_canjes():
    dni = request.args.get("dni", "")
    if not dni.isdigit():
        return respuesta_error("DNI invalido", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("Usuario no registrado", HTTPStatus.NOT_FOUND)

    lista = canjes.listar_confirmados_del_usuario(usuario["id"])
    return jsonify([canjes.como_respuesta(c) for c in lista]), HTTPStatus.OK

@app.get("/admin/canjes")
def ultimos_canjes_confirmados():
    if not es_administrador():
        return respuesta_no_autorizado()

    lista = canjes.listar_ultimos_confirmados()
    return jsonify([canjes.como_respuesta(c) for c in lista]), HTTPStatus.OK

@app.get("/admin/canjes/<id_canje>")
def consultar_canje(id_canje):
    if not es_administrador():
        return respuesta_no_autorizado()
    if not id_canje.isalnum():
        return respuesta_error("Canje invalido", HTTPStatus.BAD_REQUEST)

    canje = canjes.buscar_por_id(id_canje)
    if canje is None:
        return respuesta_error("Canje no encontrado", HTTPStatus.NOT_FOUND)

    cuerpo = canjes.como_respuesta(canje)
    cuerpo["confirmado"] = canje.get("confirmado", False)
    cuerpo["vencido"] = canjes.esta_vencido(canje)
    cuerpo["puntos_del_usuario"] = canje["expand"]["usuario"].get("puntos") or 0
    return jsonify(cuerpo), HTTPStatus.OK

@app.post("/admin/canjes/<id_canje>/confirmar")
def confirmar_canje(id_canje):
    if not es_administrador():
        return respuesta_no_autorizado()
    if not id_canje.isalnum():
        return respuesta_error("Canje invalido", HTTPStatus.BAD_REQUEST)

    canje = canjes.buscar_por_id(id_canje)
    if canje is None:
        return respuesta_error("Canje no encontrado", HTTPStatus.NOT_FOUND)

    if canje.get("confirmado"):
        return respuesta_error("El canje ya fue confirmado", HTTPStatus.CONFLICT)

    if canjes.esta_vencido(canje):
        return respuesta_error("El QR vencio, que genere otro", HTTPStatus.GONE)

    usuario = canje["expand"]["usuario"]
    premio = canje["expand"]["premio"]

    if not premio.get("disponible"):
        return respuesta_error("Premio no disponible", HTTPStatus.UNPROCESSABLE_ENTITY)

    if (usuario.get("puntos") or 0) < canje["puntos"]:
        return respuesta_error("No le alcanzan los puntos", HTTPStatus.UNPROCESSABLE_ENTITY)

    usuario_actualizado = canjes.confirmar(canje)
    return jsonify({
        "mensaje": f"Canje confirmado: {premio.get('nombre_producto', '')}",
        "puntos_restantes": usuario_actualizado.get("puntos", 0),
    }), HTTPStatus.OK

# ENDPOINTS PARA 2DO RELEASE (INACTIVOS)
"""
@app.post("/admin/aprobar-producto")
def aprobar_producto():
    if not es_administrador():
        return respuesta_error("no_autorizado", HTTPStatus.UNAUTHORIZED)

    datos = request.get_json(silent=True) or {}
    codigo_de_barras = str(datos.get("codigo_de_barras", ""))
    puntos = datos.get("puntos")

    puntos_validos = isinstance(puntos, int) and puntos > 0
    if not (codigo_de_barras.isdigit() and puntos_validos):
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    producto = productos.buscar_por_codigo(codigo_de_barras)
    if producto is None:
        return respuesta_error("producto_no_encontrado", HTTPStatus.NOT_FOUND)

    producto_aprobado = productos.aprobar(producto, puntos)
    usuarios_acreditados = reciclajes.acreditar_pendientes(producto_aprobado)
    return jsonify({"usuarios_acreditados": usuarios_acreditados}), HTTPStatus.OK

@app.patch("/sumar_puntos")
def sumar_puntos():
    datos = request.get_json(silent=True) or {}
    dni = str(datos.get("dni") or request.args.get("dni", ""))
    codigo_de_barras = str(datos.get("codigo_de_barras") or request.args.get("codigo_de_barras", ""))

    if not (dni.isdigit() and codigo_de_barras.isdigit()):
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)
    
    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("usuario_no_registrado", HTTPStatus.NOT_FOUND)

    producto = productos.buscar_por_codigo(codigo_de_barras)
    if producto is None:
        return respuesta_error("producto_no_registrado", HTTPStatus.NOT_FOUND)

    puntos_producto = producto.get("puntos", 0)
    if puntos_producto <= 0:
        return respuesta_error("producto_sin_puntos", HTTPStatus.UNPROCESSABLE_ENTITY)

    usuario_actualizado = usuarios.sumar_puntos(usuario["id"], puntos_producto)

    return jsonify({
        "nombre": usuario_actualizado["nombre"],
        "puntos_sumados": puntos_producto,
        "nueva cantidad de puntos": usuario_actualizado["puntos"],
        "mensaje": f"Se sumaron {puntos_producto} puntos a {usuario_actualizado['nombre']}"
    }), HTTPStatus.OK
"""

if __name__ == "__main__":
    app.run(host=HOST, port=PUERTO, debug=True)