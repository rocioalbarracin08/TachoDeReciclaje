import os
from http import HTTPStatus

import requests
from flask import Flask, jsonify, request

import productos, reciclajes, usuarios

CLAVE_ADMIN = os.environ.get("CLAVE_ADMIN", "")
HOST = os.environ.get("HOST", "0.0.0.0")
PUERTO = int(os.environ.get("PUERTO", "5000"))

app = Flask(__name__)


def respuesta_error(codigo_error, estado_http):
    return jsonify({"error": codigo_error}), estado_http


def respuesta_reciclaje(usuario, producto, puntos_sumados):
    if productos.esta_aprobado(producto):
        mensaje = f"Felicitaciones {usuario['nombre']} sumaste {puntos_sumados} puntos"
        estado_http = HTTPStatus.OK
    else:
        mensaje = f"Gracias {usuario['nombre']}! Producto en revision"
        estado_http = HTTPStatus.ACCEPTED

    cuerpo = {
        "nombre": usuario["nombre"],
        "puntos_sumados": puntos_sumados,
        "puntos": usuario["puntos"],
        "mensaje": mensaje,
    }
    return jsonify(cuerpo), estado_http


def es_administrador():
    clave_recibida = request.headers.get("X-Admin-Clave", "")
    return bool(CLAVE_ADMIN) and clave_recibida == CLAVE_ADMIN


@app.get("/usuario") # listo
def consultar_usuario():
    dni = request.args.get("dni", "")
    if not dni.isdigit():
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("usuario_no_registrado", HTTPStatus.NOT_FOUND)

    cuerpo = {
        "nombre": usuario["nombre"],
        "apellido": usuario["apellido"],
        "puntos": usuario["puntos"],
    }
    return jsonify(cuerpo), HTTPStatus.OK

@app.post("/usuario") # 2do release para el pr0blema de sì el usuario no estaba registrado
def registrar_usuario():
    datos = request.get_json(silent=True) or {}
    dni = str(datos.get("dni", ""))
    nombre = str(datos.get("nombre", "")).strip()
    apellido = str(datos.get("apellido", "")).strip()

    if not (dni.isdigit() and nombre and apellido):
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    if usuarios.buscar_por_dni(dni) is not None:
        return respuesta_error("usuario_ya_registrado", HTTPStatus.CONFLICT)

    usuario = usuarios.crear(dni, nombre, apellido)
    cuerpo = {
        "nombre": usuario["nombre"],
        "apellido": usuario["apellido"],
        "puntos": usuario["puntos"],
    }
    return jsonify(cuerpo), HTTPStatus.CREATED

@app.get("/producto") # listo
def consultar_producto():
    codigo_de_barras = request.args.get("codigo_de_barras", "")
    if not codigo_de_barras.isdigit():
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    producto = productos.buscar_por_codigo(codigo_de_barras)
    if producto is None:
        return respuesta_error("producto_no_registrado", HTTPStatus.NOT_FOUND)

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
    codigo_de_barras = str(datos.get("codigo_de_barras", ""))

    if not (dni.isdigit() and codigo_de_barras.isdigit()):
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("usuario_no_registrado", HTTPStatus.NOT_FOUND)

    producto = productos.obtener_o_registrar(codigo_de_barras)
    puntos_sumados, usuario_actualizado = reciclajes.registrar(usuario, producto)
    return respuesta_reciclaje(usuario_actualizado, producto, puntos_sumados)

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

@app.patch("/sumar_puntos") # Listo
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

#@app.errorhandler(requests.RequestException)
#def manejar_error_de_base_de_datos(_error):
#    return respuesta_error("error_interno", HTTPStatus.INTERNAL_SERVER_ERROR)

if __name__ == "__main__":
    app.run(host=HOST, port=PUERTO, debug=True)