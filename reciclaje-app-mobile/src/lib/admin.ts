import { URL_SERVIDOR_PYTHON } from "@/lib/api";
import { lanzarErrorDelServidor } from "@/lib/respuestas";
import type { Canje, DetalleCanje, Premio } from "@/lib/tiposCanje";
import { fetch as expoFetch } from "expo/fetch";

export type ProductoTacho = {
  id: string;
  codigo_de_barras: string;
  nombre: string;
  tamano_ml: number;
  puntos: number;
  es_reciclable: boolean;
};

function headersAdmin(claveAdmin: string) {
  return {
    "Content-Type": "application/json",
    "X-Admin-Clave": claveAdmin,
  };
}

// --- CANJES ---
export async function validarYListarCanjesAdmin(claveAdmin: string): Promise<Canje[]> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/canjes`, {
    headers: headersAdmin(claveAdmin),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function consultarDetalleCanjeAdmin(
  claveAdmin: string,
  idCanje: string
): Promise<DetalleCanje> {
  const respuesta = await fetch(
    `${URL_SERVIDOR_PYTHON}/admin/canjes/${encodeURIComponent(idCanje.trim())}`,
    { headers: headersAdmin(claveAdmin) }
  );
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function confirmarCanjeAdmin(
  claveAdmin: string,
  idCanje: string
): Promise<{ mensaje: string; puntos_restantes: number }> {
  const respuesta = await fetch(
    `${URL_SERVIDOR_PYTHON}/admin/canjes/${encodeURIComponent(idCanje.trim())}/confirmar`,
    {
      method: "POST",
      headers: headersAdmin(claveAdmin),
    }
  );
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

// --- PRODUCTOS DEL TACHO ---
export async function listarProductosAdmin(claveAdmin: string): Promise<ProductoTacho[]> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/productos`, {
    headers: headersAdmin(claveAdmin),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function crearProductoAdmin(
  claveAdmin: string,
  datos: Omit<ProductoTacho, "id">
): Promise<ProductoTacho> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/productos`, {
    method: "POST",
    headers: headersAdmin(claveAdmin),
    body: JSON.stringify(datos),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function actualizarProductoAdmin(
  claveAdmin: string,
  idProducto: string,
  datos: Omit<ProductoTacho, "id" | "codigo_de_barras">
): Promise<ProductoTacho> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/productos/${idProducto}`, {
    method: "PATCH",
    headers: headersAdmin(claveAdmin),
    body: JSON.stringify(datos),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function eliminarProductoAdmin(claveAdmin: string, idProducto: string): Promise<void> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/productos/${idProducto}`, {
    method: "DELETE",
    headers: headersAdmin(claveAdmin),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
}

// --- PREMIOS CANJEABLES ---
export async function listarTodosLosPremiosAdmin(claveAdmin: string): Promise<Premio[]> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/premios`, {
    headers: headersAdmin(claveAdmin),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export function crearPremioAdmin(
  claveAdmin: string,
  datos: {
    codigo: string;
    nombre_producto: string;
    descripcion: string;
    puntos: number;
    disponible: boolean;
    fotoUri?: string | null;
  }
): Promise<Premio> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("codigo", datos.codigo);
    formData.append("nombre_producto", datos.nombre_producto);
    formData.append("descripcion", datos.descripcion);
    formData.append("puntos", String(datos.puntos));
    formData.append("disponible", datos.disponible ? "true" : "false");

    if (datos.fotoUri) {
      const nombreArchivo = datos.fotoUri.split("/").pop() || "premio.jpg";
      const extension = nombreArchivo.split(".").pop()?.toLowerCase();
      const tipoMime = extension === "png" ? "image/png" : "image/jpeg";

      formData.append("foto", {
        uri: datos.fotoUri,
        name: nombreArchivo,
        type: tipoMime,
      } as any);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${URL_SERVIDOR_PYTHON}/admin/premios`);
    xhr.setRequestHeader("X-Admin-Clave", claveAdmin);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let mensaje = `Error ${xhr.status}`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error) mensaje = err.error;
        } catch {}
        reject(new Error(mensaje));
      }
    };

    xhr.onerror = () => {
      reject(new Error("No se pudo conectar con el servidor"));
    };

    xhr.send(formData);
  });
}

export async function cambiarDisponibilidadPremioAdmin(
  claveAdmin: string,
  idPremio: string,
  disponible: boolean
): Promise<Premio> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/premios/${idPremio}`, {
    method: "PATCH",
    headers: headersAdmin(claveAdmin),
    body: JSON.stringify({ disponible }),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function eliminarPremioAdmin(claveAdmin: string, idPremio: string): Promise<void> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/admin/premios/${idPremio}`, {
    method: "DELETE",
    headers: headersAdmin(claveAdmin),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
}