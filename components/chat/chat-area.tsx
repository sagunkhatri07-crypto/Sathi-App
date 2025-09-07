"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Phone, Video, MoreVertical, Shield, Users, Settings, Wifi, WifiOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MessageBubble } from "./message-bubble"
import { GroupInfoDialog } from "./group-info-dialog"
import { useCallManager } from "./call-manager"
import { AIFeatures } from "./ai-features"
import { FileUpload } from "./file-upload"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications"
import { useOfflineStorage } from "@/hooks/use-offline-storage"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  status: string
  last_seen: string
}

interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  created_at: string
  group_members: { role: string }[]
  created_by: {
    username: string
    display_name: string | null
  }
}

type ChatTarget = { type: "contact"; data: Profile } | { type: "group"; data: Group }

interface Message {
  id: string
  content: string
  sender_id: string
  recipient_id: string | null
  group_id: string | null
  created_at: string
  sender: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface ChatAreaProps {
  user: User
  profile: Profile | null
  selectedTarget: ChatTarget
  messages: Message[]
  onlineUsers: Set<string>
}

export function ChatArea({ user, profile, selectedTarget, messages, onlineUsers }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({})
  const [conversationSummary, setConversationSummary] = useState<string>("")
  const [showSummary, setShowSummary] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { startCall } = useCallManager(user)
  const { toast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const { showNotification, requestPermission } = useNotifications()
  const { isOnline, pendingMessages, addPendingMessage, removePendingMessage } = useOfflineStorage()

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      if (latestMessage.sender_id !== user.id) {
        showNotification(`New message from ${latestMessage.sender.display_name || latestMessage.sender.username}`, {
          body: latestMessage.content,
          tag: "new-message",
        })
      }
    }
  }, [messages, user.id, showNotification])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()

      const messageData: any = {
        content: `📎 ${file.name}`,
        sender_id: user.id,
        message_type: "file",
        file_url: url,
        file_name: file.name,
        is_encrypted: true,
      }

      if (selectedTarget.type === "contact") {
        messageData.recipient_id = selectedTarget.data.id
      } else {
        messageData.group_id = selectedTarget.data.id
      }

      if (isOnline) {
        const { error } = await supabase.from("messages").insert(messageData)
        if (error) throw error
      } else {
        addPendingMessage({
          id: Date.now().toString(),
          content: messageData.content,
          recipient_id: messageData.recipient_id,
          group_id: messageData.group_id,
          timestamp: Date.now(),
          type: "file",
          file_url: url,
          file_name: file.name,
        })
      }

      toast({
        title: "File shared",
        description: `${file.name} has been shared`,
      })
    } catch (error) {
      console.error("File upload error:", error)
      toast({
        title: "Upload failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      if (isOnline) {
        const moderationResponse = await fetch("/api/ai/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage.trim() }),
        })

        const moderation = await moderationResponse.json()

        if (!moderation.isAppropriate) {
          toast({
            title: "Message blocked",
            description: `Your message was blocked: ${moderation.reason}`,
            variant: "destructive",
          })
          setIsSending(false)
          return
        }
      }

      const messageData: any = {
        content: newMessage.trim(),
        sender_id: user.id,
        message_type: "text",
        is_encrypted: true,
      }

      if (selectedTarget.type === "contact") {
        messageData.recipient_id = selectedTarget.data.id
      } else {
        messageData.group_id = selectedTarget.data.id
      }

      if (isOnline) {
        const { error } = await supabase.from("messages").insert(messageData)
        if (error) throw error
      } else {
        addPendingMessage({
          id: Date.now().toString(),
          content: messageData.content,
          recipient_id: messageData.recipient_id,
          group_id: messageData.group_id,
          timestamp: Date.now(),
          type: "text",
        })

        toast({
          title: "Message queued",
          description: "Will send when connection is restored",
        })
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const targetName =
    selectedTarget.type === "contact"
      ? selectedTarget.data.display_name || selectedTarget.data.username
      : selectedTarget.data.name
  const targetAvatar =
    selectedTarget.type === "contact" ? selectedTarget.data.avatar_url : selectedTarget.data.avatar_url

  const handleVoiceCall = async () => {
    if (selectedTarget.type === "contact") {
      try {
        await startCall(selectedTarget.data.id, "audio")
      } catch (error) {
        console.error("Failed to start voice call:", error)
      }
    }
  }

  const handleVideoCall = async () => {
    if (selectedTarget.type === "contact") {
      try {
        await startCall(selectedTarget.data.id, "video")
      } catch (error) {
        console.error("Failed to start video call:", error)
      }
    }
  }

  const handleSmartReply = (reply: string) => {
    setNewMessage(reply)
  }

  const handleTranslate = (originalText: string, translatedText: string) => {
    const messageId = messages.find((m) => m.content === originalText)?.id
    if (messageId) {
      setTranslatedMessages((prev) => ({
        ...prev,
        [messageId]: translatedText,
      }))
      toast({
        title: "Translation complete",
        description: "Message has been translated",
      })
    }
  }

  const handleSummarize = async () => {
    if (messages.length < 5) {
      toast({
        title: "Not enough messages",
        description: "Need at least 5 messages to summarize",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })

      const { summary } = await response.json()
      setConversationSummary(summary)
      setShowSummary(true)

      toast({
        title: "Conversation summarized",
        description: "Summary generated successfully",
      })
    } catch (error) {
      console.error("Summarization failed:", error)
      toast({
        title: "Summarization failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {!isOnline && (
        <div className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">You're offline. Messages will be sent when connection is restored.</span>
          </div>
        </div>
      )}

      {pendingMessages.length > 0 && (
        <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Badge variant="secondary" className="text-xs">
              {pendingMessages.length} message{pendingMessages.length > 1 ? "s" : ""} pending
            </Badge>
          </div>
        </div>
      )}

      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-2xl mb-2">📎</div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">Drop files here to share</p>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={targetAvatar || ""} />
                <AvatarFallback
                  className={selectedTarget.type === "group" ? "bg-purple-600 text-white" : "bg-slate-600 text-white"}
                >
                  {getInitials(targetName)}
                </AvatarFallback>
              </Avatar>
              {selectedTarget.type === "contact" && isOnline && onlineUsers.has(selectedTarget.data.id) && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
              {selectedTarget.type === "group" && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 border-2 border-background rounded-full flex items-center justify-center">
                  <Users className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{targetName}</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {selectedTarget.type === "contact"
                    ? isOnline && onlineUsers.has(selectedTarget.data.id)
                      ? "Online"
                      : "Last seen recently"
                    : `${selectedTarget.data.group_members.length} members`}
                </p>
                <Shield className="h-3 w-3 text-green-600" title="End-to-end encrypted" />
                {isOnline ? (
                  <Wifi className="h-3 w-3 text-green-600" title="Connected" />
                ) : (
                  <WifiOff className="h-3 w-3 text-orange-600" title="Offline" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTarget.type === "contact" && (
              <>
                <Button variant="ghost" size="sm" onClick={handleVoiceCall}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleVideoCall}>
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            {selectedTarget.type === "group" && (
              <Button variant="ghost" size="sm" onClick={() => setShowGroupInfo(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showSummary && conversationSummary && (
        <div className="mx-4 mb-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Conversation Summary</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSummary(false)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">{conversationSummary}</p>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 chat-scroll">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {selectedTarget.type === "contact" ? "Start a secure conversation" : "Start chatting in this group"}
              </p>
              <p className="text-xs">Messages are end-to-end encrypted</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id}>
                <MessageBubble
                  message={message}
                  isOwn={message.sender_id === user.id}
                  isGroup={selectedTarget.type === "group"}
                  showAvatar={
                    index === 0 ||
                    messages[index - 1].sender_id !== message.sender_id ||
                    new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000
                  }
                />
                {translatedMessages[message.id] && (
                  <div className="ml-12 mt-1 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-sm">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">Translation: </span>
                    <span className="text-amber-800 dark:text-amber-200">{translatedMessages[message.id]}</span>
                  </div>
                )}
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {selectedTarget.type === "contact" && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedTarget.data.avatar_url || ""} />
                  <AvatarFallback className="bg-slate-600 text-white text-xs">
                    {getInitials(selectedTarget.data.display_name || selectedTarget.data.username)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex items-center gap-1">
                <div className="typing-dot w-2 h-2 bg-muted-foreground rounded-full"></div>
                <div className="typing-dot w-2 h-2 bg-muted-foreground rounded-full"></div>
                <div className="typing-dot w-2 h-2 bg-muted-foreground rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card">
        <AIFeatures
          onSmartReply={handleSmartReply}
          onTranslate={handleTranslate}
          onSummarize={handleSummarize}
          messages={messages}
          currentUser={profile?.display_name || profile?.username || "You"}
        />

        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <FileUpload
              onFileUpload={(url, name, type) => {
                toast({
                  title: "File ready to share",
                  description: `${name} is ready to be sent`,
                })
              }}
              disabled={isSending}
            />
            <Input
              placeholder={selectedTarget.type === "contact" ? "Type a message..." : "Message the group..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Messages are end-to-end encrypted
            {!isOnline && <span className="text-orange-600 ml-2">• Offline mode</span>}
          </p>
        </div>
      </div>

      {selectedTarget.type === "group" && (
        <GroupInfoDialog open={showGroupInfo} onOpenChange={setShowGroupInfo} group={selectedTarget.data} user={user} />
      )}
    </div>
  )
}
