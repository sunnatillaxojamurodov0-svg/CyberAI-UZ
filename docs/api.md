# API Documentation

## Authentication

All API endpoints require authentication via session cookie unless noted otherwise.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://avatars.githubusercontent.com/u/123"
  }
}
```

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Get Current User

```http
GET /api/auth/me
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://avatars.githubusercontent.com/u/123"
  }
}
```

## Chat

### Send Message

```http
POST /api/chat
Content-Type: application/json

{
  "message": "Explain SQL injection",
  "history": [
    {"role": "user", "content": "What is XSS?"},
    {"role": "assistant", "content": "XSS is..."}
  ],
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "systemPrompt": "You are a cybersecurity expert."
}
```

**Response:** Streaming text

**Rate Limits:**
- Free: 50 messages/day
- Pro: Unlimited
- Enterprise: Unlimited

## Billing

### Get Subscription

```http
GET /api/billing
```

**Response:**
```json
{
  "ok": true,
  "subscription": {
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": 1735689600
  },
  "plan": "pro",
  "limits": {
    "aiMessagesPerDay": -1,
    "challengesPerDay": -1,
    "maxHistory": 200
  }
}
```

### Create Checkout Session

```http
POST /api/billing
Content-Type: application/json

{
  "action": "checkout",
  "plan": "pro"
}
```

**Response:**
```json
{
  "ok": true,
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Create Portal Session

```http
POST /api/billing
Content-Type: application/json

{
  "action": "portal"
}
```

**Response:**
```json
{
  "ok": true,
  "url": "https://billing.stripe.com/session/cs_test_..."
}
```

## Workflows

### Trigger Challenge Generation

```http
POST /api/workflows
Content-Type: application/json

{
  "action": "challenge",
  "difficulty": 2,
  "category": "web"
}
```

**Response:**
```json
{
  "ok": true,
  "instanceId": "challenge-1234567890"
}
```

### Trigger Console Analysis

```http
POST /api/workflows
Content-Type: application/json

{
  "action": "console",
  "sessionId": "session_123",
  "challengeId": "challenge_456",
  "commandHistory": ["nmap -sV target", "sqlmap -u http://target/login"]
}
```

**Response:**
```json
{
  "ok": true,
  "instanceId": "console-session_123"
}
```

### Get Workflow Status

```http
GET /api/workflows?instanceId=challenge-1234567890&workflow=challenge
```

**Response:**
```json
{
  "ok": true,
  "status": {
    "status": "complete",
    "output": {
      "challengeId": "uuid",
      "name": "WEB: SQL injection",
      "difficulty": 2,
      "difficultyName": "Medium",
      "category": "web"
    }
  }
}
```

## Webhooks

### Stripe Webhook

```http
POST /api/webhooks/stripe
Content-Type: application/json
stripe-signature: t=1234567890,v1=abc123...

{
  "id": "evt_123",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "customer": "cus_123",
      "subscription": "sub_123",
      "metadata": {
        "userId": "user_123",
        "plan": "pro"
      }
    }
  }
}
```

**Supported Events:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

**HTTP Status Codes:**
- `400` — Bad request
- `401` — Unauthorized
- `404` — Not found
- `429` — Rate limit exceeded
- `500` — Internal server error
- `503` — Service unavailable
