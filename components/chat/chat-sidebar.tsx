"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageCircle, LogOut, Shield, Users, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CreateGroupDialog } from "./create-group-dialog"

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

interface ChatSidebarProps {
  user: User
  profile: Profile | null
  contacts: Profile[]
  groups: Group[] // Added groups prop
  selectedTarget: ChatTarget | null // Changed from selectedContact
  onSelectTarget: (target: ChatTarget) => void // Changed from onSelectContact
  onlineUsers: Set<string>
}

export function ChatSidebar({
  user,
  profile,
  contacts,
  groups, // Added groups
  selectedTarget, // Changed from selectedContact
  onSelectTarget, // Changed from onSelectContact
  onlineUsers,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateGroup, setShowCreateGroup] = useState(false) // Added create group state
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isOnline = (userId: string) => onlineUsers.has(userId)

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">SecureChat</span>
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-blue-600 text-white">
                {profile?.display_name ? getInitials(profile.display_name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{profile?.display_name || profile?.username}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="contacts" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="contacts" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="flex-1 mt-2">
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No contacts found</p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant={
                      selectedTarget?.type === "contact" && selectedTarget.data.id === contact.id
                        ? "secondary"
                        : "ghost"
                    }
                    className="w-full justify-start p-3 h-auto mb-1"
                    onClick={() => onSelectTarget({ type: "contact", data: contact })}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar_url || ""} />
                          <AvatarFallback className="bg-slate-600 text-white">
                            {getInitials(contact.display_name || contact.username)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline(contact.id) && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">{contact.display_name || contact.username}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {isOnline(contact.id) ? "Online" : "Last seen recently"}
                        </p>
                      </div>
                      {isOnline(contact.id) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          Online
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="groups" className="flex-1 mt-2">
          <div className="px-2 mb-2">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 h-9"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No groups found</p>
                  <p className="text-xs">Create your first group to get started</p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <Button
                    key={group.id}
                    variant={
                      selectedTarget?.type === "group" && selectedTarget.data.id === group.id ? "secondary" : "ghost"
                    }
                    className="w-full justify-start p-3 h-auto mb-1"
                    onClick={() => onSelectTarget({ type: "group", data: group })}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={group.avatar_url || ""} />
                        <AvatarFallback className="bg-purple-600 text-white">{getInitials(group.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">{group.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {group.group_members.length} member{group.group_members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                        Group
                      </Badge>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        user={user}
        contacts={contacts}
        onGroupCreated={(group) => {
          // Refresh groups or handle new group
          window.location.reload()
        }}
      />
    </div>
  )
}
