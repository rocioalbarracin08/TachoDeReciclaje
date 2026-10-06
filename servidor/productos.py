import requests

import open_food_facts
import pocketbase

URL_PRODUCTOS = f"{pocketbase.URL_POCKETBASE}/api/collections/productos/records"

ESTADO_PENDIENTE = "pendiente"
ESTADO_APROBADO = "aprobado"
PUNTOS_SIN_ASIGNAR = 0
NOMBRE_DESCONOCIDO = "Sin nombre"


def obtener_o_registrar(codigo_barras: str) -> dict:
    producto = buscar_por_codigo(codigo_barras)
    if producto is not None:
        return producto
    return registrar_como_pendiente(codigo_barras)


def buscar_por_codigo(codigo_barras: str):
    respuesta = requests.get(
        URL_PRODUCTOS,
        params={"filter": f'codigo_de_barras="{codigo_barras}"', "perPage": 1},
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    encontrados = respuesta.json()["items"]
    return encontrados[0] if encontrados else None


def registrar_como_pendiente(codigo_barras: str) -> dict:
    nombre = open_food_facts.buscar_nombre_producto(codigo_barras)
    datos = {
        "codigo_de_barras": codigo_barras,
        "nombre": nombre or NOMBRE_DESCONOCIDO,
        "puntos": PUNTOS_SIN_ASIGNAR,
        "estado": ESTADO_PENDIENTE,
    }
    respuesta = requests.post(
        URL_PRODUCTOS,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def aprobar(producto: dict, puntos: int) -> dict:
    datos = {"puntos": puntos, "estado": ESTADO_APROBADO}
    respuesta = requests.patch(
        f"{URL_PRODUCTOS}/{producto['id']}",
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def esta_aprobado(producto: dict) -> bool:
    return producto["estado"] == ESTADO_APROBADO