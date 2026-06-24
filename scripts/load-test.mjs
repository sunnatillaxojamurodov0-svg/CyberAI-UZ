#!/usr/bin/env node

/**
 * Load Testing Script
 *
 * Usage:
 *   node scripts/load-test.mjs [options]
 *
 * Options:
 *   --url <url>      Target URL (default: http://localhost:5173)
 *   --concurrent <n> Concurrent requests (default: 10)
 *   --duration <s>   Test duration in seconds (default: 30)
 *   --endpoint <path> Endpoint to test (default: /)
 */

import http from "http";
import { parseArgs } from "util";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    url: { type: "string", default: "http://localhost:5173" },
    concurrent: { type: "string", default: "10" },
    duration: { type: "string", default: "30" },
    endpoint: { type: "string", default: "/" },
  },
});

const TARGET_URL = values.url;
const CONCURRENT = parseInt(values.concurrent);
const DURATION = parseInt(values.duration) * 1000;
const ENDPOINT = values.endpoint;

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalLatency = 0;
const latencies = [];

function makeRequest() {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL(`${TARGET_URL}${ENDPOINT}`);

    const req = http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const latency = Date.now() - start;
        totalRequests++;
        successfulRequests++;
        totalLatency += latency;
        latencies.push(latency);
        resolve({ status: res.statusCode, latency });
      });
    });

    req.on("error", () => {
      totalRequests++;
      failedRequests++;
      resolve({ status: 0, latency: Date.now() - start });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      totalRequests++;
      failedRequests++;
      resolve({ status: 0, latency: 5000 });
    });
  });
}

async function runLoadTest() {
  console.log("🔥 Load Test Starting");
  console.log("═══════════════════════════════════════");
  console.log(`Target: ${TARGET_URL}${ENDPOINT}`);
  console.log(`Concurrent: ${CONCURRENT}`);
  console.log(`Duration: ${DURATION / 1000}s`);
  console.log("═══════════════════════════════════════\n");

  const startTime = Date.now();
  const promises = [];

  for (let i = 0; i < CONCURRENT; i++) {
    promises.push(
      (async () => {
        while (Date.now() - startTime < DURATION) {
          await makeRequest();
        }
      })(),
    );
  }

  await Promise.all(promises);

  const duration = (Date.now() - startTime) / 1000;
  const avgLatency = totalLatency / totalRequests;
  const sortedLatencies = latencies.sort((a, b) => a - b);
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
  const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];

  console.log("\n═══════════════════════════════════════");
  console.log("📊 Load Test Results");
  console.log("═══════════════════════════════════════");
  console.log(`Duration:       ${duration.toFixed(1)}s`);
  console.log(`Total Requests:  ${totalRequests}`);
  console.log(`Successful:      ${successfulRequests}`);
  console.log(`Failed:          ${failedRequests}`);
  console.log(`Requests/sec:    ${(totalRequests / duration).toFixed(1)}`);
  console.log(`Avg Latency:     ${avgLatency.toFixed(0)}ms`);
  console.log(`P50 Latency:     ${p50}ms`);
  console.log(`P95 Latency:     ${p95}ms`);
  console.log(`P99 Latency:     ${p99}ms`);
  console.log(`Success Rate:    ${((successfulRequests / totalRequests) * 100).toFixed(1)}%`);
  console.log("═══════════════════════════════════════\n");

  if (failedRequests > 0) {
    console.log(`⚠️  ${failedRequests} requests failed`);
  }
  if (avgLatency > 1000) {
    console.log("⚠️  Average latency is high (>1s)");
  }
}

runLoadTest().catch(console.error);
