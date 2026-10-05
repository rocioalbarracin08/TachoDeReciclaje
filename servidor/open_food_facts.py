from typing import Optional

import requests

URL_API = "https://world.openfoodfacts.org/api/v2/product"
USER_AGENT = "TachoReciclaje/1.0 (proyecto escolar)"
TIEMPO_MAXIMO_SEG = 5


def buscar_nombre_producto(codigo_barras: str) -> Optional[str]:
    try:
        respuesta = requests.get(
            f"{URL_API}/{codigo_barras}",
            params={"fields": "product_name"},
            headers={"User-Agent": USER_AGENT},
            timeout=TIEMPO_MAXIMO_SEG,
        )
        datos = respuesta.json()
    except (requests.RequestException, ValueError):
        return None

    producto_encontrado = datos.get("status") == 1
    if not producto_encontrado:
        return None

    return datos["product"].get("product_name") or None