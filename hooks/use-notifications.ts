"use client"

import { useEffect, useState } from "react"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return "denied"
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === "granted" && "Notification" in window) {
      // Check if the page is visible
      if (document.visibilityState === "hidden") {
        new Notification(title, {
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          ...options,
        })
      }
    }
  }

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  }
}
