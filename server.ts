import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Step 1: Fetch URL content using Gemini's urlContext tool if input is a single URL
  app.post('/api/fetch-url', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "Couldn't read that link. Paste the text instead." });
      }

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Read the web page at ${url} and return its main text only, verbatim, without summarizing or adding commentary. If the page cannot be read or accessed, return exactly "FETCH_FAILED".`,
        config: {
          tools: [{ urlContext: {} }],
        },
      });

      const fetchedText = (response.text || '').trim();
      if (
        !fetchedText ||
        fetchedText === 'FETCH_FAILED' ||
        fetchedText.length < 25 ||
        fetchedText.toLowerCase().includes('i cannot access') ||
        fetchedText.toLowerCase().includes('unable to access')
      ) {
        return res.status(422).json({
          error: "Couldn't read that link. Paste the text instead.",
        });
      }

      res.json({ text: fetchedText });
    } catch (_err) {
      res.status(422).json({
        error: "Couldn't read that link. Paste the text instead.",
      });
    }
  });

  // Step 2: Single Gemini call with structured JSON output to split and check all claims
  app.post('/api/check-answer', async (req, res) => {
    try {
      const { source, answer } = req.body;
      if (!source || !answer) {
        return res.status(400).json({ error: 'Both source and AI answer are required.' });
      }

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Check the AI's answer against the provided source text.

Instructions:
1. Split the AI's answer into individual atomic claims.
2. Judge each claim ONLY against the provided source text. Never use outside knowledge.
3. Give each claim a verdict:
   - "correct": the source supports the claim (including accurate paraphrases).
   - "wrong": the source contradicts the claim (e.g., wrong number, opposite fact, or contradicts safety limits).
   - "not in source": the source does not mention the claim. Do not guess.
   - "unclear": the claim is too vague or open to interpretation.
4. For "correct" and "wrong" verdicts, copy an evidence_quote VERBATIM (exact character-for-character substring) from the source. For "not in source" or "unclear", copy the closest relevant quote from the source if any exists, or leave as an empty string "".
5. Give a one-sentence reason in simple, everyday language.
6. Set logic_problem = true if the claim does not logically follow from earlier statements or the source.
7. Set unsafe = true if the claim gives risky or dangerous advice (medical dosage, legal, financial, safety).
8. Give confidence: "high", "medium", or "low".
9. Write a concise one-line overall_summary of the audit findings.

SOURCE TEXT:
"""
${source}
"""

AI'S ANSWER:
"""
${answer}
"""`,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              claims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'Unique claim ID like claim-1' },
                    claim_text: { type: Type.STRING, description: 'Clear statement of the individual claim' },
                    answer_excerpt: {
                      type: Type.STRING,
                      description: 'Exact verbatim substring from the AI answer for highlighting',
                    },
                    verdict: {
                      type: Type.STRING,
                      enum: ['correct', 'wrong', 'not in source', 'unclear'],
                    },
                    evidence_quote: {
                      type: Type.STRING,
                      description: 'Exact verbatim quote copied directly from the source text',
                    },
                    reason: {
                      type: Type.STRING,
                      description: 'One-sentence explanation in simple language',
                    },
                    logic_problem: {
                      type: Type.BOOLEAN,
                      description: 'True if the claim does not logically follow from earlier statements or the source',
                    },
                    unsafe: {
                      type: Type.BOOLEAN,
                      description: 'True if the claim contains risky medical, legal, financial, or safety advice',
                    },
                    confidence: {
                      type: Type.STRING,
                      enum: ['high', 'medium', 'low'],
                    },
                  },
                  required: [
                    'id',
                    'claim_text',
                    'answer_excerpt',
                    'verdict',
                    'evidence_quote',
                    'reason',
                    'logic_problem',
                    'unsafe',
                    'confidence',
                  ],
                },
              },
              overall_summary: {
                type: Type.STRING,
                description: 'One-line summary of the overall audit result',
              },
            },
            required: ['claims', 'overall_summary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('403') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
        return res.status(403).json({
          error: 'API key error. Please check your key in the Settings > Secrets panel.',
        });
      }
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          error: 'Rate limit reached (429). Please wait a moment and try again.',
        });
      }
      res.status(500).json({
        error: 'Failed to check the answer with Gemini. Please try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Second Opinion server listening on http://localhost:${PORT}`);
  });
}

startServer();
