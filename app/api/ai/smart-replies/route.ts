import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messages, currentUser } = await request.json()

    // Get the last few messages for context
    const recentMessages = messages
      .slice(-5)
      .map((msg: any) => `${msg.sender_name}: ${msg.content}`)
      .join("\n")

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Based on this conversation context, suggest 3 brief, natural reply options for ${currentUser}:

${recentMessages}

Generate 3 short, contextually appropriate replies (max 10 words each). Format as JSON array of strings.`,
      temperature: 0.7,
    })

    // Parse the response to extract suggestions
    let suggestions: string[]
    try {
      suggestions = JSON.parse(text)
    } catch {
      // Fallback if JSON parsing fails
      suggestions = text
        .split("\n")
        .filter((s) => s.trim())
        .slice(0, 3)
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Smart replies error:", error)
    return NextResponse.json({ error: "Failed to generate replies" }, { status: 500 })
  }
}
