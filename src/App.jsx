import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://chatting-wun1.onrender.com");

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function App() {
  const [myId, setMyId] = useState("");
  const [callTo, setCallTo] = useState("");

  const localStream = useRef(null);
  const peer = useRef(null);
  const remoteAudio = useRef(null);

  const iceQueue = useRef([]);
  const remoteDescSet = useRef(false);

  useEffect(() => {
    socket.on("connect", () => {
      setMyId(socket.id);
    });

    // RECEIVER
    socket.on("incoming-call", async ({ from, offer }) => {
      await startAudio();

      peer.current = createPeer(from);

      await peer.current.setRemoteDescription(offer);
      remoteDescSet.current = true;

      flushIce();

      const answer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(answer);

      socket.emit("answer-call", { to: from, answer });
    });

    // CALLER
    socket.on("call-answered", async ({ answer }) => {
      if (peer.current && !remoteDescSet.current) {
        await peer.current.setRemoteDescription(answer);
        remoteDescSet.current = true;
        flushIce();
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (remoteDescSet.current && peer.current) {
        peer.current.addIceCandidate(candidate);
      } else {
        iceQueue.current.push(candidate);
      }
    });
  }, []);

  const startAudio = async () => {
    if (!localStream.current) {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    }
  };

  const createPeer = (to) => {
    const pc = new RTCPeerConnection(config);

    localStream.current.getTracks().forEach((track) =>
      pc.addTrack(track, localStream.current)
    );

    pc.ontrack = (e) => {
      remoteAudio.current.srcObject = e.streams[0];
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to,
          candidate: e.candidate,
        });
      }
    };

    return pc;
  };

  const flushIce = () => {
    iceQueue.current.forEach((c) => peer.current.addIceCandidate(c));
    iceQueue.current = [];
  };

  const callUser = async () => {
    await startAudio();

    peer.current = createPeer(callTo);

    const offer = await peer.current.createOffer();
    await peer.current.setLocalDescription(offer);

    socket.emit("call-user", {
      to: callTo,
      offer,
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>My Socket ID</h3>
      <p>{myId}</p>

      <input
        placeholder="Enter other user socket ID"
        value={callTo}
        onChange={(e) => setCallTo(e.target.value)}
      />
      <br /><br />
      <button onClick={callUser}>Call</button>

      <audio ref={remoteAudio} autoPlay />
    </div>
  );
}

export default App;
