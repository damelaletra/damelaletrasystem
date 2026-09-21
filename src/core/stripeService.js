import Stripe from "stripe";
import dotenv from "dotenv";
import { db } from "./db.js";

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY || "";
export const stripe = secretKey ? new Stripe(secretKey) : null;

/**
 * Stripe Service for Dame La Letra (DML)
 * Implements: Payments, Billing, Invoicing, and Connect.
 */
export class StripeService {
  constructor() {
    this.client = stripe;
    this.baseUrl = process.env.BASE_URL || "https://www.damelaletra.com";
  }

  isConfigured() {
    return !!this.client;
  }

  /**
   * 1. Stripe Customer Management
   */
  async getOrCreateCustomer(provider) {
    if (!this.isConfigured()) throw new Error("Stripe is not configured.");

    // Check if provider already has a stripe_customer_id in DB
    if (provider.stripe_customer_id) {
      try {
        const existing = await this.client.customers.retrieve(provider.stripe_customer_id);
        if (existing && !existing.deleted) return existing;
      } catch (e) {
        console.warn("[STRIPE] Customer lookup warning:", e.message);
      }
    }

    // Search by email or phone
    const existingList = await this.client.customers.list({
      email: provider.contact_email || undefined,
      limit: 1
    });

    if (existingList.data.length > 0) {
      const customer = existingList.data[0];
      db.updateProvider(provider.id, { stripe_customer_id: customer.id });
      return customer;
    }

    const fallbackEmail = provider.contact_email || `billing+${(provider.phone || provider.id).replace(/[^\d\w]/g, "")}@damelaletra.com`;

    // Create new customer
    const newCustomer = await this.client.customers.create({
      name: provider.name,
      email: fallbackEmail,
      phone: provider.phone,
      metadata: {
        provider_id: provider.id,
        business_id: provider.business_id || "none",
        category: provider.category || "GENERAL"
      }
    });

    db.updateProvider(provider.id, { stripe_customer_id: newCustomer.id });
    return newCustomer;
  }

  /**
   * 2. Stripe Billing: Provider Recurring Subscription ($49.99/mo)
   */
  async createSubscriptionCheckout(provider, planTier = "FOUNDING") {
    if (!this.isConfigured()) throw new Error("Stripe is not configured.");

    const customer = await this.getOrCreateCustomer(provider);
    const amountCents = planTier === "FOUNDING" ? 4999 : 7999;

    const session = await this.client.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `DML Red de Proveedores - Plan ${planTier} (Louisville, KY)`,
              description: `Membresía activa para recibir clientes y solicitudes directas de ${provider.category} en Louisville.`
            },
            unit_amount: amountCents,
            recurring: {
              interval: "month"
            }
          },
          quantity: 1
        }
      ],
      success_url: `${this.baseUrl}/provider.html?session_id={CHECKOUT_SESSION_ID}&subscribed=true`,
      cancel_url: `${this.baseUrl}/provider.html?subscription_cancelled=true`,
      metadata: {
        provider_id: provider.id,
        type: "PROVIDER_SUBSCRIPTION",
        plan_tier: planTier
      }
    });

    return session;
  }

  /**
   * 3. Stripe Payments: One-Time Connection / Lead Fee ($10.00)
   */
  async createLeadFeeCheckout(provider, request) {
    if (!this.isConfigured()) throw new Error("Stripe is not configured.");

    const customer = await this.getOrCreateCustomer(provider);

    const session = await this.client.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tarifa de Conexión DML - Solicitud #${request.id.slice(-6)}`,
              description: `Cliente verificado en ${request.location_raw} (${request.service_category}). Cotizado: $${request.quoted_price}.`
            },
            unit_amount: 1000 // $10.00 USD
          },
          quantity: 1
        }
      ],
      success_url: `${this.baseUrl}/admin.html?lead_paid=${request.id}`,
      cancel_url: `${this.baseUrl}/admin.html?lead_cancelled=${request.id}`,
      metadata: {
        request_id: request.id,
        provider_id: provider.id,
        type: "LEAD_CONNECTION_FEE"
      }
    });

    return session;
  }

  /**
   * 4. Stripe Invoicing: Monthly Itemized Statement for Provider
   */
  async createMonthlyLeadInvoice(provider, completedRequests = []) {
    if (!this.isConfigured()) throw new Error("Stripe is not configured.");

    let customer = await this.getOrCreateCustomer(provider);
    if (!customer.email) {
      const fallbackEmail = provider.contact_email || `billing+${(provider.phone || provider.id).replace(/[^\d\w]/g, "")}@damelaletra.com`;
      customer = await this.client.customers.update(customer.id, { email: fallbackEmail });
    }

    // Create draft invoice
    const invoice = await this.client.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 7,
      description: `Liquidación mensual de clientes referidos DML (${completedRequests.length} conexiones)`,
      metadata: {
        provider_id: provider.id,
        total_connections: completedRequests.length.toString()
      }
    });

    // Add invoice line items for each connection
    for (const req of completedRequests) {
      await this.client.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: 1000, // $10.00 per connection
        currency: "usd",
        description: `Conexión con cliente #${req.id.slice(-6)} en ${req.location_raw} ($${req.quoted_price})`
      });
    }

    // Finalize invoice
    const finalized = await this.client.invoices.finalizeInvoice(invoice.id);
    return finalized;
  }

  /**
   * 5. Stripe Connect: Provider Onboarding & Direct Payouts (Accounts v2)
   */
  async createConnectAccount(provider) {
    if (!this.isConfigured()) throw new Error("Stripe is not configured.");

    // Check if already has connect account
    if (provider.stripe_connect_account_id) {
      return { id: provider.stripe_connect_account_id };
    }

    const cleanName = (provider.name || "Provider").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "").trim();

    const metadata = {
      provider_id: provider.id || "unknown"
    };
    if (provider.business_id) metadata.business_id = provider.business_id;
    if (provider.category) metadata.category = provider.category;

    const accountParams = {
      display_name: cleanName,
      identity: { country: "us" },
      dashboard: "express",
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application"
        }
      },
      configuration: {
        merchant: {}
      },
      metadata: metadata
    };

    if (provider.contact_email) {
      accountParams.contact_email = provider.contact_email;
    }

    const account = await this.client.v2.core.accounts.create(accountParams);

    db.updateProvider(provider.id, { stripe_connect_account_id: account.id });
    return account;
  }

  async createConnectOnboardingLink(provider) {
    if (!this.isConfigured()) throw new Error("Stripe is not configured.");

    const account = await this.createConnectAccount(provider);

    const accountLink = await this.client.v2.core.accountLinks.create({
      account: account.id,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant"],
          refresh_url: `${this.baseUrl}/provider.html?connect_refresh=true`,
          return_url: `${this.baseUrl}/provider.html?connect_success=true`
        }
      }
    });

    return accountLink;
  }

  /**
   * 6. Webhook Event Processing
   */
  async handleWebhookEvent(event) {
    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};

        if (metadata.type === "PROVIDER_SUBSCRIPTION") {
          const providerId = metadata.provider_id;
          db.updateProvider(providerId, {
            subscription_tier: metadata.plan_tier || "FOUNDING",
            subscription_status: "ACTIVE",
            subscription_id: session.subscription
          });
          console.log(`[STRIPE] Provider ${providerId} subscription activated (${metadata.plan_tier})`);
        }

        if (metadata.type === "LEAD_CONNECTION_FEE") {
          const requestId = metadata.request_id;
          db.updateRequest(requestId, { lead_fee_paid: true });
          console.log(`[STRIPE] Request ${requestId} lead fee confirmed paid.`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        console.log(`[STRIPE] Invoice ${invoice.id} paid for customer ${invoice.customer}.`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const providers = db.getProviders(p => p.subscription_id === sub.id);
        for (const prov of providers) {
          db.updateProvider(prov.id, { subscription_status: "INACTIVE" });
          console.log(`[STRIPE] Provider ${prov.name} subscription marked INACTIVE.`);
        }
        break;
      }

      default:
        console.log(`[STRIPE] Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}

export const stripeService = new StripeService();
