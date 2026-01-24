import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const socket = io("http://localhost:5000");

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const CallProvider = ({ children }) => {
  const [myId, setMyId] = useState("");
  const [incoming, setIncoming] = useState(null);
  const [callActive, setCallActive] = useState(false);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const remoteAudio = useRef(null);
  const localStream = useRef(null);
  const peer = useRef(null);

  const iceQueue = useRef([]);
  const remoteDescSet = useRef(false);

  useEffect(() => {
    console.log("📡 INIT SOCKET");

    socket.on("connect", () => {
      console.log("✅ SOCKET CONNECTED:", socket.id);
      setMyId(socket.id);
    });

    socket.on("incoming-call", ({ from, offer, type }) => {
      console.log("📞 INCOMING CALL from", from, "type:", type);
      setIncoming({ from, offer, type });
    });

    socket.on("call-answered", async ({ answer }) => {
      console.log("📨 CALL ANSWER RECEIVED");
      if (peer.current && peer.current.signalingState !== "stable") {
        await peer.current.setRemoteDescription(answer);
        console.log("✅ REMOTE DESCRIPTION SET (ANSWER)");
        remoteDescSet.current = true;
        flushIce();
        setCallActive(true);
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      console.log("🧊 ICE CANDIDATE RECEIVED");
      if (!peer.current) return;

      if (remoteDescSet.current) {
        peer.current.addIceCandidate(candidate);
      } else {
        iceQueue.current.push(candidate);
      }
    });

    socket.on("call-ended", () => {
      console.log("❌ CALL ENDED");
      endCall();
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, []);

  const startMedia = async (video) => {
    console.log("🎤 REQUESTING MEDIA. Video:", video);
    localStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });

    console.log(
      "🎧 AUDIO TRACKS:",
      localStream.current.getAudioTracks().length
    );

    if (video && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  };

  const createPeer = (to) => {
    console.log("🔗 CREATING PEER CONNECTION");
    const pc = new RTCPeerConnection(config);

    localStream.current.getTracks().forEach((track) => {
      console.log("➕ ADD TRACK:", track.kind);
      pc.addTrack(track, localStream.current);
    });

    pc.ontrack = (e) => {
      console.log("📡 ONTRACK EVENT:", e.streams);
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = e.streams[0];
        console.log("🔊 REMOTE AUDIO ATTACHED");
      }
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = e.streams[0];
        console.log("🎥 REMOTE VIDEO ATTACHED");
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log("🧊 SENDING ICE");
        socket.emit("ice-candidate", { to, candidate: e.candidate });
      }
    };

    return pc;
  };

  const flushIce = () => {
    console.log("🧊 FLUSHING ICE:", iceQueue.current.length);
    iceQueue.current.forEach((c) => peer.current.addIceCandidate(c));
    iceQueue.current = [];
  };

  const callUser = async (to, video) => {
    console.log("📞 CALLING USER:", to);
    await startMedia(video);
    peer.current = createPeer(to);

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);
    console.log("📤 OFFER SENT");

    socket.emit("call-user", {
      to,
      offer,
      type: video ? "video" : "audio",
    });
  };

  const acceptCall = async () => {
    console.log("✅ ACCEPT CALL");
    await startMedia(incoming.type === "video");
    peer.current = createPeer(incoming.from);

    await peer.current.setRemoteDescription(incoming.offer);
    console.log("📥 OFFER SET");
    remoteDescSet.current = true;
    flushIce();

    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);
    console.log("📤 ANSWER SENT");

    socket.emit("answer-call", {
      to: incoming.from,
      answer,
    });

    setCallActive(true);
    setIncoming(null);
  };

  const endCall = () => {
    console.log("❌ END CALL");
    peer.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    setCallActive(false);
    setIncoming(null);
    remoteDescSet.current = false;
  };

  return (
    <CallContext.Provider
      value={{
        myId,
        callUser,
        incoming,
        acceptCall,
        endCall,
        callActive,
        localVideo,
        remoteVideo,
        remoteAudio,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
