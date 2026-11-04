import { ClientResponseError } from "pocketbase";
import { obtenerClienteAdministrador } from "./pocketbase";
import type { DatosDni, Usuario } from "./tipos";

const COLECCION_USUARIOS = "usuarios";
const PUNTOS_INICIALES_AL_REGISTRARSE = 0;

export async function buscarUsuarioPorDni(dni: string): Promise<Usuario | null> {
  const pocketbase = await obtenerClienteAdministrador();
  try {
    return await pocketbase
      .collection(COLECCION_USUARIOS)
      .getFirstListItem<Usuario>(pocketbase.filter("dni = {:dni}", { dni }));
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) return null;
    throw error;
  }
}

export async function crearUsuarioSinPuntos(datos: DatosDni) {
  const pocketbase = await obtenerClienteAdministrador();
  return pocketbase
    .collection(COLECCION_USUARIOS)
    .create<Usuario>({ ...datos, puntos: PUNTOS_INICIALES_AL_REGISTRARSE });
}
