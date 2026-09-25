// @ts-ignore
import MiBolsillo from "./mi-bolsillo/MiBolsillo"
import { useEffect, useRef, useState } from "react"
import splashVideo from "./mi-bolsillo/assets/splash.mp4"

function SplashScreen({ onDone }: { onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fading, setFading] = useState(false)

  const finish = () => {
    setFading(true)
    setTimeout(onDone, 520)
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => finish()) // if autoplay blocked, skip
  }, [])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9999,
        background: "#05297A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity .5s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <video
        ref={videoRef}
        src={splashVideo}
        muted
        playsInline
        onEnded={finish}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  )
}

export default function App() {
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem("splash-seen") === "1"
  })

  const handleSplashDone = () => {
    sessionStorage.setItem("splash-seen", "1")
    setSplashDone(true)
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A1A4A",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 430,
          height: "100dvh",
          maxHeight: 900,
          overflow: "hidden",
        }}
      >
        <MiBolsillo showStatusBar={true} trashMode="hover" />
        {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      </div>
    </div>
  )
}
