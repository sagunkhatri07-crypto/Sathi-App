"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Phone, PhoneOff, Video } from "lucide-react"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface CallData {
  id: string
  caller_id: string
  callee_id: string
  call_type: "audio" | "video"
  status: string
  created_at: string
  caller: Profile
  callee: Profile
}

interface IncomingCallDialogProps {
  call: CallData
  onAccept: () => void
  onReject: () => void
}

export function IncomingCallDialog({ call, onAccept, onReject }: IncomingCallDialogProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 border-0">
        <div className="text-center py-6">
          <div className="mb-6">
            <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-blue-200 dark:ring-blue-800">
              <AvatarImage src={call.caller.avatar_url || ""} />
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials(call.caller.display_name || call.caller.username)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {call.caller.display_name || call.caller.username}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              {call.call_type === "video" ? (
                <>
                  <Video className="h-4 w-4" />
                  Incoming video call
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Incoming voice call
                </>
              )}
            </p>
          </div>

          <div className="flex justify-center gap-8">
            <Button onClick={onReject} size="lg" className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 p-0">
              <PhoneOff className="h-8 w-8 text-white" />
            </Button>
            <Button onClick={onAccept} size="lg" className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 p-0">
              {call.call_type === "video" ? (
                <Video className="h-8 w-8 text-white" />
              ) : (
                <Phone className="h-8 w-8 text-white" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
