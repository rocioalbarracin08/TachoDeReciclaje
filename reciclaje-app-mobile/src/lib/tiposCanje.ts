export type Premio = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  puntos: number;
  disponible: boolean;
  foto_url: string;
};

export type Canje = {
  id: string;
  nombre_premio: string;
  puntos: number;
  fecha: string;
  nombre_usuario: string;
  dni: string;
};

export type DetalleCanje = Canje & {
  confirmado: boolean;
  vencido: boolean;
  puntos_del_usuario: number;
};

export type CanjeSolicitado = {
  id_canje: string;
  minutos_validez: number;
};