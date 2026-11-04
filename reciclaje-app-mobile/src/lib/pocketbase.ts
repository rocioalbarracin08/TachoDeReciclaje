import PocketBase from "pocketbase";

const clienteAdministrador = new PocketBase(process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090");

/** Autentica como superusuario solo cuando el token venció o todavía no existe. */
export async function obtenerClienteAdministrador() {
  if (!clienteAdministrador.authStore.isValid) {
    await clienteAdministrador
      .collection("_superusers")
      .authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL!, process.env.POCKETBASE_ADMIN_PASSWORD!);
  }
  return clienteAdministrador;
}
