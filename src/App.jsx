import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://chat-1-0afu.onrender.com" , {
  transports: ["websocket", "polling"]
});

const App = () => {
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerRef = useRef(null);
  const callRoleRef = useRef(null); // "caller" | "receiver"

  const [myId, setMyId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [show,setShow]=useState("")

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      setMyId(socket.id);
    });

    socket.on("incoming-call", ({ from, offer }) => {
      callRoleRef.current = "receiver";
      setIncomingCall({ from, offer });
    });

    socket.on("call-answered", async ({ answer }) => {
      if (
        callRoleRef.current === "caller" &&
        peerRef.current &&
        peerRef.current.signalingState === "have-local-offer"
      ) {
        await peerRef.current.setRemoteDescription(answer);
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (peerRef.current && candidate) {
        peerRef.current.addIceCandidate(candidate);
      }
    });

    socket.on("call-ended", endCall);

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  const createPeer = (to) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to,
          candidate: e.candidate
        });
      }
    };

    peer.ontrack = (e) => {
      console.log("Remote audio stream received");
      setShow("Remote audio stream received")
      remoteAudioRef.current.srcObject = e.streams[0];

      // 🔥 autoplay fix
      setTimeout(() => {
        remoteAudioRef.current
          .play()
          .catch(() => {});
      }, 300);
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log("Mic access granted");
        setShow("Mic access granted")
        localAudioRef.current.srcObject = stream;

        stream.getTracks().forEach((track) =>
          peer.addTrack(track, stream)
        );
      })
      .catch(() => alert("Please allow microphone"));

    return peer;
  };

  const startCall = async () => {
    const to = prompt("Enter receiver socket ID");
    if (!to) return;

    callRoleRef.current = "caller";
    peerRef.current = createPeer(to);

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.emit("call-user", { to, offer });
  };

  const acceptCall = async () => {
    peerRef.current = createPeer(incomingCall.from);

    await peerRef.current.setRemoteDescription(incomingCall.offer);

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socket.emit("answer-call", {
      to: incomingCall.from,
      answer
    });

    setIncomingCall(null);

    // 🔥 autoplay fix on user interaction
    setTimeout(() => {
      remoteAudioRef.current
        .play()
        .catch(() => {});
    }, 300);
  };

  const endCall = () => {
    peerRef.current?.getSenders().forEach((s) => s.track?.stop());
    peerRef.current?.close();
    peerRef.current = null;
    remoteAudioRef.current.srcObject = null;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎧 Audio Call App</h2> 

      <p><b>My Socket ID:</b></p>
      <p>{myId}</p>

      <button onClick={startCall}>Start Call</button>

      {incomingCall && (
        <div style={{ marginTop: 20 }}>
          <p>📞 Incoming call from</p>
          <p>{incomingCall.from}</p>
          <button onClick={acceptCall}>Accept</button>
          {show}
        </div>
      )}

      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default App;
