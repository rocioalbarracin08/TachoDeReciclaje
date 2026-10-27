FROM debian:bookworm-slim

WORKDIR /db

# Carpeta copiada estaticamente durante la construcción de la imagen
COPY pocketbase .
COPY pb_migrations ./pb_migrations

# Otorgamos permisos de ejecución para evitar posibles errores por la copia
RUN chmod +x /db/pocketbase

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/db/pb_data", "--automigrate=0"]