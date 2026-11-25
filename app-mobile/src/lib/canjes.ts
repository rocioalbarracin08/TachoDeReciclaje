import { URL_SERVIDOR_PYTHON } from "@/lib/api";
import { lanzarErrorDelServidor } from "@/lib/respuestas";
import type { Canje, CanjeSolicitado } from "@/lib/tiposCanje";

export async function solicitarCanje(dni: string, idPremio: string): Promise<CanjeSolicitado> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/canjes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dni, id_premio: idPremio }),
  });
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

export async function obtenerHistorialDelUsuario(dni: string): Promise<Canje[]> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/canjes?dni=${encodeURIComponent(dni)}`);
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}