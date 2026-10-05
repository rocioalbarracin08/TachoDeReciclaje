import os

import requests

POCKETBASE_URL = os.environ.get("POCKETBASE_URL", "http://127.0.0.1:8090")
URL_USUARIOS = f"{POCKETBASE_URL}/api/collections/usuarios/records"
TIEMPO_MAXIMO_SEG = 5


def buscar_por_dni(dni: str):
    respuesta = requests.get(
        URL_USUARIOS,
        params={"filter": f'dni="{dni}"', "perPage": 1},
        timeout=TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    encontrados = respuesta.json()["items"]
    return encontrados[0] if encontrados else None


def sumar_puntos(id_usuario: str, puntos: int):
    respuesta = requests.patch(
        f"{URL_USUARIOS}/{id_usuario}",
        json={"puntos+": puntos},
        timeout=TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()