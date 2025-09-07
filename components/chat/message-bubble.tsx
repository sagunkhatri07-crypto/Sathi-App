"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  isGroup?: boolean // Added isGroup prop
  showAvatar: boolean
}

export function MessageBubble({ message, isOwn, isGroup = false, showAvatar }: MessageBubbleProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={cn("flex gap-3 message-animate", isOwn ? "flex-row-reverse" : "flex-row")}>
      {((isGroup && !isOwn) || (!isGroup && showAvatar && !isOwn)) && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender.avatar_url || ""} />
          <AvatarFallback className="bg-slate-600 text-white text-xs">
            {getInitials(message.sender.display_name || message.sender.username)}
          </AvatarFallback>
        </Avatar>
      )}
      {((isGroup && !isOwn && !showAvatar) || (!isGroup && !showAvatar && !isOwn)) && <div className="w-8" />}

      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {((isGroup && !isOwn) || (!isGroup && showAvatar && !isOwn)) && (
          <p className="text-xs text-muted-foreground mb-1 px-3">
            {message.sender.display_name || message.sender.username}
          </p>
        )}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl text-sm break-words",
            isOwn ? "bg-blue-600 text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md",
          )}
        >
          <p className="text-pretty">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">{formatTime(message.created_at)}</p>
      </div>
    </div>
  )
}
