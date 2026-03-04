import { promises as fs } from 'fs';

type OcrInput = {
  absolutePath?: string;
  mimeType: string;
  bytes?: Uint8Array | Buffer;
};

function toBase64(bytes: Uint8Array | Buffer): string {
  return Buffer.from(bytes).toString('base64');
}

async function resolveBytes(input: OcrInput): Promise<Buffer | null> {
  if (input.bytes !== undefined) {
    return Buffer.from(input.bytes);
  }
  if (input.absolutePath) {
    return fs.readFile(input.absolutePath);
  }
  return null;
}

async function extractTextFromCopieViaPixtral(input: OcrInput, bytes: Buffer): Promise<string> {
  const pixtralMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!pixtralMimeTypes.includes(input.mimeType)) {
    return '[ocr pixtral: mime type non supporte]';
  }

  const mistralApiKey = process.env.MISTRAL_API_KEY ?? '';
  if (!mistralApiKey) {
    return '[ocr indisponible: MISTRAL_API_KEY absente — configurez la variable d environnement]';
  }

  const base64 = Buffer.from(bytes).toString('base64');
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mistralApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_PIXTRAL_MODEL ?? 'pixtral-12b-2409',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcris fidelement ce document manuscrit ou tapuscrit. Retourne uniquement le texte, sans commentaire.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${input.mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    return `[ocr pixtral: erreur serveur ${response.status}]`;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? '[ocr pixtral: reponse vide]';
}

export async function extractTextFromCopie(input: OcrInput): Promise<string> {
  const bytes = await resolveBytes(input);
  if (!bytes) {
    return '[ocr indisponible: input image manquant]';
  }

  const mistralApiKey = process.env.MISTRAL_API_KEY ?? '';
  const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (mistralApiKey && supportedMimeTypes.includes(input.mimeType)) {
    const base64 = toBase64(bytes);
    const baseUrl = (process.env.MISTRAL_BASE_URL ?? 'https://api.mistral.ai/v1').replace(/\/$/, '');

    try {
      const response = await fetch(`${baseUrl}/ocr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.MISTRAL_OCR_MODEL ?? 'mistral-ocr-latest',
          document: {
            type: input.mimeType === 'application/pdf' ? 'document_url' : 'image_url',
            [input.mimeType === 'application/pdf' ? 'document_url' : 'image_url']:
              `data:${input.mimeType};base64,${base64}`,
          },
          include_image_base64: false,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (response.ok) {
        const result = (await response.json()) as {
          pages?: Array<{ markdown?: string }>;
          text?: string;
        };
        const extracted = result.pages?.map((page) => page.markdown ?? '').join('\n\n') ?? result.text ?? '';
        if (extracted.trim().length > 0) {
          return extracted.trim();
        }
      }
    } catch {
      // fallback pixtral below
    }
  }

  return extractTextFromCopieViaPixtral(input, bytes);
}
