import { useState } from "react";
import { useCall } from "./Context";
import ChatBox from "./ChatBox";
export default function CallsHome() {
  const { registerUser, callUser, myId, callActive } = useCall();
  const [myInputId, setMyInputId] = useState("");
  const [callTo, setCallTo] = useState("");

  if (callActive) return null;


  if (!myId) {
    return (
      <div className="calls-page">
        <input
          placeholder="Create your ID (ex: 1234)"
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

  // 📞 CALL SCREEN

  return (
  <>
    <div className="header">
      <h3>Calls</h3>
      <small>ID: {myId}</small>
    </div>

    <div className="calls-page">
      <input
        placeholder="Enter user ID to call"
        onChange={(e) => setCallTo(e.target.value)}
      />

    <button className="call-btn audio-btn">📞 Audio</button>
<button className="call-btn video-btn">🎥 Video</button>




      {/* 🔥 CHAT WILL SHOW HERE */}
      <ChatBox to={callTo} />
    </div>
  </>
);

}
