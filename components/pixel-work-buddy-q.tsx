"use client";

import { useMemo } from "react";

type MoodOption = "干劲满满" | "普通营业" | "累了" | "想吃点好的" | "快下班吧";
type SceneMood = "calm" | "happy" | "angry" | "tired";

function toSceneMood(mood: MoodOption): SceneMood {
  switch (mood) {
    case "干劲满满":
      return "happy";
    case "累了":
      return "tired";
    case "想吃点好的":
      return "happy";
    case "快下班吧":
      return "angry";
    case "普通营业":
    default:
      return "calm";
  }
}

function getFaces(mood: SceneMood) {
  const map = {
    calm: {
      cowMouth: "M-10,28 Q0,32 10,28",
      horseMouth: "M-9,34 Q0,38 9,34",
      cowBrowL: "M-21,-9 Q-14,-12 -7,-10",
      cowBrowR: "M7,-10 Q14,-12 21,-9",
      horseBrowL: "M-16,-5 Q-10,-7 -4,-5",
      horseBrowR: "M4,-5 Q10,-7 16,-5",
      eyeScale: 1,
    },
    happy: {
      cowMouth: "M-11,28 Q0,38 11,28",
      horseMouth: "M-10,34 Q0,44 10,34",
      cowBrowL: "M-21,-12 Q-14,-18 -7,-12",
      cowBrowR: "M7,-12 Q14,-18 21,-12",
      horseBrowL: "M-16,-8 Q-10,-13 -4,-8",
      horseBrowR: "M4,-8 Q10,-13 16,-8",
      eyeScale: 1,
    },
    angry: {
      cowMouth: "M-10,30 Q0,24 10,30",
      horseMouth: "M-9,36 Q0,30 9,36",
      cowBrowL: "M-18,-6 L-8,-14",
      cowBrowR: "M8,-14 L18,-6",
      horseBrowL: "M-14,-2 L-6,-10",
      horseBrowR: "M6,-10 L14,-2",
      eyeScale: 0.9,
    },
    tired: {
      cowMouth: "M-6,26 Q0,31 6,26",
      horseMouth: "M-5,33 Q0,38 5,33",
      cowBrowL: "M-20,-8 Q-14,-10 -8,-8",
      cowBrowR: "M8,-8 Q14,-10 20,-8",
      horseBrowL: "M-14,-3 Q-9,-5 -4,-4",
      horseBrowR: "M4,-4 Q9,-5 14,-3",
      eyeScale: 0.56,
    },
  } as const;

  return map[mood];
}

export function PixelWorkBuddy({ mood }: { mood: MoodOption }) {
  const sceneMood = useMemo(() => toSceneMood(mood), [mood]);
  const face = useMemo(() => getFaces(sceneMood), [sceneMood]);

  return (
    <div className="relative flex h-full min-h-[420px] w-full items-center justify-center overflow-hidden rounded-sm bg-[#f0ede8]">
      <svg
        viewBox="0 0 960 620"
        className="h-full w-full"
        role="img"
        aria-label="牛马搭子一起在工位上班"
      >
        <defs>
          <pattern id="office-dot" patternUnits="userSpaceOnUse" width="26" height="26">
            <circle cx="13" cy="13" r="0.7" fill="#e1dad0" />
          </pattern>
          <linearGradient id="office-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8dd2ff" />
            <stop offset="100%" stopColor="#e0f4ff" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="960" height="620" fill="#f0ede8" />
        <rect x="0" y="0" width="960" height="620" fill="url(#office-dot)" opacity="0.65" />
        <rect x="0" y="334" width="960" height="6" fill="#ddd7cf" />

        <g transform="translate(54,42)">
          <rect x="0" y="0" width="244" height="186" rx="8" fill="#c8d7df" stroke="#d4cec6" strokeWidth="3" />
          <rect x="8" y="8" width="228" height="170" rx="4" fill="url(#office-sky)" />
          <line x1="114" y1="0" x2="114" y2="186" stroke="#d4cec6" strokeWidth="2" />
          <line x1="0" y1="94" x2="244" y2="94" stroke="#d4cec6" strokeWidth="2" />
          <ellipse cx="68" cy="52" rx="24" ry="12" fill="#fff" opacity="0.6" />
          <ellipse cx="168" cy="68" rx="20" ry="10" fill="#fff" opacity="0.46" />
          <path d="M12 170V106h18v64h16V82h20v88h16V70h30v100h18V94h18v76h18V76h26v94h18v-58h14v58h20v16H12z" fill="#7fa8cb" opacity="0.72" />
          <path d="M26 170v-36h14v36h14v-50h16v50h18V94h18v76h14v-60h16v60h16v-28h12v28h22v16H26z" fill="#a7c8df" opacity="0.78" />
        </g>

        <g transform="translate(810,92)">
          <circle cx="0" cy="0" r="40" fill="#fff" stroke="#d4cec6" strokeWidth="3" />
          <circle cx="0" cy="0" r="3" fill="#b88867" />
          <line x1="0" y1="0" x2="-8" y2="-18" stroke="#5c4a3a" strokeWidth="4" strokeLinecap="round" />
          <line x1="0" y1="0" x2="18" y2="-4" stroke="#5c4a3a" strokeWidth="3" strokeLinecap="round" />
        </g>

        <g transform="translate(754,198)">
          <rect x="0" y="0" width="130" height="150" fill="#956a43" stroke="#735033" strokeWidth="4" />
          <rect x="16" y="48" width="28" height="82" fill="#ece2d7" stroke="#5f83a7" strokeWidth="4" />
          <rect x="52" y="48" width="28" height="82" fill="#ece2d7" stroke="#7294b7" strokeWidth="4" />
          <rect x="88" y="48" width="18" height="82" fill="#ddd4cd" stroke="#455e79" strokeWidth="4" />
          <rect x="10" y="-14" width="86" height="20" fill="#b9814d" stroke="#8f613a" strokeWidth="4" />
          <g className="office-plant" transform="translate(54,-14)">
            <path d="M-16,16 Q-24,0 -20,-18 Q-10,-4 -6,12 Z" fill="#6e9b48" />
            <path d="M-4,14 Q-4,-2 4,-24 Q10,-8 6,12 Z" fill="#85b35b" />
            <path d="M8,14 Q18,0 24,-14 Q22,4 12,14 Z" fill="#709949" />
          </g>
        </g>

        <g transform="translate(138, 202) scale(3.02)">
          <ellipse cx="45" cy="72" rx="44" ry="34" fill="#fafaf7" />
          <ellipse cx="28" cy="62" rx="14" ry="11" fill="#2c2c2c" opacity="0.55" />
          <ellipse cx="65" cy="80" rx="11" ry="9" fill="#2c2c2c" opacity="0.45" />
          <path d="M5,66 Q0,81 20,91" fill="none" stroke="#fafaf7" strokeWidth="14" strokeLinecap="round" />
          <path d="M85,66 Q90,81 70,91" fill="none" stroke="#fafaf7" strokeWidth="14" strokeLinecap="round" />

          <g transform="translate(45, 6)">
            <path d="M-18,-20 Q-28,-28 -34,-38 Q-10,-24 -2,-20 Z" fill="#e0ceaa" />
            <path d="M18,-20 Q28,-28 34,-38 Q10,-24 2,-20 Z" fill="#e0ceaa" />
            <ellipse cx="-26" cy="-3" rx="11" ry="5" fill="#f0c8b8" transform="rotate(-10, -26, -3)" />
            <ellipse cx="26" cy="-3" rx="11" ry="5" fill="#f0c8b8" transform="rotate(10, 26, -3)" />
            <path d="M0,-26 C16,-26 22,-18 22,-4 C22,12 35,34 0,34 C-35,34 -22,12 -22,-4 C-22,-18 -16,-26 0,-26 Z" fill="#fafaf7" />
            <path d="M-22,-12 C-20,-22 -10,-24 -6,-16 C-2,-8 -14,-6 -18,-2 C-24,2 -26,-6 -22,-12 Z" fill="#2c2c2c" opacity="0.6" />
            <path d="M8,-20 C16,-22 22,-14 18,-6 C14,2 4,-8 8,-20 Z" fill="#2c2c2c" opacity="0.45" />
            <ellipse cx="0" cy="20" rx="17" ry="12" fill="#f5e6d8" />
            <ellipse cx="-5" cy="18" rx="3" ry="2.5" fill="#d4b896" />
            <ellipse cx="5" cy="18" rx="3" ry="2.5" fill="#d4b896" />
            <path d={face.cowMouth} fill={sceneMood === "tired" ? "#8a7060" : "none"} stroke={sceneMood === "tired" ? "none" : "#d4b896"} strokeWidth="1.2" />
            <g transform={sceneMood === "tired" ? "scale(1, 0.6)" : undefined} style={{ transformOrigin: "-11px 4px" }}>
              <g className="office-eye-blink" style={{ transformOrigin: "-11px 4px", animationDuration: "3.8s" }}>
                <ellipse cx="-11" cy="4" rx="6" ry="8" fill="#fff" />
                <ellipse cx="-11" cy="5" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="-12.5" cy="1.5" r="1.3" fill="#fff" />
              </g>
            </g>
            <g transform={sceneMood === "tired" ? "scale(1, 0.6)" : undefined} style={{ transformOrigin: "11px 4px" }}>
              <g className="office-eye-blink" style={{ transformOrigin: "11px 4px", animationDuration: "3.8s" }}>
                <ellipse cx="11" cy="4" rx="6" ry="8" fill="#fff" />
                <ellipse cx="11" cy="5" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="9.5" cy="1.5" r="1.3" fill="#fff" />
              </g>
            </g>
            <path d={face.cowBrowL} fill="none" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" />
            <path d={face.cowBrowR} fill="none" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>

        <g transform="translate(592, 204) scale(2.98)">
          <ellipse cx="45" cy="68" rx="40" ry="30" fill="#c4955c" />
          <ellipse cx="45" cy="76" rx="26" ry="18" fill="#d4a86e" />
          <path d="M8,63 Q2,76 18,84" fill="none" stroke="#c4955c" strokeWidth="13" strokeLinecap="round" />
          <path d="M82,63 Q88,76 72,84" fill="none" stroke="#c4955c" strokeWidth="13" strokeLinecap="round" />

          <g transform="translate(45, 2)">
            <path d="M-16,-20 C-22,-30 -23,-38 -17,-44 C-12,-34 -10,-26 -8,-20 Z" fill="#c4955c" />
            <path d="M-13,-22 C-18,-30 -19,-36 -15,-40 C-12,-32 -10,-26 -9,-22 Z" fill="#d4a86e" opacity="0.7" />
            <path d="M16,-20 C22,-30 23,-38 17,-44 C12,-34 10,-26 8,-20 Z" fill="#c4955c" />
            <path d="M13,-22 C18,-30 19,-36 15,-40 C12,-32 10,-26 9,-22 Z" fill="#d4a86e" opacity="0.7" />
            <ellipse cx="0" cy="8" rx="22" ry="34" fill="#c4955c" />
            <path d="M0,-26 Q-6,-24 -8,-20 Q-10,-16 -6,-14 Q-4,-12 -2,-14 Q0,-16 -4,-18 Q-6,-18 -4,-16" fill="none" stroke="#4a2a0a" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="0" cy="30" rx="16" ry="11" fill="#d4a86e" />
            <ellipse cx="-5" cy="29" rx="2.5" ry="2" fill="#7a5a3a" />
            <ellipse cx="5" cy="29" rx="2.5" ry="2" fill="#7a5a3a" />
            <path d={face.horseMouth} fill={sceneMood === "tired" ? "#5a3a2a" : "none"} stroke={sceneMood === "tired" ? "none" : "#7a5a3a"} strokeWidth="1.2" />
            <g transform={sceneMood === "tired" ? "scale(1, 0.6)" : undefined} style={{ transformOrigin: "-9px 8px" }}>
              <g className="office-eye-blink" style={{ transformOrigin: "-9px 8px", animationDuration: "4.5s" }}>
                <ellipse cx="-9" cy="8" rx="6" ry="7.5" fill="#fff" />
                <ellipse cx="-9" cy="9" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="-10.5" cy="5.5" r="1.5" fill="#fff" />
              </g>
            </g>
            <g transform={sceneMood === "tired" ? "scale(1, 0.6)" : undefined} style={{ transformOrigin: "9px 8px" }}>
              <g className="office-eye-blink" style={{ transformOrigin: "9px 8px", animationDuration: "4.5s" }}>
                <ellipse cx="9" cy="8" rx="6" ry="7.5" fill="#fff" />
                <ellipse cx="9" cy="9" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="7.5" cy="5.5" r="1.5" fill="#fff" />
              </g>
            </g>
            <path d={face.horseBrowL} fill="none" stroke="#4a2a0a" strokeWidth="1.8" strokeLinecap="round" />
            <path d={face.horseBrowR} fill="none" stroke="#4a2a0a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>

        <g>
          <path d="M28 390h904l28 12v26H0v-22z" fill="#dbcbb8" />
          <rect x="28" y="386" width="904" height="6" fill="#cdbba7" />
          <path d="M0 428h960v192H0z" fill="#8c613e" />
          <path d="M0 438h960v182H0z" fill="#7d5536" opacity="0.14" />
        </g>
      </svg>
    </div>
  );
}
