"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Languages, FileText } from "lucide-react"

interface AIFeaturesProps {
  onSmartReply: (reply: string) => void
  onTranslate: (text: string, language: string) => void
  onSummarize: () => void
  messages: any[]
  currentUser: string
}

export function AIFeatures({ onSmartReply, onTranslate, onSummarize, messages, currentUser }: AIFeaturesProps) {
  const [smartReplies, setSmartReplies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const generateSmartReplies = async () => {
    if (messages.length === 0) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/smart-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, currentUser }),
      })

      const { suggestions } = await response.json()
      setSmartReplies(suggestions || [])
    } catch (error) {
      console.error("Failed to generate smart replies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const translateMessage = async (text: string, language: string) => {
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: language }),
      })

      const { translatedText } = await response.json()
      onTranslate(text, translatedText)
    } catch (error) {
      console.error("Translation failed:", error)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 border-t border-border/50">
      {/* Smart Replies */}
      <Button
        variant="ghost"
        size="sm"
        onClick={generateSmartReplies}
        disabled={isLoading || messages.length === 0}
        className="text-xs"
      >
        <Sparkles className="w-3 h-3 mr-1" />
        Smart Reply
      </Button>

      {/* Translation */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs">
            <Languages className="w-3 h-3 mr-1" />
            Translate
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => translateMessage(messages[messages.length - 1]?.content || "", "Spanish")}>
            To Spanish
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translateMessage(messages[messages.length - 1]?.content || "", "French")}>
            To French
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translateMessage(messages[messages.length - 1]?.content || "", "German")}>
            To German
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => translateMessage(messages[messages.length - 1]?.content || "", "Japanese")}>
            To Japanese
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Summarize */}
      <Button variant="ghost" size="sm" onClick={onSummarize} disabled={messages.length < 5} className="text-xs">
        <FileText className="w-3 h-3 mr-1" />
        Summarize
      </Button>

      {/* Smart Reply Suggestions */}
      {smartReplies.length > 0 && (
        <div className="flex gap-1 ml-2">
          {smartReplies.map((reply, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 text-xs px-2 py-1"
              onClick={() => onSmartReply(reply)}
            >
              {reply}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
