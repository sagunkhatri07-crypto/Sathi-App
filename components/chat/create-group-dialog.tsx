"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Users, Search } from "lucide-react"

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

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  contacts: Profile[]
  onGroupCreated: (group: Group) => void
}

export function CreateGroupDialog({ open, onOpenChange, user, contacts, onGroupCreated }: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClient()

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleMemberToggle = (contactId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedMembers(newSelected)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) return

    setIsCreating(true)
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add the creator as admin
      const membersToAdd = [
        { group_id: group.id, user_id: user.id, role: "admin" },
        ...Array.from(selectedMembers).map((memberId) => ({
          group_id: group.id,
          user_id: memberId,
          role: "member",
        })),
      ]

      const { error: membersError } = await supabase.from("group_members").insert(membersToAdd)

      if (membersError) throw membersError

      // Reset form
      setGroupName("")
      setGroupDescription("")
      setSelectedMembers(new Set())
      setSearchQuery("")
      onOpenChange(false)
      onGroupCreated(group)
    } catch (error) {
      console.error("Error creating group:", error)
    } finally {
      setIsCreating(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Group
          </DialogTitle>
          <DialogDescription>Create a new group chat with your contacts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupDescription">Description (optional)</Label>
            <Textarea
              id="groupDescription"
              placeholder="What's this group about?"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="h-48 border rounded-md p-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No contacts found</div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id={contact.id}
                        checked={selectedMembers.has(contact.id)}
                        onCheckedChange={() => handleMemberToggle(contact.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.avatar_url || ""} />
                        <AvatarFallback className="bg-slate-600 text-white text-xs">
                          {getInitials(contact.display_name || contact.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contact.display_name || contact.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{contact.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedMembers.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedMembers.size} member{selectedMembers.size !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.size === 0 || isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
