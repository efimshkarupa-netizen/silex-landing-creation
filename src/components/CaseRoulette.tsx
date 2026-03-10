import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

const COIN_SIZE = 90;
const VISIBLE_COINS = 5;
const TOTAL_COINS = 50;
const SPIN_DURATION = 4500;

type Rarity = "common" | "rare" | "epic" | "legendary";

interface Coin {
  value: number;
  label: string;
  rarity: Rarity;
}

const RARITY_COLORS: Record<Rarity, {
  bg1: string; bg2: string; bg3: string;
  glow: string; border: string; text: string;
  confetti: string[];
}> = {
  common: {
    bg1: "#6b7280", bg2: "#4b5563", bg3: "#374151",
    glow: "rgba(156,163,175,0.7)", border: "#9ca3af", text: "#e5e7eb",
    confetti: ["#9ca3af", "#d1d5db", "#6b7280", "#f3f4f6"],
  },
  rare: {
    bg1: "#3b82f6", bg2: "#1d4ed8", bg3: "#1e3a8a",
    glow: "rgba(59,130,246,0.8)", border: "#60a5fa", text: "#bfdbfe",
    confetti: ["#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#06b6d4"],
  },
  epic: {
    bg1: "#a855f7", bg2: "#7c3aed", bg3: "#581c87",
    glow: "rgba(168,85,247,0.85)", border: "#c084fc", text: "#e9d5ff",
    confetti: ["#a855f7", "#c084fc", "#d8b4fe", "#f472b6", "#ec4899", "#7c3aed"],
  },
  legendary: {
    bg1: "#f59e0b", bg2: "#d97706", bg3: "#b45309",
    glow: "rgba(251,191,36,0.95)", border: "#fbbf24", text: "#fef08a",
    confetti: ["#fbbf24", "#fde68a", "#f59e0b", "#fb923c", "#ef4444", "#a3e635", "#34d399"],
  },
};

interface PrizeTier {
  values: number[];
  weight: number;
  rarity: Rarity;
}

interface CaseConfig {
  tiers: PrizeTier[];
}

function getCaseConfig(caseValue: number): CaseConfig {
  const r = (n: number) => {
    if (caseValue >= 100) return Math.round(n);
    if (caseValue >= 20) return Math.round(n * 10) / 10;
    return Math.round(n * 100) / 100;
  };

  const configs: Record<number, CaseConfig> = {
    10: {
      tiers: [
        { rarity: "common",    weight: 60, values: [r(1), r(1.5), r(2), r(2.5), r(3)] },
        { rarity: "rare",      weight: 28, values: [r(4), r(5), r(6), r(7)] },
        { rarity: "epic",      weight: 10, values: [r(10), r(12), r(15)] },
        { rarity: "legendary", weight: 2,  values: [r(20), r(25)] },
      ],
    },
    15: {
      tiers: [
        { rarity: "common",    weight: 60, values: [r(1.5), r(2), r(3), r(4)] },
        { rarity: "rare",      weight: 28, values: [r(6), r(8), r(10), r(12)] },
        { rarity: "epic",      weight: 10, values: [r(18), r(22), r(27)] },
        { rarity: "legendary", weight: 2,  values: [r(38), r(45)] },
      ],
    },
    20: {
      tiers: [
        { rarity: "common",    weight: 58, values: [r(2), r(3), r(4), r(5), r(6)] },
        { rarity: "rare",      weight: 28, values: [r(8), r(10), r(13), r(16)] },
        { rarity: "epic",      weight: 11, values: [r(25), r(32), r(40)] },
        { rarity: "legendary", weight: 3,  values: [r(60), r(80)] },
      ],
    },
    25: {
      tiers: [
        { rarity: "common",    weight: 57, values: [r(2.5), r(4), r(6), r(8)] },
        { rarity: "rare",      weight: 28, values: [r(12), r(16), r(20), r(24)] },
        { rarity: "epic",      weight: 11, values: [r(35), r(45), r(55)] },
        { rarity: "legendary", weight: 4,  values: [r(80), r(100), r(125)] },
      ],
    },
    50: {
      tiers: [
        { rarity: "common",    weight: 55, values: [r(5), r(8), r(10), r(12), r(15)] },
        { rarity: "rare",      weight: 28, values: [r(25), r(32), r(40), r(48)] },
        { rarity: "epic",      weight: 12, values: [r(70), r(90), r(115)] },
        { rarity: "legendary", weight: 5,  values: [r(180), r(250), r(300)] },
      ],
    },
    100: {
      tiers: [
        { rarity: "common",    weight: 53, values: [r(10), r(15), r(20), r(25), r(30)] },
        { rarity: "rare",      weight: 28, values: [r(50), r(65), r(80), r(95)] },
        { rarity: "epic",      weight: 13, values: [r(140), r(180), r(230)] },
        { rarity: "legendary", weight: 6,  values: [r(400), r(550), r(700)] },
      ],
    },
    260: {
      tiers: [
        { rarity: "common",    weight: 52, values: [r(25), r(40), r(55), r(70), r(85)] },
        { rarity: "rare",      weight: 28, values: [r(130), r(170), r(210), r(250)] },
        { rarity: "epic",      weight: 13, values: [r(380), r(500), r(630)] },
        { rarity: "legendary", weight: 7,  values: [r(1100), r(1500), r(2000)] },
      ],
    },
    500: {
      tiers: [
        { rarity: "common",    weight: 50, values: [r(50), r(75), r(100), r(130), r(160)] },
        { rarity: "rare",      weight: 28, values: [r(260), r(340), r(420), r(490)] },
        { rarity: "epic",      weight: 14, values: [r(750), r(1000), r(1300)] },
        { rarity: "legendary", weight: 8,  values: [r(2500), r(3500), r(5000)] },
      ],
    },
    670: {
      tiers: [
        { rarity: "common",    weight: 49, values: [r(65), r(100), r(140), r(180), r(220)] },
        { rarity: "rare",      weight: 28, values: [r(350), r(460), r(560), r(660)] },
        { rarity: "epic",      weight: 14, values: [r(1000), r(1400), r(1800)] },
        { rarity: "legendary", weight: 9,  values: [r(3500), r(5000), r(7000)] },
      ],
    },
    999: {
      tiers: [
        { rarity: "common",    weight: 48, values: [r(100), r(150), r(200), r(260), r(320)] },
        { rarity: "rare",      weight: 27, values: [r(520), r(680), r(840), r(980)] },
        { rarity: "epic",      weight: 15, values: [r(1500), r(2000), r(2700)] },
        { rarity: "legendary", weight: 10, values: [r(5000), r(7500), r(10000)] },
      ],
    },
  };

  if (configs[caseValue]) return configs[caseValue];

  const scale = caseValue / 100;
  return {
    tiers: [
      { rarity: "common",    weight: 55, values: [r(caseValue * 0.1), r(caseValue * 0.15), r(caseValue * 0.2), r(caseValue * 0.25)] },
      { rarity: "rare",      weight: 28, values: [r(caseValue * 0.5), r(caseValue * 0.65), r(caseValue * 0.8), r(caseValue * 0.95)] },
      { rarity: "epic",      weight: 12, values: [r(caseValue * 1.4), r(caseValue * 1.8), r(caseValue * 2.3)] },
      { rarity: "legendary", weight: 5,  values: [r(caseValue * 4 * scale + caseValue * 2), r(caseValue * 5.5)] },
    ],
  };
}

function pickTier(tiers: PrizeTier[]): PrizeTier {
  const total = tiers.reduce((s, t) => s + t.weight, 0);
  let rand = Math.random() * total;
  for (const tier of tiers) {
    rand -= tier.weight;
    if (rand <= 0) return tier;
  }
  return tiers[0];
}

function generateCoins(currencySymbol: string, caseValue: number): Coin[] {
  const { tiers } = getCaseConfig(caseValue);
  const coins: Coin[] = [];
  for (let i = 0; i < TOTAL_COINS; i++) {
    const tier = pickTier(tiers);
    const val = tier.values[Math.floor(Math.random() * tier.values.length)];
    coins.push({ value: val, label: `${val}${currencySymbol}`, rarity: tier.rarity });
  }
  return coins;
}

function pickWinValue(caseValue: number): { value: number; rarity: Rarity } {
  const { tiers } = getCaseConfig(caseValue);
  const rand = Math.random();

  let tier: PrizeTier;
  if (rand < 0.50)      tier = tiers[0];
  else if (rand < 0.78) tier = tiers[1];
  else if (rand < 0.94) tier = tiers[2];
  else                  tier = tiers[3];

  const value = tier.values[Math.floor(Math.random() * tier.values.length)];
  return { value, rarity: tier.rarity };
}

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
  shape: "rect" | "circle" | "star";
  delay: number;
  duration: number;
}

function Confetti({ active, rarity }: { active: boolean; rarity: Rarity }) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const colors = RARITY_COLORS[rarity].confetti;
  const count = rarity === "legendary" ? 90 : rarity === "epic" ? 70 : rarity === "rare" ? 50 : 30;

  useEffect(() => {
    if (!active) return;
    const pts: ConfettiParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1.2,
      shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 2,
    }));
    setParticles(pts);
    const timeout = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timeout);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.shape === "star" ? 12 : p.shape === "circle" ? 8 : 8,
            height: p.shape === "star" ? 12 : p.shape === "circle" ? 8 : 12,
            background: p.shape === "circle" ? p.color : undefined,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "rect" ? "2px" : "0",
            color: p.shape === "star" ? p.color : undefined,
            fontSize: p.shape === "star" ? 14 : undefined,
            backgroundColor: p.shape === "rect" ? p.color : undefined,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            animation: `confettiFall ${p.duration}s ease-in forwards`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        >
          {p.shape === "star" ? "★" : null}
        </div>
      ))}
    </div>
  );
}

function CoinVisual({
  rarity,
  value,
  symbol,
  size,
  isWin,
  spinning,
}: {
  rarity: Rarity;
  value: number;
  symbol: string;
  size: number;
  isWin?: boolean;
  spinning?: boolean;
}) {
  const rc = RARITY_COLORS[rarity];
  const fontSize = size < 70 ? (value >= 100 ? 11 : 13) : size < 100 ? (value >= 100 ? 13 : 16) : (value >= 1000 ? 28 : value >= 100 ? 34 : 40);
  const symSize = size < 70 ? 10 : size < 100 ? 14 : 20;

  return (
    <div
      className="relative flex-shrink-0 flex flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 28%, ${rc.bg1}, ${rc.bg2} 50%, ${rc.bg3})`,
        border: `${size >= 140 ? 3 : 2}px solid ${isWin ? rc.border : rc.border + "88"}`,
        boxShadow: isWin
          ? `0 0 30px ${rc.glow}, 0 0 60px ${rc.glow}66, inset 0 1px 0 rgba(255,255,255,0.3)`
          : `0 0 10px ${rc.glow}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
        animation: isWin ? "coinPulse 0.8s ease-in-out infinite" : spinning ? "coinSpin 0.3s linear infinite" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.35), transparent 55%)" }}
      />
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at 65% 80%, rgba(0,0,0,0.3), transparent 50%)" }}
      />
      {size >= 140 && (
        <div
          className="absolute inset-3 rounded-full pointer-events-none"
          style={{ border: `1px solid ${rc.border}44` }}
        />
      )}
      <span
        className="font-extrabold relative z-10 leading-none"
        style={{
          fontSize,
          color: "#fff",
          textShadow: `0 0 12px ${rc.glow}, 0 2px 4px rgba(0,0,0,0.9)`,
        }}
      >
        {value}
      </span>
      <span
        className="font-bold relative z-10 leading-none"
        style={{
          fontSize: symSize,
          color: rc.text,
          textShadow: `0 0 8px ${rc.glow}`,
        }}
      >
        {symbol}
      </span>
    </div>
  );
}

const GAME_BALANCE_URL = "https://functions.poehali.dev/64bf4a3e-c7fb-44f5-a1a9-b70cae660400";

async function apiBet(userId: string, amount: number, currency: string): Promise<{ ok: boolean; balance?: number; error?: string }> {
  try {
    const res = await fetch(GAME_BALANCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "bet", amount, currency }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    return { ok: true, balance: data.balance };
  } catch {
    return { ok: false, error: "network" };
  }
}

async function apiWin(userId: string, amount: number, currency: string): Promise<{ ok: boolean; balance?: number }> {
  try {
    const res = await fetch(GAME_BALANCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "win", amount, currency }),
    });
    const data = await res.json();
    return { ok: res.ok, balance: data.balance };
  } catch {
    return { ok: false };
  }
}

interface CaseRouletteProps {
  caseValue: number;
  currency: "usdt" | "stars";
  balance: number;
  userId: string;
  onBalanceSet: (balance: number) => void;
  onClose: () => void;
}

export default function CaseRoulette({ caseValue, currency, balance, userId, onBalanceSet, onClose }: CaseRouletteProps) {
  const currencySymbol = currency === "usdt" ? "$" : "★";
  const [coins, setCoins] = useState<Coin[]>(() => generateCoins(currencySymbol, caseValue));
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [winCoin, setWinCoin] = useState<Coin | null>(null);
  const [offset, setOffset] = useState(0);
  const [notEnough, setNotEnough] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [phase, setPhase] = useState<"spin" | "result">("spin");
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const winIndexRef = useRef(0);
  const spinningRef = useRef(false);
  const finishedRef = useRef(false);
  const balanceRef = useRef(balance);

  useEffect(() => { balanceRef.current = balance; }, [balance]);

  const runSpin = useCallback(async (currentCoins: Coin[]) => {
    if (spinningRef.current || finishedRef.current) return;

    if (balanceRef.current < caseValue) {
      setNotEnough(true);
      return;
    }

    const betResult = await apiBet(userId, caseValue, currency);
    if (!betResult.ok) {
      setNotEnough(true);
      return;
    }
    if (betResult.balance !== undefined) onBalanceSet(betResult.balance);

    const win = pickWinValue(caseValue);
    const desiredWinValue = win.value;
    const desiredRarity = win.rarity;
    let targetIdx = currentCoins.findIndex((c) => c.value === desiredWinValue);
    if (targetIdx === -1 || targetIdx < VISIBLE_COINS + 5) {
      for (let i = TOTAL_COINS - 10; i >= VISIBLE_COINS + 5; i--) {
        if (currentCoins[i].value === desiredWinValue) { targetIdx = i; break; }
      }
    }
    if (targetIdx < VISIBLE_COINS + 5) {
      currentCoins[TOTAL_COINS - 8] = { value: desiredWinValue, label: `${desiredWinValue}${currencySymbol}`, rarity: desiredRarity };
      targetIdx = TOTAL_COINS - 8;
    }

    winIndexRef.current = targetIdx;
    spinningRef.current = true;
    setSpinning(true);

    const containerWidth = containerRef.current?.offsetWidth || COIN_SIZE * VISIBLE_COINS;
    const centerOffset = containerWidth / 2 - COIN_SIZE / 2;
    const targetOffset = targetIdx * (COIN_SIZE + 16) - centerOffset;
    const startTime = performance.now();

    function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4); }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      setOffset(targetOffset * easeOutQuart(progress));

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        spinningRef.current = false;
        finishedRef.current = true;
        setSpinning(false);
        setFinished(true);
        const wc = currentCoins[targetIdx];
        setWinCoin(wc);
        apiWin(userId, wc.value, currency).then((res) => {
          if (res.balance !== undefined) onBalanceSet(res.balance);
        });
        setTimeout(() => {
          setShowResult(true);
          setPhase("result");
          setConfettiActive(true);
        }, 600);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [caseValue, currencySymbol, userId, currency, onBalanceSet]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    const coinsSnap = coins;
    const timer = setTimeout(() => runSpin(coinsSnap), 600);
    return () => clearTimeout(timer);
  }, []); // только при монтировании

  const handleOpenAgain = async () => {
    if (balanceRef.current < caseValue) { setNotEnough(true); return; }

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const newCoins = generateCoins(currencySymbol, caseValue);
    spinningRef.current = false;
    finishedRef.current = false;

    setCoins(newCoins);
    setSpinning(false);
    setFinished(false);
    setWinCoin(null);
    setOffset(0);
    setNotEnough(false);
    setShowResult(false);
    setConfettiActive(false);
    setPhase("spin");

    setTimeout(() => runSpin(newCoins), 100);
  };

  const winRarityData = winCoin ? RARITY_COLORS[winCoin.rarity] : null;

  const rarityLabel: Record<Rarity, string> = {
    common: "Обычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
  };

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes spinnerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(74,222,128,0.4); }
          50%       { box-shadow: 0 0 50px rgba(74,222,128,1), 0 0 80px rgba(74,222,128,0.5); }
        }
        @keyframes coinPulse {
          0%, 100% { transform: scale(1.08); }
          50%       { transform: scale(1.16); }
        }
        @keyframes coinSpin {
          0%   { filter: brightness(1); }
          50%  { filter: brightness(1.3); }
          100% { filter: brightness(1); }
        }
        @keyframes resultSlideUp {
          from { opacity: 0; transform: translateY(50px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bigCoinAppear {
          0%   { opacity: 0; transform: scale(0.2) rotate(-30deg); }
          60%  { transform: scale(1.18) rotate(6deg); }
          80%  { transform: scale(0.94) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes starSparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes floatDot {
          0%   { opacity: 0; transform: translateY(0) scale(0.8); }
          30%  { opacity: 1; transform: translateY(-6px) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.6); }
        }
        @keyframes shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes rarityBadgePop {
          0%   { opacity: 0; transform: scale(0.5); }
          70%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[300] flex flex-col"
        style={{ background: "linear-gradient(180deg, #080812 0%, #0d0d1f 50%, #08080f 100%)" }}
      >
        {phase === "spin" && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 pt-5 pb-4">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
              >
                <Icon name="ChevronLeft" size={18} />
                <span className="text-sm">Другие кейсы</span>
              </button>
              <div className="text-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest">Кейс</div>
                <div className="text-white font-bold text-base">{caseValue}{currencySymbol}</div>
              </div>
              <div className="w-20" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
              <div className="w-full relative">
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-4 z-30"
                  style={{ filter: "drop-shadow(0 0 10px #4ade80)" }}
                >
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#4ade80]" />
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-4 z-30"
                  style={{ filter: "drop-shadow(0 0 10px #4ade80)" }}
                >
                  <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[20px] border-l-transparent border-r-transparent border-b-[#4ade80]" />
                </div>

                <div
                  className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] z-20 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, transparent, #4ade80 30%, #4ade80 70%, transparent)",
                    animation: spinning ? "spinnerGlow 0.7s ease-in-out infinite" : "none",
                    boxShadow: "0 0 14px rgba(74,222,128,0.8)",
                  }}
                />

                <div
                  className="overflow-hidden rounded-2xl"
                  ref={containerRef}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: spinning
                      ? "0 0 50px rgba(74,222,128,0.2), inset 0 0 40px rgba(0,0,0,0.5)"
                      : "inset 0 0 40px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="py-3 px-2">
                    <div
                      className="flex gap-4"
                      style={{ transform: `translateX(-${offset}px)`, willChange: "transform" }}
                    >
                      {coins.map((coin, i) => {
                        const isWin = finished && i === winIndexRef.current;
                        return (
                          <CoinVisual
                            key={i}
                            rarity={coin.rarity}
                            value={coin.value}
                            symbol={currencySymbol}
                            size={COIN_SIZE}
                            isWin={isWin}
                            spinning={spinning}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div
                  className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none rounded-l-2xl"
                  style={{ background: "linear-gradient(90deg, #080812, transparent)" }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none rounded-r-2xl"
                  style={{ background: "linear-gradient(270deg, #080812, transparent)" }}
                />
              </div>

              {spinning && (
                <div className="flex gap-2 items-end h-6">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: `hsl(${120 + i * 30}, 80%, 60%)`,
                        animation: `floatDot 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {notEnough && !spinning && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Icon name="AlertCircle" size={28} className="text-red-400" />
                  </div>
                  <span className="text-red-400 font-bold text-base">Недостаточно средств</span>
                  <span className="text-white/40 text-sm text-center">
                    Нужно {caseValue}{currencySymbol} — у тебя {currency === "usdt" ? balance.toFixed(2) : Math.floor(balance)}{currencySymbol}
                  </span>
                </div>
              )}
            </div>

            <div className="px-4 pb-8 pt-4">
              <button
                onClick={onClose}
                disabled={spinning}
                className="w-full py-4 rounded-2xl text-white/60 text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {spinning ? "Крутим..." : "Закрыть"}
              </button>
            </div>
          </div>
        )}

        {phase === "result" && winCoin && winRarityData && showResult && (
          <div className="relative flex flex-col h-full items-center overflow-hidden">
            <Confetti active={confettiActive} rarity={winCoin.rarity} />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 35%, ${winRarityData.glow}30 0%, transparent 65%)`,
                animation: "glowPulse 2s ease-in-out infinite",
              }}
            />

            <div className="flex items-center justify-between w-full px-4 pt-5 pb-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
              >
                <Icon name="ChevronLeft" size={18} />
                <span className="text-sm">Другие кейсы</span>
              </button>
              <div className="w-16" />
            </div>

            <div
              className="flex flex-col items-center flex-1 justify-center px-8 w-full"
              style={{ animation: "resultSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
            >
              <div className="text-white/50 text-sm mb-1 tracking-wide uppercase">Поздравляем!</div>
              <div className="text-white font-extrabold text-3xl mb-8">Вы выиграли</div>

              <div className="relative mb-6">
                {[...Array(winCoin.rarity === "legendary" ? 12 : winCoin.rarity === "epic" ? 10 : 8)].map((_, i) => {
                  const total = winCoin.rarity === "legendary" ? 12 : winCoin.rarity === "epic" ? 10 : 8;
                  const sparkleColors = winRarityData.confetti;
                  return (
                    <div
                      key={i}
                      className="absolute text-base"
                      style={{
                        top: `${50 + 58 * Math.sin((i * Math.PI * 2) / total)}%`,
                        left: `${50 + 58 * Math.cos((i * Math.PI * 2) / total)}%`,
                        transform: "translate(-50%, -50%)",
                        animation: `starSparkle 1.8s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                        color: sparkleColors[i % sparkleColors.length],
                        filter: `drop-shadow(0 0 4px ${sparkleColors[i % sparkleColors.length]})`,
                      }}
                    >
                      {winCoin.rarity === "legendary" ? "★" : "✦"}
                    </div>
                  );
                })}

                <CoinVisual
                  rarity={winCoin.rarity}
                  value={winCoin.value}
                  symbol={currencySymbol}
                  size={192}
                />
              </div>

              <div
                className="px-5 py-1.5 rounded-full text-sm font-bold mb-8"
                style={{
                  background: `${winRarityData.border}25`,
                  border: `1px solid ${winRarityData.border}77`,
                  color: winRarityData.text,
                  animation: "rarityBadgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
                  boxShadow: `0 0 16px ${winRarityData.glow}44`,
                }}
              >
                {rarityLabel[winCoin.rarity]}
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleOpenAgain}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${winRarityData.bg1}, ${winRarityData.bg2})`,
                    color: winCoin.rarity === "legendary" ? "#1a0a00" : "#fff",
                    boxShadow: `0 4px 24px ${winRarityData.glow}77`,
                    border: `1px solid ${winRarityData.border}55`,
                  }}
                >
                  Открыть ещё раз за {caseValue}{currencySymbol}
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-semibold text-sm text-white/70 transition-all active:scale-[0.97]"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Забрать и выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}