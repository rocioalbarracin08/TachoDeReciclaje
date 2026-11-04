import type { DatosDni } from "./tipos";

export const esDniValido = (dni: string) => /^\d{7,8}$/.test(dni);

const SEPARADOR_DE_CAMPOS_PDF417 = "@";

function capitalizarCadaPalabra(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

/**
 * El código PDF417 del dorso del DNI argentino viene como:
 * trámite@APELLIDO@NOMBRE@SEXO@DNI@EJEMPLAR@NACIMIENTO@EMISIÓN
 */
export function extraerDatosDeCodigoPdf417(textoDelCodigo: string): DatosDni | null {
  const campos = textoDelCodigo.split(SEPARADOR_DE_CAMPOS_PDF417);
  if (campos.length < 5) return null;

  const [, apellido, nombre, , dni] = campos;
  if (!esDniValido(dni.trim())) return null;

  return {
    dni: dni.trim(),
    nombre: capitalizarCadaPalabra(nombre),
    apellido: capitalizarCadaPalabra(apellido),
  };
}
