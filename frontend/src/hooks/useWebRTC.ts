import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "60a8dc3c1d5d647225e20f04",
      credential: "lWzUfPiNdH7cNaSg",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "60a8dc3c1d5d647225e20f04",
      credential: "lWzUfPiNdH7cNaSg",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "60a8dc3c1d5d647225e20f04",
      credential: "lWzUfPiNdH7cNaSg",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "60a8dc3c1d5d647225e20f04",
      credential: "lWzUfPiNdH7cNaSg",
    }
  ],
};

export function useWebRTC(roomId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("waiting");
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const otherUserIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    // 1. Get local stream
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        activeStream = stream;
        setLocalStream(stream);
        initSocketAndPeerConnection(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Failed to access camera and microphone.");
      }
    };

    initLocalStream();

    return () => {
      // Cleanup
      socketRef.current?.disconnect();
      peerConnectionRef.current?.close();
      activeStream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const initSocketAndPeerConnection = (stream: MediaStream) => {
    socketRef.current = io();
    
    socketRef.current.on("connect", () => {
      console.log("Connected to signaling server");
      socketRef.current?.emit("join-room", roomId);
    });

    socketRef.current.on("other-user", (userId: string) => {
      // Another user is already in the room, we should call them
      console.log("Other user in room:", userId);
      otherUserIdRef.current = userId;
      callUser(userId, stream);
    });

    socketRef.current.on("user-joined", (userId: string) => {
      // We were in the room, and someone joined. Wait for their offer.
      console.log("User joined:", userId);
      otherUserIdRef.current = userId;
    });

    socketRef.current.on("offer", async (payload: { caller: string; sdp: RTCSessionDescriptionInit }) => {
      console.log("Received offer from:", payload.caller);
      otherUserIdRef.current = payload.caller;
      await handleReceiveOffer(payload, stream);
    });

    socketRef.current.on("answer", async (payload: { caller: string; sdp: RTCSessionDescriptionInit }) => {
      console.log("Received answer");
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      
      pendingCandidatesRef.current.forEach(async (c) => {
        try {
          await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {
          console.error("Error adding pending ice candidate", e);
        }
      });
      pendingCandidatesRef.current = [];
      setIsConnected(true);
    });

    socketRef.current.on("ice-candidate", async (payload: { sender: string; candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current?.remoteDescription) {
          const candidate = new RTCIceCandidate(payload.candidate);
          await peerConnectionRef.current.addIceCandidate(candidate);
        } else {
          pendingCandidatesRef.current.push(payload.candidate);
        }
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    });

    socketRef.current.on("user-disconnected", () => {
      console.log("User disconnected");
      setIsConnected(false);
      setRemoteStream(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      otherUserIdRef.current = null;
    });
  };

  const remoteStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = (stream: MediaStream, targetUserId: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Crucial: Reset the remote stream so we don't accumulate dead tracks
    remoteStreamRef.current = new MediaStream();
    setRemoteStream(null);
    setConnectionStatus("connecting");

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onconnectionstatechange = () => {
      console.log("WebRTC Connection State:", pc.connectionState);
      setConnectionStatus(pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setIsConnected(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          target: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      remoteStreamRef.current.addTrack(event.track);
      
      // Clone it so React state updates
      setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      // We don't set isConnected here anymore, we wait for connectionState === 'connected'
    };

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    peerConnectionRef.current = pc;
    return pc;
  };

  const callUser = async (userId: string, stream: MediaStream) => {
    const pc = createPeerConnection(stream, userId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current?.emit("offer", {
        target: userId,
        sdp: pc.localDescription,
      });
    } catch (e) {
      console.error("Error creating offer", e);
    }
  };

  const handleReceiveOffer = async (
    payload: { caller: string; sdp: RTCSessionDescriptionInit },
    stream: MediaStream
  ) => {
    const pc = createPeerConnection(stream, payload.caller);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      
      pendingCandidatesRef.current.forEach(async (c) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch (e) {
          console.error("Error adding pending ice candidate", e);
        }
      });
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current?.emit("answer", {
        target: payload.caller,
        sdp: pc.localDescription,
      });
    } catch (e) {
      console.error("Error handling offer", e);
    }
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    connectionStatus,
    error,
  };
}
