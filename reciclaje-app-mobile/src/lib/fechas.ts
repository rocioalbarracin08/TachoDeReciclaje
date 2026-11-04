const ZONA_HORARIA_ARGENTINA = "America/Argentina/Buenos_Aires";

const UNIDADES_DE_MAYOR_A_MENOR: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

// Agrega la validación para devolver una fecha o valor por defecto si fechaTexto es undefined/vacío
const convertirFechaDePocketBase = (fechaTexto?: string) => {
  if (!fechaTexto) return new Date();
  return new Date(fechaTexto.replace(" ", "T"));
};

export function describirTiempoTranscurrido(fechaTexto: string) {
  const segundosDeDiferencia = Math.round(
    (convertirFechaDePocketBase(fechaTexto).getTime() - Date.now()) / 1000,
  );
  const formateador = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

  for (const [unidad, segundosPorUnidad] of UNIDADES_DE_MAYOR_A_MENOR) {
    if (Math.abs(segundosDeDiferencia) >= segundosPorUnidad) {
      return formateador.format(Math.round(segundosDeDiferencia / segundosPorUnidad), unidad);
    }
  }
  return "hace instantes";
}

export const formatearFechaCompleta = (fechaTexto: string) =>
  convertirFechaDePocketBase(fechaTexto).toLocaleString("es-AR", {
    timeZone: ZONA_HORARIA_ARGENTINA,
    dateStyle: "long",
    timeStyle: "short",
  });
