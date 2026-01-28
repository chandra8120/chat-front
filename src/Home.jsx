import { useState } from "react";
import { useCall } from "./Context";
import ChatBox from "./ChatBox";
import OnlineUsers from "./OnlineUsers";

export default function CallsHome() {
  const {
    registerUser,
    callUser,
    myId,
    callActive,
  } = useCall();

  const [myInputId, setMyInputId] = useState("");
  const [callTo, setCallTo] = useState("");

  // 🔥 Call active unte home screen 
  if (callActive) return null;

  // 🔐 REGISTER SCREEN
  if (!myId) {
    return (
      <div className="calls-page">
        <input
          placeholder="Create your ID (ex: 1234)"
          value={myInputId}
          onChange={(e) => setMyInputId(e.target.value)}
        />

        <button
          className="call-btn audio-btn"
          onClick={() => registerUser(myInputId)}
        >
          Save ID
        </button>
      </div>
    );
  }

  // 📞 MAIN CALL SCREEN
  return (
    <>
      <div className="header">
        <h3>Calls</h3>
        <small>ID: {myId}</small>
      </div>

      <div className="calls-page">
        {/* 🟢 ONLINE USERS */}
        <OnlineUsers />

        {/* ☎️ CALL INPUT */}
        <input
          placeholder="Enter user ID to call"
          value={callTo}
          onChange={(e) => setCallTo(e.target.value)}
        />

        {/* 📞 AUDIO CALL */}
        <button
          className="call-btn audio-btn"
          onClick={() => callUser(callTo, false)}
        >
          📞 Audio Call
        </button>

        {/* 🎥 VIDEO CALL */}
        <button
          className="call-btn video-btn"
          onClick={() => callUser(callTo, true)}
        >
          🎥 Video Call
        </button>

        {/* 💬 CHAT */}
        <ChatBox to={callTo} />
      </div>
    </>
  );
}
