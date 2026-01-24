import { useCall } from "./Context";

export default function IncomingCall() {
  const { incoming, acceptCall, endCall } = useCall();
  if (!incoming) return null;

  return (
    <div className="incoming">
      <h3>Incoming {incoming.type} Call</h3>
      <button className="accept" onClick={acceptCall}>✔</button>
      <button className="reject" onClick={endCall}>✖</button>
    </div>
  );
}
