import { useState } from "react";
import { useCall } from "./Context";

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
          placeholder="Enter user ID to call (ex: 1234)"
          onChange={(e) => setCallTo(e.target.value)}
        />

        <div className="call-card">
          <div>
            <h4>Audio Call</h4>
            <p>Make audio calls</p>
          </div>
          <button
            className="call-btn audio-btn"
            onClick={() => callUser(callTo, false)}
          >
            Call
          </button>
        </div>

        <div className="call-card">
          <div>
            <h4>Video Call</h4>
            <p>Make video calls</p>
          </div>
          <button
            className="call-btn video-btn"
            onClick={() => callUser(callTo, true)}
          >
            Call
          </button>
        </div>
      </div>
    </>
  );
}
