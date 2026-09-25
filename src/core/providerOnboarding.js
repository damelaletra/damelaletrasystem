import { db } from "./db.js";
import { geminiService } from "./gemini.js";
import { channels } from "./channels.js";

/**
 * Conversational Provider Onboarding & Profile Management Engine
 * Enables providers (like Miguel Sosa) to update their business profile, skills, rates,
 * portfolio, and operational availability through natural conversation.
 */
export class ProviderOnboardingEngine {
  async handleProviderDirectMessage(provider, rawMessage, channel = "WHATSAPP") {
    console.log(`[PROVIDER ONBOARDING] Direct message from ${provider.name} (${provider.phone}): "${rawMessage}"`);

    // 1. Extract structured profile updates using Gemini AI
    const analysis = await geminiService.extractProviderProfileUpdates(rawMessage, provider);

    const updates = {};
    if (analysis && analysis.updated_fields) {
      for (const [key, value] of Object.entries(analysis.updated_fields)) {
        if (value !== null && value !== undefined) {
          updates[key] = value;
        }
      }
    }

    // 2. Persist profile changes to database
    let updatedProvider = provider;
    if (Object.keys(updates).length > 0) {
      updatedProvider = db.updateProvider(provider.id, updates) || provider;
      console.log(`[PROVIDER ONBOARDING] Updated ${provider.name} profile:`, updates);
    }

    // 3. Log event
    db.logEvent(null, "PROVIDER_PROFILE_CONVERSATION", "PROVIDER", {
      provider_id: provider.id,
      provider_name: provider.name,
      message: rawMessage,
      updates: updates,
      summary: analysis ? analysis.summary_changes : "Mensaje recibido"
    });

    // 4. Send natural response back to the provider
    const replyText = (analysis && analysis.reply_message)
      ? analysis.reply_message
      : `¡Hola ${provider.name}! Recibí tus datos y tu perfil como ${provider.display_name} está actualizado en Dame La Letra.`;

    await channels.sendProviderDirectMessage(updatedProvider, replyText, {
      updatedFields: updates,
      summaryChanges: analysis ? analysis.summary_changes : null
    });

    return {
      success: true,
      provider: updatedProvider,
      updates,
      reply: replyText
    };
  }
}

export const providerOnboarding = new ProviderOnboardingEngine();
