import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatLayout } from "@/components/chat/chat-layout"

export default async function ChatPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get user's contacts (other users they've messaged)
  const { data: contacts } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, status, last_seen")
    .neq("id", data.user.id)
    .limit(50)

  const { data: groups } = await supabase
    .from("groups")
    .select(`
      id, name, description, avatar_url, created_at,
      group_members!inner(role),
      created_by:profiles!created_by(username, display_name)
    `)
    .eq("group_members.user_id", data.user.id)

  return <ChatLayout user={data.user} profile={profile} contacts={contacts || []} groups={groups || []} />
}
