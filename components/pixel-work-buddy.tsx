"use client";

import { useMemo } from "react";

type MoodOption = "干劲满满" | "普通营业" | "累了" | "快下班吧";
type SceneMood = "calm" | "happy" | "angry" | "tired";

function toSceneMood(mood: MoodOption): SceneMood {
  switch (mood) {
    case "干劲满满":
      return "happy";
    case "累了":
      return "tired";
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
      cowBrowL: "M-16,-3 Q-11,-5 -6,-4",
      cowBrowR: "M6,-4 Q11,-5 16,-3",
      horseBrowL: "M-16,-5 Q-10,-7 -4,-5",
      horseBrowR: "M4,-5 Q10,-7 16,-5",
      eyeScale: 1,
    },
    happy: {
      cowMouth: "M-11,28 Q0,38 11,28",
      horseMouth: "M-10,34 Q0,44 10,34",
      cowBrowL: "M-16,-5 Q-11,-11 -6,-6",
      cowBrowR: "M6,-6 Q11,-11 16,-5",
      horseBrowL: "M-16,-8 Q-10,-13 -4,-8",
      horseBrowR: "M4,-8 Q10,-13 16,-8",
      eyeScale: 1,
    },
    angry: {
      cowMouth: "M-10,30 Q0,24 10,30",
      horseMouth: "M-9,36 Q0,30 9,36",
      cowBrowL: "M-14,-2 L-8,-8",
      cowBrowR: "M8,-8 L14,-2",
      horseBrowL: "M-14,-2 L-6,-10",
      horseBrowR: "M6,-10 L14,-2",
      eyeScale: 0.9,
    },
    tired: {
      cowMouth: "M-9,30 Q0,22 9,30",
      horseMouth: "M-8,36 Q0,28 8,36",
      cowBrowL: "M-16,-2 Q-11,-4 -6,-3",
      cowBrowR: "M6,-3 Q11,-4 16,-2",
      horseBrowL: "M-14,-3 Q-9,-5 -4,-4",
      horseBrowR: "M4,-4 Q9,-5 14,-3",
      eyeScale: 0.56,
    },
  } as const;

  return map[mood];
}

function getSkyPalette(hour: number) {
  if (hour >= 18 || hour < 6) {
    return {
      wall: "#e7dac2",
      wallTop: "#f7efe1",
      wallMid: "#dfd0b8",
      wallBottom: "#cfbea8",
      skyTop: "#314a76",
      skyBottom: "#6e7fb4",
      skylineBack: "#7181b0",
      skylineFront: "#49567f",
      cloud: "rgba(240, 244, 255, 0.85)",
      frame: "#d5cabb",
      frameLine: "#b8ac9b",
    };
  }

  if (hour >= 16) {
    return {
      wall: "#eadfcb",
      wallTop: "#fbf1df",
      wallMid: "#e8d2b9",
      wallBottom: "#d6bfa6",
      skyTop: "#f5b06e",
      skyBottom: "#f4d4a7",
      skylineBack: "#d69778",
      skylineFront: "#9e6f63",
      cloud: "rgba(255, 245, 229, 0.85)",
      frame: "#d8c8b2",
      frameLine: "#bda98f",
    };
  }

  return {
    wall: "#eadfcb",
    wallTop: "#faf4e8",
    wallMid: "#e7dcc6",
    wallBottom: "#d6c7b1",
    skyTop: "#98d5ff",
    skyBottom: "#e8f6ff",
    skylineBack: "#a9c9e2",
    skylineFront: "#7ea0c4",
    cloud: "rgba(255, 255, 255, 0.88)",
    frame: "#d9d1c4",
    frameLine: "#bfb5a6",
  };
}

export function PixelWorkBuddy({ mood }: { mood: MoodOption }) {
  const sceneMood = useMemo(() => toSceneMood(mood), [mood]);
  const face = useMemo(() => getFaces(sceneMood), [sceneMood]);
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const sky = useMemo(() => getSkyPalette(hour), [hour]);
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-sm bg-[#f0ede8]">
      <svg
        viewBox="0 0 960 624"
        className="h-full w-full scale-[1.14]"
        role="img"
        aria-label="牛马搭子一起在工位上班"
      >
        <defs>
          <linearGradient id="buddy-window-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.skyTop} />
            <stop offset="100%" stopColor={sky.skyBottom} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="960" height="624" fill={sky.wall} />
        <rect x="0" y="0" width="960" height="402" fill={sky.wallTop} />
        <rect x="0" y="402" width="960" height="28" fill={sky.wallMid} />
        <rect x="0" y="430" width="960" height="194" fill={sky.wallBottom} />

        <g transform="translate(-92,-28)">
          <rect x="0" y="0" width="360" height="248" rx="10" fill={sky.frame} stroke={sky.frameLine} strokeWidth="4" />
          <rect x="14" y="14" width="332" height="220" rx="6" fill="url(#buddy-window-sky)" />
          <line x1="182" y1="0" x2="182" y2="248" stroke={sky.frameLine} strokeWidth="3" />
          <line x1="0" y1="130" x2="360" y2="130" stroke={sky.frameLine} strokeWidth="3" />
          <g className="buddy-cloud buddy-cloud-slow">
            <ellipse cx="118" cy="72" rx="34" ry="16" fill={sky.cloud} />
            <ellipse cx="93" cy="76" rx="18" ry="11" fill={sky.cloud} />
            <ellipse cx="138" cy="76" rx="21" ry="12" fill={sky.cloud} />
          </g>
          <g className="buddy-cloud buddy-cloud-fast">
            <ellipse cx="258" cy="90" rx="28" ry="13" fill={sky.cloud} />
            <ellipse cx="238" cy="93" rx="15" ry="9" fill={sky.cloud} />
            <ellipse cx="275" cy="93" rx="17" ry="9" fill={sky.cloud} />
          </g>
          <path d="M16 220v-54h26v54h24v-72h28v72h24V124h34v96h22v-62h24v62h30v-104h34v104h18v-46h18v46h34v14H16z" fill={sky.skylineBack} opacity="0.82" />
          <path d="M30 220v-34h18v34h20v-56h22v56h20v-86h30v86h18v-42h18v42h22v-68h26v68h18v-30h14v30h26v14H30z" fill={sky.skylineFront} opacity="0.9" />
        </g>

        <g transform="translate(814,92)">
          <circle cx="0" cy="0" r="34" fill="#fffdf8" stroke="#b9aa96" strokeWidth="4" />
          <circle cx="0" cy="0" r="2.8" fill="#8f7c67" />
          <line x1="0" y1="-24" x2="0" y2="-20" stroke="#8f7c67" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="0" y1="24" x2="0" y2="20" stroke="#8f7c67" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="-24" y1="0" x2="-20" y2="0" stroke="#8f7c67" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="24" y1="0" x2="20" y2="0" stroke="#8f7c67" strokeWidth="2.2" strokeLinecap="round" />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-11"
            stroke="#5d4c3f"
            strokeWidth="3.2"
            strokeLinecap="round"
            transform={`rotate(${hourAngle})`}
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-18"
            stroke="#7a6a5a"
            strokeWidth="2.4"
            strokeLinecap="round"
            transform={`rotate(${minuteAngle})`}
          />
        </g>

        <g transform="translate(428,118)">
          <rect x="0" y="0" width="118" height="76" rx="5" fill="#f5ecd9" stroke="#c7b496" strokeWidth="3.5" />
          <rect x="12" y="12" width="30" height="22" fill="#ffd86f" stroke="#c7a94f" strokeWidth="2" />
          <rect x="50" y="14" width="22" height="24" fill="#ffc7c7" stroke="#cf9999" strokeWidth="2" />
          <rect x="78" y="12" width="24" height="20" fill="#fff2b7" stroke="#d2bf74" strokeWidth="2" />
          <rect x="18" y="44" width="32" height="12" fill="#d8e8ff" stroke="#a7b9d4" strokeWidth="2" />
          <rect x="58" y="46" width="28" height="10" fill="#d9f0d1" stroke="#9cb790" strokeWidth="2" />
        </g>

        <g transform="translate(246, 228) scale(1.9)">
          <ellipse cx="45" cy="72" rx="44" ry="34" fill="#fafaf7" />
          <path d="M18 58 Q22 50 30 49 Q38 50 40 58 Q39 66 32 70 Q24 72 18 68 Q14 64 18 58 Z" fill="#2c2c2c" opacity="0.5" />
          <path d="M62 74 Q72 70 78 78 Q76 88 68 90 Q60 88 60 80 Q60 76 62 74 Z" fill="#2c2c2c" opacity="0.34" />

          <g transform="translate(45, 6)">
            <path d="M-16,-18 Q-24,-26 -26,-34 Q-14,-30 -4,-18 Z" fill="#e0ceaa" />
            <path d="M16,-18 Q24,-26 26,-34 Q14,-30 4,-18 Z" fill="#e0ceaa" />
            <ellipse cx="-26" cy="-3" rx="11" ry="5" fill="#f0c8b8" transform="rotate(-10, -26, -3)" />
            <ellipse cx="26" cy="-3" rx="11" ry="5" fill="#f0c8b8" transform="rotate(10, 26, -3)" />
            <path d="M0,-26 C16,-26 22,-18 22,-4 C22,12 35,34 0,34 C-35,34 -22,12 -22,-4 C-22,-18 -16,-26 0,-26 Z" fill="#fafaf7" />
            <path d="M-18,-12 C-16,-22 -8,-24 -4,-16 C0,-8 -10,-6 -14,-2 C-20,2 -22,-6 -18,-12 Z" fill="#2c2c2c" opacity="0.6" />
            <path d="M8,-20 C16,-22 22,-14 18,-6 C14,2 4,-8 8,-20 Z" fill="#2c2c2c" opacity="0.45" />
            <ellipse cx="0" cy="22" rx="21" ry="14" fill="#f5e6d8" />
            <ellipse cx="-6" cy="20" rx="3.4" ry="2.8" fill="#d4b896" />
            <ellipse cx="6" cy="20" rx="3.4" ry="2.8" fill="#d4b896" />
            <path d={face.cowMouth} fill={sceneMood === "tired" ? "#8a7060" : "none"} stroke={sceneMood === "tired" ? "none" : "#d4b896"} strokeWidth="1.2" />
            {sceneMood === "tired" ? (
              <>
                <ellipse cx="-11" cy="12.2" rx="7.2" ry="3.1" fill="#6b6170" opacity="0.3" />
                <ellipse cx="11" cy="12.2" rx="7.2" ry="3.1" fill="#6b6170" opacity="0.3" />
              </>
            ) : null}
            <g
              className="office-eye-blink"
              transform={sceneMood === "tired" ? "scale(1, 0.6)" : undefined}
              style={{ transformOrigin: "0px 4px", animationDuration: "3.8s" }}
            >
              <g>
                <ellipse cx="-11" cy="4" rx="6" ry="8" fill="#fff" />
                <ellipse cx="-10.3" cy="6.2" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="-11.6" cy="2.9" r="1.3" fill="#fff" />
              </g>
              <g>
                <ellipse cx="11" cy="4" rx="6" ry="8" fill="#fff" />
                <ellipse cx="10.3" cy="6.2" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="9" cy="2.9" r="1.3" fill="#fff" />
              </g>
            </g>
            <path d={face.cowBrowL} fill="none" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" />
            <path d={face.cowBrowR} fill="none" stroke="#5c4a3a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>

        <g transform="translate(616, 234) scale(1.87)">
          <ellipse cx="45" cy="68" rx="40" ry="30" fill="#c4955c" />
          <ellipse cx="45" cy="76" rx="26" ry="18" fill="#d4a86e" />

          <g transform="translate(45, 2)">
            <path d="M-17,-18 C-22,-24 -23,-30 -19,-34 C-13,-30 -10,-24 -8,-18 Z" fill="#c4955c" />
            <path d="M-15,-19 C-19,-24 -19,-28 -16,-31 C-12,-28 -10,-23 -9,-19 Z" fill="#d4a86e" opacity="0.72" />
            <path d="M17,-18 C22,-24 23,-30 19,-34 C13,-30 10,-24 8,-18 Z" fill="#c4955c" />
            <path d="M15,-19 C19,-24 19,-28 16,-31 C12,-28 10,-23 9,-19 Z" fill="#d4a86e" opacity="0.72" />
            <ellipse cx="0" cy="8" rx="22" ry="34" fill="#c4955c" />
            <path d="M-9,-26.5 Q-4,-32.5 4,-31.5 Q10,-30.5 13,-25.5 Q10,-25.5 7,-21.5 Q4,-17.5 1,-18.5 Q-2,-19.5 -3,-15.5 Q-6,-17.5 -7,-20.5 Q-8,-23.5 -9,-26.5 Z" fill="#4a2a0a" opacity="0.96" />
            <path d="M1,-29.5 Q4,-27.5 5,-22.5 Q2,-23.5 0,-21.5 Q-1,-24.5 1,-29.5 Z" fill="#4a2a0a" opacity="0.96" />
            <path d="M8,-26.5 Q11,-24.5 12,-20.5 Q9,-21.5 7,-19.5 Q6,-22.5 8,-26.5 Z" fill="#4a2a0a" opacity="0.96" />
            <ellipse cx="0" cy="30" rx="13.5" ry="9.5" fill="#d4a86e" />
            <ellipse cx="-4.3" cy="29" rx="2.1" ry="1.7" fill="#7a5a3a" />
            <ellipse cx="4.3" cy="29" rx="2.1" ry="1.7" fill="#7a5a3a" />
            <path d={face.horseMouth} fill={sceneMood === "tired" ? "#5a3a2a" : "none"} stroke={sceneMood === "tired" ? "none" : "#7a5a3a"} strokeWidth="1.2" />
            {sceneMood === "tired" ? (
              <>
                <ellipse cx="-9" cy="15.3" rx="7" ry="3" fill="#594b45" opacity="0.28" />
                <ellipse cx="9" cy="15.3" rx="7" ry="3" fill="#594b45" opacity="0.28" />
              </>
            ) : null}
            <g
              className="office-eye-blink"
              transform={sceneMood === "tired" ? "scale(1, 0.6)" : undefined}
              style={{ transformOrigin: "0px 8px", animationDuration: "4.5s" }}
            >
              <g>
                <ellipse cx="-9" cy="8" rx="6" ry="7.5" fill="#fff" />
                <ellipse cx="-8.2" cy="10.1" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="-9.7" cy="6.8" r="1.5" fill="#fff" />
              </g>
              <g>
                <ellipse cx="9" cy="8" rx="6" ry="7.5" fill="#fff" />
                <ellipse cx="8.2" cy="10.1" rx="3.5" ry="4.5" fill="#2c2c2c" />
                <circle cx="6.7" cy="6.8" r="1.5" fill="#fff" />
              </g>
            </g>
            <path d={face.horseBrowL} fill="none" stroke="#4a2a0a" strokeWidth="1.8" strokeLinecap="round" />
            <path d={face.horseBrowR} fill="none" stroke="#4a2a0a" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>

        <g>
          <path d="M92 364 H868 L912 398 H48 Z" fill="#f6f4ef" />
          <path d="M18 398 H942 V624 H18 Z" fill="#ddd9d1" />
          <rect x="18" y="394" width="924" height="8" fill="#ffffff" />
          <g transform="translate(390,456)">
            <path d="M0 8 C0 -8 14 -20 30 -20 C46 -20 60 -8 60 8" fill="none" stroke="#d56d3b" strokeWidth="5" strokeLinecap="round" />
            <path d="M-10 10 H70 L63 68 H-3 Z" fill="#ee8751" fillOpacity="0.78" stroke="#d56d3b" strokeOpacity="0.82" strokeWidth="5" strokeLinejoin="round" />
            <text
              x="30"
              y="52"
              textAnchor="middle"
              fontSize="28"
              fontWeight="700"
              fill="#fff8ef"
              opacity="0.9"
              fontFamily="Arial, Helvetica, sans-serif"
            >
              S
            </text>
          </g>
          <text
            x="545"
            y="520"
            textAnchor="middle"
            fontSize="42"
            fontWeight="700"
            letterSpacing="0"
            fill="#c86b3e"
            fontFamily="Arial, Helvetica, sans-serif"
            opacity="0.72"
          >
            Shopee
          </text>
        </g>

        <g transform="translate(246, 228) scale(1.9)">
          <path d="M10,56 Q5,64 18,68" fill="none" stroke="#ece8e2" strokeWidth="14" strokeLinecap="round" />
          <path d="M82,56 Q87,64 73,69" fill="none" stroke="#ece8e2" strokeWidth="14" strokeLinecap="round" />
          <ellipse cx="19" cy="69" rx="8" ry="5" fill="#f1ddd2" />
          <ellipse cx="72" cy="70" rx="8" ry="5" fill="#f1ddd2" />
        </g>

        <g transform="translate(616, 234) scale(1.87)">
          <path d="M9,58 Q4,65 17,69" fill="none" stroke="#b7854e" strokeWidth="14" strokeLinecap="round" />
          <path d="M81,58 Q85,65 72,70" fill="none" stroke="#b7854e" strokeWidth="14" strokeLinecap="round" />
          <ellipse cx="18" cy="70" rx="8" ry="5" fill="#6f4d31" />
          <ellipse cx="73" cy="71" rx="8" ry="5" fill="#6f4d31" />
        </g>

        <g>
          <g transform="translate(84,258) scale(2.4)">
            <path d="M18 8 C22 14 22 24 18 32 C14 25 14 14 18 8 Z" fill="#5d9654" />
            <path d="M10 14 C15 17 18 25 16 33 C10 29 7 22 10 14 Z" fill="#79b26b" />
            <path d="M26 14 C29 22 26 29 20 33 C18 25 21 17 26 14 Z" fill="#6aa85f" />
            <path d="M6 24 C12 24 17 28 18 35 C11 36 6 32 6 24 Z" fill="#4e8447" />
            <path d="M30 23 C30 31 25 35 18 35 C19 28 24 23 30 23 Z" fill="#5b914f" />
            <path d="M18 33 L18 41" stroke="#5f864b" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M7 40 H29 L26 56 H10 Z" fill="#f4efe8" stroke="#c4b4a1" strokeWidth="3" />
            <path d="M9 40 H27 L25 46 H11 Z" fill="#e2d5c6" opacity="0.8" />
          </g>

          <g transform="translate(268,302)">
            <path d="M18 12 H108 L104 78 H22 Z" fill="#d6dae1" stroke="#aeb5bf" strokeWidth="3" />
            <path d="M26 20 H100 L97 70 H29 Z" fill="#e7ebf1" opacity="0.92" />
            <g transform="translate(33,18) scale(0.5)">
              <path d="M63 39 C67 34 75 35 79 43 C81 48 80 54 76 58 C79 61 81 66 81 71 C81 79 75 85 67 85 C64 85 62 84 60 82 C58 84 56 85 53 85 C45 85 39 79 39 71 C39 66 41 61 44 58 C40 54 39 48 41 43 C45 35 54 34 60 39 C61 40 62 40 63 39 Z" fill="#aeb6c1" />
              <circle cx="78" cy="56" r="6.5" fill="#e7ebf1" />
              <path d="M63 30 C66 25 72 24 76 27 C72 29 68 32 65 37 C63 36 62 33 63 30 Z" fill="#aeb6c1" />
            </g>
            <path d="M51 78 H75" stroke="#9ea6b1" strokeWidth="4" strokeLinecap="round" />
            <path d="M18 81 H108 L116 85 H10 Z" fill="#d2d7df" stroke="#adb4bf" strokeWidth="2" />
            <path d="M16 85 H110 L102 88 H24 Z" fill="#bcc4cf" />
          </g>

          <g transform="translate(628,304)">
            <path d="M18 12 H108 L104 78 H22 Z" fill="#d6dae1" stroke="#aeb5bf" strokeWidth="3" />
            <path d="M26 20 H100 L97 70 H29 Z" fill="#e7ebf1" opacity="0.92" />
            <g transform="translate(33,18) scale(0.5)">
              <path d="M63 39 C67 34 75 35 79 43 C81 48 80 54 76 58 C79 61 81 66 81 71 C81 79 75 85 67 85 C64 85 62 84 60 82 C58 84 56 85 53 85 C45 85 39 79 39 71 C39 66 41 61 44 58 C40 54 39 48 41 43 C45 35 54 34 60 39 C61 40 62 40 63 39 Z" fill="#aeb6c1" />
              <circle cx="78" cy="56" r="6.5" fill="#e7ebf1" />
              <path d="M63 30 C66 25 72 24 76 27 C72 29 68 32 65 37 C63 36 62 33 63 30 Z" fill="#aeb6c1" />
            </g>
            <path d="M51 78 H75" stroke="#9ea6b1" strokeWidth="4" strokeLinecap="round" />
            <path d="M18 81 H108 L116 85 H10 Z" fill="#d2d7df" stroke="#adb4bf" strokeWidth="2" />
            <path d="M16 85 H110 L102 88 H24 Z" fill="#bcc4cf" />
          </g>

          <g transform="translate(452,310) scale(1.34)">
            <path d="M2 14 H40 L45 56 H7 Z" fill="#c89258" stroke="#8b6137" strokeWidth="3" />
            <path d="M10 14 C10 5 15 0 21 0 C27 0 32 5 32 14" fill="none" stroke="#8b6137" strokeWidth="3" strokeLinecap="round" />
            <path d="M9 22 H38" stroke="#ddb07a" strokeWidth="2.2" strokeLinecap="round" opacity="0.62" />
            <path d="M12 29 H35" stroke="#ddb07a" strokeWidth="1.9" strokeLinecap="round" opacity="0.45" />
            <path d="M10 38 H36" stroke="#ad7b46" strokeWidth="2.2" strokeLinecap="round" opacity="0.42" />
            <path d="M14 44 H32" stroke="#ad7b46" strokeWidth="1.8" strokeLinecap="round" opacity="0.28" />
          </g>

          <g transform="translate(424,352) scale(1.18)">
            <path d="M6 12 H54 L60 20 H12 Z" fill="#f3e6d5" stroke="#c6b19a" strokeWidth="2.4" />
            <path d="M12 20 H60 L55 36 H7 Z" fill="#ead8c3" stroke="#b89e82" strokeWidth="2.4" />
            <ellipse cx="32" cy="18" rx="21" ry="6" fill="#f8f0e5" />
            <path d="M15 18 C21 13 27 13 33 18 C39 22 45 22 51 17" fill="none" stroke="#d89a44" strokeWidth="3" strokeLinecap="round" />
            <path d="M14 21 C19 18 24 19 29 22 C35 25 41 25 50 20" fill="none" stroke="#d89a44" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <ellipse cx="20" cy="17" rx="4" ry="2.4" fill="#71a85f" />
            <ellipse cx="27" cy="20" rx="3.5" ry="2.2" fill="#8ec16d" />
            <ellipse cx="42" cy="18" rx="3.6" ry="2.1" fill="#6fa45d" />
            <ellipse cx="48" cy="15" rx="3.2" ry="2" fill="#d66f4a" />
            <path d="M54 7 L63 15" stroke="#8f6a48" strokeWidth="2.3" strokeLinecap="round" />
            <path d="M50 9 L59 17" stroke="#b88a60" strokeWidth="2.1" strokeLinecap="round" />
          </g>

          <g transform="translate(798,338)">
            <path d="M10 24 C8 16 13 10 18 10 C23 10 28 16 26 24" fill="none" stroke="#dcd7d0" strokeWidth="2.8" strokeLinecap="round" opacity="0.92">
              <animateTransform attributeName="transform" type="translate" values="0 0; -1 -10; 1 -18" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.92;0.62;0" dur="2.8s" repeatCount="indefinite" />
            </path>
            <path d="M19 20 C17 12 22 6 27 6 C31 6 34 12 32 20" fill="none" stroke="#dcd7d0" strokeWidth="2.5" strokeLinecap="round" opacity="0.84">
              <animateTransform attributeName="transform" type="translate" values="0 0; 1 -9; -1 -16" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.84;0.52;0" dur="2.4s" begin="0.4s" repeatCount="indefinite" />
            </path>
            <path d="M28 24 C26 17 31 12 35 12 C39 12 42 17 40 24" fill="none" stroke="#dcd7d0" strokeWidth="2.2" strokeLinecap="round" opacity="0.78">
              <animateTransform attributeName="transform" type="translate" values="0 0; -1 -8; 1 -14" dur="2.6s" begin="0.9s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.78;0.46;0" dur="2.6s" begin="0.9s" repeatCount="indefinite" />
            </path>
            <path d="M8 24 H36 V52 Q36 58 30 58 H14 Q8 58 8 52 Z" fill="#f6efe6" stroke="#c0ab95" strokeWidth="3" />
            <path d="M36 30 Q48 30 48 40 Q48 50 36 50" fill="none" stroke="#c0ab95" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 28 H32 V38 H12 Z" fill="#c99f72" opacity="0.28" />
            <ellipse cx="22" cy="24" rx="13" ry="3.8" fill="#6c4d37" />
            <ellipse cx="22" cy="23" rx="11" ry="2.8" fill="#8b6245" opacity="0.82" />
          </g>
        </g>

      </svg>
    </div>
  );
}
