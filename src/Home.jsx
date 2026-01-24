import { useState } from "react";
import { useCall } from "./Context";

export default function CallsHome() {
  const { callUser, myId } = useCall();
  const [id, setId] = useState("");

  return (
    <>
      <div className="header">
        <h3>Calls</h3>
        <small>ID: {myId}</small>
      </div>

      <div className="calls-page">
        <input
          placeholder="Enter User ID"
          onChange={(e) => setId(e.target.value)}
        />

        <div className="call-card">
          <div>
            <h4>Audio Call</h4>
            <p>Make audio calls</p>
          </div>
          <button
            className="call-btn audio-btn"
            onClick={() => callUser(id, false)}
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
            onClick={() => callUser(id, true)}
          >
            Call
          </button>
        </div>
      </div>
    </>
  );
}
