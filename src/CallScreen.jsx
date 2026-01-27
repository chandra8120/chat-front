import { useCall } from "./Context";
import { useEffect } from "react";

export default function CallScreen() {
  const {
    callActive,
    localVideo,
    remoteVideo,
    remoteAudio,
    endCall,          // 🔥 CUT FUNCTION
  } = useCall();

  // 🔥 FORCE AUDIO PLAY (AUTOPLAY FIX)
  useEffect(() => {
    if (callActive && remoteAudio?.current) {
      remoteAudio.current.muted = false;
      remoteAudio.current.volume = 1;

      const playPromise = remoteAudio.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("🔊 AUDIO PLAYING"))
          .catch((e) =>
            console.warn("⚠️ AUDIO PLAY BLOCKED – USER INTERACTION NEEDED", e)
          );
      }
    }
  }, [callActive]);

  // ❌ Call active lekapothe screen chupinchakudadu
  if (!callActive) return null;

  return (
    <div className="call-screen">
      {/* 🌍 REMOTE VIDEO */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="remote-video"
      />

      {/* 🧍 LOCAL VIDEO */}
      <video
        ref={localVideo}
        autoPlay
        muted
        playsInline
        className="local-video"
      />

      {/* 🔊 AUDIO */}
      <audio ref={remoteAudio} />

      {/* ❌ CALL CUT BUTTON (HERE ONLY) */}
      <div className="controls">
        <button className="end" onClick={endCall}>❌</button>
      </div>
    </div>
  );
}
