import express from 'express';
import Docker from 'dockerode';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.DOCKER_PROXY_PORT || 2377;
const NETWORK_NAME = 'cyberai-targets';
const MAX_CONTAINERS = parseInt(process.env.MAX_CONTAINERS || '10');
const CONTAINER_TTL_MS = parseInt(process.env.CONTAINER_TTL_MS || String(4 * 60 * 60 * 1000));

// ============================================
// SECURITY CONFIGURATION
// ============================================

const API_KEY = process.env.DOCKER_API_KEY || crypto.randomBytes(32).toString('hex');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://app.cyberaiuz.workers.dev').split(',');

console.log('========================================');
console.log('  CyberAI Docker Proxy - PRODUCTION');
console.log('========================================');
console.log(`API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 8)}`);
console.log(`Max Containers: ${MAX_CONTAINERS}`);
console.log(`Container TTL: ${CONTAINER_TTL_MS / 1000 / 60} min`);
console.log(`Network: ${NETWORK_NAME}`);
console.log('========================================\n');

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '1mb' }));

// ============================================
// AUTHENTICATION
// ============================================

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const token = authHeader.replace('Bearer ', '');
  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
};

// ============================================
// DOCKER CONNECTION
// ============================================

let docker;
try {
  const dockerHost = process.env.DOCKER_HOST;
  if (dockerHost && dockerHost.startsWith('tcp://')) {
    const url = new URL(dockerHost);
    docker = new Docker({ host: url.hostname, port: parseInt(url.port) });
    console.log(`✓ Connected to Docker daemon via TCP: ${dockerHost}`);
  } else {
    docker = new Docker({ socketPath: '//./pipe/docker_engine' });
    console.log('✓ Connected to Docker daemon via named pipe');
  }
} catch (err) {
  console.error('✗ Failed to connect to Docker:', err.message);
  process.exit(1);
}

// ============================================
// NETWORK SETUP
// ============================================

async function ensureNetwork() {
  try {
    const networks = await docker.listNetworks();
    const exists = networks.some(n => n.Name === NETWORK_NAME);
    if (!exists) {
      await docker.createNetwork({
        Name: NETWORK_NAME,
        Driver: 'bridge',
        IPAM: { Config: [{ Subnet: '10.10.0.0/16', Gateway: '10.10.0.1' }] }
      });
      console.log(`✓ Created network: ${NETWORK_NAME}`);
    } else {
      console.log(`✓ Network exists: ${NETWORK_NAME}`);
    }
  } catch (err) {
    console.error('✗ Network error:', err.message);
  }
}

// ============================================
// TARGET TEMPLATES
// ============================================

const TEMPLATES = {
  'ubuntu-web': {
    Image: 'ubuntu:22.04',
    Cmd: ['/bin/bash', '-c', 'apt-get update -qq && apt-get install -y -qq apache2 mysql-server openssh-server > /dev/null 2>&1 && mkdir -p /run/sshd && service apache2 start && service mysql start && /usr/sbin/sshd -D'],
    ExposedPorts: { '80/tcp': {}, '22/tcp': {}, '3306/tcp': {} },
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      MemorySwap: 512 * 1024 * 1024,
      NanoCpus: 1 * 1e9,
      PortBindings: {
        '80/tcp': [{ HostPort: '' }],
        '22/tcp': [{ HostPort: '' }],
        '3306/tcp': [{ HostPort: '' }]
      }
    },
    HealthCheck: {
      Test: ['CMD-SHELL', 'service apache2 status || exit 1'],
      Interval: 30000000000,
      Timeout: 5000000000,
      Retries: 3,
      StartPeriod: 90000000000
    }
  },
  'centos-mail': {
    Image: 'quay.io/centos/centos:stream9',
    Cmd: ['/bin/bash', '-c', 'dnf install -y postfix dovecot openssh-server > /dev/null 2>&1 && mkdir -p /run/sshd && postfix start && dovecot && /usr/sbin/sshd -D'],
    ExposedPorts: { '25/tcp': {}, '143/tcp': {}, '22/tcp': {} },
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      MemorySwap: 512 * 1024 * 1024,
      NanoCpus: 1 * 1e9,
      PortBindings: {
        '25/tcp': [{ HostPort: '' }],
        '143/tcp': [{ HostPort: '' }],
        '22/tcp': [{ HostPort: '' }]
      }
    },
    HealthCheck: {
      Test: ['CMD-SHELL', 'ss -tlnp | grep -q :22 || exit 1'],
      Interval: 30000000000,
      Timeout: 5000000000,
      Retries: 3,
      StartPeriod: 90000000000
    }
  },
  'debian-db': {
    Image: 'debian:12',
    Cmd: ['/bin/bash', '-c', 'apt-get update -qq && apt-get install -y -qq postgresql redis-server openssh-server > /dev/null 2>&1 && mkdir -p /run/sshd && pg_ctlcluster 15 main start && redis-server --daemonize yes && /usr/sbin/sshd -D'],
    ExposedPorts: { '5432/tcp': {}, '6379/tcp': {}, '22/tcp': {} },
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      MemorySwap: 512 * 1024 * 1024,
      NanoCpus: 1 * 1e9,
      PortBindings: {
        '5432/tcp': [{ HostPort: '' }],
        '6379/tcp': [{ HostPort: '' }],
        '22/tcp': [{ HostPort: '' }]
      }
    },
    HealthCheck: {
      Test: ['CMD', 'pg_isready'],
      Interval: 30000000000,
      Timeout: 5000000000,
      Retries: 3,
      StartPeriod: 60000000000
    }
  },
  'alpine-container': {
    Image: 'alpine:3.18',
    Cmd: ['/bin/sh', '-c', 'apk add --no-cache openssh docker-cli > /dev/null 2>&1 && ssh-keygen -A && /usr/sbin/sshd -D'],
    ExposedPorts: { '22/tcp': {} },
    HostConfig: {
      Memory: 256 * 1024 * 1024,
      MemorySwap: 256 * 1024 * 1024,
      NanoCpus: 0.5 * 1e9,
      Privileged: false,
      PortBindings: {
        '22/tcp': [{ HostPort: '' }]
      }
    },
    HealthCheck: {
      Test: ['CMD', 'sshd', '-t'],
      Interval: 30000000000,
      Timeout: 5000000000,
      Retries: 3,
      StartPeriod: 30000000000
    }
  },
  'kali-pentest': {
    Image: 'kalilinux/kali-rolling',
    Cmd: ['/bin/bash', '-c', 'apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq kali-linux-headless openssh-server > /dev/null 2>&1 && mkdir -p /run/sshd && /usr/sbin/sshd -D'],
    ExposedPorts: { '22/tcp': {} },
    HostConfig: {
      Memory: 1024 * 1024 * 1024,
      MemorySwap: 1024 * 1024 * 1024,
      NanoCpus: 2 * 1e9,
      PortBindings: {
        '22/tcp': [{ HostPort: '' }]
      }
    },
    HealthCheck: {
      Test: ['CMD', 'ss', '-tlnp', '|', 'grep', '-q', ':22'],
      Interval: 60000000000,
      Timeout: 10000000000,
      Retries: 5,
      StartPeriod: 120000000000
    }
  }
};

// ============================================
// CONTAINER STATE
// ============================================

const activeContainers = new Map();

async function syncContainers() {
  try {
    const containers = await docker.listContainers({ all: true });
    const cyberaiContainers = containers.filter(c =>
      c.Labels && c.Labels['cyberai.managed'] === 'true'
    );

    for (const c of cyberaiContainers) {
      if (!activeContainers.has(c.Id)) {
        const createdAt = parseInt(c.Labels['cyberai.created'] || String(Date.now()));
        activeContainers.set(c.Id, {
          id: c.Id,
          name: c.Names[0]?.replace('/', ''),
          template_id: c.Labels['cyberai.template'],
          user_id: c.Labels['cyberai.user'],
          status: c.State === 'running' ? 'running' : 'stopped',
          created_at: createdAt,
          ip: ''
        });
      }
    }

    for (const [id, data] of activeContainers) {
      const found = cyberaiContainers.find(c => c.Id === id);
      if (!found) {
        activeContainers.delete(id);
      } else {
        data.status = found.State === 'running' ? 'running' : 'stopped';
      }
    }

    console.log(`✓ Synced ${activeContainers.size} containers`);
  } catch (err) {
    console.error('✗ Sync error:', err.message);
  }
}

// ============================================
// CONTAINER CLEANUP (TTL + orphan)
// ============================================

async function cleanupExpiredContainers() {
  const now = Date.now();
  for (const [id, data] of activeContainers) {
    const age = now - data.created_at;
    if (age > CONTAINER_TTL_MS) {
      console.log(`⏰ TTL expired: ${data.name} (${Math.round(age / 60000)} min)`);
      try {
        const container = docker.getContainer(id);
        await container.stop({ t: 10 });
        await container.remove();
        activeContainers.delete(id);
        console.log(`✓ Removed expired: ${data.name}`);
      } catch (err) {
        console.error(`✗ Cleanup error for ${data.name}:`, err.message);
      }
    }
  }

  const runningCount = Array.from(activeContainers.values()).filter(c => c.status === 'running').length;
  if (runningCount > MAX_CONTAINERS) {
    const sorted = Array.from(activeContainers.values())
      .filter(c => c.status === 'running')
      .sort((a, b) => a.created_at - b.created_at);

    const toRemove = sorted.slice(0, runningCount - MAX_CONTAINERS);
    for (const data of toRemove) {
      console.log(`🗑️ Over limit, removing: ${data.name}`);
      try {
        const container = docker.getContainer(data.id);
        await container.stop({ t: 10 });
        await container.remove();
        activeContainers.delete(data.id);
      } catch (err) {
        console.error(`✗ Over-limit cleanup error:`, err.message);
      }
    }
  }
}

setInterval(cleanupExpiredContainers, 60 * 1000);

// ============================================
// API ROUTES
// ============================================

app.post('/api/containers', authenticate, async (req, res) => {
  try {
    const { template_id, user_id } = req.body;

    if (!template_id) {
      return res.status(400).json({ error: 'template_id required' });
    }

    const template = TEMPLATES[template_id];
    if (!template) {
      return res.status(404).json({ error: `Template not found: ${template_id}` });
    }

    const runningCount = Array.from(activeContainers.values()).filter(c => c.status === 'running').length;
    if (runningCount >= MAX_CONTAINERS) {
      return res.status(429).json({ error: 'Max containers reached. Try again later.' });
    }

    const containerName = `cyberai-${template_id}-${uuidv4().substring(0, 8)}`;
    console.log(`Creating: ${containerName}`);

    const container = await docker.createContainer({
      Image: template.Image,
      Cmd: template.Cmd,
      ExposedPorts: template.ExposedPorts,
      HostConfig: {
        ...template.HostConfig,
        NetworkMode: NETWORK_NAME,
        RestartPolicy: { Name: 'unless-stopped' }
      },
      Labels: {
        'cyberai.managed': 'true',
        'cyberai.user': user_id || 'anonymous',
        'cyberai.template': template_id,
        'cyberai.created': String(Date.now())
      },
      HealthCheck: template.HealthCheck
    });

    await container.start();

    const info = await container.inspect();
    const networks = info.NetworkSettings.Networks;
    const networkData = networks[NETWORK_NAME] || networks[Object.keys(networks)[0]];
    const ip = networkData?.IPAddress || info.NetworkSettings.IPAddress || 'unknown';

    const containerData = {
      id: container.id,
      name: containerName,
      template_id,
      user_id: user_id || 'anonymous',
      ip,
      status: 'running',
      created_at: Date.now(),
      ttl_ms: CONTAINER_TTL_MS,
      expires_at: Date.now() + CONTAINER_TTL_MS,
      ports: template.ExposedPorts ? Object.keys(template.ExposedPorts) : [],
      memory_mb: (template.HostConfig.Memory || 0) / (1024 * 1024)
    };

    activeContainers.set(container.id, containerData);

    console.log(`✓ Created: ${containerName} (${ip})`);

    res.json({ ok: true, data: containerData });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/containers', authenticate, async (req, res) => {
  try {
    const containers = Array.from(activeContainers.values());
    const now = Date.now();
    const enriched = containers.map(c => ({
      ...c,
      uptime_ms: now - c.created_at,
      remaining_ms: Math.max(0, c.ttl_ms - (now - c.created_at)),
      remaining_min: Math.max(0, Math.round((c.ttl_ms - (now - c.created_at)) / 60000))
    }));
    res.json({ ok: true, data: enriched, meta: { max: MAX_CONTAINERS, ttl_min: CONTAINER_TTL_MS / 60000 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/containers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = activeContainers.get(id);
    if (!data) {
      return res.status(404).json({ error: 'Container not found' });
    }

    let health = 'unknown';
    let state = 'unknown';
    try {
      const container = docker.getContainer(id);
      const info = await container.inspect();
      state = info.State.Status;
      health = info.State.Health?.Status || 'no-healthcheck';
    } catch {}

    res.json({
      ok: true,
      data: {
        ...data,
        state,
        health,
        remaining_min: Math.max(0, Math.round((data.ttl_ms - (Date.now() - data.created_at)) / 60000))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/containers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = activeContainers.get(id);
    if (!data) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const container = docker.getContainer(id);
    await container.stop({ t: 10 });
    await container.remove();
    activeContainers.delete(id);

    console.log(`✓ Stopped & removed: ${data.name}`);
    res.json({ ok: true, message: 'Container stopped and removed' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/containers/:id/restart', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = activeContainers.get(id);
    if (!data) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const container = docker.getContainer(id);
    await container.restart({ t: 10 });
    data.status = 'running';
    data.created_at = Date.now();
    data.expires_at = Date.now() + CONTAINER_TTL_MS;
    activeContainers.set(id, data);

    console.log(`✓ Restarted: ${data.name}`);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/containers/:id/exec', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'command required' });
    }

    const container = docker.getContainer(id);
    const exec = await container.exec({
      Cmd: ['/bin/bash', '-c', command],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({ Detach: false, Tty: false });

    let output = '';
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });

    stream.on('end', () => {
      res.json({ ok: true, output });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/containers/:id/stats', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const container = docker.getContainer(id);
    const stats = await container.stats({ stream: false });

    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0);
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;

    res.json({
      ok: true,
      data: {
        cpu_percent: Math.round(cpuPercent * 100) / 100,
        memory_usage_mb: Math.round(stats.memory_stats.usage / (1024 * 1024)),
        memory_limit_mb: Math.round(stats.memory_stats.limit / (1024 * 1024)),
        memory_percent: Math.round((stats.memory_stats.usage / stats.memory_stats.limit) * 10000) / 100,
        network_rx_bytes: stats.networks?.eth0?.rx_bytes || 0,
        network_tx_bytes: stats.networks?.eth0?.tx_bytes || 0,
        pids: stats.pids_stats.current || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/templates', authenticate, (req, res) => {
  const templates = Object.entries(TEMPLATES).map(([id, t]) => ({
    id,
    image: t.Image,
    ports: t.ExposedPorts ? Object.keys(t.ExposedPorts) : [],
    memory_mb: (t.HostConfig.Memory || 0) / (1024 * 1024),
    cpu_limit: t.HostConfig.NanoCpus / 1e9
  }));
  res.json({ ok: true, data: templates });
});

app.get('/api/health', async (req, res) => {
  try {
    await docker.ping();
    const running = Array.from(activeContainers.values()).filter(c => c.status === 'running').length;
    res.json({
      status: 'ok',
      docker: 'connected',
      containers: { active: running, max: MAX_CONTAINERS },
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(503).json({ status: 'error', docker: 'disconnected', error: err.message });
  }
});

// ============================================
// START
// ============================================

async function start() {
  await ensureNetwork();
  await syncContainers();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✓ Server running on http://0.0.0.0:${PORT}`);
    console.log(`✓ Network: ${NETWORK_NAME}`);
    console.log(`✓ Max containers: ${MAX_CONTAINERS}`);
    console.log(`✓ Container TTL: ${CONTAINER_TTL_MS / 60000} min`);
    console.log('\nEndpoints:');
    console.log('  POST   /api/containers          - Create container');
    console.log('  GET    /api/containers          - List containers');
    console.log('  GET    /api/containers/:id      - Container details');
    console.log('  DELETE /api/containers/:id      - Remove container');
    console.log('  POST   /api/containers/:id/restart - Restart');
    console.log('  POST   /api/containers/:id/exec - Execute command');
    console.log('  GET    /api/containers/:id/stats - Resource stats');
    console.log('  GET    /api/templates           - List templates');
    console.log('  GET    /api/health              - Health check\n');
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  for (const [id, data] of activeContainers) {
    try {
      await docker.getContainer(id).stop({ t: 5 });
      console.log(`  ✓ Stopped: ${data.name}`);
    } catch {}
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Interrupted, shutting down...');
  for (const [id, data] of activeContainers) {
    try {
      await docker.getContainer(id).stop({ t: 5 });
    } catch {}
  }
  process.exit(0);
});

start().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
