import { URL_SERVIDOR_PYTHON } from "./api";
import type { DatosDni, Usuario } from "./tipos";

// 1. Consultar usuario por DNI (GET /usuario?dni=...)
export async function buscarUsuarioPorDni(dni: string): Promise<Usuario | null> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/usuario?dni=${dni}`);

  if (respuesta.status === 404) {
    return null; // Usuario no registrado
  }

  if (!respuesta.ok) {
    throw new Error("ERROR_SERVIDOR");
  }

  return await respuesta.json();
}

// 2. Registrar usuario nuevo (POST /usuario)
export async function crearUsuarioSinPuntos(datos: DatosDni): Promise<Usuario> {
  const respuesta = await fetch(`${URL_SERVIDOR_PYTHON}/usuario`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  if (respuesta.status === 409) {
    throw new Error("USUARIO_ALYA_REGISTRADO");
  }

  if (!respuesta.ok) {
    throw new Error("ERROR_SERVIDOR");
  }

  return await respuesta.json();
}