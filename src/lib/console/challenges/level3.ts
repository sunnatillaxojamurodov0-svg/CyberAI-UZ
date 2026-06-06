import type { CTFChallenge } from "../types";

/* ──────────────────────────────────────────────────────────────
   LEVEL 3 — Expert level (hard). OSCP-style multi-stage chains:
   recon -> foothold -> privesc -> root.
   ────────────────────────────────────────────────────────────── */

export const LEVEL3: CTFChallenge[] = [
  {
    id: "l3-01-full-chain",
    level: 3,
    category: "web",
    title: "Full Chain: Aurora",
    summary: "RCE -> shell -> SUID privesc -> root.",
    scenario:
      "The Aurora server (10.10.30.5) runs a web application with a vulnerable file upload function. Objective: gain a foothold, horizontal/vertical movement, and full root compromise. This is an OSCP-style full chain.",
    objectives: [
      "Recon: all ports and services",
      "Get RCE via file upload (web shell)",
      "From www-data shell, get root via SUID binary",
      "Read root.txt",
    ],
    hints: [
      "nmap -sC -sV -p- 10.10.30.5.",
      "/upload page might not filter .php files — upload a web shell.",
      "In the shell: find / -perm -4000 2>/dev/null — look for SUID binaries.",
    ],
    targetIp: "10.10.30.5",
    flag: "CYBERAI{full_ch41n_pwn_aur0r4}",
    flagFormat: "CYBERAI{...}",
    points: 350,
    rubric: {
      expectedTools: ["nmap", "gobuster", "curl", "nc", "find"],
      expectedConcepts: [
        "enumeration",
        "file upload rce",
        "reverse shell",
        "suid privilege escalation",
      ],
      parMinutes: 35,
    },
    env: {
      network: "Web app file upload + SUID privesc.",
      hosts: [
        {
          ip: "10.10.30.5",
          hostname: "aurora.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            { port: 80, service: "http", version: "Apache 2.4.52 / PHP 8.1", state: "open" },
          ],
          web: {
            server: "Apache/2.4.52",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>Aurora Portal</h1><a href='/upload'>Upload</a></body></html>",
              },
              "/upload": {
                status: 200,
                protected: true,
                body: "<html><body><h1>File Upload</h1><p>No extension filter. Upload .php -> /uploads/shell.php.</p></body></html>",
              },
              "/uploads/shell.php": {
                status: 200,
                body: "[WEB SHELL ACTIVE] cmd=? — RCE as www-data. find / -perm -4000 shows: /usr/bin/cp (SUID). cp /root/root.txt /tmp && cat.",
              },
            },
            discoverablePaths: ["/upload", "/uploads/"],
          },
          fs: {
            "/usr/bin/cp": "[SUID root binary]",
            "/root/root.txt": "CYBERAI{full_ch41n_pwn_aur0r4}",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },
  {
    id: "l3-02-pivot",
    level: 3,
    category: "network",
    title: "Internal Network: Pivot",
    summary: "Pivot from the DMZ host to the internal network.",
    scenario:
      "The DMZ web server (10.10.30.10) is exposed externally. It is connected to both networks: external and internal (172.16.0.0/24). After gaining a foothold, you must pivot to the internal database server — that's where the real flag is.",
    objectives: [
      "Compromise the DMZ host",
      "Identify the internal network interface",
      "Pivot to the internal DB server (172.16.0.10)",
      "Get the flag from the DB",
    ],
    hints: [
      "DMZ host: find a vulnerable service on 10.10.30.10.",
      "In the shell: ip a — you'll see internal IP 172.16.0.5.",
      "Internal: 172.16.0.10:3306 MySQL. Connect via pivot.",
    ],
    targetIp: "10.10.30.10",
    flag: "CYBERAI{p1v0t_t0_1nt3rn4l_db}",
    flagFormat: "CYBERAI{...}",
    points: 380,
    rubric: {
      expectedTools: ["nmap", "ssh", "curl", "mysql"],
      expectedConcepts: ["pivoting", "dual-homed host", "internal enumeration", "lateral movement"],
      parMinutes: 40,
    },
    env: {
      network: "DMZ host (dual-homed) + internal DB server.",
      hosts: [
        {
          ip: "10.10.30.10",
          hostname: "dmz-web.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            { port: 80, service: "http", version: "nginx 1.20.1", state: "open" },
          ],
          credentials: [{ service: "ssh", username: "webadmin", password: "Winter2024!" }],
          web: {
            server: "nginx/1.20.1",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>DMZ Web</h1><!-- ssh webadmin:Winter2024! --></body></html>",
              },
            },
          },
          fs: {
            "/home/webadmin/network.txt":
              "Interfaces:\n eth0: 10.10.30.10 (external)\n eth1: 172.16.0.5 (internal)\nInternal DB: 172.16.0.10:3306 (root:dbroot123)",
          },
        },
        {
          ip: "172.16.0.10",
          hostname: "internal-db",
          os: "Linux (Debian 11)",
          ports: [{ port: 3306, service: "mysql", version: "MySQL 8.0.32", state: "open" }],
          credentials: [{ service: "mysql", username: "root", password: "dbroot123" }],
          fs: {
            "/var/lib/mysql/secrets.sql":
              "INSERT INTO vault VALUES('flag','CYBERAI{p1v0t_t0_1nt3rn4l_db}');",
          },
        },
      ],
    },
  },
  {
    id: "l3-03-buffer",
    level: 3,
    category: "reversing",
    title: "Buffer Overflow",
    summary: "Simple stack buffer overflow exploitation.",
    scenario:
      "A custom network service (10.10.30.15:9999) accepts input without validation. Classic stack buffer overflow — overwrite EIP and jump to shellcode. This is a classic OSCP exam component.",
    objectives: [
      "Fuzz the service (find the crash offset)",
      "Determine the EIP offset",
      "Exploit it and get a shell",
      "Read the flag",
    ],
    hints: [
      "nc 10.10.30.15 9999 — the service expects 'OVERFLOW1 <input>'.",
      "Crash with pattern: EIP is overwritten after approximately 524 bytes.",
      "Get shell with JMP ESP gadget + shellcode.",
    ],
    targetIp: "10.10.30.15",
    flag: "CYBERAI{st4ck_0v3rfl0w_31p_pwn}",
    flagFormat: "CYBERAI{...}",
    points: 400,
    rubric: {
      expectedTools: ["nc", "nmap", "python3"],
      expectedConcepts: ["buffer overflow", "eip control", "fuzzing", "shellcode"],
      parMinutes: 45,
    },
    env: {
      network: "Vulnerable custom network service.",
      hosts: [
        {
          ip: "10.10.30.15",
          hostname: "vuln-svc.corp.local",
          os: "Windows 10 (x86)",
          ports: [
            {
              port: 9999,
              service: "custom",
              state: "open",
              banner: "Welcome to Vulnerable Server! Commands: OVERFLOW1 ... OVERFLOW10",
            },
          ],
          fs: {
            "C:/Users/admin/flag.txt": "CYBERAI{st4ck_0v3rfl0w_31p_pwn}",
          },
        },
      ],
    },
  },
  {
    id: "l3-04-ad",
    level: 3,
    category: "network",
    title: "Domain Domination",
    summary: "Take over Active Directory via Kerberoasting.",
    scenario:
      "The corporate domain (CORP.LOCAL) is managed by a Domain Controller (10.10.30.20). A low-privilege domain account is available. The goal is to obtain service account hashes via Kerberoasting, crack them, and become Domain Admin.",
    objectives: [
      "Enumerate the domain (kerbrute/enum)",
      "Get SPN hashes via Kerberoasting",
      "Crack the hashes (hashcat)",
      "Get the flag as Domain Admin",
    ],
    hints: [
      "Initial: jdoe / Welcome1 (low privilege).",
      "GetUserSPNs.py CORP.LOCAL/jdoe:Welcome1 -dc-ip 10.10.30.20 -request.",
      "hashcat -m 13100 hashes.txt rockyou.txt — sqlsvc password gets cracked.",
    ],
    targetIp: "10.10.30.20",
    flag: "CYBERAI{k3rb3r04st_d0m41n_4dm1n}",
    flagFormat: "CYBERAI{...}",
    points: 420,
    rubric: {
      expectedTools: ["nmap", "kerbrute", "GetUserSPNs.py", "hashcat", "evil-winrm"],
      expectedConcepts: ["active directory", "kerberoasting", "spn", "hash cracking"],
      parMinutes: 50,
    },
    env: {
      network: "Active Directory domain + Domain Controller.",
      hosts: [
        {
          ip: "10.10.30.20",
          hostname: "DC01.corp.local",
          os: "Windows Server 2022",
          ports: [
            { port: 53, service: "domain", state: "open" },
            { port: 88, service: "kerberos-sec", state: "open" },
            { port: 389, service: "ldap", version: "AD LDAP", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [
            { service: "smb", username: "jdoe", password: "Welcome1" },
            { service: "smb", username: "sqlsvc", password: "Summer2023!" },
          ],
          fs: {
            "C:/Users/Administrator/Desktop/flag.txt": "CYBERAI{k3rb3r04st_d0m41n_4dm1n}",
            "SPN-info":
              "sqlsvc (SPN: MSSQL/db.corp.local) — Kerberoastable. Hash -> hashcat -m 13100 -> 'Summer2023!'. sqlsvc is in the Domain Admins group.",
          },
        },
      ],
    },
  },
  {
    id: "l3-05-deserial",
    level: 3,
    category: "web",
    title: "Insecure Object",
    summary: "RCE via insecure deserialization.",
    scenario:
      "A Java web application (10.10.30.25) accepts serialized objects in a cookie. Insecure deserialization leads to remote code execution (RCE) via a malicious object — this is a very serious vulnerability.",
    objectives: [
      "Identify the serialized cookie",
      "Create a malicious payload with ysoserial",
      "Get RCE and read the flag",
    ],
    hints: [
      "curl -v http://10.10.30.25/ — base64 'session' cookie (rO0AB... Java marker).",
      "Create payload with ysoserial CommonsCollections5 'command'.",
      "Send the payload as the session cookie — RCE as tomcat.",
    ],
    targetIp: "10.10.30.25",
    flag: "CYBERAI{1ns3cur3_d3s3r14l1z4t10n}",
    flagFormat: "CYBERAI{...}",
    points: 400,
    rubric: {
      expectedTools: ["curl", "ysoserial", "base64", "nc"],
      expectedConcepts: ["deserialization", "java gadget chains", "rce"],
      parMinutes: 45,
    },
    env: {
      network: "Java/Tomcat web application.",
      hosts: [
        {
          ip: "10.10.30.25",
          hostname: "java-app.corp.local",
          os: "Linux (Ubuntu 20.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.2p1", state: "open" },
            { port: 8080, service: "http", version: "Apache Tomcat 9.0.50", state: "open" },
          ],
          web: {
            server: "Apache-Coyote/1.1",
            routes: {
              "/": {
                status: 200,
                headers: { "Set-Cookie": "session=rO0ABXNyABFqYXZhLnV0aWwu..." },
                body: "<html><body><h1>Java App</h1><!-- session cookie is a serialized Java object --></body></html>",
              },
            },
          },
          fs: { "/opt/tomcat/flag.txt": "CYBERAI{1ns3cur3_d3s3r14l1z4t10n}" },
        },
      ],
    },
  },
  {
    id: "l3-06-docker",
    level: 3,
    category: "privesc",
    title: "Container Escape",
    summary: "Get host root from Docker group privilege.",
    scenario:
      "You've gained a user shell in a containerized environment (10.10.30.30). The user is in the 'docker' group — this is nearly equivalent to root because you can mount the host filesystem via docker to get root.",
    objectives: [
      "Check user groups",
      "Identify Docker socket/group privilege",
      "Get host root via container",
      "Read the host root flag",
    ],
    hints: [
      "ssh devops@10.10.30.30 (password: Deploy2024).",
      "id — you'll see the 'docker' group.",
      "docker run -v /:/mnt --rm -it alpine chroot /mnt sh — host root.",
    ],
    targetIp: "10.10.30.30",
    flag: "CYBERAI{d0ck3r_gr0up_3sc4p3}",
    flagFormat: "CYBERAI{...}",
    points: 370,
    rubric: {
      expectedTools: ["ssh", "id", "docker", "cat"],
      expectedConcepts: ["docker group", "container escape", "privilege escalation"],
      parMinutes: 38,
    },
    env: {
      network: "SSH server + Docker.",
      hosts: [
        {
          ip: "10.10.30.30",
          hostname: "ci.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [{ port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" }],
          credentials: [{ service: "ssh", username: "devops", password: "Deploy2024" }],
          fs: {
            "/home/devops/groups.txt": "devops : devops docker",
            "/root/root.txt": "CYBERAI{d0ck3r_gr0up_3sc4p3}",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },
  {
    id: "l3-07-ssrf",
    level: 3,
    category: "web",
    title: "Blind Server Request",
    summary: "Access the internal metadata service via SSRF.",
    scenario:
      "A cloud-based web application (10.10.30.35) takes a URL and fetches it server-side. This is SSRF (Server-Side Request Forgery) — you can access the internal cloud metadata endpoint (169.254.169.254) and steal sensitive information.",
    objectives: [
      "Find the URL fetch function",
      "Access internal metadata via SSRF",
      "Get the secret IAM credential/flag",
    ],
    hints: [
      "/fetch?url= parameter fetches an external URL.",
      "Try url=http://169.254.169.254/latest/meta-data/.",
      "The flag is in the iam/security-credentials/ path.",
    ],
    targetIp: "10.10.30.35",
    flag: "CYBERAI{ssrf_cl0ud_m3t4d4t4}",
    flagFormat: "CYBERAI{...}",
    points: 380,
    rubric: {
      expectedTools: ["curl"],
      expectedConcepts: ["ssrf", "cloud metadata", "internal access"],
      parMinutes: 40,
    },
    env: {
      network: "Cloud web application with SSRF vulnerability.",
      hosts: [
        {
          ip: "10.10.30.35",
          hostname: "cloud-app.corp.local",
          os: "Linux (Amazon Linux 2)",
          ports: [{ port: 80, service: "http", version: "nginx 1.20.1", state: "open" }],
          web: {
            server: "nginx/1.20.1",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>Image Proxy</h1><form>/fetch?url=...</form></body></html>",
              },
              "/fetch?url=http://169.254.169.254/latest/meta-data/": {
                status: 200,
                body: "iam/\nhostname\ninstance-id\nsecurity-credentials/",
              },
              "/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/": {
                status: 200,
                body: '{"AccessKeyId":"AKIA...","SecretAccessKey":"...","Token":"FLAG: CYBERAI{ssrf_cl0ud_m3t4d4t4}"}',
              },
            },
          },
        },
      ],
    },
  },
  {
    id: "l3-08-kernel",
    level: 3,
    category: "privesc",
    title: "Kernel Bug",
    summary: "Root via kernel exploit (DirtyPipe style).",
    scenario:
      "The server (10.10.30.40) runs an old Linux kernel (5.8.x). It is vulnerable to kernel exploits like DirtyPipe (CVE-2022-0847). Objective: get root from a user shell via kernel exploitation.",
    objectives: [
      "SSH in and identify the kernel version",
      "Find the matching kernel exploit (searchsploit)",
      "Compile the exploit and get root",
      "Read the root flag",
    ],
    hints: [
      "ssh analyst@10.10.30.40 (password: Analyst99).",
      "uname -r — kernel 5.8.0. searchsploit dirty pipe.",
      "Exploit overwrites /etc/passwd or gives a SUID shell -> root.",
    ],
    targetIp: "10.10.30.40",
    flag: "CYBERAI{d1rtyp1p3_k3rn3l_r00t}",
    flagFormat: "CYBERAI{...}",
    points: 400,
    rubric: {
      expectedTools: ["ssh", "uname", "searchsploit", "gcc"],
      expectedConcepts: ["kernel exploit", "cve research", "compilation", "privilege escalation"],
      parMinutes: 42,
    },
    env: {
      network: "SSH server with old kernel.",
      hosts: [
        {
          ip: "10.10.30.40",
          hostname: "legacy.corp.local",
          os: "Linux (Ubuntu 20.04, kernel 5.8.0)",
          ports: [{ port: 22, service: "ssh", version: "OpenSSH 8.2p1", state: "open" }],
          credentials: [{ service: "ssh", username: "analyst", password: "Analyst99" }],
          fs: {
            "/proc/version": "Linux version 5.8.0-43-generic (CVE-2022-0847 DirtyPipe vulnerable)",
            "/root/root.txt": "CYBERAI{d1rtyp1p3_k3rn3l_r00t}",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },
  {
    id: "l3-09-waf-bypass",
    level: 3,
    category: "web",
    title: "Wall Bypass",
    summary: "Bypass WAF and execute SQLi.",
    scenario:
      "An e-commerce site (10.10.30.45) is protected by a WAF (Web Application Firewall). Simple SQL injection is blocked. Goal: bypass the WAF using encoding, comments, and case tricks to exfiltrate the database.",
    objectives: [
      "Identify the vulnerable parameter and WAF",
      "Apply WAF bypass techniques",
      "Exfiltrate admin credentials from the DB",
      "Get the flag from the admin panel",
    ],
    hints: [
      "?id=1 — simple ' gets blocked (WAF 403).",
      "Bypass: /*!50000UNION*/, URL encoding, or UnIoN SeLeCt.",
      "admin hash from users table -> crack -> /admin -> flag.",
    ],
    targetIp: "10.10.30.45",
    flag: "CYBERAI{w4f_byp4ss_un10n_1nj3ct}",
    flagFormat: "CYBERAI{...}",
    points: 410,
    rubric: {
      expectedTools: ["curl", "sqlmap", "john"],
      expectedConcepts: ["waf bypass", "union-based sqli", "encoding tricks", "exfiltration"],
      parMinutes: 45,
    },
    env: {
      network: "WAF-protected e-commerce site.",
      hosts: [
        {
          ip: "10.10.30.45",
          hostname: "store.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 80, service: "http", version: "ModSecurity WAF / Apache", state: "open" },
            { port: 3306, service: "mysql", version: "MySQL 8.0", state: "filtered" },
          ],
          web: {
            server: "Apache (ModSecurity)",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>CorpStore</h1><a href='/product?id=1'>Product</a></body></html>",
              },
              "/product?id=1": {
                status: 200,
                body: "<html><body>Product: Widget. Price: $9.99</body></html>",
              },
              "/product?id=1'": {
                status: 403,
                body: "[ModSecurity] Request blocked: SQL injection detected.",
              },
              "/product?id=1/*!50000UNION*/SELECT user,pass,3 FROM users": {
                status: 200,
                body: "admin | $1$xyz$cR4ck3dHash | 3  (when cracked: 'admin@123')",
              },
              "/admin": {
                status: 200,
                protected: true,
                body: "<html><body><h1>Admin</h1><pre>FLAG: CYBERAI{w4f_byp4ss_un10n_1nj3ct}</pre></body></html>",
              },
            },
            discoverablePaths: ["/admin"],
          },
        },
      ],
    },
  },
  {
    id: "l3-10-bank-heist",
    level: 3,
    category: "web",
    title: "Finale: Citadel Bank",
    summary: "Recon -> RCE -> pivot -> AD -> Domain Admin. Full enterprise.",
    scenario:
      "Final exam. The external perimeter of Citadel Bank (10.10.30.50) is provided. Compromise the web application, pivot to the internal network, enumerate the file server, and finally take over the Domain Controller to achieve full enterprise compromise. This is a full network simulation from the OSCP exam.",
    objectives: [
      "External perimeter recon and web foothold",
      "Pivot to internal network (10.10.31.0/24)",
      "Gather credentials from the file server",
      "Take over the Domain Controller and read final.txt",
    ],
    hints: [
      "Web app on 10.10.30.50 gives RCE (vulnerable upload/injection).",
      "Internal: 10.10.31.10 (file server, SMB), 10.10.31.20 (DC).",
      "Domain admin credential from file server -> evil-winrm DC -> final.txt.",
    ],
    targetIp: "10.10.30.50",
    flag: "CYBERAI{c1t4d3l_t0t4l_d0m41n_pwn3d}",
    flagFormat: "CYBERAI{...}",
    points: 500,
    rubric: {
      expectedTools: ["nmap", "gobuster", "curl", "nc", "smbclient", "evil-winrm", "hashcat"],
      expectedConcepts: [
        "external recon",
        "web exploitation",
        "pivoting",
        "credential harvesting",
        "active directory compromise",
      ],
      parMinutes: 60,
    },
    env: {
      network: "Full enterprise: DMZ web + internal file server + DC.",
      hosts: [
        {
          ip: "10.10.30.50",
          hostname: "citadel-web.bank.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            { port: 80, service: "http", version: "nginx 1.20.1 / PHP 8.1", state: "open" },
            { port: 443, service: "https", version: "nginx 1.20.1", state: "open" },
          ],
          web: {
            server: "nginx/1.20.1",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>Citadel Bank</h1><a href='/portal'>Portal</a></body></html>",
              },
              "/portal": {
                status: 200,
                protected: true,
                body: "<html><body><h1>Portal</h1><p>Vulnerable 'doc' parameter -> RCE. Internal IP: 10.10.31.5</p></body></html>",
              },
            },
            discoverablePaths: ["/portal", "/uploads/", "/admin/"],
          },
          fs: {
            "/var/www/internal.txt":
              "Internal network 10.10.31.0/24:\n 10.10.31.10 = FILE01 (SMB)\n 10.10.31.20 = DC01\nbackup_svc / Backup#2024 stored on the file server.",
          },
        },
        {
          ip: "10.10.31.10",
          hostname: "FILE01.bank.local",
          os: "Windows Server 2019",
          ports: [
            { port: 139, service: "netbios-ssn", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
          ],
          credentials: [{ service: "smb", username: "backup_svc", password: "Backup#2024" }],
          fs: {
            "//IT/creds.txt":
              "Domain Admin: Administrator / Citadel$Admin2024\nDC: 10.10.31.20 (WinRM 5985 open)",
          },
        },
        {
          ip: "10.10.31.20",
          hostname: "DC01.bank.local",
          os: "Windows Server 2022",
          ports: [
            { port: 88, service: "kerberos-sec", state: "open" },
            { port: 389, service: "ldap", state: "open" },
            { port: 445, service: "microsoft-ds", state: "open" },
            { port: 5985, service: "winrm", state: "open" },
          ],
          credentials: [
            { service: "smb", username: "Administrator", password: "Citadel$Admin2024" },
          ],
          fs: {
            "C:/Users/Administrator/Desktop/final.txt": "CYBERAI{c1t4d3l_t0t4l_d0m41n_pwn3d}",
          },
        },
      ],
    },
  },
];
