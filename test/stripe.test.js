import assert from "assert";
import { stripeService, stripe } from "../src/core/stripeService.js";
import { db } from "../src/core/db.js";

async function runStripeTests() {
  console.log("=================================================");
  console.log("   DAME LA LETRA (DML) - STRIPE TEST SUITE       ");
  console.log("=================================================\n");

  db.seed();
  const provider = db.getProviders()[0]; // José Martínez

  assert(stripe !== null, "Stripe client must be initialized with STRIPE_SECRET_KEY");
  console.log("▶ TEST 1: Stripe Client & Authentication");
  console.log("  ✔ Stripe Client initialized successfully (PASS)");

  // TEST 2: Stripe Customer Creation & Caching
  console.log("\n▶ TEST 2: Customer Creation / Retrieval");
  const customer = await stripeService.getOrCreateCustomer(provider);
  assert(customer.id.startsWith("cus_"), "Must return a valid Stripe Customer ID");
  assert.strictEqual(customer.name, provider.name);
  console.log(`  ✔ Customer created: ${customer.id} (${customer.name}) (PASS)`);

  // TEST 3: Stripe Billing - Subscription Checkout Session ($49.99/mo)
  console.log("\n▶ TEST 3: Stripe Billing (Provider Subscription Checkout)");
  const subSession = await stripeService.createSubscriptionCheckout(provider, "FOUNDING");
  assert(subSession.id.startsWith("cs_test_"), "Must return a valid Checkout Session ID");
  assert(subSession.url.includes("checkout.stripe.com"), "Must have a hosted checkout URL");
  assert.strictEqual(subSession.mode, "subscription");
  console.log(`  ✔ Subscription Session generated: ${subSession.id} -> ${subSession.url.slice(0, 45)}... (PASS)`);

  // TEST 4: Stripe Payments - Lead Fee Checkout Session ($10.00)
  console.log("\n▶ TEST 4: Stripe Payments (One-Time Lead Fee Checkout)");
  const dummyRequest = {
    id: "req-test-lead-101",
    location_raw: "Preston Hwy, Louisville",
    service_category: "PLUMBING",
    quoted_price: 150
  };
  const leadSession = await stripeService.createLeadFeeCheckout(provider, dummyRequest);
  assert(leadSession.id.startsWith("cs_test_"), "Must return a valid Checkout Session ID");
  assert.strictEqual(leadSession.mode, "payment");
  console.log(`  ✔ Lead Fee Session generated: ${leadSession.id} ($10.00 USD) (PASS)`);

  // TEST 5: Stripe Invoicing - Monthly Itemized Statement for Referred Leads
  console.log("\n▶ TEST 5: Stripe Invoicing (Monthly Provider Statement)");
  const dummyLeads = [
    { id: "req-lead-01", location_raw: "Dixie Hwy, Louisville", quoted_price: 150 },
    { id: "req-lead-02", location_raw: "Bardstown Rd, Louisville", quoted_price: 200 }
  ];
  const invoice = await stripeService.createMonthlyLeadInvoice(provider, dummyLeads);
  assert(invoice.id.startsWith("in_"), "Must return a valid Stripe Invoice ID");
  assert.strictEqual(invoice.status, "open");
  assert.strictEqual(invoice.total, 2000); // 2 leads * $10.00 = $20.00 (2000 cents)
  console.log(`  ✔ Invoice finalized: ${invoice.id} ($20.00 USD total) (PASS)`);

  // TEST 6: Stripe Connect - Provider Express Account & Onboarding Link
  console.log("\n▶ TEST 6: Stripe Connect (Provider Onboarding Link Accounts v2)");
  const onboardingLink = await stripeService.createConnectOnboardingLink(provider);
  assert(onboardingLink.url.includes("connect.stripe.com"), "Must return a valid Connect Onboarding URL");
  console.log(`  ✔ Connect Onboarding Link created: ${onboardingLink.url.slice(0, 50)}... (PASS)`);

  // TEST 7: Webhook Processing
  console.log("\n▶ TEST 7: Webhook Ingestion & State Machine Synchronization");
  const webhookResult = await stripeService.handleWebhookEvent({
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_simulated",
        subscription: "sub_test_123",
        metadata: {
          type: "PROVIDER_SUBSCRIPTION",
          provider_id: provider.id,
          plan_tier: "FOUNDING"
        }
      }
    }
  });
  assert.strictEqual(webhookResult.received, true);
  const updatedProvider = db.getProviderById(provider.id);
  assert.strictEqual(updatedProvider.subscription_status, "ACTIVE");
  assert.strictEqual(updatedProvider.subscription_tier, "FOUNDING");
  console.log("  ✔ Webhook successfully marked provider subscription as ACTIVE (PASS)");

  console.log("\n=================================================");
  console.log("   ALL 4 STRIPE PRODUCTS VALIDATED & PASSED      ");
  console.log("   (Payments, Billing, Invoicing, Connect)       ");
  console.log("=================================================\n");
}

runStripeTests().catch(err => {
  console.error("❌ STRIPE TEST SUITE FAILED:", err);
  process.exit(1);
});
