"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number; kind: "heart" | "name" };

const heartPoints = Array.from({ length: 86 }, (_, i) => {
  const t = (Math.PI * 2 * i) / 86;
  return {
    x: 50 + 2.65 * 16 * Math.pow(Math.sin(t), 3),
    y: 43 - 2.15 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
    kind: "heart" as const,
  };
});

const letters: Record<string, number[][]> = {
  B: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[2,0],[3,1],[2,2],[1,2],[2,2],[3,3],[2,4],[1,4]],
  U: [[0,0],[0,1],[0,2],[0,3],[1,4],[2,4],[3,3],[3,2],[3,1],[3,0]],
  S: [[3,0],[2,0],[1,0],[0,1],[1,2],[2,2],[3,3],[2,4],[1,4],[0,4]],
  E: [[3,0],[2,0],[1,0],[0,0],[0,1],[0,2],[1,2],[2,2],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4]],
};

const namePoints: Point[] = "BUSE".split("").flatMap((letter, index) =>
  letters[letter].map(([x, y]) => ({ x: 30 + index * 11 + x * 2.4, y: 77 + y * 2.5, kind: "name" as const }))
);
const allPoints = [...heartPoints, ...namePoints];
const verses = [
  ["B", "Bir ömre sığmayacak kadar çok seviyorum seni."],
  ["U", "Uzak ihtimalleri bile seninle güzel buluyorum."],
  ["S", "Sesin değince dünyamın bütün gürültüsü susuyor."],
  ["E", "En güzel yarınım, bugünümde açan çiçeğimsin."],
  ["N", "Nasıl anlatılır bilmiyorum; kalbim hep sana dönüyor."],
  ["U", "Uykudan önceki son, sabahımdaki ilk düşüncemsin."],
  ["R", "Ruhumun eve döndüğü yer sensin, Busenur."],
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const chime = useCallback(() => {
    if (!soundOn) return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audioRef.current || new AudioCtx();
    audioRef.current = ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 440 + Math.random() * 220;
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.35);
  }, [soundOn]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, rect.width, rect.height);
    setFinished(false);
    const scaleX = rect.width / 100, scaleY = rect.height / 100;
    let index = 0;
    const timer = window.setInterval(() => {
      if (index >= allPoints.length) {
        clearInterval(timer); setFinished(true); return;
      }
      const p = allPoints[index];
      const prev = index > 0 ? allPoints[index - 1] : null;
      const x = p.x * scaleX, y = p.y * scaleY;
      if (prev && prev.kind === p.kind) {
        ctx.beginPath(); ctx.moveTo(prev.x * scaleX, prev.y * scaleY); ctx.lineTo(x, y);
        ctx.strokeStyle = p.kind === "heart" ? "rgba(255,126,149,.72)" : "rgba(255,220,181,.72)";
        ctx.lineWidth = 1.15; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, p.kind === "heart" ? 2.1 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = p.kind === "heart" ? "#ff8da3" : "#ffe2bd";
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
      if (index % 12 === 0) chime();
      index++;
    }, 34);
    return () => clearInterval(timer);
  }, [chime]);

  useEffect(() => {
    if (!started) return;
    return draw();
  }, [started, draw]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const glow = document.querySelector<HTMLElement>(".cursor-glow");
      if (glow) { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    if (!started) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("revealed");
    }), { threshold: 0.55 });
    document.querySelectorAll(".verse").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [started]);

  return (
    <main className={started ? "is-started" : ""}>
      <div className="noise" /><div className="cursor-glow" />
      {!started && (
        <section className="intro" aria-label="Giriş">
          <p className="eyebrow">ONUR’DAN · SADECE BİR KİŞİ İÇİN</p>
          <h1>Buse’ye küçük<br />bir sürpriz.</h1>
          <p className="intro-copy">Bazı hisler cümlelere sığmıyor.<br />Onur da onları haritada nokta nokta çizdi.</p>
          <button className="open-button" onClick={() => setStarted(true)}><span>başlat</span><i>→</i></button>
          <p className="signature">Onur’dan Buse’ye, her seferinde yeniden.</p>
        </section>
      )}

      {started && (<>
        <section className="story" aria-live="polite">
          <header><span>ONUR × BUSE</span><button onClick={() => setSoundOn(v => !v)} aria-label="Sesi aç veya kapat">{soundOn ? "ses açık" : "sessiz"}</button></header>
          <div className="coordinates"><span>41°01′</span><span>29°00′</span></div>
          <iframe className="map-frame" title="İstanbul haritası" src="https://www.openstreetmap.org/export/embed.html?bbox=28.70%2C40.86%2C29.32%2C41.22&layer=mapnik" />
          <canvas ref={canvasRef} aria-label="Haritadaki noktalarla oluşan kalp ve Buse yazısı" />
          <div className={`message ${finished ? "visible" : ""}`}>
            <p>Onur’un kalbindeki bütün yollar</p>
            <h2>Buse’ye çıkıyor.</h2>
            <button onClick={draw}>bir daha çiz <span>↻</span></button>
          </div>
          <div className="counter">{finished ? allPoints.length : "…"}<small>küçük nokta, tek bir isim.</small></div>
          <footer><span>ONUR + BUSE</span><p>aşağı kaydır ↓</p><span>♥</span></footer>
        </section>
        <section className="poetry" aria-label="Busenur için akrostiş">
          <div className="poetry-head"><span>07 DİZE · TEK BİR HİS</span><h2>Sana söylemek<br />istediklerim var.</h2></div>
          {verses.map(([letter, line], index) => (
            <article className="verse" key={`${letter}-${index}`}>
              <span className="verse-no">0{index + 1}</span>
              <span className="letter">{letter}</span>
              <p>{line}</p>
              <i>{"BUSENUR".slice(0, index + 1)}</i>
            </article>
          ))}
          <div className="finale"><span>ve bütün yollar yine aynı yere çıkıyor</span><h2>ONUR + BUSE</h2><p>Seni, kelimelerin yetmediği yerden seviyorum.</p><b>♥</b></div>
        </section>
      </>)}
    </main>
  );
}
