import { useCall } from "./Context";

export default function CallScreen() {
  const { callActive, localVideo, remoteVideo, remoteAudio, endCall } = useCall();

  return (
    <>
      {/* 🔊 AUDIO ALWAYS EXISTS */}
      <audio ref={remoteAudio} />

      {callActive && (
        <div className="call-screen">
          <video ref={remoteVideo} autoPlay muted playsInline />
          <video ref={localVideo} autoPlay muted playsInline />
          <button onClick={endCall}>❌</button>
        </div>
      )}
    </>
  );
}
