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


def crear(codigo: str, nombre_producto: str, descripcion: str, puntos: int, disponible: bool, archivo_foto=None) -> dict:
    datos = {
        "codigo": codigo.strip(),
        "nombre_producto": nombre_producto.strip(),
        "descripcion": descripcion.strip(),
        "puntos": str(puntos),
        "disponible": "true" if disponible else "false",
    }
    archivos = None
    if archivo_foto is not None:
        archivos = {
            "foto": (archivo_foto.filename or "premio.jpg", archivo_foto.stream, archivo_foto.mimetype or "image/jpeg")
        }

    respuesta = requests.post(
        URL_PREMIOS,
        data=datos,
        files=archivos,
        headers=pocketbase.encabezados_admin(),
        timeout=15,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def actualizar(id_premio: str, campos: dict) -> dict:
    respuesta = requests.patch(
        f"{URL_PREMIOS}/{id_premio}",
        json=campos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def eliminar(id_premio: str):
    respuesta = requests.delete(
        f"{URL_PREMIOS}/{id_premio}",
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()


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