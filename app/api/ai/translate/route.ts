import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json()

    const { text: translatedText } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Translate the following text to ${targetLanguage}. Only return the translation, no explanations:

${text}`,
      temperature: 0.3,
    })

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
