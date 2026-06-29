import type { CTFChallenge } from "../types";

/* ──────────────────────────────────────────────────────────────
   LEVEL 1 — Beginner (easy). For learners.
   Each CTF teaches one specific technique.
   ────────────────────────────────────────────────────────────── */

export const LEVEL1: CTFChallenge[] = [
  {
    id: "l1-01-robots",
    level: 1,
    category: "web",
    title: "Hidden Path",
    summary: "Something is hidden in robots.txt.",
    scenario:
      "The target web server (10.10.10.5) displays a simple corporate page. Many administrators use robots.txt to hide pages from search engine crawlers — but anyone can read that file. Start here.",
    objectives: [
      "Identify open ports on the web server",
      "Read the robots.txt file",
      "Access the hidden path and find the flag",
    ],
    hints: [
      "Scan 10.10.10.5 with nmap.",
      "Try curl http://10.10.10.5/robots.txt",
      "Access the Disallow path from robots.txt with curl.",
    ],
    solution: [
      "Scan the target: nmap 10.10.10.5",
      "发现 port 80 (HTTP) open",
      "Fetch robots.txt: curl http://10.10.10.5/robots.txt",
      "robots.txt contains: Disallow: /secret-admin-7421/",
      "Access the hidden path: curl http://10.10.10.5/secret-admin-7421/",
      "Flag found: CYBERAI{r0b0ts_4r3_n0t_s3cr3t}",
    ],
    targetIp: "10.10.10.5",
    flag: "CYBERAI{r0b0ts_4r3_n0t_s3cr3t}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["nmap", "curl"],
      expectedConcepts: ["port scanning", "robots.txt enumeration", "http requests"],
      parMinutes: 8,
    },
    env: {
      network: "A single web server. HTTP on port 80.",
      hosts: [
        {
          ip: "10.10.10.5",
          hostname: "web01.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            { port: 80, service: "http", version: "Apache 2.4.52", state: "open" },
          ],
          web: {
            server: "Apache/2.4.52",
            routes: {
              "/": {
                status: 200,
                body: "<html><head><title>Corp Portal</title></head><body><h1>Welcome to Corp Portal</h1><p>Authorized personnel only.</p></body></html>",
              },
              "/robots.txt": {
                status: 200,
                body: "User-agent: *\nDisallow: /secret-admin-7421/\nDisallow: /backup/",
              },
              "/secret-admin-7421/": {
                status: 200,
                body: "<html><body><h1>Hidden Admin Note</h1><pre>Note: portal needs updating.\nFLAG: CYBERAI{r0b0ts_4r3_n0t_s3cr3t}</pre></body></html>",
              },
              "/backup/": {
                status: 403,
                body: "Forbidden",
              },
            },
            discoverablePaths: ["/robots.txt", "/secret-admin-7421/", "/backup/"],
          },
        },
      ],
    },
  },
  {
    id: "l1-02-ftp-anon",
    level: 1,
    category: "recon",
    title: "Open Door",
    summary: "Anonymous FTP access is enabled.",
    scenario:
      "The file server (10.10.10.8) runs FTP. Many older servers allow the 'anonymous' user to log in without a password. This is a classic misconfiguration.",
    objectives: [
      "Identify the FTP port",
      "Log in as an anonymous user",
      "Browse files and read the flag",
    ],
    hints: [
      "nmap -sV 10.10.10.8 — identify the version.",
      "ftp 10.10.10.8 and enter 'anonymous' as username.",
      "Use ls and get to download the flag file, then cat it.",
    ],
    solution: [
      "Scan the target: nmap -sV 10.10.10.8",
      "发现 port 21 (FTP) open with vsftpd 3.0.3",
      "Connect to FTP: ftp 10.10.10.8",
      "Username: anonymous, Password: (empty)",
      "List files: ls",
      "Download flag: get readme.txt",
      "Exit FTP: bye",
      "Read flag: cat readme.txt",
      "Flag found: CYBERAI{4n0nym0us_ftp_l3ak}",
    ],
    targetIp: "10.10.10.8",
    flag: "CYBERAI{4n0nym0us_ftp_l3ak}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["nmap", "ftp"],
      expectedConcepts: ["service enumeration", "anonymous ftp", "file transfer"],
      parMinutes: 8,
    },
    env: {
      network: "File server. FTP on port 21 with anonymous access.",
      hosts: [
        {
          ip: "10.10.10.8",
          hostname: "fileserver.corp.local",
          os: "Linux (Debian 11)",
          ports: [
            {
              port: 21,
              service: "ftp",
              version: "vsftpd 3.0.3",
              state: "open",
              banner: "220 (vsFTPd 3.0.3)",
            },
            { port: 22, service: "ssh", version: "OpenSSH 8.4p1", state: "open" },
          ],
          credentials: [{ service: "ftp", username: "anonymous", password: "" }],
          fs: {
            "/ftp/readme.txt":
              "This is a public file sharing area.\nDo not place confidential files here!",
            "/ftp/notes.txt":
              "Don't forget to change the backup password.\nFLAG: CYBERAI{4n0nym0us_ftp_l3ak}",
          },
        },
      ],
    },
  },
  {
    id: "l1-03-base64",
    level: 1,
    category: "crypto",
    title: "Hidden Text",
    summary: "The page contains Base64-encoded data.",
    scenario:
      "The source code of the web page (10.10.10.12) contains a jumble of characters. This is often Base64 encoding — not encryption, just simple encoding. Decoding it is easy.",
    objectives: ["View the page source", "Find the Base64 string", "Decode it to reveal the flag"],
    hints: [
      "Use curl http://10.10.10.12/ to get the full HTML.",
      "The long string in the comment (<!-- -->) might be Base64.",
      "Use echo '<string>' | base64 -d.",
    ],
    targetIp: "10.10.10.12",
    flag: "CYBERAI{b4s364_1s_n0t_3ncrypt10n}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["curl", "base64"],
      expectedConcepts: ["source inspection", "base64 encoding", "decoding"],
      parMinutes: 6,
    },
    env: {
      network: "A single static web page.",
      hosts: [
        {
          ip: "10.10.10.12",
          hostname: "blog.corp.local",
          os: "Linux",
          ports: [{ port: 80, service: "http", version: "nginx 1.18.0", state: "open" }],
          web: {
            server: "nginx/1.18.0",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>Dev Blog</h1><p>Coming soon...</p>\n<!-- TODO: remove debug token Q1lCRVJBSXtiNHMzNjRfMXNfbjB0XzNuY3J5cHQxMG59 -->\n</body></html>",
              },
            },
          },
        },
      ],
    },
  },
  {
    id: "l1-04-default-creds",
    level: 1,
    category: "web",
    title: "Default Password",
    summary: "Admin panel is open with default login/password.",
    scenario:
      "A router management panel (10.10.10.15) was discovered. Many devices ship with factory default credentials (like admin/admin) that are never changed.",
    objectives: ["Locate the web panel", "Try default credentials", "Log in and retrieve the flag"],
    hints: [
      "Check the /login page on port 80.",
      "The most common default: admin / admin.",
      "Logging into the login page with the correct credentials reveals the flag.",
    ],
    targetIp: "10.10.10.15",
    flag: "CYBERAI{d3f4ult_cr3ds_ar3_d4ng3r0us}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["nmap", "curl"],
      expectedConcepts: ["default credentials", "authentication", "web login"],
      parMinutes: 7,
    },
    env: {
      network: "Router admin panel.",
      hosts: [
        {
          ip: "10.10.10.15",
          hostname: "router.corp.local",
          os: "Embedded Linux",
          ports: [{ port: 80, service: "http", version: "lighttpd 1.4.59", state: "open" }],
          credentials: [{ service: "http", username: "admin", password: "admin" }],
          web: {
            server: "lighttpd/1.4.59",
            routes: {
              "/": {
                status: 200,
                body: "<html><body><h1>RouterOS Admin</h1><a href='/login'>Login</a></body></html>",
              },
              "/login": {
                status: 200,
                body: "<html><body><h1>Login</h1><form>POST username & password. Hint: try default factory creds.</form></body></html>",
                protected: true,
              },
              "/dashboard": {
                status: 200,
                body: "<html><body><h1>Admin Dashboard</h1><p>Welcome admin.</p><pre>FLAG: CYBERAI{d3f4ult_cr3ds_ar3_d4ng3r0us}</pre></body></html>",
              },
            },
          },
        },
      ],
    },
  },
  {
    id: "l1-05-ssh-weak",
    level: 1,
    category: "password",
    title: "Weak Password",
    summary: "SSH user uses a very simple password.",
    scenario:
      "The server (10.10.10.20) runs SSH. A user named 'developer' is known to exist. Weak passwords are vulnerable to dictionary attacks.",
    objectives: [
      "Confirm the SSH port",
      "Find the developer user's password (hydra)",
      "Log in via SSH and read the flag",
    ],
    hints: [
      "nmap 10.10.10.20 — verify port 22 is open.",
      "Run hydra -l developer -P rockyou.txt ssh://10.10.10.20",
      "With the found password, ssh developer@10.10.10.20, then cat flag.txt.",
    ],
    targetIp: "10.10.10.20",
    flag: "CYBERAI{w34k_p4ssw0rds_d13}",
    flagFormat: "CYBERAI{...}",
    points: 120,
    rubric: {
      expectedTools: ["nmap", "hydra", "ssh"],
      expectedConcepts: ["brute force", "dictionary attack", "ssh access"],
      parMinutes: 10,
    },
    env: {
      network: "SSH server. developer user has a weak password.",
      hosts: [
        {
          ip: "10.10.10.20",
          hostname: "dev.corp.local",
          os: "Linux (Ubuntu 20.04)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.2p1", state: "open" },
            { port: 80, service: "http", version: "Apache 2.4.41", state: "open" },
          ],
          credentials: [{ service: "ssh", username: "developer", password: "password123" }],
          fs: {
            "/home/developer/flag.txt": "CYBERAI{w34k_p4ssw0rds_d13}",
            "/home/developer/notes.md": "TODO: change the password (very weak).",
          },
        },
      ],
    },
  },
  {
    id: "l1-06-dirbust",
    level: 1,
    category: "web",
    title: "Hidden Directories",
    summary: "Find hidden directories with gobuster.",
    scenario:
      "The web server (10.10.10.25) shows nothing on the homepage. But unlinked directories may exist. Directory brute-forcing reveals them.",
    objectives: [
      "Identify the HTTP service",
      "Find directories with gobuster",
      "Retrieve the flag from a hidden directory",
    ],
    hints: [
      "Run gobuster dir -u http://10.10.10.25 -w common.txt",
      "One of the discovered directories may contain a config file.",
      "Use curl to read the file inside /config/.",
    ],
    targetIp: "10.10.10.25",
    flag: "CYBERAI{d1r3ct0ry_brut3_f0rc3}",
    flagFormat: "CYBERAI{...}",
    points: 120,
    rubric: {
      expectedTools: ["gobuster", "curl"],
      expectedConcepts: ["directory enumeration", "wordlists", "hidden content"],
      parMinutes: 9,
    },
    env: {
      network: "Web server with hidden directories.",
      hosts: [
        {
          ip: "10.10.10.25",
          hostname: "app.corp.local",
          os: "Linux",
          ports: [{ port: 80, service: "http", version: "nginx 1.20.1", state: "open" }],
          web: {
            server: "nginx/1.20.1",
            routes: {
              "/": { status: 200, body: "<html><body><h1>It works!</h1></body></html>" },
              "/admin/": { status: 403, body: "Forbidden" },
              "/config/": {
                status: 200,
                body: "<html><body>Index of /config/<br><a href='settings.bak'>settings.bak</a></body></html>",
              },
              "/config/settings.bak": {
                status: 200,
                body: "DB_HOST=localhost\nDB_USER=root\nDB_PASS=s3cr3t\n# FLAG: CYBERAI{d1r3ct0ry_brut3_f0rc3}",
              },
              "/uploads/": {
                status: 200,
                body: "<html><body>Index of /uploads/ (empty)</body></html>",
              },
            },
            discoverablePaths: ["/admin/", "/config/", "/uploads/", "/config/settings.bak"],
          },
        },
      ],
    },
  },
  {
    id: "l1-07-rot13",
    level: 1,
    category: "crypto",
    title: "Rotated Alphabet",
    summary: "Decode a message encrypted with ROT13.",
    scenario:
      "A found note contains strange-looking text. This is ROT13 — each letter is shifted by 13 positions. It's a very weak 'encryption' that is easily reversed.",
    objectives: ["Read the local file", "Identify the ROT13 text", "Decode it to reveal the flag"],
    hints: [
      "cat note.txt — the file is on your Kali box.",
      "ROT13 — decode with tr 'A-Za-z' 'N-ZA-Mn-za-m'",
      "Or: echo '<text>' | rot13.",
    ],
    targetIp: "127.0.0.1",
    flag: "CYBERAI{rot13_is_trivial}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["cat", "tr"],
      expectedConcepts: ["rot13", "substitution cipher", "decoding"],
      parMinutes: 5,
    },
    env: {
      network: "Local artifact — no network required.",
      localFiles: {
        "/root/note.txt": "Quick note:\nPNLOREN{ebg13_vf_gevivny}\n(each character shifted by 13)",
      },
      hosts: [],
    },
  },
  {
    id: "l1-08-banner",
    level: 1,
    category: "network",
    title: "Banner Grab",
    summary: "Flag is hidden in the service banner.",
    scenario:
      "An unknown service on 10.10.10.30 runs on an unusual port (1337). Many services send a 'banner' upon connection — it provides info about the service and sometimes leaks extra details.",
    objectives: [
      "Identify the unusual port",
      "Capture the banner (netcat)",
      "Read the flag from the banner",
    ],
    hints: [
      "nmap -p- 10.10.10.30 — scan all ports.",
      "Connect with nc 10.10.10.30 1337",
      "The banner reveals the flag immediately.",
    ],
    targetIp: "10.10.10.30",
    flag: "CYBERAI{b4nn3r_gr4bb1ng_101}",
    flagFormat: "CYBERAI{...}",
    points: 110,
    rubric: {
      expectedTools: ["nmap", "nc"],
      expectedConcepts: ["full port scan", "banner grabbing", "netcat"],
      parMinutes: 8,
    },
    env: {
      network: "Service on a special port.",
      hosts: [
        {
          ip: "10.10.10.30",
          hostname: "svc.corp.local",
          os: "Linux",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" },
            {
              port: 1337,
              service: "custom",
              state: "open",
              banner:
                "==== CORP DEBUG SERVICE v0.1 ====\nWARNING: debug mode active\nFLAG: CYBERAI{b4nn3r_gr4bb1ng_101}\n>",
            },
          ],
        },
      ],
    },
  },
  {
    id: "l1-09-hashid",
    level: 1,
    category: "password",
    title: "Cracked Hash",
    summary: "Crack the MD5 hash to find the password.",
    scenario:
      "A single password hash was obtained from a database dump. This is MD5 — fast, but a weak algorithm. Simple passwords can be quickly cracked with john or rainbow tables.",
    objectives: [
      "Identify the hash type",
      "Crack the hash (john/hashcat)",
      "Submit the cracked password as the flag",
    ],
    hints: [
      "cat hash.txt — the hash is on your box.",
      "Use hash-identifier or hashid to identify the type.",
      "john --format=raw-md5 --wordlist=rockyou.txt hash.txt.",
    ],
    targetIp: "127.0.0.1",
    flag: "CYBERAI{sunshine}",
    flagFormat: "CYBERAI{cracked_password}",
    points: 120,
    rubric: {
      expectedTools: ["cat", "hashid", "john"],
      expectedConcepts: ["hash identification", "md5", "password cracking"],
      parMinutes: 9,
    },
    env: {
      network: "Local hash file.",
      localFiles: {
        "/root/hash.txt": "0571749e2ac330a7455809c6b0e7af90",
      },
      hosts: [],
    },
  },
  {
    id: "l1-10-cookie",
    level: 1,
    category: "web",
    title: "Fake Cookie",
    summary: "Modify the admin cookie value.",
    scenario:
      "The web application (10.10.10.35) stores the user role in a cookie: role=guest. There's no server-side validation. By changing the cookie to role=admin you can access the admin area.",
    objectives: [
      "View the homepage cookie",
      "Change the cookie value to admin",
      "Get the flag from the admin page",
    ],
    hints: [
      "curl -v http://10.10.10.35/ — check the Set-Cookie header.",
      "Change role=guest to role=admin.",
      "curl -b 'role=admin' http://10.10.10.35/admin.",
    ],
    targetIp: "10.10.10.35",
    flag: "CYBERAI{c00k13_t4mp3r1ng}",
    flagFormat: "CYBERAI{...}",
    points: 130,
    rubric: {
      expectedTools: ["curl"],
      expectedConcepts: ["cookies", "client-side trust", "parameter tampering"],
      parMinutes: 8,
    },
    env: {
      network: "Web application relying on a session cookie.",
      hosts: [
        {
          ip: "10.10.10.35",
          hostname: "shop.corp.local",
          os: "Linux",
          ports: [{ port: 80, service: "http", version: "Apache 2.4.52", state: "open" }],
          web: {
            server: "Apache/2.4.52",
            routes: {
              "/": {
                status: 200,
                headers: { "Set-Cookie": "role=guest" },
                body: "<html><body><h1>Member Area</h1><p>Role: guest</p></body></html>",
              },
              "/admin": {
                status: 200,
                protected: true,
                body: "<html><body><h1>Admin</h1><p>role=admin cookie required.</p><pre>FLAG: CYBERAI{c00k13_t4mp3r1ng}</pre></body></html>",
              },
            },
          },
        },
      ],
    },
  },
];
