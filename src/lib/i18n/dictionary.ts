export type LangCode = string;

export interface StaticTranslations {
  [key: string]: Record<LangCode, string>;
}

export const dictionary: StaticTranslations = {
  // Navigation
  "nav.console": {
    EN: "Console",
    UZ: "Konsol",
    RU: "Консоль",
    TR: "Konsol",
    DE: "Konsole",
    FR: "Console",
    ES: "Consola",
  },
  "nav.projects": {
    EN: "Projects",
    UZ: "Loyihalar",
    RU: "Проекты",
    TR: "Projeler",
    DE: "Projekte",
    FR: "Projets",
    ES: "Proyectos",
  },
  "nav.prompts": {
    EN: "Prompts",
    UZ: "Buyruqlar",
    RU: "Промпты",
    TR: "İstemler",
    DE: "Prompts",
    FR: "Prompts",
    ES: "Prompts",
  },
  "nav.leaderboard": {
    EN: "Leaderboard",
    UZ: "Reyting",
    RU: "Таблица лидеров",
    TR: "Sıralama",
    DE: "Rangliste",
    FR: "Classement",
    ES: "Clasificación",
  },
  "nav.targets": {
    EN: "Targets",
    UZ: "Maqsadlar",
    RU: "Цели",
    TR: "Hedefler",
    DE: "Ziele",
    FR: "Cibles",
    ES: "Objetivos",
  },
  "nav.community": {
    EN: "Community",
    UZ: "Jamoat",
    RU: "Сообщество",
    TR: "Topluluk",
    DE: "Gemeinschaft",
    FR: "Communauté",
    ES: "Comunidad",
  },

  // Hero
  "hero.badge": {
    EN: "v2.0 Beta Live",
    UZ: "v2.0 Beta Jonli",
    RU: "v2.0 Beta Живой",
    TR: "v2.0 Beta Canlı",
  },
  "hero.title": {
    EN: "Secure the Synthetic Era",
    UZ: "Sintetik Erani Xavfsiz Qilish",
    RU: "Обеспечить безопасность синтетической эры",
    TR: "Sentetik Dönemi Güvence Altına Alın",
  },
  "hero.cta": {
    EN: "Start for Free",
    UZ: "Bepul Boshlash",
    RU: "Начать бесплатно",
    TR: "Ücretsiz Başlayın",
  },
  "hero.about": { EN: "About Me", UZ: "Men Haqimda", RU: "Обо мне", TR: "Hakkımda" },

  // Community
  "community.mission": { EN: "Mission", UZ: "Missiya", RU: "Миссия", TR: "Görev" },
  "community.cta": {
    EN: "Apply for early access",
    UZ: "Erta kirish uchun ariza bering",
    RU: "Подать заявку на ранний доступ",
    TR: "Erken erişim için başvurun",
  },
  "community.operator": { EN: "Operator", UZ: "Operator", RU: "Оператор", TR: "Operatör" },
  "community.countries": { EN: "Countries", UZ: "Davlatlar", RU: "Страны", TR: "Ülkeler" },
  "community.signals": {
    EN: "Signals / day",
    UZ: "Signallar / kun",
    RU: "Сигналы / день",
    TR: "Sinyaller / gün",
  },

  // Bento
  "bento.title": {
    EN: "Unfair Advantage, Built In",
    UZ: "Adolatsiz ustunlik, Ichida",
    RU: "Несправедливое преимущество, встроенное",
    TR: "Haksız avantaj, dahili",
  },
  "bento.ai_mentor": {
    EN: "Adaptive AI Mentor",
    UZ: "Moslashuvchan AI Murabbiy",
    RU: "Адаптивный ИИ-наставник",
    TR: "Uyarlanabilir AI Mentör",
  },
  "bento.ai_mentor.desc": {
    EN: "Our LLM-powered mentor watches your keystrokes, offering context-aware hints just before you get stuck, without giving away the answer.",
    UZ: "Bizning LLM asosidagi murabbiy sizning kalitlaringizni kuzatadi, javobni bermasdan oldin kontekstga mos maslahatlar beradi.",
    RU: "Наш ИИ-наставник на базе LLM отслеживает ваши нажатия клавиш, предлагая контекстные подсказки именно перед тем, как вы застрянете, не раскрывая ответ.",
    TR: "LLM tabanlı mentörümüz tuş vuruşlarınızı izler, cevabı vermeden hemen önce bağlam farkındalık ipuçları sunar.",
  },
  "bento.live_targets.desc": {
    EN: "Spin up isolated, realistic vulnerable networks in seconds. No local VMs required.",
    UZ: "Sekundlar ichida real va zaif tarmoqlarni yarating. Mahalliy VM kerak emas.",
    RU: "Запускайте изолированные, реалистичные уязвимые сети за секунды. Локальные ВМ не требуются.",
    TR: "Saniyeler içinde izole, gerçekçi kırılgan ağlar oluşturun. Yerel VM gerekmez.",
  },
  "bento.gamified_ctf.desc": {
    EN: "Compete in global leaderboards. Earn zero-knowledge proofs for every vulnerability you exploit.",
    UZ: "Global reytinglarda raqobatlasharing. Har bir zaiflik uchun nol bilim isboti oling.",
    RU: "Соревнуйтесь в глобальных рейтингах. Получайте доказательства с нулевым разглашением за каждую уязвимость.",
    TR: "Küresel sıralamalarda yarışın. Her zafer için sıfır bilgi kanıtları kazanın.",
  },
  "bento.threat_emulation.desc": {
    EN: "Test your defenses against AI-generated attack vectors that adapt to your architecture in real-time.",
    UZ: "O'z arxitekturangizga moslashuvchan AI hujum vektorlariga qarshi mudofaaingizni sinab ko'ring.",
    RU: "Проверьте свою защиту против векторов атак, сгенерированных ИИ, которые адаптируются к вашей архитектуре в реальном времени.",
    TR: "Zaman içinde mimarinize uyarlanan AI tarafından üretilen saldırı vektörlerine karşı savunmanızı test edin.",
  },
  "bento.live_targets": {
    EN: "Live Cloud Targets",
    UZ: "Jonli Bulut Maqsadlari",
    RU: "Живые облачные цели",
    TR: "Canlı Bulut Hedefleri",
  },
  "bento.gamified_ctf": {
    EN: "Gamified CTFs",
    UZ: "O'yinlashtirilgan CTF",
    RU: "Геймифицированные CTF",
    TR: "Oyunlaştırılmış CTF'ler",
  },
  "bento.premium": {
    EN: "Premium Feature",
    UZ: "Premium Xususiyat",
    RU: "Премиум функция",
    TR: "Premium Özellik",
  },
  "bento.threat_emulation": {
    EN: "Automated Threat Emulation",
    UZ: "Avtomatlashtirilgan Tahdid Imitatsiyasi",
    RU: "Автоматизированная эмуляция угроз",
    TR: "Otomatik Tehdit Emülasyonu",
  },
  "bento.explore": {
    EN: "Explore Red Team Tools",
    UZ: "Qizil Jamoa Vositalarini Organish",
    RU: "Изучить инструменты красной команды",
    TR: "Kırmızı Ekip Araçlarını Keşfet",
  },

  // Assistant
  "assistant.badge": {
    EN: "Cyber-Pilot · v2",
    UZ: "Cyber-Pilot · v2",
    RU: "Cyber-Pilot · v2",
    TR: "Cyber-Pilot · v2",
  },
  "assistant.title": {
    EN: "Talk to your infrastructure.",
    UZ: "Infrastrukturangiz bilan gaplashing.",
    RU: "Говорите со своей инфраструктурой.",
    TR: "Altyapınızla konuşun.",
  },
  "assistant.title.gradient": {
    EN: "infrastructure.",
    UZ: "infrastrukturangiz.",
    RU: "инфраструктурой.",
    TR: "altyapınızla.",
  },
  "assistant.description": {
    EN: "No more cryptic log greps and fragile runbooks. Describe the state you need; CyberAI translates your intent into hardened, audit-ready policy in milliseconds.",
    UZ: "Yashirin log qidiruvlari va zaif qo'llanmalar yo'q. Kerakli holatni tasvirlab bering; CyberAI niyatingizni millisekundlarda mustahkamlangan siyosatga aylantiradi.",
    RU: "Больше никаких загадочных поисков в логах и хрупких руководств. Опишите нужное состояние; CyberAI переводит ваше намерение в укрепленную, готовую к аудиту политику за миллисекунды.",
    TR: "Artık gizemli log aramaları ve kırılgan çalışma kitabı yok. İhtiyacınız olan durumu tanımlayın; CyberAI niyetinizi milisaniyeler içinde güçlendirilmiş, denetime hazır politikaya dönüştürür.",
  },
  "assistant.bullet1": {
    EN: "Conversational threat hunting across petabyte-scale log lakes.",
    UZ: "Petabayt miqyosidagi log ko'llarida suhbat shaklidagi tahdid ovchiligi.",
    RU: "Разговорный поиск угроз в логах масштаба петабайт.",
    TR: "Petabayt ölçekli log havuzlarında konuşma tarzı tehdit avcılığı.",
  },
  "assistant.bullet2": {
    EN: "Use tools to ask, write, and deploy — never raw SQL again.",
    UZ: "So'rash, yozish va joylashtirish uchun vositalardan foydalaning — hech qachon xom SQL ishlatmang.",
    RU: "Используйте инструменты для запросов, записи и развертывания — никогда больше не используйте сырой SQL.",
    TR: "Sormak, yazmak ve dağıtmak için araçları kullanın — bir daha asla ham SQL kullanmayın.",
  },
  "assistant.bullet3": {
    EN: "Every action signed, diffed, and reversible.",
    UZ: "Har bir amal imzolangan, diff qilingan va qaytarilishi mumkin.",
    RU: "Каждое действие подписано, сравнено и обратимо.",
    TR: "Her eylem imzalanmış, karşılaştırılmış ve geri alınabilir.",
  },
  "assistant.cta": {
    EN: "Open Assistant",
    UZ: "Yordamchini ochish",
    RU: "Открыть ассистент",
    TR: "Asistanı Aç",
  },

  // Projects
  "projects.badge": {
    EN: "Active Projects",
    UZ: "Faol Loyihalar",
    RU: "Активные проекты",
    TR: "Aktif Projeler",
  },
  "projects.title": {
    EN: "Sovereign infrastructure for the autonomous era.",
    UZ: "Avtonom era uchun mustaqil infratuzilma.",
    RU: "Суверенная инфраструктура для автономной эры.",
    TR: "Otonom çağ için egemen altyapı.",
  },

  // Prompts
  "prompts.badge": {
    EN: "Prompts Library",
    UZ: "Buyruqlar Kutubxonasi",
    RU: "Библиотека промптов",
    TR: "İstem Kütüphanesi",
  },
  "prompts.title": {
    EN: "Battle-ready prompts for every operation.",
    UZ: "Har bir operatsiya uchun tayyor buyruqlar.",
    RU: "Боевые промпты для каждой операции.",
    TR: "Her operasyon için hazır istemler.",
  },

  // Common
  "common.loading": {
    EN: "Loading...",
    UZ: "Yuklanmoqda...",
    RU: "Загрузка...",
    TR: "Yükleniyor...",
  },
  "common.save": { EN: "Save", UZ: "Saqlash", RU: "Сохранить", TR: "Kaydet" },
  "common.cancel": { EN: "Cancel", UZ: "Bekor qilish", RU: "Отмена", TR: "İptal" },
  "common.search": { EN: "Search", UZ: "Qidirish", RU: "Поиск", TR: "Ara" },
  "common.close": { EN: "Close", UZ: "Yopish", RU: "Закрыть", TR: "Kapat" },
};

export function getStaticTranslation(key: string, lang: string): string | null {
  const entry = dictionary[key];
  if (!entry) return null;
  return entry[lang] ?? entry["EN"] ?? null;
}
