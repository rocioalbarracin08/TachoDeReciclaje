export async function lanzarErrorDelServidor(respuesta: Response): Promise<never> {
  const cuerpo = await respuesta.json().catch(() => ({}));
  throw new Error(cuerpo.error ?? "Error inesperado del servidor");
}