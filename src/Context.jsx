import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const socket = io("https://chatting-wun1.onrender.com");

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const CallProvider = ({ children }) => {
  const [myId, setMyId] = useState("");
  const [incoming, setIncoming] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [messages, setMessages] = useState([]);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const remoteAudio = useRef(null);
  const localStream = useRef(null);
  const peer = useRef(null);

  const iceQueue = useRef([]);
  const remoteDescSet = useRef(false);

  // 🔌 SOCKET INIT
  useEffect(() => {
    console.log("📡 INIT SOCKET");

    socket.on("connect", () => {
      console.log("✅ SOCKET CONNECTED");
    });

    socket.on("incoming-call", ({ from, offer, type }) => {
      setIncoming({ from, offer, type });
    });

    socket.on("call-answered", async ({ answer }) => {
      if (peer.current && peer.current.signalingState !== "stable") {
        await peer.current.setRemoteDescription(answer);
        remoteDescSet.current = true;
        flushIce();
        setCallActive(true);
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (!peer.current) return;

      if (remoteDescSet.current) {
        peer.current.addIceCandidate(candidate);
      } else {
        iceQueue.current.push(candidate);
      }
    });

    // 💬 RECEIVE MESSAGE
    socket.on("receive-message", (msg) => {
      console.log("💬 MESSAGE RECEIVED:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("call-ended", endCall);

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("receive-message");
      socket.off("call-ended");
    };
  }, []);

  // 🔐 REGISTER USER
  const registerUser = (id) => {
    if (!id) return;
    setMyId(id);
    socket.emit("register", id);
  };

  // 🎤 MEDIA
  const startMedia = async (video) => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video,
    });

    if (video && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  };

  // 🔗 PEER
  const createPeer = (to) => {
    const pc = new RTCPeerConnection(config);

    localStream.current.getTracks().forEach((track) =>
      pc.addTrack(track, localStream.current)
    );

    pc.ontrack = (event) => {
      if (event.track.kind === "audio" && remoteAudio.current) {
        remoteAudio.current.srcObject = new MediaStream([event.track]);
      }

      if (event.track.kind === "video" && remoteVideo.current) {
        remoteVideo.current.srcObject = new MediaStream([event.track]);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to, candidate: e.candidate });
      }
    };

    return pc;
  };

  const flushIce = () => {
    iceQueue.current.forEach((c) => peer.current.addIceCandidate(c));
    iceQueue.current = [];
  };

  // 📞 CALL USER
  const callUser = async (to, video) => {
    if (!to) return;
    await startMedia(video);
    peer.current = createPeer(to);

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("call-user", {
      to,
      offer,
      type: video ? "video" : "audio",
    });
  };

  // ✅ ACCEPT CALL
  const acceptCall = async () => {
    await startMedia(incoming.type === "video");
    peer.current = createPeer(incoming.from);

    await peer.current.setRemoteDescription(incoming.offer);
    remoteDescSet.current = true;
    flushIce();

    const answer = await peer.current.createAnswer();
    await peer.current.setLocalDescription(answer);

    socket.emit("answer-call", {
      to: incoming.from,
      answer,
    });

    setCallActive(true);
    setIncoming(null);
  };

  // ❌ END CALL
  const endCall = () => {
    peer.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    setCallActive(false);
    setIncoming(null);
    remoteDescSet.current = false;
  };

  // 💬 SEND MESSAGE
  const sendMessage = (to, message) => {
    if (!to || !message) return;

    socket.emit("send-message", { to, message });

    setMessages((prev) => [
      ...prev,
      { from: myId, message, time: Date.now(), self: true },
    ]);
  };

  return (
    <CallContext.Provider
      value={{
        myId,
        registerUser,
        callUser,
        incoming,
        acceptCall,
        endCall,
        callActive,
        localVideo,
        remoteVideo,
        remoteAudio,

        // 💬 CHAT
        messages,
        sendMessage,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
