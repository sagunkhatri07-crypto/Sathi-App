"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Users, Crown, Shield, UserMinus, UserPlus } from "lucide-react"

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

interface GroupMember {
  id: string
  role: string
  user_id: string
  joined_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface GroupInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  user: User
}

export function GroupInfoDialog({ open, onOpenChange, group, user }: GroupInfoDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [userRole, setUserRole] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    if (!open) return

    const loadMembers = async () => {
      const { data } = await supabase
        .from("group_members")
        .select(`
          id, role, user_id, joined_at,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq("group_id", group.id)

      if (data) {
        setMembers(data as GroupMember[])
        const currentUserMember = data.find((member) => member.user_id === user.id)
        setUserRole(currentUserMember?.role || "")
      }
    }

    loadMembers()
  }, [open, group.id, user.id, supabase])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3 text-yellow-600" />
      case "moderator":
        return <Shield className="h-3 w-3 text-blue-600" />
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
            Admin
          </Badge>
        )
      case "moderator":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
            Moderator
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            Member
          </Badge>
        )
    }
  }

  const canManageMembers = userRole === "admin" || userRole === "moderator"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={group.avatar_url || ""} />
              <AvatarFallback className="bg-purple-600 text-white">{getInitials(group.name)}</AvatarFallback>
            </Avatar>
            {group.name}
          </DialogTitle>
          <DialogDescription>
            {group.description || "No description"}
            <br />
            <span className="text-xs">Created {new Date(group.created_at).toLocaleDateString()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </h4>
            {canManageMembers && (
              <Button size="sm" variant="outline">
                <UserPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles.avatar_url || ""} />
                        <AvatarFallback className="bg-slate-600 text-white text-xs">
                          {getInitials(member.profiles.display_name || member.profiles.username)}
                        </AvatarFallback>
                      </Avatar>
                      {getRoleIcon(member.role) && (
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                          {getRoleIcon(member.role)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profiles.display_name || member.profiles.username}
                        {member.user_id === user.id && " (You)"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{member.profiles.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    {canManageMembers && member.user_id !== user.id && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {userRole === "admin" && (
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 bg-transparent">
                Leave Group
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
