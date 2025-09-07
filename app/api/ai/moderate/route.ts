import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Analyze this message for inappropriate content (harassment, hate speech, explicit content, spam, threats):

"${content}"

Respond with JSON: {"isAppropriate": true/false, "reason": "brief explanation if inappropriate", "severity": "low/medium/high"}`,
      temperature: 0.1,
    })

    const moderation = JSON.parse(text)
    return NextResponse.json(moderation)
  } catch (error) {
    console.error("Moderation error:", error)
    return NextResponse.json({
      isAppropriate: true,
      reason: "",
      severity: "low",
    })
  }
}
