"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { ChatSidebar } from "./chat-sidebar"
import { ChatArea } from "./chat-area"
import { WelcomeScreen } from "./welcome-screen"
import { CallManager } from "./call-manager" // Added CallManager import

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

interface ChatLayoutProps {
  user: User
  profile: Profile | null
  contacts: Profile[]
  groups: Group[]
}

type ChatTarget = { type: "contact"; data: Profile } | { type: "group"; data: Group }

export function ChatLayout({ user, profile, contacts, groups }: ChatLayoutProps) {
  const [selectedTarget, setSelectedTarget] = useState<ChatTarget | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    if (!selectedTarget) return

    let filter = ""
    if (selectedTarget.type === "contact") {
      filter = `or(and(sender_id.eq.${user.id},recipient_id.eq.${selectedTarget.data.id}),and(sender_id.eq.${selectedTarget.data.id},recipient_id.eq.${user.id}))`
    } else {
      filter = `group_id.eq.${selectedTarget.data.id}`
    }

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new])
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg)))
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTarget, user.id, supabase])

  useEffect(() => {
    if (!selectedTarget) return

    const loadMessages = async () => {
      let query = supabase
        .from("messages")
        .select("*, sender:profiles!sender_id(username, display_name, avatar_url)")
        .order("created_at", { ascending: true })

      if (selectedTarget.type === "contact") {
        query = query.or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${selectedTarget.data.id}),and(sender_id.eq.${selectedTarget.data.id},recipient_id.eq.${user.id})`,
        )
      } else {
        query = query.eq("group_id", selectedTarget.data.id)
      }

      const { data } = await query
      setMessages(data || [])
    }

    loadMessages()
  }, [selectedTarget, user.id, supabase])

  useEffect(() => {
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState()
        const users = new Set(Object.keys(newState))
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            username: profile?.username,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, profile?.username, supabase])

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        user={user}
        profile={profile}
        contacts={contacts}
        groups={groups}
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        onlineUsers={onlineUsers}
      />
      <div className="flex-1 flex flex-col">
        {selectedTarget ? (
          <ChatArea
            user={user}
            profile={profile}
            selectedTarget={selectedTarget}
            messages={messages}
            onlineUsers={onlineUsers}
          />
        ) : (
          <WelcomeScreen profile={profile} />
        )}
      </div>
      <CallManager user={user} profile={profile} />
    </div>
  )
}
