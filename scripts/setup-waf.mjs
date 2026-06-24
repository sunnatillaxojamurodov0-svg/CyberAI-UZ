#!/usr/bin/env node

/**
 * Cloudflare WAF Rules Configuration Script
 * 
 * Usage:
 *   node scripts/setup-waf.mjs
 * 
 * Environment Variables:
 *   CLOUDFLARE_API_TOKEN - Cloudflare API token
 *   CLOUDFLARE_ZONE_ID - Zone ID from Cloudflare dashboard
 */

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CF_API_TOKEN || !ZONE_ID) {
  console.error('Error: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required');
  console.error('Set them in your environment or .env file');
  process.exit(1);
}

const API_BASE = 'https://api.cloudflare.com/client/v4';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!data.success) {
    console.error(`API Error: ${JSON.stringify(data.errors)}`);
    throw new Error(data.errors?.[0]?.message || 'API request failed');
  }

  return data.result;
}

// Managed Ruleset - OWASP Core Ruleset
async function deployManagedRuleset() {
  console.log('Deploying Cloudflare Managed Ruleset...');
  
  try {
    const existing = await apiRequest(`/zones/${ZONE_ID}/rulesets`);
    const managedRuleset = existing.find(r => 
      r.phase === 'http_request_firewall_managed' && 
      r.name === 'CyberAI Managed Rules'
    );

    if (managedRuleset) {
      console.log('  Managed ruleset already deployed, updating...');
      await apiRequest(`/zones/${ZONE_ID}/rulesets/${managedRuleset.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'CyberAI Managed Rules',
          kind: 'zone',
          phase: 'http_request_firewall_managed',
          rules: [{
            action: 'execute',
            action_parameters: {
              id: 'efb7b8c949ac4650a09736fc376e9aee', // Cloudflare Managed Ruleset
            },
            expression: 'true',
            enabled: true,
          }],
        }),
      });
    } else {
      await apiRequest(`/zones/${ZONE_ID}/rulesets`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'CyberAI Managed Rules',
          kind: 'zone',
          phase: 'http_request_firewall_managed',
          rules: [{
            action: 'execute',
            action_parameters: {
              id: 'efb7b8c949ac4650a09736fc376e9aee',
            },
            expression: 'true',
            enabled: true,
          }],
        }),
      });
    }
    console.log('  ✓ Managed ruleset deployed');
  } catch (error) {
    console.error('  ✗ Failed to deploy managed ruleset:', error.message);
  }
}

// Custom WAF Rules
async function deployCustomRules() {
  console.log('Deploying custom WAF rules...');
  
  const rules = [
    {
      action: 'block',
      expression: 'cf.waf.score gt 40',
      description: 'Block high attack scores',
      enabled: true,
    },
    {
      action: 'challenge',
      expression: 'http.request.uri.path eq "/admin" or http.request.uri.path contains "/admin/"',
      description: 'Challenge admin paths',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.path contains "../" or http.request.uri.path contains "..\\"',
      description: 'Block path traversal attempts',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.query contains "union select" or http.request.uri.query contains "1=1"',
      description: 'Block SQL injection attempts',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.query contains "<script" or http.request.uri.query contains "javascript:"',
      description: 'Block XSS attempts in query strings',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.path contains ".env" or http.request.uri.path contains ".git" or http.request.uri.path contains ".htaccess"',
      description: 'Block sensitive file access',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.path contains "wp-admin" or http.request.uri.path contains "wp-login"',
      description: 'Block WordPress admin paths',
      enabled: true,
    },
    {
      action: 'log',
      expression: 'cf.threat_score gt 10',
      description: 'Log high threat scores',
      enabled: true,
    },
  ];

  try {
    const existing = await apiRequest(`/zones/${ZONE_ID}/rulesets`);
    const customRules = existing.find(r => r.phase === 'http_request_firewall_custom');

    if (customRules) {
      console.log('  Custom rules already exist, updating...');
      await apiRequest(`/zones/${ZONE_ID}/rulesets/${customRules.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'CyberAI Custom Rules',
          kind: 'zone',
          phase: 'http_request_firewall_custom',
          rules,
        }),
      });
    } else {
      await apiRequest(`/zones/${ZONE_ID}/rulesets`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'CyberAI Custom Rules',
          kind: 'zone',
          phase: 'http_request_firewall_custom',
          rules,
        }),
      });
    }
    console.log('  ✓ Custom rules deployed');
  } catch (error) {
    console.error('  ✗ Failed to deploy custom rules:', error.message);
  }
}

// Rate Limiting Rules
async function deployRateLimiting() {
  console.log('Deploying rate limiting rules...');
  
  const rules = [
    {
      action: 'block',
      expression: 'http.request.uri.path eq "/api/auth/login"',
      action_parameters: {
        ratelimit: {
          characteristics: ['cf.colo.id', 'ip.src'],
          period: 60,
          requests_per_period: 10,
          mitigation_timeout: 600,
        },
      },
      description: 'Rate limit login attempts',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.path eq "/api/auth/register"',
      action_parameters: {
        ratelimit: {
          characteristics: ['cf.colo.id', 'ip.src'],
          period: 3600,
          requests_per_period: 5,
          mitigation_timeout: 3600,
        },
      },
      description: 'Rate limit registration',
      enabled: true,
    },
    {
      action: 'block',
      expression: 'http.request.uri.path eq "/api/chat"',
      action_parameters: {
        ratelimit: {
          characteristics: ['cf.colo.id', 'ip.src'],
          period: 60,
          requests_per_period: 30,
          mitigation_timeout: 300,
        },
      },
      description: 'Rate limit chat API',
      enabled: true,
    },
    {
      action: 'challenge',
      expression: 'http.request.uri.path starts_with "/api" and not http.request.uri.path starts_with "/api/auth"',
      action_parameters: {
        ratelimit: {
          characteristics: ['cf.colo.id', 'ip.src'],
          period: 60,
          requests_per_period: 100,
          mitigation_timeout: 60,
        },
      },
      description: 'Rate limit general API',
      enabled: true,
    },
  ];

  try {
    const existing = await apiRequest(`/zones/${ZONE_ID}/rulesets`);
    const rateLimitRules = existing.find(r => r.phase === 'http_ratelimit');

    if (rateLimitRules) {
      console.log('  Rate limiting rules already exist, updating...');
      await apiRequest(`/zones/${ZONE_ID}/rulesets/${rateLimitRules.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'CyberAI Rate Limits',
          kind: 'zone',
          phase: 'http_ratelimit',
          rules,
        }),
      });
    } else {
      await apiRequest(`/zones/${ZONE_ID}/rulesets`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'CyberAI Rate Limits',
          kind: 'zone',
          phase: 'http_ratelimit',
          rules,
        }),
      });
    }
    console.log('  ✓ Rate limiting rules deployed');
  } catch (error) {
    console.error('  ✗ Failed to deploy rate limiting rules:', error.message);
  }
}

// Main
async function main() {
  console.log('Cloudflare WAF Configuration');
  console.log('============================\n');

  await deployManagedRuleset();
  await deployCustomRules();
  await deployRateLimiting();

  console.log('\n============================');
  console.log('WAF configuration complete!');
  console.log('\nTo verify, visit:');
  console.log('  https://dash.cloudflare.com → Security → WAF');
}

main().catch(console.error);
