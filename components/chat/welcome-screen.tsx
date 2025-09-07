"use client"

import { MessageCircle, Shield, Users, Zap } from "lucide-react"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  status: string
  last_seen: string
}

interface WelcomeScreenProps {
  profile: Profile | null
}

export function WelcomeScreen({ profile }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-4 bg-blue-600 rounded-2xl">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
          <Shield className="h-8 w-8 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          Welcome to SecureChat, {profile?.display_name || profile?.username}!
        </h1>

        <p className="text-muted-foreground mb-8 text-pretty">
          Select a contact from the sidebar to start a secure, end-to-end encrypted conversation.
        </p>

        <div className="grid gap-4 text-left">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-sm">End-to-End Encryption</p>
              <p className="text-xs text-muted-foreground">Your messages are completely private</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-sm">Group Conversations</p>
              <p className="text-xs text-muted-foreground">Chat with multiple people securely</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-sm">AI-Powered Features</p>
              <p className="text-xs text-muted-foreground">Smart suggestions and translations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
