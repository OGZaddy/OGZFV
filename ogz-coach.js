// ogz-coach-mcp.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export function mountCoachMCP(app) {
  app.get('/api/ogz-coach/mcp', async (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    // Send a ping to establish the stream
    res.write('event: welcome\n');
    res.write('data: OGZ Coach ready\n\n');

    // Listen for Claude payloads from MCP
    req.on('data', async chunk => {
      // Parse the incoming SSE chunk
      const line = chunk.toString().trim();
      if (!line.startsWith('data:')) return;
      const payload = JSON.parse(line.replace(/^data:\s*/, ''));

      // Call Claude
      const claudeResp = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY
        },
        body: JSON.stringify({
          model: 'claude-2.1-sonic',
          prompt: `You are OGZPrime Assistant. ${payload.message}`,
          max_tokens_to_sample: 512
        })
      });
      const json = await claudeResp.json();

      // Stream the reply back as an SSE data event
      res.write(`event: message\n`);
      res.write(`data: ${JSON.stringify({ reply: json.completion })}\n\n`);
    });

    // Clean up on client disconnect
    req.on('close', () => {
      res.end();
    });
  });
}
