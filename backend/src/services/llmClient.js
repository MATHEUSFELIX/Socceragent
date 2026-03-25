/*
 * llmClient abstracts away calls to different large language model providers.
 * It supports 'mock', 'openai' and 'anthropic'. When using the mock provider
 * the system returns a static response useful for local testing without API
 * keys. For real providers set `LLM_PROVIDER` in the environment and
 * provide the corresponding API keys in `.env`. The function generate()
 * accepts a prompt string and returns the generated text.
 */

const axios = require('axios');

const provider = process.env.LLM_PROVIDER || 'mock';

async function generate(prompt) {
  if (provider === 'mock') {
    return `Mock analysis for prompt: ${prompt.slice(0, 100)}...`;
  } else if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    const body = {
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful football assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    };
    const res = await axios.post(url, body, { headers });
    return res.data.choices[0].message.content.trim();
  } else if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    const body = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      temperature: 0.7,
      messages: [
        { role: 'user', content: prompt },
      ],
    };
    const res = await axios.post(url, body, { headers });
    return res.data.choices[0].message.content.trim();
  } else {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

module.exports = { generate };