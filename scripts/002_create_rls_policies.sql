-- Profiles RLS Policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Groups RLS Policies
CREATE POLICY "Users can view groups they are members of" ON public.groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = groups.id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update groups" ON public.groups FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Group admins can delete groups" ON public.groups FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Group Members RLS Policies
CREATE POLICY "Users can view group members of their groups" ON public.group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  )
);
CREATE POLICY "Group admins can add members" ON public.group_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
  )
);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')
  )
);

-- Messages RLS Policies
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = messages.group_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    recipient_id IS NOT NULL OR 
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  )
);
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (sender_id = auth.uid());
CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING (sender_id = auth.uid());

-- Message Reactions RLS Policies
CREATE POLICY "Users can view reactions on messages they can see" ON public.message_reactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.messages 
    WHERE id = message_reactions.message_id AND (
      sender_id = auth.uid() OR 
      recipient_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = messages.group_id AND user_id = auth.uid()
      )
    )
  )
);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.messages 
    WHERE id = message_reactions.message_id AND (
      sender_id = auth.uid() OR 
      recipient_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = messages.group_id AND user_id = auth.uid()
      )
    )
  )
);
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions FOR DELETE USING (user_id = auth.uid());
