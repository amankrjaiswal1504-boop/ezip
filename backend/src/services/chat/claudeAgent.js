const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT } = require('./systemPrompt');
const { TOOL_DEFINITIONS, runTool } = require('./tools');
const { sanitizeForModel } = require('./sanitize');

const DEFAULT_MODEL = 'claude-sonnet-5-5';
const MAX_TOOL_ROUNDS = 6;
const MAX_JSON_RETRIES = 1;

let client = null;

function isAiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 60 * 1000 });
  return client;
}

function buildParams(messages) {
  const params = {
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools: TOOL_DEFINITIONS,
    messages,
    // Caches the stable tools + system prefix (and the conversation so far).
    cache_control: { type: 'ephemeral' },
    // Chat is latency-sensitive and simple; low effort keeps replies quick and cheap.
    output_config: { effort: process.env.ANTHROPIC_EFFORT || 'low' },
  };
  // Server-side refusal fallback (Claude API only). Set ANTHROPIC_FALLBACKS=off
  // when using a model or platform that doesn't support it.
  if (process.env.ANTHROPIC_FALLBACKS !== 'off') {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }
  return params;
}

// Runs one assistant turn: streams text through onText, executes tool calls
// (backed by our own DB, with ownership enforced inside each tool), and loops
// until Claude finishes. Throws Anthropic.APIError on API failure so the caller
// can fall back to the rule-based bot.
async function runClaudeTurn({ history, contextNote, toolCtx, onText, onCard, isAborted }) {
  const anthropic = getClient();
  const messages = [...history, { role: 'system', content: contextNote }];
  let fullText = '';
  let jsonRetries = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    if (isAborted()) break;
    const stream = anthropic.beta.messages.stream(buildParams(messages));
    let roundText = '';
    stream.on('text', (delta) => {
      if (isAborted()) {
        stream.abort();
        return;
      }
      if (!roundText && fullText) onText('\n\n');
      roundText += delta;
      onText(delta);
    });

    let message;
    try {
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      if (isAborted()) break;
      // With eager input streaming, an unparseable tool input rejects here.
      // Retry that turn once; real API errors go to the caller.
      if (err instanceof Anthropic.APIError || jsonRetries >= MAX_JSON_RETRIES) throw err;
      jsonRetries += 1;
      round -= 1;
      continue;
    }

    if (roundText) fullText += (fullText ? '\n\n' : '') + roundText;

    if (message.stop_reason === 'refusal') {
      return { text: fullText, refused: true };
    }
    if (message.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: message.content });
      continue;
    }
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    // A tool call cut off by max_tokens may carry truncated input; don't run it.
    if (!toolUses.length || message.stop_reason === 'max_tokens') break;

    messages.push({ role: 'assistant', content: message.content });
    const results = [];
    for (const toolUse of toolUses) {
      const before = toolCtx.cards.length;
      const { isError, result } = await runTool(toolUse.name, toolUse.input, toolCtx);
      toolCtx.cards.slice(before).forEach(onCard);
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(sanitizeForModel(result)),
        ...(isError ? { is_error: true } : {}),
      });
    }
    // All results for one assistant turn go back in a single user message.
    messages.push({ role: 'user', content: results });
  }

  return { text: fullText, refused: false };
}

module.exports = { runClaudeTurn, isAiEnabled, DEFAULT_MODEL };
