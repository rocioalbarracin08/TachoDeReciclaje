import requests

import pocketbase

URL_USUARIOS = f"{pocketbase.URL_POCKETBASE}/api/collections/usuarios/records"

def buscar_por_dni(dni: str):
    respuesta = requests.get(
        URL_USUARIOS,
        params={"filter": f'dni="{dni}"', "perPage": 1},
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    encontrados = respuesta.json()["items"]
    return encontrados[0] if encontrados else None


def sumar_puntos(id_usuario: str, puntos: int) -> dict:
    respuesta = requests.patch(
        f"{URL_USUARIOS}/{id_usuario}",
        json={"puntos+": puntos},
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()

SIN_PUNTOS = 0

def crear(dni: str, nombre: str, apellido: str) -> dict:
    datos = {
        "dni": dni,
        "nombre": nombre,
        "apellido": apellido,
        "puntos": SIN_PUNTOS,
    }
    respuesta = requests.post(
        URL_USUARIOS,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()