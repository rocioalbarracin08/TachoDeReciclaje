import os
import time

import requests

URL_POCKETBASE = os.environ.get("POCKETBASE_URL", "http://127.0.0.1:8090")
TIEMPO_MAXIMO_SEG = 5 # casi que ni se usa
DURACION_TOKEN_SEG = 3600

_token_guardado = {"valor": None, "vence_en": 0.0}


def encabezados_admin() -> dict:
    return {"Authorization": _obtener_token_admin()}


def _obtener_token_admin() -> str:
    if time.time() < _token_guardado["vence_en"]:
        return _token_guardado["valor"]

    respuesta = requests.post(
        f"{URL_POCKETBASE}/api/collections/_superusers/auth-with-password",
        json={
            "identity": os.environ["POCKETBASE_ADMIN_EMAIL"],
            "password": os.environ["POCKETBASE_ADMIN_PASSWORD"],
        },
        timeout=5,
    )
    respuesta.raise_for_status()

    _token_guardado["valor"] = respuesta.json()["token"]
    _token_guardado["vence_en"] = time.time() + DURACION_TOKEN_SEG
    return _token_guardado["valor"]