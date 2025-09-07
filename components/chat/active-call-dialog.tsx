"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react"

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

interface ActiveCallDialogProps {
  call: CallData
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  onEndCall: () => void
  isInitiator: boolean
}

export function ActiveCallDialog({ call, localStream, remoteStream, onEndCall, isInitiator }: ActiveCallDialogProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const otherUser = isInitiator ? call.callee : call.caller

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = isMuted
        setIsMuted(!isMuted)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = isVideoOff
        setIsVideoOff(!isVideoOff)
      }
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
    <Dialog open={true}>
      <DialogContent className="sm:max-w-4xl h-[80vh] bg-black border-0 p-0">
        <div className="relative h-full flex flex-col">
          {call.call_type === "video" ? (
            <div className="flex-1 relative">
              {/* Remote video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Local video (picture-in-picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden">
                {isVideoOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-blue-600 text-white">You</AvatarFallback>
                    </Avatar>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                )}
              </div>

              {/* Call info overlay */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherUser.avatar_url || ""} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(otherUser.display_name || otherUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{otherUser.display_name || otherUser.username}</p>
                    <p className="text-xs text-gray-300">{formatDuration(callDuration)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Audio call UI
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
              <div className="text-center text-white">
                <Avatar className="h-32 w-32 mx-auto mb-6 ring-4 ring-white/20">
                  <AvatarImage src={otherUser.avatar_url || ""} />
                  <AvatarFallback className="bg-blue-600 text-white text-4xl">
                    {getInitials(otherUser.display_name || otherUser.username)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-bold mb-2">{otherUser.display_name || otherUser.username}</h2>
                <p className="text-xl text-blue-200 mb-4">{formatDuration(callDuration)}</p>
                <p className="text-blue-300">Voice call in progress</p>
              </div>
            </div>
          )}

          {/* Call controls */}
          <div className="p-6 bg-black/80 backdrop-blur-sm">
            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleMute}
                size="lg"
                variant={isMuted ? "destructive" : "secondary"}
                className="h-14 w-14 rounded-full p-0"
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              {call.call_type === "video" && (
                <Button
                  onClick={toggleVideo}
                  size="lg"
                  variant={isVideoOff ? "destructive" : "secondary"}
                  className="h-14 w-14 rounded-full p-0"
                >
                  {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
              )}

              <Button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                size="lg"
                variant={isSpeakerOn ? "secondary" : "outline"}
                className="h-14 w-14 rounded-full p-0"
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              </Button>

              <Button onClick={onEndCall} size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 p-0">
                <PhoneOff className="h-6 w-6 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
