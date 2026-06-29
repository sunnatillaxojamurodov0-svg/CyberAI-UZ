export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "EN", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "UZ", name: "Uzbek", nativeName: "O'zbek", flag: "🇺🇿" },
  { code: "RU", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "TR", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "FR", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "PT", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "IT", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "NL", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "PL", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "UK", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "CS", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "RO", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "HU", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "EL", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "DA", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "FI", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "SV", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "NO", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "SK", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  { code: "BG", name: "Bulgarian", nativeName: "Български", flag: "🇧🇬" },
  { code: "HR", name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷" },
  { code: "SL", name: "Slovenian", nativeName: "Slovenščina", flag: "🇸🇮" },
  { code: "ET", name: "Estonian", nativeName: "Eesti", flag: "🇪🇪" },
  { code: "LV", name: "Latvian", nativeName: "Latviešu", flag: "🇱🇻" },
  { code: "LT", name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹" },
  { code: "ID", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "MS", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "TH", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "VI", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "FIL", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
  { code: "HI", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "BN", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "TA", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "TE", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "MR", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "GU", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "KN", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ML", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "PA", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "UR", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "FA", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "AR", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "HE", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "JA", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "KO", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ZH", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "ZHT", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "KA", name: "Georgian", nativeName: "ქართული", flag: "🇬🇪" },
  { code: "HY", name: "Armenian", nativeName: "Հայերեն", flag: "🇦🇲" },
  { code: "KK", name: "Kazakh", nativeName: "Қазақ тілі", flag: "🇰🇿" },
  { code: "UZ", name: "Uzbek", nativeName: "O'zbek", flag: "🇺🇿" },
  { code: "AZ", name: "Azerbaijani", nativeName: "Azərbaycan", flag: "🇦🇿" },
  { code: "KY", name: "Kyrgyz", nativeName: "Кыргызча", flag: "🇰🇬" },
  { code: "TG", name: "Tajik", nativeName: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "TK", name: "Turkmen", nativeName: "Türkmen", flag: "🇹🇲" },
  { code: "MN", name: "Mongolian", nativeName: "Монгол", flag: "🇲🇳" },
  { code: "NE", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  { code: "SI", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
  { code: "MY", name: "Myanmar", nativeName: "မြန်မာ", flag: "🇲🇲" },
  { code: "KM", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "LO", name: "Lao", nativeName: "ລາວ", flag: "🇱🇦" },
  { code: "SW", name: "Swahili", nativeName: "Kiswahili", flag: "🇹🇿" },
  { code: "AM", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
  { code: "YO", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬" },
  { code: "IG", name: "Igbo", nativeName: "Igbo", flag: "🇳🇬" },
  { code: "HA", name: "Hausa", nativeName: "Hausa", flag: "🇳🇬" },
  { code: "ZU", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦" },
  { code: "AF", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },
  { code: "SQ", name: "Albanian", nativeName: "Shqip", flag: "🇦🇱" },
  { code: "BS", name: "Bosnian", nativeName: "Bosanski", flag: "🇧🇦" },
  { code: "MT", name: "Maltese", nativeName: "Malti", flag: "🇲🇹" },
  { code: "CY", name: "Welsh", nativeName: "Cymraeg", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "GA", name: "Irish", nativeName: "Gaeilge", flag: "🇮🇪" },
  { code: "IS", name: "Icelandic", nativeName: "Íslenska", flag: "🇮🇸" },
  { code: "MK", name: "Macedonian", nativeName: "Македонски", flag: "🇲🇰" },
  { code: "BE", name: "Belarusian", nativeName: "Беларуская", flag: "🇧🇾" },
  { code: "MG", name: "Malagasy", nativeName: "Malagasy", flag: "🇲🇬" },
];

export const DEFAULT_LANGUAGE = "EN";

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name ?? code;
}

export function getNativeName(code: string): string {
  return getLanguageByCode(code)?.nativeName ?? code;
}
