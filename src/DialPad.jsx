import { useState } from "react";
import { useCall } from "./Context";

export default function DialPad() {
  const { callUser } = useCall();
  const [id, setId] = useState("");

  return (
    <div className="card">
      <input placeholder="User ID" onChange={(e) => setId(e.target.value)} />
      <button onClick={() => callUser(id, false)}>📞 Audio</button>
      <button onClick={() => callUser(id, true)}>🎥 Video</button>
    </div>
  );
}
