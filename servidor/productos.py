import random
import string
import requests
import open_food_facts
import pocketbase

URL_PRODUCTOS = f"{pocketbase.URL_POCKETBASE}/api/collections/productos/records"

PUNTOS_SIN_ASIGNAR = 0
NOMBRE_DESCONOCIDO = "Sin nombre"


def _generar_id() -> str:
    caracteres = string.ascii_lowercase + string.digits
    return "".join(random.choices(caracteres, k=15))


def listar_todos() -> list:
    respuesta = requests.get(
        URL_PRODUCTOS,
        params={"perPage": 200, "sort": "nombre"},
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()["items"]


def crear(codigo_barras: str, nombre: str, tamano_ml: int, puntos: int, es_reciclable: bool) -> dict:
    nombre_final = nombre.strip() or open_food_facts.buscar_nombre_producto(codigo_barras) or NOMBRE_DESCONOCIDO
    datos = {
        "id": _generar_id(),
        "codigo_de_barras": codigo_barras.strip(),
        "nombre": nombre_final,
        "tamano_ml": tamano_ml,
        "puntos": puntos if es_reciclable else 0,
        "es_reciclable": es_reciclable,
    }
    respuesta = requests.post(
        URL_PRODUCTOS,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def actualizar(id_producto: str, nombre: str, tamano_ml: int, puntos: int, es_reciclable: bool) -> dict:
    datos = {
        "nombre": nombre.strip(),
        "tamano_ml": tamano_ml,
        "puntos": puntos if es_reciclable else 0,
        "es_reciclable": es_reciclable,
    }
    respuesta = requests.patch(
        f"{URL_PRODUCTOS}/{id_producto}",
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def eliminar(id_producto: str):
    respuesta = requests.delete(
        f"{URL_PRODUCTOS}/{id_producto}",
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()


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
        "id": _generar_id(),
        "codigo_de_barras": codigo_barras.strip(),
        "nombre": nombre or NOMBRE_DESCONOCIDO,
        "puntos": PUNTOS_SIN_ASIGNAR,
        "es_reciclable": False,
    }
    respuesta = requests.post(
        URL_PRODUCTOS,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    if respuesta.status_code not in (200, 201):
        print("Error de PocketBase:", respuesta.status_code, respuesta.text)
    respuesta.raise_for_status()
    return respuesta.json()


def aprobar(producto: dict, puntos: int) -> dict:
    datos = {"puntos": puntos, "es_reciclable": True}
    respuesta = requests.patch(
        f"{URL_PRODUCTOS}/{producto['id']}",
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def esta_aprobado(producto: dict) -> bool:
    return producto.get("puntos", 0) > 0