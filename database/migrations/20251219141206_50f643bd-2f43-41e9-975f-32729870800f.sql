-- Create security definer function to check if user is room member
CREATE OR REPLACE FUNCTION public.is_chat_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Create security definer function to check if user owns room
CREATE OR REPLACE FUNCTION public.is_chat_room_owner(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_rooms
    WHERE id = _room_id
      AND (user_id = _user_id OR target_user_id = _user_id)
  )
$$;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view members in their rooms" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room owners can add members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room owners can remove members" ON public.chat_room_members;

-- Recreate chat_rooms SELECT policy without recursion
CREATE POLICY "Users can view their chat rooms"
ON public.chat_rooms
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = target_user_id 
  OR public.is_chat_room_member(auth.uid(), id)
  OR public.is_admin(auth.uid())
);

-- Recreate chat_room_members SELECT policy without recursion  
CREATE POLICY "Users can view room members"
ON public.chat_room_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_chat_room_owner(auth.uid(), room_id)
  OR public.is_admin(auth.uid())
);

-- Recreate chat_room_members INSERT policy
CREATE POLICY "Room owners can add members"
ON public.chat_room_members
FOR INSERT
WITH CHECK (
  public.is_chat_room_owner(auth.uid(), room_id)
  OR public.is_admin(auth.uid())
);

-- Recreate chat_room_members DELETE policy
CREATE POLICY "Room owners can remove members"
ON public.chat_room_members
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.is_chat_room_owner(auth.uid(), room_id)
  OR public.is_admin(auth.uid())
);