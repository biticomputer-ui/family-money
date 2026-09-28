'use server';

import { z } from 'zod';

const AiActionSchema = z.object({
  actions: z.array(z.discriminatedUnion('type', [
    z.object({
      type: z.literal('expense'),
      amount: z.number(),
      description: z.string(),
      category: z.string().optional()
    }),
    z.object({
      type: z.literal('income'),
      amount: z.number(),
      description: z.string()
    }),
    z.object({
      type: z.literal('pay_obligation'),
      amount: z.number(),
      obligationId: z.string()
    })
  ]))
});

export type AiStructuredActions = z.infer<typeof AiActionSchema>;

export async function parseExpenseWithAI(
  userInput: string, 
  pendingObligations: { id: string; title: string; amount: number }[]
): Promise<AiStructuredActions> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable");

  const systemPrompt = `You are a financial assistant.
User inputs natural language text about expenses or bill payments.
Extract structured commands.

Rules:
1. "expense": Standard spending. Amount must be a positive number. Description should be short in Vietnamese (e.g., "Phở", "Trà sữa").
2. "pay_obligation": If the user says they paid a bill matching one of these pending obligations:
${JSON.stringify(pendingObligations)}
Extract the obligationId. The amount is optional if it matches exactly, but include it if they specify it.
3. Return valid JSON exactly matching the schema. No markdown ticks.`;

  const schemaJson = `{
  "type": "object",
  "properties": {
    "actions": {
      "type": "array",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["expense"] },
              "amount": { "type": "number" },
              "description": { "type": "string" },
              "category": { "type": "string" }
            },
            "required": ["type", "amount", "description"]
          },
          {
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["pay_obligation"] },
              "amount": { "type": "number" },
              "obligationId": { "type": "string" }
            },
            "required": ["type", "amount", "obligationId"]
          }
        ]
      }
    }
  },
  "required": ["actions"]
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\nUser Input: " + userInput }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: JSON.parse(schemaJson)
      }
    })
  });

  const resJson = await response.json();
  const text = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Không thể xử lý yêu cầu. Vui lòng thử lại.");
  }

  const parsed = JSON.parse(text);
  return AiActionSchema.parse(parsed);
}

import { cookies } from 'next/headers';

export async function getLegacyData() {
  const cookieStore = await cookies();
  const legacyCookie = cookieStore.get('family_money_data');
  if (!legacyCookie || !legacyCookie.value) return null;
  
  try {
    const data = JSON.parse(legacyCookie.value);
    return data;
  } catch {
    return null;
  }
}

export async function clearLegacyCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('family_money_data');
}
