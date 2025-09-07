"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { IncomingCallDialog } from "./incoming-call-dialog"
import { ActiveCallDialog } from "./active-call-dialog"

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
  status: "ringing" | "accepted" | "rejected" | "ended"
  created_at: string
  caller: Profile
  callee: Profile
}

interface CallManagerProps {
  user: User
  profile: Profile | null
}

export function CallManager({ user, profile }: CallManagerProps) {
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null)
  const [activeCall, setActiveCall] = useState<CallData | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null)
  const supabase = createClient()

  // Subscribe to call events
  useEffect(() => {
    const channel = supabase
      .channel("calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `callee_id.eq.${user.id}`,
        },
        async (payload) => {
          const callData = payload.new as any
          // Fetch caller profile
          const { data: caller } = await supabase.from("profiles").select("*").eq("id", callData.caller_id).single()

          if (caller) {
            setIncomingCall({
              ...callData,
              caller,
              callee: profile!,
            })
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `or(caller_id.eq.${user.id},callee_id.eq.${user.id})`,
        },
        (payload) => {
          const callData = payload.new as any
          if (callData.status === "accepted" && activeCall?.id === callData.id) {
            // Handle call acceptance
            handleCallAccepted()
          } else if (callData.status === "rejected" || callData.status === "ended") {
            // Handle call end
            handleCallEnd()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, profile, supabase, activeCall])

  const initiatePeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    pc.onicecandidate = (event) => {
      if (event.candidate && activeCall) {
        // Send ICE candidate through signaling
        supabase.from("call_signals").insert({
          call_id: activeCall.id,
          sender_id: user.id,
          signal_type: "ice-candidate",
          signal_data: JSON.stringify(event.candidate),
        })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
    }

    setPeerConnection(pc)
    return pc
  }

  const startCall = async (calleeId: string, callType: "audio" | "video") => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      })
      setLocalStream(stream)

      // Create call record
      const { data: call, error } = await supabase
        .from("calls")
        .insert({
          caller_id: user.id,
          callee_id: calleeId,
          call_type: callType,
          status: "ringing",
        })
        .select(`
          *, 
          caller:profiles!caller_id(*),
          callee:profiles!callee_id(*)
        `)
        .single()

      if (error) throw error

      setActiveCall(call)

      // Initialize peer connection
      const pc = initiatePeerConnection()
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Send offer through signaling
      await supabase.from("call_signals").insert({
        call_id: call.id,
        sender_id: user.id,
        signal_type: "offer",
        signal_data: JSON.stringify(offer),
      })
    } catch (error) {
      console.error("Error starting call:", error)
    }
  }

  const acceptCall = async (call: CallData) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.call_type === "video",
      })
      setLocalStream(stream)

      // Update call status
      await supabase.from("calls").update({ status: "accepted" }).eq("id", call.id)

      setActiveCall(call)
      setIncomingCall(null)

      // Initialize peer connection
      const pc = initiatePeerConnection()
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Listen for signaling
      const signalChannel = supabase
        .channel(`call-signals-${call.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_signals",
            filter: `call_id.eq.${call.id}`,
          },
          async (payload) => {
            const signal = payload.new as any
            if (signal.sender_id === user.id) return

            const signalData = JSON.parse(signal.signal_data)

            if (signal.signal_type === "offer") {
              await pc.setRemoteDescription(signalData)
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)

              await supabase.from("call_signals").insert({
                call_id: call.id,
                sender_id: user.id,
                signal_type: "answer",
                signal_data: JSON.stringify(answer),
              })
            } else if (signal.signal_type === "answer") {
              await pc.setRemoteDescription(signalData)
            } else if (signal.signal_type === "ice-candidate") {
              await pc.addIceCandidate(signalData)
            }
          },
        )
        .subscribe()
    } catch (error) {
      console.error("Error accepting call:", error)
    }
  }

  const rejectCall = async (call: CallData) => {
    await supabase.from("calls").update({ status: "rejected" }).eq("id", call.id)
    setIncomingCall(null)
  }

  const endCall = async () => {
    if (activeCall) {
      await supabase.from("calls").update({ status: "ended" }).eq("id", activeCall.id)
      handleCallEnd()
    }
  }

  const handleCallAccepted = () => {
    // Call was accepted, continue with WebRTC setup
  }

  const handleCallEnd = () => {
    // Clean up streams and connections
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop())
      setRemoteStream(null)
    }
    if (peerConnection) {
      peerConnection.close()
      setPeerConnection(null)
    }
    setActiveCall(null)
    setIncomingCall(null)
  }

  return (
    <>
      {incomingCall && (
        <IncomingCallDialog
          call={incomingCall}
          onAccept={() => acceptCall(incomingCall)}
          onReject={() => rejectCall(incomingCall)}
        />
      )}
      {activeCall && (
        <ActiveCallDialog
          call={activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
          isInitiator={activeCall.caller_id === user.id}
        />
      )}
    </>
  )
}

// Export the startCall function for use in other components
export const useCallManager = (user: User) => {
  const supabase = createClient()

  const startCall = async (calleeId: string, callType: "audio" | "video") => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      })

      // Create call record
      const { data: call, error } = await supabase
        .from("calls")
        .insert({
          caller_id: user.id,
          callee_id: calleeId,
          call_type: callType,
          status: "ringing",
        })
        .select()
        .single()

      if (error) throw error

      return { call, stream }
    } catch (error) {
      console.error("Error starting call:", error)
      throw error
    }
  }

  return { startCall }
}
