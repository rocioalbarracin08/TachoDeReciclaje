import os
from http import HTTPStatus

import requests
from flask import Flask, jsonify, request

import productos
import reciclajes
import usuarios

HOST = "0.0.0.0"
PUERTO = 5000
CLAVE_ADMIN = os.environ.get("CLAVE_ADMIN", "")

app = Flask(__name__)


def respuesta_error(codigo_error, estado_http):
    return jsonify({"error": codigo_error}), estado_http


def respuesta_reciclaje(usuario, producto, puntos):
    if productos.esta_aprobado(producto):
        mensaje = f"Felicitaciones {usuario['nombre']} sumaste {puntos} puntos"
        estado_http = HTTPStatus.OK
    else:
        mensaje = f"Gracias {usuario['nombre']}! Producto en revision"
        estado_http = HTTPStatus.ACCEPTED

    cuerpo = {"nombre": usuario["nombre"], "puntos": puntos, "mensaje": mensaje}
    return jsonify(cuerpo), estado_http


def es_administrador():
    clave_recibida = request.headers.get("X-Admin-Clave", "")
    return bool(CLAVE_ADMIN) and clave_recibida == CLAVE_ADMIN


@app.get("/api/tacho/usuario")
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


@app.post("/api/tacho/reciclar")
def reciclar():
    datos = request.get_json(silent=True) or {}
    dni = str(datos.get("dni", ""))
    codigo_barras = str(datos.get("codigo_barras", ""))

    if not (dni.isdigit() and codigo_barras.isdigit()):
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    usuario = usuarios.buscar_por_dni(dni)
    if usuario is None:
        return respuesta_error("usuario_no_registrado", HTTPStatus.NOT_FOUND)

    producto = productos.obtener_o_registrar(codigo_barras)
    puntos = reciclajes.registrar(usuario, producto)
    return respuesta_reciclaje(usuario, producto, puntos)


@app.post("/api/tacho/admin/aprobar-producto")
def aprobar_producto():
    if not es_administrador():
        return respuesta_error("no_autorizado", HTTPStatus.UNAUTHORIZED)

    datos = request.get_json(silent=True) or {}
    codigo_barras = str(datos.get("codigo_barras", ""))
    puntos = datos.get("puntos")

    puntos_validos = isinstance(puntos, int) and puntos > 0
    if not (codigo_barras.isdigit() and puntos_validos):
        return respuesta_error("faltan_datos", HTTPStatus.BAD_REQUEST)

    producto = productos.buscar_por_codigo(codigo_barras)
    if producto is None:
        return respuesta_error("producto_no_encontrado", HTTPStatus.NOT_FOUND)

    producto_aprobado = productos.aprobar(producto, puntos)
    usuarios_acreditados = reciclajes.acreditar_pendientes(producto_aprobado)
    return jsonify({"usuarios_acreditados": usuarios_acreditados}), HTTPStatus.OK


@app.errorhandler(requests.RequestException)
def manejar_error_de_base_de_datos(_error):
    return respuesta_error("error_interno", HTTPStatus.INTERNAL_SERVER_ERROR)


if __name__ == "__main__":
    app.run(host=HOST, port=PUERTO)