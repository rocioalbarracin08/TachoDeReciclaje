export type Usuario = {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  puntos: number;
  updated: string; // fecha de la última modificación (se usa para "último movimiento de puntos")
};

export type DatosDni = Pick<Usuario, "dni" | "nombre" | "apellido">;

export type EstadoFormulario = { error?: string };
