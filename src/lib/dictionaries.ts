import type { Locale } from "@/lib/i18n";
import type { Language } from "@/lib/languages";

const en = {
  nav: {
    label: "Primary navigation",
    explore: "Explore",
    writing: "Writing",
    ask: "Ask",
    changeLanguage: "Change language",
    languages: "Languages",
  },
  meta: {
    siteDescription:
      "Explore Ömer Balkan's story, projects, writing, and personal AI profile.",
    blogTitle: "Articles",
    blogDescription: "Writing by Ömer Balkan about technology, AI, and life.",
    askTitle: "Ask",
    askDescription:
      "Ask an AI profile about Ömer Balkan, his projects, writing, tools, and public story.",
    articleNotFound: "Article Not Found",
    articleImageAlt: "Article by Ömer Balkan",
  },
  og: {
    siteDescription:
      "Explore my story, projects, and writing — or ask the AI profile about anything else.",
    siteFooter: "Explore / Writing / Ask",
    articleCta: "Read the article →",
    writingFallback: "Writing",
  },
  explore: {
    scenes: {
      identity: "Identity",
      introduction: "Introduction",
      story: "Story",
      social: "Instagram & YouTube",
      articles: "Articles",
      ask: "Ask",
    },
    sectionStatus: (index: number, total: number, label: string) =>
      `Section ${index} of ${total}: ${label}`,
    sectionsLabel: "Explore sections",
    goTo: (label: string) => `Go to ${label}`,
    continueTo: (label: string) => `Continue to ${label}`,
    continue: "Continue",
    elsewhere: "Elsewhere",
    latestArticles: "Latest articles",
    allArticles: "All articles",
    latest: "Latest",
    articleTopics: "Article topics",
    askTitle: "Want to go deeper?",
    askCta: "Just Ask!",
    social: {
      title: "Tech and AI, now in Turkish.",
      body: "I also make tech and AI content in Turkish on Instagram and YouTube, for anyone who'd rather keep up with what's new in their own language.",
      instagramCta: "Follow on Instagram",
      youtubeCta: "Watch on YouTube",
      follow: "Follow",
      subscribe: "Subscribe",
    },
  },
  blog: {
    title: "Articles",
    intro: "Notes and essays about technology, AI, and life.",
    latest: "Latest",
  },
  article: {
    allArticles: "All articles",
    undated: "Undated",
    languageGroup: "Article language",
    original: "original",
    translatedFrom: (language: string) => `Translated from ${language} by AI.`,
    originalSource: (source: string) => `Read the original on ${source}`,
    unavailable:
      "The full article isn't available right now. Please check back soon.",
  },
  languageNames: {
    en: "English",
    tr: "Turkish",
    es: "Spanish",
    de: "German",
    it: "Italian",
  } satisfies Record<Language, string>,
  notFound: {
    title: "This page wandered off.",
    body: "The link may be old or mistyped. Try one of these instead.",
    explore: "Explore",
    articles: "All articles",
    ask: "Ask anything",
  },
  ask: {
    title: "Ask anything about me",
    avatarAlt: "Ömer Balkan GitHub profile picture",
    inputLabel: "Ask anything about BLCNYY",
    placeholder: "Ask about work, projects, writing, or anything else...",
    followUpPlaceholder: "Ask a follow-up...",
    submit: "Ask",
    stop: "Stop",
    stopLabel: "Stop the answer",
    back: "Back",
    youAsked: "YOU ASKED:",
    followUp: "FOLLOW-UP:",
    thinking: "Thinking...",
    streaming: "Streaming...",
    stopped: "Stopped",
    stoppedEarly: "Stopped before an answer arrived",
    askAgain: "Ask Again",
    speak: "Speak answer",
    pauseSpeech: "Pause spoken answer",
    recentSearches: "Recent Searches",
    removeRecent: (question: string) => `Remove recent search: ${question}`,
    suggestionsLabel: "Suggested questions",
    suggestions: [
      "Who is Ömer Balkan?",
      "What is Duly?",
      "What is Salah[Now]?",
      "What's his tech setup?",
    ],
    askAboutSelection: "Ask about that",
    explainSelection: (text: string) => `Explain "${text}"`,
    startDictation: "Start dictation",
    stopDictation: "Stop dictation",
    dictatePrompt: "Dictate prompt",
    listening: "Listening...",
    errors: {
      generic: "The assistant could not answer that just yet.",
      noStream: "I couldn't start the response stream. Please try again.",
      streamEnded: "The stream ended unexpectedly.",
      empty: "I got an empty answer back. Please try again.",
      unreachable: "I couldn't reach the assistant. Please try again.",
      speechPlayback: "The audio could not be played in this browser.",
      speechCached: "The cached audio could not be played.",
      speechSaved: "The saved audio could not be played.",
      speechGenerated: "The generated audio could not be played.",
      speechFailed: "The answer could not be spoken yet.",
      speechEmpty: "I couldn't generate audio for that answer yet.",
      speechUnknown: "I couldn't generate speech for that answer yet.",
      dictationUnsupported:
        "Dictation is not supported in this browser. Try Chrome or Edge.",
      dictationBlocked:
        "Microphone access is blocked. Allow microphone access to dictate.",
      dictationNoSpeech: "I didn't catch any speech. Try the mic again.",
      dictationNetwork: "Dictation needs a working speech recognition connection.",
      dictationUnavailable: "Dictation is unavailable in this browser right now.",
      dictationStart: "Dictation could not start. Try the mic again.",
    },
  },
  eggs: {
    secretFound: "Secret found",
    secretsCount: (found: number, total: number) =>
      `${found} of ${total} secrets found`,
    secrets: {
      terminal: {
        name: "Hidden terminal",
        hint: "Some keys are worth pressing more than once.",
      },
      console: {
        name: "Developer console",
        hint: "Developers always check the console.",
      },
      spell: {
        name: "Name in lights",
        hint: "Type my name. Anywhere on Explore.",
      },
      snake: {
        name: "Retro code",
        hint: "↑ ↑ ↓ ↓ …",
      },
      "ship-it": {
        name: "Ship it",
        hint: "Want to go deeper? Really, really deep?",
      },
      "runaway-page": {
        name: "Runaway page",
        hint: "Get lost.",
      },
    },
    console: {
      greeting: "Hey developer 👋 Curious, huh?",
      hint: "Type blcnyy.help() to see what you can do.",
      commands: [
        ["blcnyy.help()", "show this list"],
        ["blcnyy.terminal()", "open the hidden terminal"],
        ["blcnyy.party()", "celebrate with the particles"],
        ["blcnyy.secrets()", "see which secrets you found"],
      ],
      tip: "Tip: on a keyboard, tap Shift three times anywhere.",
      secretsHeader: (found: number, total: number) =>
        `Secrets found: ${found}/${total}`,
    },
    terminal: {
      title: "visitor@blcnyy.dev — zsh",
      close: "Close terminal",
      welcome:
        "Welcome to the BLCNYY terminal. Type 'help' to see what you can do.",
      commands: [
        ["help", "list commands"],
        ["whoami", "who are you?"],
        ["about", "a short intro"],
        ["ls", "list what's here"],
        ["projects", "Duly and Salah[Now]"],
        ["open <name>", "open duly, salah, x, instagram, youtube, github, blog, ask"],
        ["ask <question>", "ask the AI profile anything"],
        ["theme <color>", "recolor the particles: blue, purple, #ff3366, rainbow…"],
        ["party", "celebrate"],
        ["lang <en|tr>", "switch language"],
        ["secrets", "see which secrets you found"],
        ["clear", "clear the screen"],
        ["exit", "close the terminal"],
      ],
      whoami:
        "visitor. Curious enough to find a hidden terminal. Respect. 🫡",
      about:
        "Ömer Balkan (BLCNYY). Vibe-coder and tech enthusiast from İstanbul, building Duly and Salah[Now] and writing about tech and AI.",
      ls: "projects/   articles/   story.md   secrets.txt",
      notFound: (command: string) =>
        `zsh: command not found: ${command}. Try 'help'.`,
      askUsage: "Usage: ask <question>",
      asking: "thinking…",
      askFailed: "The AI profile could not answer right now.",
      sudo: "Nice try. This incident will be reported. 👀",
      rmrf: [
        "removing /System…",
        "removing /Users/visitor/homework…",
        "removing /node_modules (this may take a while)…",
        "removing blcnyy.dev…",
      ],
      rmrfEnd: "Just kidding. Everything is fine. 😄",
      opening: (target: string) => `Opening ${target}…`,
      openUsage: "Usage: open <duly|salah|x|instagram|youtube|github|blog|ask>",
      themeUsage:
        "Usage: theme <color>. Try blue, purple, pink, matrix, rainbow, or a hex code like #ff3366. 'theme orange' resets it.",
      themeTooDark: "That color is too dark to see. Try a brighter one.",
      themeSet: (name: string) => `Theme set to ${name}.`,
      langUsage: "Usage: lang <en|tr>",
      party: "🎉 Party mode!",
      secretsHeader: (found: number, total: number) =>
        `Secrets found: ${found}/${total}`,
      secretLocked: "???",
      cat: "Try 'cat story.md' or 'cat secrets.txt'.",
      secretsFile: "Nice try. Secrets are found, not read. 🥚",
    },
    snake: {
      title: "SNAKE",
      start: "Press Space to start",
      controls: "Arrow keys or WASD · Esc to exit",
      score: "Score",
      best: "Best",
      gameOver: "Game over",
      restart: "Press Space to play again",
    },
    shipIt: {
      title: "SHIP IT",
      tagline: "Dodge the bugs. Ship to production.",
      start: "Press Space or tap to start",
      controls: "Mouse, arrow keys, or finger to move · Esc to exit",
      score: "Shipped",
      best: "Best",
      deployed: (version: number) => `Deployed v${version}.0 🚀`,
      failed: "Build failed ❌",
      restart: "Press Space or tap to retry",
      close: "Close game",
    },
    runaway: {
      prompt: "Or catch the page that ran away.",
      caught: "Caught it! Taking you home…",
      label: "missing-page.html",
    },
  },
  api: {
    crossSite: "Requests from other sites are not allowed.",
    tooManyQuestions:
      "Too many questions from this connection. Please wait a bit and try again.",
    tooManySpeech:
      "Too many spoken-answer requests from this connection. Please wait a bit and try again.",
    badJson: "Send JSON with a message field.",
    badSpeechJson: "Send JSON with a text field.",
    tooLong: (max: number) =>
      `Please keep your message to ${max} characters or fewer.`,
    speechTooLong: (max: number) =>
      `Please keep the text to ${max} characters or fewer.`,
    emptyMessage: "Write a prompt before sending the request.",
    emptySpeech: "There is no answer text to speak yet.",
    notConfigured:
      "The assistant is not configured yet. Add OPENROUTER_API_KEY on the server.",
    speechNotConfigured:
      "Speech is not configured yet. Add OPENROUTER_API_KEY on the server.",
    unsignedSpeech:
      "Only answers from Ask can be read aloud. Ask the question again to hear it.",
    modelError: "I couldn't reach the AI model. Please try again in a moment.",
    startFailed: "The assistant could not start a response. Please try again.",
    interrupted:
      "The connection was interrupted while streaming the response. Please try again.",
    speechError:
      "I couldn't generate speech for that answer. Please try again in a moment.",
  },
};

export type Dictionary = typeof en;

const tr: Dictionary = {
  nav: {
    label: "Ana gezinme",
    explore: "Keşfet",
    writing: "Yazılar",
    ask: "Sor",
    changeLanguage: "Dili değiştir",
    languages: "Diller",
  },
  meta: {
    siteDescription:
      "Ömer Balkan'ın hikâyesini, projelerini, yazılarını ve kişisel yapay zekâ profilini keşfet.",
    blogTitle: "Yazılar",
    blogDescription:
      "Ömer Balkan'ın teknoloji, yapay zekâ ve hayat üzerine yazıları.",
    askTitle: "Sor",
    askDescription:
      "Ömer Balkan, projeleri, yazıları, kullandığı araçlar ve hikâyesi hakkında yapay zekâ profiline soru sor.",
    articleNotFound: "Yazı bulunamadı",
    articleImageAlt: "Ömer Balkan'ın yazısı",
  },
  og: {
    siteDescription:
      "Hikâyemi, projelerimi ve yazılarımı keşfet ya da aklına takılanı yapay zekâ profiline sor.",
    siteFooter: "Keşfet / Yazılar / Sor",
    articleCta: "Yazıyı oku →",
    writingFallback: "Yazılar",
  },
  explore: {
    scenes: {
      identity: "Kimlik",
      introduction: "Tanıtım",
      story: "Hikâye",
      social: "Instagram ve YouTube",
      articles: "Yazılar",
      ask: "Sor",
    },
    sectionStatus: (index: number, total: number, label: string) =>
      `Bölüm ${index} / ${total}: ${label}`,
    sectionsLabel: "Keşfet bölümleri",
    goTo: (label: string) => `${label} bölümüne git`,
    continueTo: (label: string) => `Sonraki bölüm: ${label}`,
    continue: "Devam",
    elsewhere: "Diğer hesaplar",
    latestArticles: "Son yazılar",
    allArticles: "Tüm yazılar",
    latest: "En yeni",
    articleTopics: "Yazı konuları",
    askTitle: "Daha fazlasını mı merak ediyorsun?",
    askCta: "Hemen sor!",
    social: {
      title: "Teknoloji ve yapay zekâ, artık Türkçe.",
      body: "Instagram ve YouTube'da Türkçe teknoloji ve yapay zekâ içerikleri de üretiyorum. Yenilikleri kendi dilinde takip etmek isteyen herkes için.",
      instagramCta: "Instagram'da takip et",
      youtubeCta: "YouTube'da izle",
      follow: "Takip et",
      subscribe: "Abone ol",
    },
  },
  blog: {
    title: "Makaleler",
    intro: "Teknoloji, yapay zekâ ve hayat üzerine notlar ve denemeler.",
    latest: "En yeni",
  },
  article: {
    allArticles: "Tüm yazılar",
    undated: "Tarihsiz",
    languageGroup: "Yazının dili",
    original: "orijinal",
    translatedFrom: (language: string) =>
      `Orijinal dili ${language}. Yapay zekâ ile çevrildi.`,
    originalSource: (source: string) => `Orijinal paylaşım: ${source}`,
    unavailable:
      "Yazının tamamı şu an görüntülenemiyor. Lütfen daha sonra tekrar dene.",
  },
  languageNames: {
    en: "İngilizce",
    tr: "Türkçe",
    es: "İspanyolca",
    de: "Almanca",
    it: "İtalyanca",
  },
  notFound: {
    title: "Bu sayfa kaybolmuş.",
    body: "Bağlantı eski ya da hatalı olabilir. Bunlardan birini dene.",
    explore: "Keşfet",
    articles: "Tüm yazılar",
    ask: "Bir şey sor",
  },
  ask: {
    title: "Bana dair her şeyi sor",
    avatarAlt: "Ömer Balkan'ın GitHub profil fotoğrafı",
    inputLabel: "BLCNYY hakkında bir şey sor",
    placeholder: "İş, projeler, yazılar ya da aklına gelen her şeyi sor...",
    followUpPlaceholder: "Devam sorusu sor...",
    submit: "Sor",
    stop: "Durdur",
    stopLabel: "Yanıtı durdur",
    back: "Geri",
    youAsked: "SORDUN:",
    followUp: "DEVAM SORUSU:",
    thinking: "Düşünüyor...",
    streaming: "Yazıyor...",
    stopped: "Durduruldu",
    stoppedEarly: "Yanıt gelmeden durduruldu",
    askAgain: "Tekrar sor",
    speak: "Yanıtı sesli oku",
    pauseSpeech: "Sesli yanıtı duraklat",
    recentSearches: "Son aramalar",
    removeRecent: (question: string) => `Son aramalardan kaldır: ${question}`,
    suggestionsLabel: "Önerilen sorular",
    suggestions: [
      "Ömer Balkan kim?",
      "Duly nedir?",
      "Salah[Now] nedir?",
      "Hangi teknolojileri kullanıyor?",
    ],
    askAboutSelection: "Bunu sor",
    explainSelection: (text: string) => `"${text}" ne demek, açıklar mısın?`,
    startDictation: "Sesle yazmayı başlat",
    stopDictation: "Sesle yazmayı durdur",
    dictatePrompt: "Soruyu sesle yaz",
    listening: "Dinliyor...",
    errors: {
      generic: "Asistan şu an bu soruyu yanıtlayamadı.",
      noStream: "Yanıt başlatılamadı. Lütfen tekrar dene.",
      streamEnded: "Yanıt beklenmedik şekilde kesildi.",
      empty: "Boş bir yanıt geldi. Lütfen tekrar dene.",
      unreachable: "Asistana ulaşılamadı. Lütfen tekrar dene.",
      speechPlayback: "Ses bu tarayıcıda oynatılamadı.",
      speechCached: "Önbellekteki ses oynatılamadı.",
      speechSaved: "Kaydedilen ses oynatılamadı.",
      speechGenerated: "Oluşturulan ses oynatılamadı.",
      speechFailed: "Yanıt şu an sesli okunamadı.",
      speechEmpty: "Bu yanıt için ses oluşturulamadı.",
      speechUnknown: "Bu yanıt için ses oluşturulamadı.",
      dictationUnsupported:
        "Bu tarayıcı sesle yazmayı desteklemiyor. Chrome veya Edge'i dene.",
      dictationBlocked:
        "Mikrofon erişimi engellenmiş. Sesle yazmak için mikrofona izin ver.",
      dictationNoSpeech: "Bir şey duyamadım. Mikrofonu tekrar dene.",
      dictationNetwork: "Sesle yazma için çalışan bir ses tanıma bağlantısı gerekiyor.",
      dictationUnavailable: "Sesle yazma şu an bu tarayıcıda kullanılamıyor.",
      dictationStart: "Sesle yazma başlatılamadı. Mikrofonu tekrar dene.",
    },
  },
  eggs: {
    secretFound: "Sır bulundu",
    secretsCount: (found: number, total: number) =>
      `${total} sırdan ${found} tanesi bulundu`,
    secrets: {
      terminal: {
        name: "Gizli terminal",
        hint: "Bazı tuşlara birden fazla basmaya değer.",
      },
      console: {
        name: "Geliştirici konsolu",
        hint: "Geliştiriciler konsola mutlaka bakar.",
      },
      spell: {
        name: "Işıklarda isim",
        hint: "Adımı yaz. Keşfet'te herhangi bir yerde.",
      },
      snake: {
        name: "Retro kod",
        hint: "↑ ↑ ↓ ↓ …",
      },
      "ship-it": {
        name: "Ship it",
        hint: "Daha derine mi? Gerçekten çok derine?",
      },
      "runaway-page": {
        name: "Kaçak sayfa",
        hint: "Kaybol.",
      },
    },
    console: {
      greeting: "Selam geliştirici 👋 Meraklısın, ha?",
      hint: "Neler yapabileceğini görmek için blcnyy.help() yaz.",
      commands: [
        ["blcnyy.help()", "bu listeyi göster"],
        ["blcnyy.terminal()", "gizli terminali aç"],
        ["blcnyy.party()", "parçacıklarla kutla"],
        ["blcnyy.secrets()", "bulduğun sırları gör"],
      ],
      tip: "İpucu: klavyede herhangi bir yerde Shift'e üç kez bas.",
      secretsHeader: (found: number, total: number) =>
        `Bulunan sırlar: ${found}/${total}`,
    },
    terminal: {
      title: "visitor@blcnyy.dev — zsh",
      close: "Terminali kapat",
      welcome:
        "BLCNYY terminaline hoş geldin. Neler yapabileceğini görmek için 'help' yaz.",
      commands: [
        ["help", "komutları listele"],
        ["whoami", "sen kimsin?"],
        ["about", "kısa bir tanıtım"],
        ["ls", "burada neler var"],
        ["projects", "Duly ve Salah[Now]"],
        ["open <ad>", "duly, salah, x, instagram, youtube, github, blog, ask aç"],
        ["ask <soru>", "yapay zekâ profiline soru sor"],
        ["theme <renk>", "parçacıkları renklendir: blue, purple, #ff3366, rainbow…"],
        ["party", "kutla"],
        ["lang <en|tr>", "dili değiştir"],
        ["secrets", "bulduğun sırları gör"],
        ["clear", "ekranı temizle"],
        ["exit", "terminali kapat"],
      ],
      whoami: "ziyaretçi. Gizli bir terminal bulacak kadar meraklı. Saygılar. 🫡",
      about:
        "Ömer Balkan (BLCNYY). İstanbul'dan bir vibe-coder ve teknoloji meraklısı; Duly ve Salah[Now] üzerinde çalışıyor, teknoloji ve yapay zekâ hakkında yazıyor.",
      ls: "projects/   articles/   story.md   secrets.txt",
      notFound: (command: string) =>
        `zsh: komut bulunamadı: ${command}. 'help' yazmayı dene.`,
      askUsage: "Kullanım: ask <soru>",
      asking: "düşünüyor…",
      askFailed: "Yapay zekâ profili şu an yanıt veremedi.",
      sudo: "İyi denemeydi. Bu olay raporlanacak. 👀",
      rmrf: [
        "/System siliniyor…",
        "/Users/visitor/ödevler siliniyor…",
        "/node_modules siliniyor (biraz sürebilir)…",
        "blcnyy.dev siliniyor…",
      ],
      rmrfEnd: "Şaka şaka. Her şey yolunda. 😄",
      opening: (target: string) => `${target} açılıyor…`,
      openUsage: "Kullanım: open <duly|salah|x|instagram|youtube|github|blog|ask>",
      themeUsage:
        "Kullanım: theme <renk>. blue, purple, pink, matrix, rainbow ya da #ff3366 gibi bir hex kodu dene. 'theme orange' eski haline döndürür.",
      themeTooDark: "Bu renk görünmeyecek kadar koyu. Daha açık bir renk dene.",
      themeSet: (name: string) => `Tema: ${name}.`,
      langUsage: "Kullanım: lang <en|tr>",
      party: "🎉 Parti modu!",
      secretsHeader: (found: number, total: number) =>
        `Bulunan sırlar: ${found}/${total}`,
      secretLocked: "???",
      cat: "'cat story.md' ya da 'cat secrets.txt' dene.",
      secretsFile: "İyi denemeydi. Sırlar okunmaz, bulunur. 🥚",
    },
    snake: {
      title: "SNAKE",
      start: "Başlamak için Space'e bas",
      controls: "Ok tuşları ya da WASD · Çıkmak için Esc",
      score: "Skor",
      best: "En iyi",
      gameOver: "Oyun bitti",
      restart: "Tekrar oynamak için Space'e bas",
    },
    shipIt: {
      title: "SHIP IT",
      tagline: "Bug'lardan kaç. Production'a çıkar.",
      start: "Başlamak için Space'e bas ya da dokun",
      controls: "Fare, ok tuşları ya da parmağınla hareket et · Çıkmak için Esc",
      score: "Yayınlanan",
      best: "En iyi",
      deployed: (version: number) => `v${version}.0 yayında 🚀`,
      failed: "Build başarısız ❌",
      restart: "Tekrar denemek için Space'e bas ya da dokun",
      close: "Oyunu kapat",
    },
    runaway: {
      prompt: "Ya da kaçan sayfayı yakala.",
      caught: "Yakaladın! Seni ana sayfaya götürüyorum…",
      label: "kayip-sayfa.html",
    },
  },
  api: {
    crossSite: "Başka sitelerden gelen isteklere izin verilmiyor.",
    tooManyQuestions:
      "Bu bağlantıdan çok fazla soru geldi. Biraz bekleyip tekrar dene.",
    tooManySpeech:
      "Bu bağlantıdan çok fazla sesli yanıt isteği geldi. Biraz bekleyip tekrar dene.",
    badJson: "message alanı olan bir JSON gönder.",
    badSpeechJson: "text alanı olan bir JSON gönder.",
    tooLong: (max: number) => `Lütfen mesajını en fazla ${max} karakterle sınırla.`,
    speechTooLong: (max: number) => `Lütfen metni en fazla ${max} karakterle sınırla.`,
    emptyMessage: "Göndermeden önce bir soru yaz.",
    emptySpeech: "Sesli okunacak bir yanıt henüz yok.",
    notConfigured:
      "Asistan henüz yapılandırılmamış. Sunucuya OPENROUTER_API_KEY ekle.",
    speechNotConfigured:
      "Sesli okuma henüz yapılandırılmamış. Sunucuya OPENROUTER_API_KEY ekle.",
    unsignedSpeech:
      "Yalnızca Sor bölümündeki yanıtlar sesli okunabilir. Dinlemek için soruyu tekrar sor.",
    modelError: "Yapay zekâ modeline ulaşılamadı. Biraz sonra tekrar dene.",
    startFailed: "Asistan yanıt vermeye başlayamadı. Lütfen tekrar dene.",
    interrupted: "Yanıt gelirken bağlantı kesildi. Lütfen tekrar dene.",
    speechError: "Bu yanıt için ses oluşturulamadı. Biraz sonra tekrar dene.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, tr };

export const getDictionary = (locale: Locale) => dictionaries[locale];
