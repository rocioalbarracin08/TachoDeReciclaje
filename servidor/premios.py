import requests

import pocketbase

URL_PREMIOS = f"{pocketbase.URL_POCKETBASE}/api/collections/premios/records"
CANTIDAD_MAXIMA_PREMIOS = 200


def listar(solo_disponibles: bool) -> list:
    parametros = {"perPage": CANTIDAD_MAXIMA_PREMIOS, "sort": "puntos"}
    if solo_disponibles:
        parametros["filter"] = "disponible=true"

    respuesta = requests.get(
        URL_PREMIOS,
        params=parametros,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()["items"]


def buscar_por_id(id_premio: str):
    respuesta = requests.get(
        f"{URL_PREMIOS}/{id_premio}",
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    if respuesta.status_code == 404:
        return None
    respuesta.raise_for_status()
    return respuesta.json()


def construir_url_foto(premio: dict, url_base_pocketbase: str) -> str:
    nombre_archivo = premio.get("foto", "")
    if not nombre_archivo:
        return ""
    return f"{url_base_pocketbase}/api/files/premios/{premio['id']}/{nombre_archivo}"


def como_respuesta(premio: dict, url_base_pocketbase: str) -> dict:
    return {
        "id": premio["id"],
        "codigo": premio.get("codigo", ""),
        "nombre": premio.get("nombre_producto", ""),
        "descripcion": premio.get("descripcion", ""),
        "puntos": premio.get("puntos", 0),
        "disponible": premio.get("disponible", False),
        "foto_url": construir_url_foto(premio, url_base_pocketbase),
    }