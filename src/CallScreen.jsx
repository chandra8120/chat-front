import { useCall } from "./Context";
import { useEffect } from "react";

export default function CallScreen() {
  const {
    callActive,
    localVideo,
    remoteVideo,
    remoteAudio,
    endCall,
  } = useCall();

  useEffect(() => {
    if (!callActive) return;

    const audio = remoteAudio.current;
    if (!audio) return;

    audio.muted = false;
    audio.volume = 1;

    const startAudio = () => {
      audio.play()
        .then(() => console.log("🔊 AUDIO PLAYING"))
        .catch((e) => console.log("❌ AUDIO FAIL", e));

      document.removeEventListener("click", startAudio);
    };

    // 🔥 Browser autoplay restriction fix
    document.addEventListener("click", startAudio);

    return () => {
      document.removeEventListener("click", startAudio);
    };
  }, [callActive]);

  return (
    <>
      {/* 🔊 AUDIO MUST ALWAYS EXIST (NEVER REMOVE THIS) */}
      <audio ref={remoteAudio} />

      {/* 👇 UI ONLY WHEN CALL ACTIVE */}
      {callActive && (
        <div className="call-screen">
          <video
            ref={remoteVideo}
            autoPlay
            playsInline
            className="remote-video"
          />

          <video
            ref={localVideo}
            autoPlay
            muted
            playsInline
            className="local-video"
          />

          <div className="controls">
            <button className="end" onClick={endCall}>❌</button>
          </div>
        </div>
      )}
    </>
  );
}
