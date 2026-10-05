import os

import requests

import productos
import usuarios

POCKETBASE_URL = os.environ.get("POCKETBASE_URL", "http://127.0.0.1:8090")
URL_RECICLAJES = f"{POCKETBASE_URL}/api/collections/reciclajes/records"
TIEMPO_MAXIMO_SEG = 5
MAXIMO_POR_PAGINA = 500

SIN_PUNTOS = 0


def registrar(usuario: dict, producto: dict) -> int:
    if productos.esta_aprobado(producto):
        puntos = producto["puntos"]
        _guardar(usuario, producto, puntos, acreditado=True)
        usuarios.sumar_puntos(usuario["id"], puntos)
        return puntos

    _guardar(usuario, producto, SIN_PUNTOS, acreditado=False)
    return SIN_PUNTOS


def acreditar_pendientes(producto: dict) -> int:
    total_acreditados = 0
    pendientes = _buscar_pendientes(producto)

    while pendientes:
        for reciclaje in pendientes:
            _acreditar(reciclaje, producto["puntos"])
        total_acreditados += len(pendientes)
        pendientes = _buscar_pendientes(producto)

    return total_acreditados


def _buscar_pendientes(producto: dict) -> list:
    respuesta = requests.get(
        URL_RECICLAJES,
        params={
            "filter": f'producto="{producto["id"]}" && acreditado=false',
            "perPage": MAXIMO_POR_PAGINA,
        },
        timeout=TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()["items"]


def _acreditar(reciclaje: dict, puntos: int):
    datos = {"puntos_otorgados": puntos, "acreditado": True}
    respuesta = requests.patch(
        f"{URL_RECICLAJES}/{reciclaje['id']}", json=datos, timeout=TIEMPO_MAXIMO_SEG
    )
    respuesta.raise_for_status()
    usuarios.sumar_puntos(reciclaje["usuario"], puntos)


def _guardar(usuario: dict, producto: dict, puntos: int, acreditado: bool):
    datos = {
        "usuario": usuario["id"],
        "producto": producto["id"],
        "puntos_otorgados": puntos,
        "acreditado": acreditado,
    }
    respuesta = requests.post(URL_RECICLAJES, json=datos, timeout=TIEMPO_MAXIMO_SEG)
    respuesta.raise_for_status()