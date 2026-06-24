import { getEnv } from '@/lib/db';

type Plan = 'free' | 'pro' | 'enterprise';

const PLANS: Record<Plan, { priceId: string; name: string; features: string[] }> = {
  free: {
    priceId: '',
    name: 'Free',
    features: ['50 AI messages/day', '3 CTF challenges/day', 'Basic leaderboard'],
  },
  pro: {
    priceId: 'price_pro_monthly',
    name: 'Pro',
    features: ['Unlimited AI messages', 'Unlimited CTF challenges', 'Priority support', 'Custom models', 'API access'],
  },
  enterprise: {
    priceId: 'price_enterprise_monthly',
    name: 'Enterprise',
    features: ['Everything in Pro', 'Custom deployment', 'Dedicated support', 'SLA', 'Team management'],
  },
};

interface D1Like {
  prepare(sql: string): { bind(...args: unknown[]): { first<T>(): Promise<T | null>; run(): Promise<unknown> } };
}

export async function getStripeCustomer(userId: string): Promise<{ id: string } | null> {
  const env = getEnv();
  const db = env.cyberai_db as D1Like;

  const sub = await db
    .prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? LIMIT 1')
    .bind(userId)
    .first<{ stripe_customer_id: string }>();

  return sub?.stripe_customer_id ? { id: sub.stripe_customer_id } : null;
}

export async function createStripeCustomer(userId: string, email: string): Promise<{ id: string }> {
  const env = getEnv();
  const stripeKey = env.STRIPE_SECRET_KEY as string;

  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email,
      'metadata[userId]': userId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Stripe customer');
  }

  const customer = await response.json() as { id: string };
  return customer;
}

export async function createCheckoutSession(
  userId: string,
  plan: Plan,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  const env = getEnv();
  const stripeKey = env.STRIPE_SECRET_KEY as string;
  const db = env.cyberai_db as D1Like;

  let customer = await getStripeCustomer(userId);
  if (!customer) {
    const user = await db.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
    if (!user) throw new Error('User not found');
    customer = await createStripeCustomer(userId, user.email);
  }

  const planConfig = PLANS[plan];
  if (!planConfig.priceId) throw new Error('Free plan does not require checkout');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customer.id,
      'line_items[0][price]': planConfig.priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      'metadata[userId]': userId,
      'metadata[plan]': plan,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create checkout session: ${error}`);
  }

  const session = await response.json() as { id: string; url: string };
  return { sessionId: session.id, url: session.url };
}

export async function createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
  const env = getEnv();
  const stripeKey = env.STRIPE_SECRET_KEY as string;

  const customer = await getStripeCustomer(userId);
  if (!customer) throw new Error('No Stripe customer found');

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customer.id,
      return_url: returnUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create portal session');
  }

  const session = await response.json() as { url: string };
  return session;
}

export async function handleWebhook(payload: string, signature: string): Promise<{ type: string; processed: boolean }> {
  const env = getEnv();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET as string;

  const timestamp = signature.split(',')[0].replace('t=', '');
  const sig = signature.split(',')[1].replace('sig=', '');

  const elements = [timestamp, payload, webhookSecret].join('.');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(webhookSecret);
  const data = encoder.encode(elements);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const expectedSig = await crypto.subtle.sign('HMAC', key, data);
  const expectedSigHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (sig !== expectedSigHex) {
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };

  const db = env.cyberai_db as D1Like;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const metadata = session.metadata as Record<string, string> | undefined;
      const plan = (metadata?.plan as Plan) || 'pro';
      const userId = metadata?.userId;

      await db
        .prepare(`INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET stripe_subscription_id=excluded.stripe_subscription_id, plan=excluded.plan, status=excluded.status, current_period_start=excluded.current_period_start, current_period_end=excluded.current_period_end, updated_at=excluded.updated_at`)
        .bind(
          `sub_${session.subscription as string}`,
          userId,
          session.customer as string,
          session.subscription as string,
          session.line_items as string,
          plan,
          session.current_period_start as number,
          session.current_period_end as number,
          Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000),
        )
        .run();
      return { type: event.type, processed: true };
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string;

      await db
        .prepare(`UPDATE subscriptions SET status = 'active', updated_at = ? WHERE stripe_subscription_id = ?`)
        .bind(Math.floor(Date.now() / 1000), subscriptionId)
        .run();

      await db
        .prepare(`INSERT INTO payments (id, user_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status, description, created_at)
         SELECT ?, s.user_id, ?, ?, ?, ?, 'succeeded', ?, ?
         FROM subscriptions s WHERE s.stripe_subscription_id = ?`)
        .bind(
          `pay_${invoice.payment_intent as string}`,
          invoice.payment_intent as string,
          invoice.id as string,
          invoice.amount_paid as number,
          invoice.currency as string,
          'Subscription payment',
          Math.floor(Date.now() / 1000),
          subscriptionId,
        )
        .run();
      return { type: event.type, processed: true };
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const status = subscription.status as string;

      await db
        .prepare(`UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ? WHERE stripe_subscription_id = ?`)
        .bind(
          status,
          subscription.current_period_start as number,
          subscription.current_period_end as number,
          subscription.cancel_at_period_end ? 1 : 0,
          Math.floor(Date.now() / 1000),
          subscription.id as string,
        )
        .run();
      return { type: event.type, processed: true };
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      await db
        .prepare(`UPDATE subscriptions SET status = 'canceled', updated_at = ? WHERE stripe_subscription_id = ?`)
        .bind(Math.floor(Date.now() / 1000), subscription.id as string)
        .run();
      return { type: event.type, processed: true };
    }

    default:
      return { type: event.type, processed: false };
  }
}

export async function getUserSubscription(userId: string): Promise<{ plan: Plan; status: string; currentPeriodEnd: number } | null> {
  const env = getEnv();
  const db = env.cyberai_db as D1Like;

  const sub = await db
    .prepare('SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ? AND status != ? ORDER BY created_at DESC LIMIT 1')
    .bind(userId, 'canceled')
    .first<{ plan: Plan; status: string; current_period_end: number }>();

  if (!sub) return null;

  return {
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.current_period_end,
  };
}

export function getPlanLimits(plan: Plan): { aiMessagesPerDay: number; challengesPerDay: number; maxHistory: number; maxTokensPerDay: number } {
  switch (plan) {
    case 'enterprise':
      return { aiMessagesPerDay: -1, challengesPerDay: -1, maxHistory: -1, maxTokensPerDay: -1 };
    case 'pro':
      return { aiMessagesPerDay: -1, challengesPerDay: -1, maxHistory: 200, maxTokensPerDay: 1000000 };
    case 'free':
    default:
      return { aiMessagesPerDay: 50, challengesPerDay: 3, maxHistory: 50, maxTokensPerDay: 100000 };
  }
}

export type { Plan };
