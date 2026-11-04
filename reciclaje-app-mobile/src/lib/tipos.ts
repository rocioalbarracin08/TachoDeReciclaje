export type Usuario = {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  puntos: number;
  created: string;
  updated?: string;
};

export type DatosDni = Pick<Usuario, "dni" | "nombre" | "apellido">;

export type EstadoFormulario = { error?: string };