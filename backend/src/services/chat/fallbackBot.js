// Rule-based assistant used when ANTHROPIC_API_KEY is missing or the API fails.
// It answers the common questions from real DB data through the same tool
// executors the AI uses, so permissions behave identically in both modes.
const ScrapCategory = require('../../models/ScrapCategory');
const ScrapItem = require('../../models/ScrapItem');
const { runTool } = require('./tools');
const { classifyTopic, extractPickupId } = require('./classifier');
const { findItemsInText, pickCity } = require('./catalog');

const T = {
  en: {
    greeting:
      "Hi! I'm the ScrapMate Assistant. I can check scrap rates, estimate your payout, help you book or track a pickup, and answer payment questions. What would you like to do?",
    ratesFor: (city) => `Here are the current indicative rates in **${city}**. The final amount depends on actual weight at pickup.`,
    ratesNone: (city) => `I couldn't find rates for that in **${city}**. You can see the full list on the [rates page](/rates).`,
    ratesGeneric: (city) =>
      `Here are some current indicative rates in **${city}**. Tell me an item (e.g. "copper rate") or see the full list on the [rates page](/rates).`,
    estimate: (min, max) =>
      `Your estimated payout is **₹${inr(min)} – ₹${inr(max)}**. This is an estimate; the final amount is based on the actual weight at pickup.`,
    book:
      'Booking takes about a minute: pick your items, add quantities, choose an address and a time slot. Pickup is free.',
    loginNeeded: 'Please log in so I can look up your pickups.',
    noPickups: "You don't have any pickups yet. Would you like to book one?",
    latestPickup: 'Here is your most recent pickup:',
    trackNotFound: (id) => `I couldn't find pickup ${id} on your account. Please check the ID.`,
    askPickupId: 'Which pickup? Here are your recent ones. Reply with the pickup ID (like SM-2026-000123).',
    confirmCancel: (id) => `Do you want to cancel pickup **${id}**? Press **Confirm** below to go ahead.`,
    cannotChange: (msg) => `I can't do that: ${msg}`,
    reschedHelp: (id) =>
      `To reschedule **${id}**, tell me the new date and slot, for example: "reschedule ${id} to 2026-10-12 11:00 AM - 1:00 PM". Available slots:`,
    catalog: (cats) => `We pick up:\n${cats}\n\nAsk me for any item's rate, or book a pickup.`,
    areas: (cities) => `We currently pick up in: **${cities}**. More cities are coming soon.`,
    slots: (date, slots) => `Pickup slots for ${date}:\n${slots}`,
    faq: (q, a) => `**${q}**\n\n${a}`,
    payment:
      'You can be paid by **cash, UPI or bank transfer** right after the collector weighs your scrap. A digital receipt is created for every completed pickup.',
    unknown:
      "Sorry, I didn't quite get that. I can help with scrap rates, estimates, booking, tracking a pickup, and payments. You can also talk to our team on WhatsApp.",
  },
  hi: {
    greeting:
      'नमस्ते! मैं ScrapMate असिस्टेंट हूँ। मैं कबाड़ के रेट, अनुमानित कीमत, पिकअप बुक या ट्रैक करने और भुगतान से जुड़े सवालों में मदद कर सकता हूँ। आप क्या करना चाहेंगे?',
    ratesFor: (city) => `**${city}** में अभी के अनुमानित रेट ये हैं। अंतिम राशि पिकअप पर असली वज़न से तय होगी।`,
    ratesNone: (city) => `**${city}** में इसका रेट नहीं मिला। पूरी सूची [रेट पेज](/rates) पर देखें।`,
    ratesGeneric: (city) =>
      `**${city}** के कुछ मौजूदा अनुमानित रेट ये हैं। किसी आइटम का नाम बताइए (जैसे "तांबा रेट") या पूरी सूची [रेट पेज](/rates) पर देखें।`,
    estimate: (min, max) =>
      `आपकी अनुमानित कमाई **₹${inr(min)} – ₹${inr(max)}** है। यह सिर्फ़ अनुमान है; अंतिम राशि पिकअप पर असली वज़न से तय होगी।`,
    book: 'बुकिंग में लगभग एक मिनट लगता है: आइटम चुनें, मात्रा डालें, पता और समय चुनें। पिकअप मुफ़्त है।',
    loginNeeded: 'अपने पिकअप देखने के लिए कृपया लॉग इन करें।',
    noPickups: 'आपका अभी कोई पिकअप नहीं है। क्या आप एक बुक करना चाहेंगे?',
    latestPickup: 'आपका सबसे हाल का पिकअप:',
    trackNotFound: (id) => `आपके खाते में पिकअप ${id} नहीं मिला। कृपया ID जाँच लें।`,
    askPickupId: 'कौन सा पिकअप? आपके हाल के पिकअप ये हैं। पिकअप ID भेजें (जैसे SM-2026-000123)।',
    confirmCancel: (id) => `क्या आप पिकअप **${id}** रद्द करना चाहते हैं? आगे बढ़ने के लिए नीचे **Confirm** दबाएँ।`,
    cannotChange: (msg) => `यह नहीं हो सकता: ${msg}`,
    reschedHelp: (id) =>
      `**${id}** का समय बदलने के लिए नई तारीख और स्लॉट बताइए, जैसे: "reschedule ${id} to 2026-10-12 11:00 AM - 1:00 PM"। उपलब्ध स्लॉट:`,
    catalog: (cats) => `हम ये चीज़ें लेते हैं:\n${cats}\n\nकिसी भी आइटम का रेट पूछें या पिकअप बुक करें।`,
    areas: (cities) => `हम अभी इन शहरों में पिकअप करते हैं: **${cities}**।`,
    slots: (date, slots) => `${date} के पिकअप स्लॉट:\n${slots}`,
    faq: (q, a) => `**${q}**\n\n${a}`,
    payment:
      'कलेक्टर के वज़न करने के तुरंत बाद आपको **कैश, UPI या बैंक ट्रांसफ़र** से भुगतान मिलता है। हर पूरे पिकअप की डिजिटल रसीद बनती है।',
    unknown:
      'माफ़ कीजिए, मैं समझ नहीं पाया। मैं रेट, अनुमान, बुकिंग, पिकअप ट्रैकिंग और भुगतान में मदद कर सकता हूँ। आप WhatsApp पर हमारी टीम से भी बात कर सकते हैं।',
  },
};

const inr = (n) => Math.round(n).toLocaleString('en-IN');

const QTY_RE = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|किलो|pcs|pieces?|piece|nos|units?)?/i;

function bulletList(lines) {
  return lines.map((l) => `- ${l}`).join('\n');
}

function isoDateFromText(text) {
  const m = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (m) return m[1];
  const d = new Date();
  if (/\b(tomorrow|kal)\b|कल/i.test(text)) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// "10 kg newspaper and 2 fridge" -> [{ item: 'Newspaper', quantity: 10 }, ...]
async function parseQuantities(text) {
  const parts = text.split(/,|\band\b|\baur\b|और|\+|;/i);
  const out = [];
  for (const part of parts) {
    const q = part.match(QTY_RE);
    if (!q) continue;
    const items = await findItemsInText(part);
    if (items.length) out.push({ item: items[0].name, quantity: Number(q[1]) });
  }
  return out;
}

async function reply({ text, lang, ctx }) {
  const t = T[lang] || T.en;
  const topic = classifyTopic(text);
  const pickupId = extractPickupId(text);
  const say = (content, extra = {}) => ({ text: content, topic, failed: false, ...extra });

  // Specific pickup questions (track / cancel / reschedule)
  if (topic === 'cancel_reschedule') {
    if (!ctx.user) {
      ctx.cards.push({ type: 'login' });
      return say(t.loginNeeded);
    }
    if (!pickupId) {
      await runTool('get_my_pickups', {}, ctx);
      return say(t.askPickupId);
    }
    if (/reschedul|change|postpone|बदल/i.test(text)) {
      const slotMatch = text.match(/\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M/i);
      const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
      if (slotMatch && dateMatch) {
        const { result } = await runTool(
          'reschedule_pickup',
          { pickup_id: pickupId, date: dateMatch[0], slot: slotMatch[0].replace(/\s+/g, ' ').replace(/\s*-\s*/, ' - ') },
          ctx
        );
        if (result.error) return say(t.cannotChange(result.message));
        return say(lang === 'hi' ? 'नीचे **Confirm** दबाकर नया समय पक्का करें।' : 'Press **Confirm** below to move your pickup.');
      }
      const { result } = await runTool('get_time_slots', { date: isoDateFromText(text) }, ctx);
      return say(`${t.reschedHelp(pickupId)}\n${bulletList(result.slots || [])}`);
    }
    const { result } = await runTool('cancel_pickup', { pickup_id: pickupId }, ctx);
    if (result.error) return say(t.cannotChange(result.message));
    return say(t.confirmCancel(pickupId));
  }

  if (topic === 'tracking' || pickupId) {
    if (!ctx.user) {
      ctx.cards.push({ type: 'login' });
      return say(t.loginNeeded);
    }
    if (pickupId) {
      const { result } = await runTool('track_pickup', { pickup_id: pickupId }, ctx);
      if (result.error) return say(t.trackNotFound(pickupId));
      return say(lang === 'hi' ? `**${pickupId}** की ताज़ा स्थिति:` : `Here's the latest on **${pickupId}**:`);
    }
    const { result } = await runTool('get_my_pickups', {}, ctx);
    if (!result.pickups?.length) {
      ctx.cards.push({ type: 'link', label: lang === 'hi' ? 'पिकअप बुक करें' : 'Book a pickup', to: '/schedule-pickup' });
      return say(t.noPickups);
    }
    // Show the most relevant one as a tracking card instead of the whole list.
    ctx.cards.length = 0;
    const active = result.pickups.find((p) => !['COMPLETED', 'CANCELLED'].includes(p.status)) || result.pickups[0];
    ctx.cards.push({ type: 'tracking', pickup: active });
    return say(t.latestPickup);
  }

  // Item + quantity => estimate (checked before generic rates)
  const city = await pickCity(text, ctx.defaultCity);
  const quantities = /\d/.test(text) ? await parseQuantities(text) : [];
  if (quantities.length && ['rates', 'booking', 'other', 'catalog'].includes(topic)) {
    const { result } = await runTool('estimate_value', { items: quantities, city }, ctx);
    if (result.lines?.length) return say(t.estimate(result.totalMin, result.totalMax), { topic: 'rates' });
  }

  const mentioned = await findItemsInText(text);
  if (topic === 'rates' || (mentioned.length && ['other', 'catalog'].includes(topic))) {
    if (mentioned.length) {
      const before = ctx.cards.length;
      const lines = [];
      for (const item of mentioned.slice(0, 4)) {
        const { result } = await runTool('get_scrap_rates', { city, search: item.name }, ctx);
        lines.push(...(result.rates || []));
      }
      // Merge into one rates card.
      ctx.cards.splice(before);
      if (!lines.length) return say(t.ratesNone(city), { topic: 'rates' });
      ctx.cards.push({ type: 'rates', city, rates: lines.slice(0, 8), more: 0 });
      return say(t.ratesFor(city), { topic: 'rates' });
    }
    const { result } = await runTool('get_scrap_rates', { city }, ctx);
    if (!result.rates?.length) return say(t.ratesNone(city), { topic: 'rates' });
    return say(t.ratesGeneric(city), { topic: 'rates' });
  }

  if (topic === 'booking') {
    ctx.cards.push({ type: 'link', label: lang === 'hi' ? 'पिकअप बुक करें' : 'Book a pickup', to: '/schedule-pickup' });
    return say(t.book);
  }

  if (topic === 'catalog') {
    const categories = await ScrapCategory.find({ isActive: true }).sort({ name: 1 }).lean();
    const lines = [];
    for (const c of categories) {
      const items = await ScrapItem.find({ category: c._id, isActive: true }).limit(6).lean();
      lines.push(`**${c.name}**: ${items.map((i) => i.name).join(', ')}`);
    }
    ctx.cards.push({ type: 'link', label: lang === 'hi' ? 'सभी रेट देखें' : 'See all rates', to: '/rates' });
    return say(t.catalog(bulletList(lines)));
  }

  if (topic === 'service_area') {
    const { result } = await runTool('get_service_areas', {}, ctx);
    return say(t.areas(result.cities.join(', ')));
  }

  if (topic === 'time_slots') {
    const date = isoDateFromText(text);
    const { result } = await runTool('get_time_slots', { date }, ctx);
    return say(t.slots(date, bulletList(result.slots || [])));
  }

  if (topic === 'greeting' && text.trim().split(/\s+/).length <= 4) return say(t.greeting);

  // Admin-editable FAQ before giving up.
  const { result: faq } = await runTool('get_faq', { topic: text }, ctx);
  if (faq.faqs?.length) return say(t.faq(faq.faqs[0].question, faq.faqs[0].answer));

  if (topic === 'payment') return say(t.payment);
  if (topic === 'greeting') return say(t.greeting);

  return { text: t.unknown, topic, failed: true };
}

module.exports = { reply, T };
