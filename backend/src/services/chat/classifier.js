// Cheap, deterministic text signals used in both AI and fallback modes:
// language detection, escalation triggers, and a coarse topic for analytics.

const DEVANAGARI = /[ऀ-ॿ]/;
const HINGLISH = /\b(kya|kaise|kaisa|hai|hain|mujhe|muje|chahiye|kitna|kitne|kab|kahan|bhav|bhaav|daam|kabaad|kabad|raddi|bechna|becho|aap|apka|aapka|mera|meri|nahi|nahin|haan|bhai|karo|karna|batao|bataiye|aur|milega|milenge|kitni|hoga|wala|ka|ki|ke|ko)\b/i;

function detectLanguage(text) {
  if (DEVANAGARI.test(text)) return 'hi';
  const hits = (String(text).match(new RegExp(HINGLISH.source, 'gi')) || []).length;
  return hits >= 2 ? 'hi' : 'en';
}

const HUMAN_RE =
  /\b(human|real person|agent|representative|executive|customer care|support team|call me|talk to (a |some)?(person|human|someone|team)|insaan|kisi se baat|manager)\b|इंसान|एजेंट|किसी से बात|कस्टमर केयर/i;
const ANGRY_RE =
  /\b(fraud|cheat(ed|ing)?|scam|worst|useless|pathetic|terrible|horrible|angry|furious|disgusting|rubbish|nonsense|bakwas|bekaar|bekar|ghatiya|chor|dhokha)\b|धोखा|बकवास|घटिया|बेकार|चोर/i;

function detectEscalation(text) {
  const t = String(text);
  if (HUMAN_RE.test(t)) return 'user_request';
  const letters = t.replace(/[^A-Za-z]/g, '');
  const shouting = letters.length >= 12 && letters === letters.toUpperCase();
  if (ANGRY_RE.test(t) || /!{3,}/.test(t) || shouting) return 'frustration';
  return null;
}

const TOPICS = [
  // Checked before tracking: "cancel SM-2026-000001" is a cancel, not a status check.
  ['cancel_reschedule', /\b(cancel\w*|reschedul\w*|change (the )?(date|time|slot)|postpone)\b|रद्द|बदल/i],
  ['tracking', /\b(track\w*|status|where is|kab aayega|kahan hai|arriv\w*|on the way|collector)\b|SM-\d{4}-\d{6}|ट्रैक|कहाँ/i],
  ['payment', /\b(pay|payment|paid|upi|cash|bank|refund|money|paisa|paise|wallet|receipt)\b|पैसे|भुगतान|रसीद/i],
  ['booking', /\b(book|schedule|pickup chahiye|pick up|pickup)\b|बुक/i],
  ['rates', /\b(rate|rates|price|prices|bhav|bhaav|daam|kitna|how much|worth|estimate|value)\b|भाव|रेट|कीमत|दाम/i],
  ['catalog', /\b(what can i sell|what do you (buy|accept|take)|items|categories|accept)\b|क्या बेच/i],
  ['service_area', /\b(city|cities|area|areas|serviceable|available in|pin ?code|location)\b|शहर|इलाका/i],
  ['time_slots', /\b(slot|slots|timing|timings|what time|samay)\b|समय/i],
  ['account', /\b(login|log in|password|account|register|sign ?up|otp|profile|address)\b|पासवर्ड|खाता/i],
  ['greeting', /^\s*(hi+|hello|hey|namaste|namaskar|good (morning|afternoon|evening))\b|नमस्ते|नमस्कार/i],
];

function classifyTopic(text) {
  for (const [topic, re] of TOPICS) if (re.test(text)) return topic;
  return 'other';
}

const PICKUP_ID_RE = /\bSM-\d{4}-\d{6}\b/i;

function extractPickupId(text) {
  const m = String(text).match(PICKUP_ID_RE);
  return m ? m[0].toUpperCase() : null;
}

module.exports = { detectLanguage, detectEscalation, classifyTopic, extractPickupId, PICKUP_ID_RE };
