from datetime import datetime, timedelta, timezone

import requests

import pocketbase
import usuarios

URL_CANJES = f"{pocketbase.URL_POCKETBASE}/api/collections/canjes/records"
MINUTOS_VALIDEZ_DEL_QR = 5
CANTIDAD_MAXIMA_HISTORIAL = 50


def crear_pendiente(usuario: dict, premio: dict) -> dict:
    eliminar_pendientes_del_usuario(usuario["id"])

    datos = {
        "usuario": usuario["id"],
        "premio": premio["id"],
        "puntos": premio["puntos"],
        "confirmado": False,
    }
    respuesta = requests.post(
        URL_CANJES,
        json=datos,
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()


def eliminar_pendientes_del_usuario(id_usuario: str):
    pendientes = _listar(f'usuario="{id_usuario}" && confirmado=false')
    for canje in pendientes:
        respuesta = requests.delete(
            f"{URL_CANJES}/{canje['id']}",
            headers=pocketbase.encabezados_admin(),
            timeout=pocketbase.TIEMPO_MAXIMO_SEG,
        )
        respuesta.raise_for_status()


def buscar_por_id(id_canje: str):
    respuesta = requests.get(
        f"{URL_CANJES}/{id_canje}",
        params={"expand": "usuario,premio"},
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    if respuesta.status_code == 404:
        return None
    respuesta.raise_for_status()
    return respuesta.json()


def listar_confirmados_del_usuario(id_usuario: str) -> list:
    return _listar(f'usuario="{id_usuario}" && confirmado=true')


def listar_ultimos_confirmados() -> list:
    return _listar("confirmado=true")


def esta_vencido(canje: dict) -> bool:
    momento_de_creacion = _leer_fecha(canje["created"])
    limite = momento_de_creacion + timedelta(minutes=MINUTOS_VALIDEZ_DEL_QR)
    return datetime.now(timezone.utc) > limite


def confirmar(canje: dict) -> dict:
    """Resta los puntos y marca el canje como confirmado. Devuelve el usuario actualizado."""
    id_usuario = canje["expand"]["usuario"]["id"]
    puntos_del_canje = canje["puntos"]

    usuario_actualizado = usuarios.sumar_puntos(id_usuario, -puntos_del_canje)
    try:
        _marcar_como_confirmado(canje["id"])
    except requests.RequestException:
        usuarios.sumar_puntos(id_usuario, puntos_del_canje)
        raise
    return usuario_actualizado


def como_respuesta(canje: dict) -> dict:
    expandido = canje.get("expand", {})
    premio = expandido.get("premio", {})
    usuario = expandido.get("usuario", {})
    nombre_completo = f"{usuario.get('nombre', '')} {usuario.get('apellido', '')}".strip()

    return {
        "id": canje["id"],
        "nombre_premio": premio.get("nombre_producto", ""),
        "puntos": canje.get("puntos", 0),
        "fecha": canje.get("updated", ""),
        "nombre_usuario": nombre_completo,
        "dni": usuario.get("dni", ""),
    }


def _marcar_como_confirmado(id_canje: str):
    respuesta = requests.patch(
        f"{URL_CANJES}/{id_canje}",
        json={"confirmado": True},
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()


def _listar(filtro: str) -> list:
    respuesta = requests.get(
        URL_CANJES,
        params={
            "filter": filtro,
            "expand": "usuario,premio",
            "sort": "-updated",
            "perPage": CANTIDAD_MAXIMA_HISTORIAL,
        },
        headers=pocketbase.encabezados_admin(),
        timeout=pocketbase.TIEMPO_MAXIMO_SEG,
    )
    respuesta.raise_for_status()
    return respuesta.json()["items"]


def _leer_fecha(texto: str) -> datetime:
    return datetime.fromisoformat(texto.replace(" ", "T").replace("Z", "+00:00"))