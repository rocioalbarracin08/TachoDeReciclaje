import requests

import pocketbase
import productos
import usuarios

URL_REGISTRO_TEMPORAL = f"{pocketbase.URL_POCKETBASE}/api/collections/registro_temporal_asignar_puntos/records"
MAXIMO_POR_PAGINA = 500

SIN_PUNTOS = 0

def registrar(usuario: dict, producto: dict):
    if productos.esta_aprobado(producto):
        puntos = producto["puntos"]
        # si el producto ya existe y vale puntos, se los sumo directo sin pasar por la tabla temporal
        usuario_actualizado = usuarios.sumar_puntos(usuario["id"], puntos)
        return puntos, usuario_actualizado

    # si no existe o vale 0, recien ahi atrapo el momento y lo mando a la tabla temporal
    _guardar_en_temporal(usuario, producto)
    return SIN_PUNTOS, usuario

def acreditar_pendientes(producto: dict) -> int:
    total_acreditados = 0
    pendientes = _buscar_pendientes(producto)

    while pendientes:
        for registro in pendientes:
            # le asigno al usuario los puntos correspondientes
            usuarios.sumar_puntos(registro["id_usuario"], producto["puntos"])
            # como ya se le asignaron los puntos, borro el registro de la tabla temporal
            _borrar_registro_temporal(registro["id"])
            
        total_acreditados += len(pendientes)
        pendientes = _buscar_pendientes(producto)

    return total_acreditados

def _buscar_pendientes(producto: dict) -> list:
    respuesta = requests.get(
        URL_REGISTRO_TEMPORAL,
        # quite el filtro de acreditado porque la tabla entera son solo los pendientes
        params={
            "filter": f'id_producto="{producto["id"]}"',
            "perPage": MAXIMO_POR_PAGINA,
        },
        headers=pocketbase.encabezados_admin(),
        timeout=5,
    )
    respuesta.raise_for_status()
    return respuesta.json()["items"]

def _borrar_registro_temporal(id_registro: str):
    # agregue esta funcion para poder eliminar el registro una vez que sume los puntos
    respuesta = requests.delete(
        f"{URL_REGISTRO_TEMPORAL}/{id_registro}",
        headers=pocketbase.encabezados_admin(),
        timeout=5,
    )
    respuesta.raise_for_status()

def _guardar_en_temporal(usuario: dict, producto: dict):
    datos = {
        "id_usuario": usuario["dni"],
        "id_producto": producto["codigo_de_barras"]
    }
    respuesta = requests.post(
        URL_REGISTRO_TEMPORAL,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=5,
    )
    respuesta.raise_for_status()