import os

HOST = "0.0.0.0"
PUERTO = 5000

POCKETBASE_URL = "http://127.0.0.1:8090"
POCKETBASE_EMAIL = os.environ.get("POCKETBASE_EMAIL", "")
POCKETBASE_CLAVE = os.environ.get("POCKETBASE_CLAVE", "")

CLAVE_ADMIN = os.environ.get("area2026", "")

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product"
OPEN_FOOD_FACTS_USER_AGENT = "TachoReciclaje/1.0 (proyecto escolar)"

TIEMPO_MAXIMO_RESPUESTA_SEG = 5
REGISTROS_POR_PAGINA = 100