"use client"

import { useEffect, useState } from "react"

interface OfflineMessage {
  id: string
  content: string
  recipient_id?: string
  group_id?: string
  timestamp: number
  type: "text" | "file"
  file_url?: string
  file_name?: string
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingMessages, setPendingMessages] = useState<OfflineMessage[]>([])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Load pending messages from localStorage
    const stored = localStorage.getItem("pendingMessages")
    if (stored) {
      setPendingMessages(JSON.parse(stored))
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const addPendingMessage = (message: OfflineMessage) => {
    const updated = [...pendingMessages, message]
    setPendingMessages(updated)
    localStorage.setItem("pendingMessages", JSON.stringify(updated))
  }

  const removePendingMessage = (id: string) => {
    const updated = pendingMessages.filter((msg) => msg.id !== id)
    setPendingMessages(updated)
    localStorage.setItem("pendingMessages", JSON.stringify(updated))
  }

  const clearPendingMessages = () => {
    setPendingMessages([])
    localStorage.removeItem("pendingMessages")
  }

  return {
    isOnline,
    pendingMessages,
    addPendingMessage,
    removePendingMessage,
    clearPendingMessages,
  }
}
