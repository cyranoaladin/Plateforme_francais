import { promises as fs } from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_OCR_PROMPT =
  "Tu es un OCR spécialisé en copies d'élèves français. Transcris fidèlement le texte manuscrit."

type OcrInput = {
  absolutePath?: string
  mimeType: string
  bytes?: Uint8Array | Buffer
}

function toBase64(bytes: Uint8Array | Buffer): string {
  return Buffer.from(bytes).toString('base64')
}

async function resolveBytes(input: OcrInput): Promise<Buffer | null> {
  if (input.bytes !== undefined) {
    return Buffer.from(input.bytes)
  }
  if (input.absolutePath) {
    return fs.readFile(input.absolutePath)
  }
  return null
}

export async function extractTextFromCopie(input: OcrInput): Promise<string> {
  const bytes = await resolveBytes(input)
  if (!bytes) {
    return '[ocr indisponible: input image manquant]'
  }

  const mistralApiKey = process.env.MISTRAL_API_KEY ?? ''
  const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  if (mistralApiKey && supportedMimeTypes.includes(input.mimeType)) {
    const base64 = toBase64(bytes)
    const baseUrl = (process.env.MISTRAL_BASE_URL ?? 'https://api.mistral.ai/v1').replace(/\/$/, '')

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
            [input.mimeType === 'application/pdf' ? 'document_url' : 'image_url']: `data:${input.mimeType};base64,${base64}`,
          },
          include_image_base64: false,
        }),
        signal: AbortSignal.timeout(60_000),
      })

      if (response.ok) {
        const result = (await response.json()) as {
          pages?: Array<{ markdown?: string }>
          text?: string
        }
        const extracted = result.pages?.map((page) => page.markdown ?? '').join('\n\n') ?? result.text ?? ''
        if (extracted.trim().length > 0) {
          return extracted.trim()
        }
      }
    } catch {
      // fallback Gemini below
    }
  }

  return extractTextFromCopieGemini({ ...input, bytes })
}

async function extractTextFromCopieGemini(input: OcrInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? ''
  if (!apiKey) {
    return '[ocr indisponible: GEMINI_API_KEY absente]'
  }

  const bytes = await resolveBytes(input)
  if (!bytes) {
    return '[ocr indisponible: input image manquant]'
  }

  const base64 = toBase64(bytes)
  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({ model: 'gemini-1.5-pro' })

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: GEMINI_OCR_PROMPT },
          {
            inlineData: {
              data: base64,
              mimeType: input.mimeType,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
    },
  })

  return result.response.text().trim()
}
