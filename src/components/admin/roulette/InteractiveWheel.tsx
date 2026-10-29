"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Confetti from "react-confetti";
import { Play, RotateCcw, Maximize2, Minimize2, Volume2, VolumeX, Sparkles, X, Gamepad2, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameItem {
  id: string;
  name: string;
  categoryId: string;
  images?: string | null;
}

interface InteractiveWheelProps {
  games: GameItem[];
  spinDuration?: number; // en segundos
  title?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; stroke: string }> = {
  SHOOTER: { bg: "#dc2626", text: "#ffffff", stroke: "#ef4444" },
  RACING: { bg: "#0284c7", text: "#ffffff", stroke: "#38bdf8" },
  KOMBAT: { bg: "#ea580c", text: "#ffffff", stroke: "#f97316" },
  SPORTS: { bg: "#9333ea", text: "#ffffff", stroke: "#c084fc" },
  BOARD_GAME: { bg: "#059669", text: "#ffffff", stroke: "#34d399" },
  ARENA_MULTIGAMES: { bg: "#b45309", text: "#ffffff", stroke: "#eab308" },
};

// Alternate color palette in case multiple games share the same category
const FALLBACK_PALETTES = [
  "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#3b82f6",
  "#e11d48", "#10b981", "#6366f1", "#f97316", "#06b6d4"
];

export function InteractiveWheel({ games, spinDuration = 8, title }: InteractiveWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<GameItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // Physics & Animation Refs
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastPointerAngleRef = useRef(0);
  const lastPointerTimeRef = useRef(0);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const lastTickSectorRef = useRef<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pointerDownPosRef = useRef({ x: 0, y: 0, time: 0 });
  const totalDragAngleRef = useRef(0);
  const hasMovedRef = useRef(false);
  const moveHistoryRef = useRef<{ angle: number; time: number }[]>([]);

  // Resize listener for Confetti
  useEffect(() => {
    const updateSize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Web Audio API Synthesized Sounds
  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }, [soundEnabled]);

  const playFanfareSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.6);
      });
    } catch {}
  }, [soundEnabled]);

  // Preload Game Images
  useEffect(() => {
    games.forEach((game) => {
      let imageUrl: string | null = null;
      if (game.images) {
        try {
          const parsed = JSON.parse(game.images);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
            imageUrl = parsed[0];
          }
        } catch {}
      }
      if (imageUrl && !loadedImagesRef.current.has(game.id)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
          loadedImagesRef.current.set(game.id, img);
          drawWheel();
        };
      }
    });
  }, [games]);

  const numSectors = games.length || 1;
  const sectorAngle = (2 * Math.PI) / numSectors;

  // Determines current winning sector index at the top pointer (angle = 3*PI/2)
  const getSectorAtPointer = useCallback((curAngle: number) => {
    const pointerAngle = (3 * Math.PI) / 2;
    let rel = (pointerAngle - curAngle) % (2 * Math.PI);
    if (rel < 0) rel += 2 * Math.PI;
    return Math.floor(rel / sectorAngle) % numSectors;
  }, [numSectors, sectorAngle]);

  // Canvas Drawing Routine
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    // Leave 40px margin on each side for the outer glow shadow to breathe
    const radius = center - 40;

    ctx.clearRect(0, 0, size, size);

    // Outer Glow / Rim Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = "#09090b";
    ctx.shadowColor = "#eab308";
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();
    ctx.restore();

    // Metallic Rim with decorative pegs
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 2, 0, 2 * Math.PI);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#27272a";
    ctx.stroke();
    ctx.restore();

    // Draw Wheel Sectors
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angleRef.current);

    games.forEach((game, i) => {
      const startA = i * sectorAngle;
      const endA = startA + sectorAngle;
      const catStyle = CATEGORY_COLORS[game.categoryId] || {
        bg: FALLBACK_PALETTES[i % FALLBACK_PALETTES.length],
        text: "#ffffff",
        stroke: "#eab308"
      };

      // ---- Build the wedge clip path ----
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.clip(); // everything below is clipped to this wedge

      // 1. Base solid color fill
      const grad = ctx.createRadialGradient(0, 0, 30, 0, 0, radius);
      grad.addColorStop(0, catStyle.bg + "dd");
      grad.addColorStop(1, "#000000cc");
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. Draw game image — cover the entire wedge regardless of sector angle
      const img = loadedImagesRef.current.get(game.id);
      if (img && img.complete && img.naturalWidth > 0) {
        const midA = startA + sectorAngle / 2;

        ctx.save();
        // Rotate canvas so the sector bisector is along the +X axis
        ctx.rotate(midA);

        // In this rotated frame the wedge spans:
        //   X: 0 → radius
        //   Y: -halfH → +halfH  where halfH = radius * sin(sectorAngle/2)
        const halfH = radius * Math.sin(sectorAngle / 2);
        // Bounding box of the wedge: width=radius, height=2*halfH
        const boxW = radius;
        const boxH = Math.max(halfH * 2, 1);

        // Scale image to COVER the bounding box (like CSS background-size:cover)
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const boxAspect = boxW / boxH;
        let drawW: number, drawH: number;
        if (imgAspect > boxAspect) {
          // image wider than box → fit by height, crop width
          drawH = boxH * 1.05; // tiny overdraw to hide any aliasing edge
          drawW = drawH * imgAspect;
        } else {
          // image taller than box → fit by width, crop height
          drawW = boxW * 1.05;
          drawH = drawW / imgAspect;
        }

        // Center the image over the bounding box
        const drawX = boxW / 2 - drawW / 2;
        const drawY = -drawH / 2;

        ctx.globalAlpha = 0.88;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.globalAlpha = 1;
        ctx.restore();

        // Dark vignette: stronger at edges, lighter near center
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startA, endA);
        ctx.closePath();
        const vignette = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
        vignette.addColorStop(0, "rgba(0,0,0,0.25)");
        vignette.addColorStop(0.55, "rgba(0,0,0,0.05)");
        vignette.addColorStop(1,   "rgba(0,0,0,0.50)");
        ctx.fillStyle = vignette;
        ctx.fill();
      }

      // 3. Sector divider border
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.stroke();

      ctx.restore(); // end wedge clip

      // 4. Game name label — drawn outside the clip so it's always fully visible
      const midA = startA + sectorAngle / 2;
      const labelDist = radius * 0.80;
      const labelX = Math.cos(midA) * labelDist;
      const labelY = Math.sin(midA) * labelDist;

      ctx.save();
      ctx.translate(labelX, labelY);
      ctx.rotate(midA + Math.PI / 2); // rotate to read along the sector

      // Pill background
      let displayName = game.name;
      if (displayName.length > 14) displayName = displayName.substring(0, 13) + "…";

      ctx.font = `bold ${Math.max(10, Math.min(13, radius * 0.045))}px system-ui, sans-serif`;
      const textW = ctx.measureText(displayName).width;
      const pillH = 16;
      const pillPad = 5;

      ctx.fillStyle = "rgba(0,0,0,0.70)";
      ctx.beginPath();
      ctx.roundRect(-textW / 2 - pillPad, -pillH / 2, textW + pillPad * 2, pillH, 4);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.fillText(displayName, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();

      // 5. Golden pin at each sector boundary (drawn in world space)
      const pinX = Math.cos(startA) * (radius - 3);
      const pinY = Math.sin(startA) * (radius - 3);
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore(); // restore center translation & rotation

    // Center Hub (Golden Button)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 46, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(center, center, 5, center, center, 46);
    hubGrad.addColorStop(0, "#fbbf24");
    hubGrad.addColorStop(0.7, "#d97706");
    hubGrad.addColorStop(1, "#78350f");
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = "#00000099";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fef08a";
    ctx.stroke();

    // Center Hub Emblem
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#eab308";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.fillStyle = "#eab308";
    ctx.shadowBlur = 0;
    ctx.fillText("CHIMU", center, center - 6);
    ctx.font = "bold 9px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("WHEEL", center, center + 6);
    ctx.restore();

    // Top Pointer Arrow (Pin) pointing DOWN at center
    ctx.save();
    ctx.translate(center, center - radius - 16);
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(16, -10);
    ctx.lineTo(0, 26);
    ctx.closePath();
    ctx.fillStyle = "#eab308";
    ctx.shadowColor = "#eab308";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Pointer Center Dot
    ctx.beginPath();
    ctx.arc(0, -2, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.restore();
  }, [games, numSectors, sectorAngle]);

  // Redraw when angle or games change
  useEffect(() => {
    drawWheel();
  }, [angle, drawWheel]);

  // Handle Wheel Winner Announcement
  const handleWheelFinished = useCallback(() => {
    setIsSpinning(false);
    const winningIdx = getSectorAtPointer(angleRef.current);
    const winGame = games[winningIdx];
    if (winGame) {
      setWinner(winGame);
      setShowWinnerModal(true);
      playFanfareSound();
    }
  }, [games, getSectorAtPointer, playFanfareSound]);

  // 1. AUTO SPIN with configurable duration and easing
  const startAutoSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);

    // Calculate total rotations: at least 5 to 10 full turns + random target
    const extraTurns = 6 + Math.floor(Math.random() * 5);
    const targetSector = Math.floor(Math.random() * numSectors);
    // Align so targetSector lands at top pointer (3*PI/2)
    const targetSectorMid = targetSector * sectorAngle + sectorAngle / 2;
    const pointerAngle = (3 * Math.PI) / 2;
    const finalAngle = angleRef.current + extraTurns * 2 * Math.PI + (pointerAngle - targetSectorMid - (angleRef.current % (2 * Math.PI)));

    const startTime = performance.now();
    const durationMs = spinDuration * 1000;
    const startAngle = angleRef.current;
    const totalDelta = finalAngle - startAngle;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth custom cubic easing out: 1 - Math.pow(1 - progress, 3.5)
      const ease = 1 - Math.pow(1 - progress, 3.5);
      const current = startAngle + totalDelta * ease;
      angleRef.current = current;
      setAngle(current);

      // Tick sound when pointer enters a new sector
      const curSector = getSectorAtPointer(current);
      if (curSector !== lastTickSectorRef.current) {
        lastTickSectorRef.current = curSector;
        playTickSound();
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        handleWheelFinished();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // 2. INTERACTIVE DRAG & FLICK (Grab & Spin with momentum)
  const getPointerAngle = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (isSpinning) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    totalDragAngleRef.current = 0;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const initialAngle = getPointerAngle(e.clientX, e.clientY);
    lastPointerAngleRef.current = initialAngle;
    lastPointerTimeRef.current = performance.now();
    velocityRef.current = 0;
    moveHistoryRef.current = [{ angle: initialAngle, time: performance.now() }];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    if (Math.hypot(dx, dy) > 8) {
      hasMovedRef.current = true;
    }

    const currentAngle = getPointerAngle(e.clientX, e.clientY);
    const now = performance.now();

    // Delta angle with wrap-around normalization
    let delta = currentAngle - lastPointerAngleRef.current;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    totalDragAngleRef.current += Math.abs(delta);
    angleRef.current += delta;
    setAngle(angleRef.current);

    // Keep history for flick momentum estimation
    moveHistoryRef.current.push({ angle: currentAngle, time: now });
    moveHistoryRef.current = moveHistoryRef.current.filter((s) => now - s.time <= 140);

    // Tick sound check during manual drag
    const curSector = getSectorAtPointer(angleRef.current);
    if (curSector !== lastTickSectorRef.current) {
      lastTickSectorRef.current = curSector;
      playTickSound();
    }

    lastPointerAngleRef.current = currentAngle;
    lastPointerTimeRef.current = now;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const totalMoved = totalDragAngleRef.current;

    // If it was just a click/tap with no real drag movement → do nothing.
    // The user must drag and throw the wheel manually or use the GIRAR button.
    if (!hasMovedRef.current || totalMoved < 0.08) {
      return;
    }

    // Calculate flick velocity from recent movement history
    let calculatedVel = 0;
    const history = moveHistoryRef.current;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = last.time - first.time;
      if (dt > 8) {
        let dAngle = last.angle - first.angle;
        if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
        if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
        calculatedVel = dAngle / dt;
      }
    }

    // If the user dragged but released very slowly, still coast a little
    const MIN_SPEED = 0.003;
    let vel = calculatedVel;
    if (Math.abs(vel) < MIN_SPEED && totalMoved > 0.08) {
      vel = MIN_SPEED * (vel >= 0 ? 1 : -1);
    }

    // If still too slow to matter, just do nothing
    if (Math.abs(vel) < 0.001) return;

    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);

    const friction = 0.985; // natural decelerating rotational friction

    const coast = () => {
      vel *= friction;
      angleRef.current += vel * 16;
      setAngle(angleRef.current);

      const curSector = getSectorAtPointer(angleRef.current);
      if (curSector !== lastTickSectorRef.current) {
        lastTickSectorRef.current = curSector;
        playTickSound();
      }

      if (Math.abs(vel) > 0.0001) {
        animFrameRef.current = requestAnimationFrame(coast);
      } else {
        handleWheelFinished();
      }
    };

    animFrameRef.current = requestAnimationFrame(coast);
  };

  // Toggle Fullscreen (Ideal for projector / event screen)
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-3"
          : "rounded-3xl flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-black border border-gray-800 p-6 md:p-8 shadow-2xl"
      }`}
    >
      {/* Confetti Explosion on Winner */}
      {showWinnerModal && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
        />
      )}

      {/* Top Bar: Title & Controls */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 mb-4 z-20">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            {title || "Ruleta de Juegos"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Presioná <span className="text-yellow-400 font-bold">GIRAR</span> o{" "}
            <span className="text-yellow-400 font-bold">agarrá la ruleta con el mouse / dedo</span> para darle tu propio impulso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="text-gray-400 hover:text-white hover:bg-gray-800 h-9 w-9 rounded-xl border border-gray-800"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white hover:bg-gray-800 h-9 w-9 rounded-xl border border-gray-800"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa para el evento"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-yellow-400" />}
          </Button>
        </div>
      </div>

      {/* Main Wheel Canvas Area – flex-1 so it fills remaining vertical space in fullscreen */}
      <div className={`relative flex items-center justify-center ${
        isFullscreen ? "flex-1 w-full" : ""
      }`}>
        <canvas
          ref={canvasRef}
          width={720}
          height={720}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={isFullscreen ? {
            /* Square that fits inside the remaining height AND width, with breathing room */
            width:  "min(calc(100vh - 120px), calc(100vw - 32px))",
            height: "min(calc(100vh - 120px), calc(100vw - 32px))",
          } : undefined}
          className={`cursor-grab active:cursor-grabbing touch-none ${
            isFullscreen
              ? ""
              : "w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[580px] md:h-[580px] max-w-full"
          }`}
        />

        {/* Center Spin Trigger Button Overlay */}
        <button
          type="button"
          disabled={isSpinning}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={startAutoSpin}
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 text-black font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:shadow-[0_0_45px_rgba(234,179,8,0.9)] hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSpinning ? (
            <span className="text-[10px] animate-pulse">GIRANDO</span>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black" />
              <span>GIRAR</span>
            </>
          )}
        </button>
      </div>

      {/* Winner Modal Announcement */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-gray-950 border-2 border-yellow-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-[0_0_60px_rgba(234,179,8,0.4)] relative">
            <button
              onClick={() => setShowWinnerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold tracking-widest text-yellow-400 uppercase bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full inline-block">
                🏆 ¡JUEGO SELECCIONADO!
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {winner.name}
              </h3>
            </div>

            {/* Winner Game Cover */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-700 bg-black shadow-2xl">
              {(() => {
                let imgUrl: string | null = null;
                if (winner.images) {
                  try {
                    const p = JSON.parse(winner.images);
                    if (Array.isArray(p) && p.length > 0) imgUrl = p[0];
                  } catch {}
                }
                return imgUrl ? (
                  <img src={imgUrl} alt={winner.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                    <Gamepad2 className="w-12 h-12 text-primary opacity-40" />
                    <span className="text-xs text-gray-400">Sin imagen</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowWinnerModal(false);
                  startAutoSpin();
                }}
                className="flex-1 bg-primary text-black hover:bg-yellow-400 font-bold h-11 rounded-xl gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                Girar de Nuevo
              </Button>
              <Button
                onClick={() => setShowWinnerModal(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-600 h-11 px-6 rounded-xl cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
