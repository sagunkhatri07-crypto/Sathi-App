import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    const conversation = messages.map((msg: any) => `${msg.sender_name}: ${msg.content}`).join("\n")

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `Summarize this conversation in 2-3 sentences, highlighting key topics and decisions:

${conversation}`,
      temperature: 0.3,
    })

    return NextResponse.json({ summary: text })
  } catch (error) {
    console.error("Summarization error:", error)
    return NextResponse.json({ error: "Summarization failed" }, { status: 500 })
  }
}
