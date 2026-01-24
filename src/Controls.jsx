import { useCall } from "./Context";

export default function CallControls() {
  const { endCall } = useCall();
  return (
    <div className="controls">
      <button className="end" onClick={endCall}>❌</button>
    </div>
  );
}
