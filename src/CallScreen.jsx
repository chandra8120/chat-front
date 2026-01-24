import { useCall } from "./Context";
import { useEffect } from "react";

export default function CallScreen() {
  const {
    callActive,
    localVideo,
    remoteVideo,
    remoteAudio,
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

  return (
    <div className="call-screen">
      {/* VIDEO (if video call) */}
      <video ref={remoteVideo} autoPlay playsInline />
      <video ref={localVideo} autoPlay muted playsInline className="local-video" />

      {/* 🔊 AUDIO MUST ALWAYS EXIST */}
      <audio ref={remoteAudio} />
    </div>
  );
}
