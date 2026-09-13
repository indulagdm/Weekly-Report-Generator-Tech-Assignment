const aiService = require('../services/ai.service');
const { ok } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/ai/status - lets the frontend know whether to show the chat
// widget as active or as a "not configured yet" placeholder.
const status = asyncHandler(async (req, res) => {
  ok(res, { configured: aiService.isConfigured() });
});

// POST /api/ai/chat { message } - manager-only. Foundation only: returns
// a clear 501 until ANTHROPIC_API_KEY is set. See ai.service.js for the
// commented-out real implementation to fill in once a key is purchased.
const chat = asyncHandler(async (req, res) => {
  const reply = await aiService.chat(req.body.message);
  ok(res, { reply });
});

module.exports = { status, chat };
