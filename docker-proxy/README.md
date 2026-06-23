# CyberAI Docker Proxy - Xavfsiz Container Yaratish Tizimi

## ⚠️ XAVFSIZLIK MUHIM!

Bu tizim Docker API'ni internetga chiqaradi. Agar noto'g'ri sozlasangiz, hakerlar sizning kompyuteringizga kirishi mumkin.

## 🛡️ Xavfsizlik choralari:

1. **Faqat localhost** — server faqat 127.0.0.1 da ishlaydi
2. **API Key** — har bir so'rov autentifikatsiya talab qiladi
3. **CORS** — faqat ruxsat etilgan domenlar
4. **Rate Limiting** — 15 daqiqada 100 ta so'rov
5. **Cloudflare Tunnel** — xavfsiz internetga chiqish

## 📋 O'rnatish qadamlari:

### 1. Docker Desktop o'rnating
```
https://docker.com/products/docker-desktop
```

### 2. setup.bat ni ishga tushiring
```
cd D:\cyberaiuz\docker-proxy
setup.bat
```

### 3. Serverni ishga tushiring
```
start.bat
```

### 4. Cloudflare Tunnel sozlang

#### a. cloudflared o'rnating
```
winget install cloudflare.cloudflared
```

#### b. Cloudflare dashboard dan tunnel yarating
1. https://dash.cloudflare.com → Zero Trust → Networks → Tunnels
2. "Create a tunnel" bosing
3. Tunnel nomi: `cyberai-docker-proxy`
4. Service: `https://localhost:2377`
5. Hostname: `docker.cyberaiuz.workers.dev`

#### c. Tunnel sozlamasini yuklab oling
```
cloudflared tunnel token cyberai-docker-proxy > C:\Users\sunna\.cloudflared\credentials.json
```

#### d. Tunnel ishga tushiring
```
cloudflared tunnel run cyberai-docker-proxy
```

## 🔧 API ishlatish:

### API Key olish
Server ishga tushganda console da API Key ko'rsatiladi.

### Container yaratish
```bash
curl -X POST https://docker.cyberaiuz.workers.dev/api/containers \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"template_id": "ubuntu-web", "user_id": "sunnatilla"}'
```

### Container ro'yxati
```bash
curl https://docker.cyberaiuz.workers.dev/api/containers \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Container to'xtatish
```bash
curl -X DELETE https://docker.cyberaiuz.workers.dev/api/containers/CONTAINER_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 📁 Fayl tuzilishi:
```
docker-proxy/
├── server.js          # Asosiy server
├── package.json       # Dependencies
├── setup.bat          # O'rnatish skripti
├── start.bat          # Ishga tushirish skripti
├── .env               # API Key (avtomatik yaratiladi)
├── cloudflared-config.yml  # Tunnel sozlamasi
└── README.md          # Bu fayl
```

## ⚡ Template lar:

| ID | OS | Xizmatlar |
|----|-----|-----------|
| ubuntu-web | Ubuntu 22.04 | http, ssh, mysql |
| centos-mail | CentOS 9 | smtp, imap, ssh |
| debian-db | Debian 12 | postgresql, redis, ssh |
| alpine-container | Alpine 3.18 | docker, ssh |
| kali-pentest | Kali Linux | ssh, metasploit |

## 🔒 Xavfsizlik maslahatlari:

1. **API Key'ni hech kim bilan bo'lishmang**
2. **Faqat HTTPS ishlating** (Cloudflare Tunnel avtomatik HTTPS beradi)
3. **Docker Desktop'ni faqat kerak bo'lganda yoqing**
4. **Tunnel'ni faqat kerak bo'lganda ishga tushiring**
5. **Log'larni tekshirib turing**

## 🆘 Muammo bo'lsa:

1. Docker ishlamayapti → Docker Desktop'ni qayta ishga tushiring
2. Server ulanmayapti → 2377 port ochilganligini tekshiring
3. Tunnel ishlamayapti → cloudflared loglarini tekshiring
