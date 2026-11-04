const ZONA_HORARIA_ARGENTINA = "America/Argentina/Buenos_Aires";

const convertirFechaDePocketBase = (fechaTexto?: string): Date => {
  if (!fechaTexto) return new Date();
  // Convierte el formato "YYYY-MM-DD HH:mm:ss" de PocketBase a formato ISO compatible con JS
  const ISO = fechaTexto.includes(" ") ? fechaTexto.replace(" ", "T") : fechaTexto;
  const d = new Date(ISO);
  return isNaN(d.getTime()) ? new Date() : d;
};

export function describirTiempoTranscurrido(fechaTexto?: string): string {
  if (!fechaTexto) return "Fecha no disponible";
  
  const fecha = convertirFechaDePocketBase(fechaTexto);
  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);

  if (segundos < 60) return "hace instantes";
  
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

export const formatearFechaCompleta = (fechaTexto?: string): string => {
  if (!fechaTexto) return "-";
  const fecha = convertirFechaDePocketBase(fechaTexto);
  try {
    return fecha.toLocaleString("es-AR", {
      timeZone: ZONA_HORARIA_ARGENTINA,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return fecha.toLocaleDateString();
  }
};