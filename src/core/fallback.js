import { db } from "./db.js";
import { channels } from "./channels.js";

/**
 * External Discovery Fallback Engine
 * Rule: DML NEVER pretends to know what it does not know.
 * Clear distinction between:
 * - VERIFIED_NETWORK_PROVIDER
 * - EXTERNAL_DISCOVERY
 * - NOT_FOUND
 */
export function handleExternalFallback(request) {
  const publicResults = db.searchPublicDirectory(request.service_category);

  if (publicResults.length > 0) {
    const discovery = publicResults[0];
    const record = db.createExternalDiscovery({
      request_id: request.id,
      business_name: discovery.name,
      phone: discovery.phone,
      address: discovery.address,
      service_indicated: discovery.services.join(", "),
      source: "PUBLIC_DIRECTORY"
    });

    const fallbackMessage =
      `No tengo un proveedor confirmado dentro de nuestra red para esto en este momento, ` +
      `pero encontré este negocio local en Louisville que ofrece el servicio:\n\n` +
      `?? *${discovery.name}*\n` +
      `?? Teléfono: ${discovery.phone}\n` +
      `?? Dirección: ${discovery.address}\n\n` +
      `?? *Nota transparente*: Este negocio no forma parte de nuestra red directa y no podemos garantizar su precio ni disponibilidad inmediata.`;

    db.updateRequest(request.id, {
      status: "EXTERNAL_FALLBACK_OFFERED",
      updated_at: new Date().toISOString()
    });

    channels.sendCustomerMessage(request, fallbackMessage, {
      fallbackType: "EXTERNAL_DISCOVERY",
      discovery: record
    });

    return {
      type: "EXTERNAL_DISCOVERY",
      discovery: record,
      message: fallbackMessage
    };
  } else {
    const notFoundMessage =
      `Por el momento no tenemos un proveedor disponible en nuestra red para esta solicitud específica en Louisville. ` +
      `Hemos guardado tu requerimiento y nuestro equipo está buscando opciones para contactarte tan pronto tengamos alguien calificado.`;

    db.updateRequest(request.id, {
      status: "NO_PROVIDER",
      updated_at: new Date().toISOString()
    });

    channels.sendCustomerMessage(request, notFoundMessage, {
      fallbackType: "NOT_FOUND"
    });

    return {
      type: "NOT_FOUND",
      message: notFoundMessage
    };
  }
}
