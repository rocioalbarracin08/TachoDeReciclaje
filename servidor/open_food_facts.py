from typing import Optional
import requests

URL_API = "https://world.openfoodfacts.org/api/v2/product"
USER_AGENT = "TachoDeReciclaje - ETEC - Version 1.0"


def buscar_nombre_producto(codigo_barras: str) -> Optional[str]:
  try:
    respuesta = requests.get(
        f"{URL_API}/{codigo_barras}.json",
        params={"fields": "product_name"},
        headers={"User-Agent": USER_AGENT},
        timeout=3,  # Timeout corto para responder rápido al cliente/ESP32
    )
    if respuesta.status_code == 200:
      datos = respuesta.json()
      if datos.get("status") == 1:
        return datos.get("product", {}).get("product_name")
  except Exception:
    # Si falla la red o la API externa, no rompe el servidor y devuelve None
    return None

  return None