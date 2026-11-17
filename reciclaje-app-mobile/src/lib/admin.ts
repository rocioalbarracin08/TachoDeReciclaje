import { URL_SERVIDOR_PYTHON } from "@/lib/api";
import { lanzarErrorDelServidor } from "@/lib/respuestas";
import type { Canje, DetalleCanje } from "@/lib/tiposCanje";

function headersAdmin(claveAdmin: string) {
  return {
    "Content-Type": "application/json",
    "X-Admin-Clave": claveAdmin,
  };
}

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
    {
      headers: headersAdmin(claveAdmin),
    }
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