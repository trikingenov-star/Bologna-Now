import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// ─── POST /api/ai/itinerary ───────────────────────────────────────────────────
router.post("/ai/itinerary", async (req, res) => {
  const { items, dateFrom, dateTo, lang = "en" } = req.body as {
    items: Array<{
      id: string;
      title: string;
      type: string;
      timeOfDay: string[];
      eventDate: string;
      lat?: number;
      lng?: number;
    }>;
    dateFrom?: string | null;
    dateTo?: string | null;
    lang?: string;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: "No items provided" });
    return;
  }

  const isItalian = lang === "it";

  // Build items list with date and coords info
  const itemList = items
    .map((i) => {
      const coords = i.lat != null && i.lng != null ? ` coords="${i.lat},${i.lng}"` : "";
      const fixedDate = i.type === "EVENT" ? ` fixedDate="${i.eventDate}"` : "";
      return `id="${i.id}" title="${i.title}" time="${Array.isArray(i.timeOfDay) ? i.timeOfDay.join("/") : i.timeOfDay}"${fixedDate}${coords}`;
    })
    .join("; ");

  // Date handling
  let dateInstruction = "Plan for a single generic day.";
  let dateRangeLabel = "";

  if (dateFrom && dateTo && dateFrom !== dateTo) {
    const from = new Date(dateFrom + "T12:00:00");
    const to = new Date(dateTo + "T12:00:00");
    const dayCount = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    dateInstruction = `Trip: ${dateFrom} to ${dateTo} (${dayCount} days). Spread activities across days. Assign "date":"YYYY-MM-DD" to each block. Activities with fixedDate MUST be placed on that exact date.`;
    dateRangeLabel = isItalian
      ? `${from.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${to.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`
      : `${from.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${to.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  } else if (dateFrom) {
    const from = new Date(dateFrom + "T12:00:00");
    dateInstruction = `Trip date: ${dateFrom}. Activities with fixedDate MUST be on that date. Assign "date":"${dateFrom}" to each block.`;
    dateRangeLabel = isItalian
      ? from.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })
      : from.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  }

  const systemMsg = isItalian
    ? "Sei una guida locale esperta di Bologna. Rispondi SOLO con JSON valido, nessun testo extra, nessun markdown."
    : "You are an expert local Bologna guide. Respond ONLY with valid JSON, no extra text, no markdown.";

  const userMsg = `${dateInstruction}

Activities to schedule: ${itemList}

Ordering rules:
1. Items with fixedDate must be placed on that exact date.
2. Within each day, order items by proximity using coords (if available) — minimize walking distance between consecutive stops.
3. Group by Morning / Afternoon / Evening based on their "time" field.
4. Write a short motivating note per item (max 15 words, ${isItalian ? "in Italian" : "in English"}).

Respond ${isItalian ? "in Italian" : "in English"} with ONLY this JSON:
{"vibe":"one word","intro":"one sentence max 20 words","totalDuration":"Xh","timeBlocks":[{"period":"Morning","startTime":"09:00","items":[{"id":"exact-id-from-input","note":"short tip"}]}]}

CRITICAL: use ONLY the exact id values from the input. Skip empty periods.`;

  try {
    req.log.info({ itemCount: items.length, lang, dateFrom, dateTo }, "AI itinerary request");

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      max_completion_tokens: 8192,
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";
    req.log.info(
      { finish_reason: completion.choices[0]?.finish_reason, contentLength: rawContent.length },
      "AI itinerary response"
    );

    if (!rawContent.trim()) {
      req.log.error("AI itinerary: empty content returned");
      res.json({ success: false, error: "AI returned empty response" });
      return;
    }

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ rawContent }, "AI itinerary: no JSON in response");
      res.json({ success: false, error: "AI response format invalid" });
      return;
    }

    const itinerary = JSON.parse(jsonMatch[0]);
    itinerary.timeBlocks = (itinerary.timeBlocks ?? []).filter(
      (b: { items: unknown[] }) => Array.isArray(b.items) && b.items.length > 0
    );
    if (dateRangeLabel) itinerary.dateRange = dateRangeLabel;

    res.json({ success: true, itinerary });
  } catch (err) {
    req.log.error({ err }, "AI itinerary failed");
    res.json({ success: false, error: "AI service unavailable" });
  }
});

// ─── POST /api/ai/activity-detail ────────────────────────────────────────────
router.post("/ai/activity-detail", async (req, res) => {
  const { item, lang = "en" } = req.body as {
    item: {
      id: string;
      title: string;
      shortText: string;
      whyThisPick: string;
      type: string;
      timeOfDay: string[];
      badges: string[];
    };
    lang?: string;
  };

  if (!item) {
    res.status(400).json({ success: false, error: "No item provided" });
    return;
  }

  const isItalian = lang === "it";

  const systemMsg = isItalian
    ? "Sei una guida esperta di Bologna. Rispondi SOLO con JSON valido, nessun markdown."
    : "You are an expert Bologna guide. Respond ONLY with valid JSON, no markdown.";

  const userMsg = `Activity: "${item.title}" (${item.type})
Tags: ${Array.isArray(item.badges) ? item.badges.join(", ") : item.badges}
Best time: ${Array.isArray(item.timeOfDay) ? item.timeOfDay.join(", ") : item.timeOfDay}
Description: ${item.shortText}

Respond ${isItalian ? "in Italian" : "in English"} with:
{"description":"3-4 sentences vivid immersive experience, max 80 words","duration":"visit duration","localTips":["tip1","tip2","tip3"],"bestTime":"best time and why"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      max_completion_tokens: 800,
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";

    if (!rawContent.trim()) {
      res.json({ success: false, error: "AI returned empty response" });
      return;
    }

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.json({ success: false, error: "Invalid AI response" });
      return;
    }

    const detail = JSON.parse(jsonMatch[0]);
    res.json({ success: true, detail });
  } catch (err) {
    req.log.error({ err }, "AI activity detail failed");
    res.json({ success: false, error: "AI service unavailable" });
  }
});

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────
router.post("/ai/chat", async (req, res) => {
  const { messages, context, lang = "en" } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: {
      profile?: { travelStyle?: string; interests?: string[]; budget?: string };
      activities?: Array<{ id: string; title: string; type: string; category: string[] }>;
      savedItems?: Array<{ id: string; title: string }>;
    };
    lang?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: "No messages provided" });
    return;
  }

  const isItalian = lang === "it";

  const activityList = context?.activities
    ?.map((a) => `${a.title} (${a.category.slice(0, 2).join("/")})`)
    .join(", ") ?? "";

  const savedList = context?.savedItems?.map((i) => i.title).join(", ") ?? "";

  const profileInfo = context?.profile
    ? `Traveling: ${context.profile.travelStyle || "solo"}; Interests: ${(context.profile.interests ?? []).join(", ") || "general"}`
    : "";

  const systemMsg = isItalian
    ? `Sei Bolo, una guida AI simpatica ed esperta di Bologna. Hai una personalità calda, entusiasta e locale. Rispondi in italiano, in modo conversazionale e breve (max 3 frasi). Sei come un amico bolognese che conosce tutti i segreti della città.

Profilo utente: ${profileInfo}
Attività disponibili: ${activityList || "varie attività a Bologna"}
Attività nel suo itinerario: ${savedList || "nessuna ancora"}`
    : `You are Bolo, a warm, enthusiastic AI guide to Bologna, Italy. You have a friendly local personality. Reply in English, conversationally and briefly (max 3 sentences). You're like a Bolognese friend who knows all the city's secrets.

User profile: ${profileInfo}
Activities available: ${activityList || "various Bologna activities"}
Activities in their itinerary: ${savedList || "none yet"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemMsg },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      max_completion_tokens: 8192,
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content ?? "";

    req.log.info(
      { finish_reason: choice?.finish_reason, contentLength: content.length },
      "AI chat response"
    );

    if (!content.trim()) {
      req.log.warn({ choice }, "AI chat returned empty content");
      res.json({ success: false, error: "Empty response" });
      return;
    }
    res.json({ success: true, message: content });
  } catch (err) {
    req.log.error({ err }, "AI chat failed");
    res.json({ success: false, error: "AI service unavailable" });
  }
});

export default router;
