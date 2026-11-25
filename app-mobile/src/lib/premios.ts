import { URL_SERVIDOR_PYTHON } from "@/lib/api";
import { lanzarErrorDelServidor } from "@/lib/respuestas";
import type { Premio } from "@/lib/tiposCanje";

export async function obtenerPremiosDisponibles(): Promise<Premio[]> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/premios`);
  if (!respuesta.ok) await lanzarErrorDelServidor(respuesta);
  return await respuesta.json();
}

function normalizarParaBuscar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filtrarPremiosPorBusqueda(premios: Premio[], textoBuscado: string): Premio[] {
  const busqueda = normalizarParaBuscar(textoBuscado.trim());
  if (!busqueda) return premios;

  return premios.filter((premio) => {
    const nombre = normalizarParaBuscar(premio.nombre);
    const codigo = normalizarParaBuscar(premio.codigo);
    return nombre.includes(busqueda) || codigo.includes(busqueda);
  });
}

export function alcanzanLosPuntos(puntosDelUsuario: number, premio: Premio): boolean {
  return puntosDelUsuario >= premio.puntos;
}