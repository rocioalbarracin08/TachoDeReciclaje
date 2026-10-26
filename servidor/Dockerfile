FROM python:3.12-slim

WORKDIR /app

# Instalamos las dependencias globalmente en el contenedor
RUN pip install --no-cache-dir flask requests

COPY . .

EXPOSE 5000

# CORRECCIÓN: Debes ejecutar tu script de Python. 
# Cambia "app.py" por el nombre real de tu archivo principal (ej: main.py, server.py)
CMD ["python", "app.py"]