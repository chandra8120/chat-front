import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

// 🔌 SOCKET
const socket = io("https://chatting-wun1.onrender.com");

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const CallProvider = ({ children }) => {
  const [myId, setMyId] = useState("");
  const [incoming, setIncoming] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const remoteAudio = useRef(null);

  const localStream = useRef(null);
  const peer = useRef(null);

  const iceQueue = useRef([]);
  const remoteDescSet = useRef(false);

  /* ================= SOCKET INIT ================= */
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ SOCKET CONNECTED");
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
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

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("call-ended", endCall);

    return () => {
      socket.off();
    };
  }, []);

  /* ================= REGISTER ================= */
  const registerUser = (id) => {
    if (!id) return;
    setMyId(id);
    socket.emit("register", id);
  };

  /* ================= MEDIA ================= */
  const startMedia = async (video) => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false,
    });

    if (video && localVideo.current) {
      localVideo.current.srcObject = localStream.current;
    }
  };

  /* ================= PEER ================= */
  const createPeer = (to) => {
    const pc = new RTCPeerConnection(config);

    // add local tracks
    localStream.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.current);
    });

    // 🔥 SINGLE REMOTE STREAM (IMPORTANT)
    const remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      console.log("🎥 TRACK:", event.track.kind);

      remoteStream.addTrack(event.track);

      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }

      if (remoteAudio.current) {
        remoteAudio.current.srcObject = remoteStream;
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

  /* ================= CALL ================= */
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

  /* ================= ACCEPT ================= */
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

  /* ================= END ================= */
  const endCall = () => {
    peer.current?.close();

    localStream.current?.getTracks().forEach((t) => t.stop());

    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (remoteAudio.current) remoteAudio.current.srcObject = null;

    peer.current = null;
    setCallActive(false);
    setIncoming(null);
    remoteDescSet.current = false;
  };

  /* ================= CHAT ================= */
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

        messages,
        sendMessage,
        onlineUsers,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
