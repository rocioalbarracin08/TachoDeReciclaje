FROM python:3.12-slim

WORKDIR /app

# Instalamos las dependencias globalmente en el contenedor
RUN pip install --no-cache-dir flask requests

COPY . .

EXPOSE 5000

# Ejecutamos tu aplicación
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data"]