// TextToSpeechPlayer.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * TextToSpeechPlayer
 *
 * Attractive "video-player" UI for browser TTS with a canvas visualiser
 *
 * Props:
 *  - initialText: default text shown
 *  - lang: e.g. "en-US"
 *
 * Notes:
 *  - This visualiser is driven by speaking state because SpeechSynthesis
 *    doesn't provide an audio stream to the WebAudio API in most browsers.
 *  - To use a *real* audio analyser you can fetch TTS from a backend as an
 *    audio file and play it in an <audio> element and connect that element
 *    to an AnalyserNode (see comment in code).
 */
export default function TextToSpeechPlayer({
  initialText = "Hello — welcome to your smart TTS player. Describe a person who inspires you.",
  lang = "en-US",
}) {
  const [text, setText] = useState(initialText);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [estimatedDuration, setEstimatedDuration] = useState(0); // seconds
  const rafRef = useRef(null);
  const startTsRef = useRef(null);
  const utterRef = useRef(null);
  const canvasRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Load voices
  useEffect(() => {
    function loadVoices() {
      const v = synthRef.current.getVoices();
      setVoices(v);
      if (v.length && !selectedVoice) setSelectedVoice(v[0].name);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // Estimate duration (very rough) using words-per-minute heuristic
  function estimateDurationForText(textInput, speechRate) {
    const words = (textInput || "").trim().split(/\s+/).filter(Boolean).length;
    if (!words) return 0;
    const baseWpm = 150; // average speaking words per minute
    const wpm = baseWpm * speechRate; // faster rate → more words/min
    const minutes = words / wpm;
    return Math.max(1, Math.round(minutes * 60)); // at least 1 sec
  }

  // Canvas visualiser (procedural energy mimic)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let mounted = true;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    let phase = 0;
    function draw() {
      if (!mounted) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Background subtle gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(255,255,255,0.02)");
      g.addColorStop(1, "rgba(0,0,0,0.02)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Bars count adapts to width
      const bars = Math.max(8, Math.floor(w / 18));
      const barWidth = Math.floor(w / bars) - 6;
      const gap = 6;
      const baseX = (w - (bars * (barWidth + gap) - gap)) / 2;

      // Animate phase
      phase += 0.06;

      // energy factor from speaking state — more lively when speaking
      const timeSinceStart = speaking ? (Date.now() - (startTsRef.current || 0)) / 1000 : 0;
      const energyBase = speaking ? 0.6 + Math.abs(Math.sin(timeSinceStart * 2)) * 0.4 : 0.05;

      for (let i = 0; i < bars; i++) {
        // create per-bar variation and movement
        const xi = baseX + i * (barWidth + gap);
        // fauxEnergy oscillates with index + phase and random jitter
        const freq = 0.5 + (i / bars) * 2.5;
        const faux = Math.max(
          0,
          Math.sin(phase * freq + i * 0.7) * 0.5 + Math.random() * 0.25
        );
        const barH = (0.05 + faux * energyBase) * h * 1.1;
        // gradient per bar
        const barGrad = ctx.createLinearGradient(xi, h - barH, xi, h);
        barGrad.addColorStop(0, "#7C3AED"); // purple
        barGrad.addColorStop(1, "#06B6D4"); // teal
        ctx.fillStyle = barGrad;
        // rounded corner rectangle
        const x = xi;
        const y = h - barH;
        roundRect(ctx, x, y, barWidth, barH, 4, true, false);
      }

      // subtle overlay "shine" when speaking
      if (speaking) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      mounted = false;
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speaking]);

  // helper rounded rect
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === "undefined") stroke = true;
    if (typeof radius === "undefined") radius = 5;
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (let side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Update estimated duration when text or rate change
  useEffect(() => {
    setEstimatedDuration(estimateDurationForText(text, rate));
    setElapsed(0);
  }, [text, rate]);

  // start speaking
  function startSpeaking() {
    if (!("speechSynthesis" in window)) {
      alert("Speech Synthesis not supported in this browser.");
      return;
    }
    if (!text.trim()) return;

    // cancel any existing
    synthRef.current.cancel();
    setElapsed(0);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;

    if (selectedVoice) {
      const v = voices.find((x) => x.name === selectedVoice);
      if (v) utter.voice = v;
    }

    utter.onstart = () => {
      utterRef.current = utter;
      startTsRef.current = Date.now();
      setSpeaking(true);
      tickTimer(); // start elapsed timer
    };
    utter.onend = () => {
      setSpeaking(false);
      utterRef.current = null;
      startTsRef.current = null;
      setElapsed((prev) => Math.min(estimatedDuration, prev));
      if (rafRef.current) {
        // visualiser will naturally quiet because speaking=false
      }
    };
    utter.onerror = (e) => {
      console.error("TTS error", e);
      setSpeaking(false);
      utterRef.current = null;
      startTsRef.current = null;
    };

    synthRef.current.speak(utter);
  }

  // stop speaking
  function stopSpeaking() {
    synthRef.current.cancel();
    setSpeaking(false);
    utterRef.current = null;
    startTsRef.current = null;
  }

  // Toggles
  function togglePlayPause() {
    if (speaking) {
      stopSpeaking();
    } else {
      startSpeaking();
    }
  }

  // elapsed timer while speaking (for progress bar)
  const timerRef = useRef(null);
  function tickTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!speaking || !startTsRef.current) return;
      const sec = (Date.now() - startTsRef.current) / 1000;
      setElapsed(sec);
      if (estimatedDuration && sec >= estimatedDuration + 1) {
        // safety stop
        stopSpeaking();
        clearInterval(timerRef.current);
      }
    }, 150);
  }
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // progress percent
  const progress = estimatedDuration > 0 ? Math.min(1, elapsed / estimatedDuration) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.player}>
        <div style={styles.coverAndInfo}>
          <div style={styles.cover}>
            {/* simple SVG avatar / cover */}
            <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="10" fill="#111827" />
              <g transform="translate(8,8)" fill="#fff" opacity="0.08">
                <rect x="0" y="0" width="48" height="48" rx="6" />
              </g>
              <g transform="translate(16,12)">
                <circle cx="12" cy="10" r="8" fill="#7C3AED" />
                <rect x="4" y="28" width="16" height="10" rx="3" fill="#06B6D4" />
              </g>
            </svg>
          </div>

          <div style={styles.info}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>TTS Player</div>
            <div style={{ marginTop: 6, color: "#475569" }}>{text.slice(0, 80) + (text.length > 80 ? "..." : "")}</div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={togglePlayPause} style={styles.playBtn} aria-label="play-pause">
                {speaking ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="5" width="4" height="14" rx="1" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#fff"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3v18l15-9L5 3z" fill="#fff"/></svg>
                )}
              </button>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Rate</div>
                <input
                  aria-label="rate"
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
                <div style={{ minWidth: 36, textAlign: "right", color: "#0f172a", fontWeight: 600 }}>{rate.toFixed(1)}x</div>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>Pitch</div>
                <input
                  aria-label="pitch"
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={styles.selectLabel}>
                Voice
                <select
                  value={selectedVoice || ""}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  style={styles.select}
                >
                  {voices.length === 0 && <option>Loading voices…</option>}
                  {voices.map((v) => (
                    <option key={v.name + v.lang} value={v.name}>
                      {v.name} — {v.lang} {v.default ? "(default)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ color: "#475569", fontSize: 13 }}>
                {Math.max(1, estimatedDuration)}s • {Math.max(1, text.trim().split(/\s+/).filter(Boolean).length)} words
              </div>
            </div>
          </div>
        </div>

        {/* Canvas visualiser */}
        <div style={styles.visualiserWrap}>
          <canvas ref={canvasRef} style={styles.canvas} />
          {/* progress overlay */}
          <div style={styles.progressBarOuter}>
            <div style={{ ...styles.progressBarInner, width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div style={styles.timeAndActions}>
            <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {formatTime(Math.round(elapsed))} / {formatTime(Math.round(estimatedDuration))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button title="Stop" onClick={stopSpeaking} style={styles.smallBtn}>Stop</button>
              <button
                title="Reset text"
                onClick={() => {
                  stopSpeaking();
                  setText("");
                }}
                style={styles.smallBtn}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* editable text area */}
        <div style={{ marginTop: 14 }}>
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to speak..."
            style={styles.textarea}
          />
        </div>
      </div>
    </div>
  );
}

// small helpers & styles
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "18px auto",
    padding: 14,
  },
  player: {
    background: "linear-gradient(180deg, #fff, #fbfbff)",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
    padding: 18,
    border: "1px solid rgba(15,23,42,0.04)",
  },
  coverAndInfo: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  cover: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    flex: "0 0 96px",
    boxShadow: "inset 0 -6px 18px rgba(0,0,0,0.06)",
  },
  info: {
    flex: 1,
    minWidth: 180,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "linear-gradient(180deg,#7c3aed,#5524c6)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    color: "#fff",
    boxShadow: "0 6px 18px rgba(124,58,237,0.18)",
    cursor: "pointer",
  },
  selectLabel: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "#f8fafc",
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid rgba(15,23,42,0.04)",
    fontSize: 13,
    color: "#0f172a",
  },
  select: {
    marginLeft: 8,
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 13,
  },
  visualiserWrap: {
    marginTop: 14,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    background: "linear-gradient(180deg, rgba(12,74,110,0.02), rgba(124,58,237,0.02))",
    padding: 12,
  },
  canvas: {
    width: "100%",
    height: 120,
    display: "block",
    borderRadius: 8,
    background: "linear-gradient(180deg, #f8fafc, #fff)",
    boxShadow: "inset 0 2px 8px rgba(2,6,23,0.02)",
  },
  progressBarOuter: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 6,
    background: "rgba(15,23,42,0.06)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    background: "linear-gradient(90deg, #7C3AED, #06B6D4)",
  },
  timeAndActions: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 26,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallBtn: {
    background: "#eef2ff",
    border: "1px solid rgba(99,102,241,0.06)",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.04)",
    padding: 12,
    fontSize: 14,
    resize: "vertical",
    boxShadow: "inset 0 2px 6px rgba(2,6,23,0.02)",
  },
};
