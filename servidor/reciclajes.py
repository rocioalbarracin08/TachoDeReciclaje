import requests

import pocketbase
import productos
import usuarios

URL_RECICLAJES = f"{pocketbase.URL_POCKETBASE}/api/collections/reciclajes/records"
MAXIMO_POR_PAGINA = 500

SIN_PUNTOS = 0


def registrar(usuario: dict, producto: dict):
    if productos.esta_aprobado(producto):
        puntos = producto["puntos"]
        _guardar(usuario, producto, puntos, acreditado=True)
        usuario_actualizado = usuarios.sumar_puntos(usuario["id"], puntos)
        return puntos, usuario_actualizado

    _guardar(usuario, producto, SIN_PUNTOS, acreditado=False)
    return SIN_PUNTOS, usuario


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
            "filter": f'id_producto="{producto["id"]}" && acreditado=false',
            "perPage": MAXIMO_POR_PAGINA,
        },
        headers=pocketbase.encabezados_admin(),
        timeout=5,
    )
    respuesta.raise_for_status()
    return respuesta.json()["items"]


def _acreditar(reciclaje: dict, puntos: int):
    datos = {"puntos_otorgados": puntos, "acreditado": True}
    respuesta = requests.patch(
        f"{URL_RECICLAJES}/{reciclaje['id']}",
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=5,
    )
    respuesta.raise_for_status()
    usuarios.sumar_puntos(reciclaje["id_usuario"], puntos)


def _guardar(usuario: dict, producto: dict, puntos: int, acreditado: bool):
    datos = {
        "id_usuario": usuario["id"],
        "id_producto": producto["id"],
        "puntos_otorgados": puntos,
        "acreditado": acreditado,
    }
    respuesta = requests.post(
        URL_RECICLAJES,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=5,
    )
    respuesta.raise_for_status()