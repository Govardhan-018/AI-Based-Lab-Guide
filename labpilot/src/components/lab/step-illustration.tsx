"use client";

/**
 * Generates a cartoon-style SVG illustration for a lab experiment step
 * based on keywords found in the instruction text. Zero-cost, offline,
 * instant — no API calls needed.
 */

interface StepIllustrationProps {
  instruction: string;
  testTubeNumber?: number;
  testTubeName?: string;
  stepIndex: number;
  expectedObservation?: string;
}

type ActionType =
  | "pour"
  | "stir"
  | "heat"
  | "filter"
  | "measure"
  | "observe"
  | "mix"
  | "add"
  | "hold"
  | "shake"
  | "weigh"
  | "dissolve"
  | "evaporate"
  | "record"
  | "smell"
  | "default";

const ACTION_COLORS: Record<ActionType, { bg: string; accent: string }> = {
  pour:      { bg: "#EEF2FF", accent: "#6366F1" },
  stir:      { bg: "#F0FDF4", accent: "#22C55E" },
  heat:      { bg: "#FFF7ED", accent: "#F97316" },
  filter:    { bg: "#FDF4FF", accent: "#A855F7" },
  measure:   { bg: "#EFF6FF", accent: "#3B82F6" },
  observe:   { bg: "#FEFCE8", accent: "#EAB308" },
  mix:       { bg: "#F0FDFA", accent: "#14B8A6" },
  add:       { bg: "#EEF2FF", accent: "#6366F1" },
  hold:      { bg: "#FFF1F2", accent: "#FB7185" },
  shake:     { bg: "#FDF2F8", accent: "#EC4899" },
  weigh:     { bg: "#F5F3FF", accent: "#8B5CF6" },
  dissolve:  { bg: "#ECFDF5", accent: "#10B981" },
  evaporate: { bg: "#FFF7ED", accent: "#F59E0B" },
  record:    { bg: "#F8FAFC", accent: "#64748B" },
  smell:     { bg: "#FEF9C3", accent: "#CA8A04" },
  default:   { bg: "#F1F5F9", accent: "#475569" },
};

function detectAction(instruction: string): ActionType {
  const lower = instruction.toLowerCase();
  const checks: [ActionType, RegExp][] = [
    ["pour",      /pour|transfer|decant/],
    ["stir",      /stir|swirl|agitat/],
    ["heat",      /heat|warm|boil|burn|flame|bunsen/],
    ["filter",    /filter|strain|separat/],
    ["measure",   /measur|graduat|pipett|burett|weigh|mass/],
    ["observe",   /observ|watch|look|note|examin|check/],
    ["mix",       /mix|combin|blend|together/],
    ["shake",     /shake|vortex/],
    ["dissolve",  /dissolv|solut/],
    ["evaporate", /evaporat|crystall|dry/],
    ["record",    /record|write|document|note down/],
    ["smell",     /smell|odou?r|waft/],
    ["add",       /add|drop|introduc|place|put/],
    ["hold",      /hold|show|display|camera|pick up/],
  ];
  for (const [action, re] of checks) {
    if (re.test(lower)) return action;
  }
  return "default";
}

function getLiquidColor(instruction: string, testTubeName?: string): string {
  const text = `${instruction} ${testTubeName || ""}`.toLowerCase();
  if (/blue|copper\s*sulfate|cuso/i.test(text)) return "#60A5FA";
  if (/green|copper\s*carbonate/i.test(text)) return "#4ADE80";
  if (/yellow|iodine|ferric/i.test(text)) return "#FACC15";
  if (/red|pink|phenol|litmus|acid.*red/i.test(text)) return "#FB7185";
  if (/purple|violet|potassium.*perman|kmno/i.test(text)) return "#A78BFA";
  if (/orange|dichromat|bromine/i.test(text)) return "#FB923C";
  if (/brown|iron|rust|fe/i.test(text)) return "#A16207";
  if (/black|charcoal|carbon/i.test(text)) return "#374151";
  if (/white|nacl|sodium|salt|precip/i.test(text)) return "#E2E8F0";
  return "#93C5FD";
}

function TestTubeSVG({ x, y, number, liquidColor, label }: { x: number; y: number; number?: number; liquidColor: string; label?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* tube body */}
      <rect x="0" y="0" width="28" height="70" rx="0" ry="0" fill="none" stroke="#94A3B8" strokeWidth="2" />
      <rect x="0" y="65" width="28" height="10" rx="5" ry="5" fill="none" stroke="#94A3B8" strokeWidth="2" />
      {/* rim */}
      <rect x="-3" y="-2" width="34" height="6" rx="2" fill="#CBD5E1" />
      {/* liquid */}
      <rect x="2" y="30" width="24" height="40" rx="0" fill={liquidColor} opacity="0.7" />
      <ellipse cx="14" cy="30" rx="12" ry="3" fill={liquidColor} opacity="0.5" />
      {/* number label */}
      {number != null && (
        <>
          <circle cx="14" cy="16" r="9" fill="#7C3AED" />
          <text x="14" y="20" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{number}</text>
        </>
      )}
      {/* name label */}
      {label && (
        <text x="14" y="88" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="500">{label.length > 12 ? label.slice(0, 11) + "…" : label}</text>
      )}
    </g>
  );
}

function BeakerSVG({ x, y, liquidColor }: { x: number; y: number; liquidColor: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* beaker body */}
      <path d="M5,0 L0,70 L50,70 L45,0 Z" fill="none" stroke="#94A3B8" strokeWidth="2" />
      {/* spout */}
      <path d="M5,0 L-5,-5 L-5,5 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
      {/* liquid */}
      <path d="M8,35 L3,70 L47,70 L42,35 Z" fill={liquidColor} opacity="0.5" />
      {/* measurement lines */}
      <line x1="40" y1="55" x2="35" y2="55" stroke="#94A3B8" strokeWidth="1" />
      <line x1="39" y1="45" x2="34" y2="45" stroke="#94A3B8" strokeWidth="1" />
    </g>
  );
}

function HandSVG({ x, y, flipped }: { x: number; y: number; flipped?: boolean }) {
  return (
    <g transform={`translate(${x},${y})${flipped ? " scale(-1,1)" : ""}`}>
      <path
        d="M0,20 Q5,0 15,-5 Q20,-7 25,-3 Q28,0 25,5 L20,15 Q25,12 30,10 Q35,8 35,15 Q35,20 30,22 L15,30 Q5,35 0,30 Z"
        fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" opacity="0.85"
      />
      {/* wrist */}
      <rect x="-5" y="25" width="12" height="20" rx="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" opacity="0.85" />
    </g>
  );
}

function FlameSVG({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="12" cy="40" rx="15" ry="4" fill="#94A3B8" opacity="0.3" />
      <rect x="6" y="35" width="12" height="8" rx="1" fill="#64748B" />
      <path d="M12,35 Q8,20 12,5 Q14,0 16,8 Q20,20 12,35" fill="#F97316" opacity="0.9" />
      <path d="M12,35 Q10,25 12,15 Q13,10 14,15 Q16,25 12,35" fill="#FACC15" opacity="0.8" />
    </g>
  );
}

function FunnelSVG({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0,0 L30,0 L18,30 L12,30 Z" fill="none" stroke="#94A3B8" strokeWidth="2" />
      <rect x="12" y="30" width="6" height="20" rx="1" fill="none" stroke="#94A3B8" strokeWidth="2" />
      {/* filter paper */}
      <path d="M3,5 L27,5 L17,25 L13,25 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" opacity="0.6" />
    </g>
  );
}

function StirRodSVG({ x, y, angle }: { x: number; y: number; angle?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${angle || -20})`}>
      <rect x="0" y="0" width="4" height="60" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
    </g>
  );
}

function BubblesSVG({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="5" cy="0" r="3" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.7" />
      <circle cx="15" cy="-8" r="2" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.5" />
      <circle cx="10" cy="-15" r="2.5" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.6" />
      <circle cx="20" cy="-20" r="1.5" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.4" />
    </g>
  );
}

function ArrowSVG({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,3" />
      <polygon
        points={`${x2},${y2} ${x2 - headLen * Math.cos(angle - 0.4)},${y2 - headLen * Math.sin(angle - 0.4)} ${x2 - headLen * Math.cos(angle + 0.4)},${y2 - headLen * Math.sin(angle + 0.4)}`}
        fill="#94A3B8"
      />
    </g>
  );
}

function DropletsSVG({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M3,0 Q0,6 3,10 Q6,6 3,0" fill={color} opacity="0.7" />
      <path d="M10,4 Q7,10 10,14 Q13,10 10,4" fill={color} opacity="0.5" />
    </g>
  );
}

function ScaleSVG({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="30" width="60" height="8" rx="2" fill="#94A3B8" />
      <rect x="10" y="15" width="40" height="15" rx="2" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
      <text x="30" y="26" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">0.00g</text>
    </g>
  );
}

function EyeSVG({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx="15" cy="10" rx="15" ry="10" fill="none" stroke="#64748B" strokeWidth="2" />
      <circle cx="15" cy="10" r="5" fill="#3B82F6" />
      <circle cx="15" cy="10" r="2" fill="#1E293B" />
      <circle cx="17" cy="8" r="1" fill="white" />
    </g>
  );
}

function renderScene(action: ActionType, liquidColor: string, tubeNumber?: number, tubeName?: string) {
  switch (action) {
    case "pour":
      return (
        <>
          <HandSVG x={80} y={15} />
          <g transform="translate(105,30) rotate(45)">
            <TestTubeSVG x={0} y={0} number={tubeNumber} liquidColor={liquidColor} />
          </g>
          <DropletsSVG x={155} y={80} color={liquidColor} />
          <BeakerSVG x={130} y={70} liquidColor={liquidColor} />
          <ArrowSVG x1={130} y1={60} x2={150} y2={75} />
        </>
      );
    case "stir":
      return (
        <>
          <BeakerSVG x={100} y={50} liquidColor={liquidColor} />
          <StirRodSVG x={130} y={20} angle={-15} />
          <HandSVG x={120} y={5} />
          {/* swirl lines */}
          <path d="M115,90 Q120,85 125,90 Q130,95 135,90" fill="none" stroke={liquidColor} strokeWidth="1.5" opacity="0.6" />
        </>
      );
    case "heat":
      return (
        <>
          <FlameSVG x={120} y={90} />
          <BeakerSVG x={105} y={40} liquidColor={liquidColor} />
          <BubblesSVG x={120} y={55} />
        </>
      );
    case "filter":
      return (
        <>
          <FunnelSVG x={120} y={25} />
          <TestTubeSVG x={122} y={80} number={tubeNumber} liquidColor={liquidColor} />
          <HandSVG x={70} y={10} />
          <g transform="translate(85,15) rotate(30)">
            <TestTubeSVG x={0} y={0} liquidColor={liquidColor} />
          </g>
          <DropletsSVG x={133} y={55} color={liquidColor} />
        </>
      );
    case "measure":
      return (
        <>
          <TestTubeSVG x={120} y={40} number={tubeNumber} liquidColor={liquidColor} label={tubeName} />
          <ScaleSVG x={90} y={110} />
          <HandSVG x={85} y={20} />
        </>
      );
    case "mix":
      return (
        <>
          <TestTubeSVG x={80} y={50} number={tubeNumber} liquidColor={liquidColor} />
          <ArrowSVG x1={115} y1={85} x2={135} y2={85} />
          <BeakerSVG x={140} y={50} liquidColor={liquidColor} />
          <HandSVG x={60} y={30} />
          <BubblesSVG x={155} y={70} />
        </>
      );
    case "add":
      return (
        <>
          <HandSVG x={85} y={15} />
          <TestTubeSVG x={115} y={30} number={tubeNumber} liquidColor={liquidColor} label={tubeName} />
          <ArrowSVG x1={130} y1={105} x2={145} y2={115} />
          <BeakerSVG x={125} y={75} liquidColor={liquidColor} />
        </>
      );
    case "hold":
      return (
        <>
          <HandSVG x={90} y={25} />
          <TestTubeSVG x={120} y={40} number={tubeNumber} liquidColor={liquidColor} label={tubeName} />
          {/* camera icon */}
          <g transform="translate(185,50)">
            <rect x="0" y="0" width="30" height="22" rx="3" fill="#475569" />
            <circle cx="15" cy="11" r="7" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="15" cy="11" r="3" fill="#3B82F6" />
            <rect x="8" y="-4" width="14" height="5" rx="2" fill="#475569" />
          </g>
          <ArrowSVG x1={155} y1={65} x2={183} y2={62} />
        </>
      );
    case "shake":
      return (
        <>
          <HandSVG x={100} y={20} />
          <TestTubeSVG x={125} y={35} number={tubeNumber} liquidColor={liquidColor} />
          {/* shake lines */}
          <line x1="160" y1="45" x2="170" y2="40" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="160" y1="55" x2="172" y2="55" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="160" y1="65" x2="170" y2="70" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="118" y1="45" x2="108" y2="40" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="118" y1="55" x2="106" y2="55" stroke="#94A3B8" strokeWidth="1.5" />
        </>
      );
    case "dissolve":
      return (
        <>
          <BeakerSVG x={105} y={45} liquidColor={liquidColor} />
          <StirRodSVG x={140} y={25} angle={-10} />
          {/* dissolving particles */}
          <circle cx="120" cy="85" r="2" fill="#94A3B8" opacity="0.6" />
          <circle cx="130" cy="90" r="1.5" fill="#94A3B8" opacity="0.4" />
          <circle cx="115" cy="95" r="1" fill="#94A3B8" opacity="0.3" />
          <circle cx="135" cy="80" r="1.5" fill="#94A3B8" opacity="0.5" />
          <HandSVG x={80} y={15} />
        </>
      );
    case "evaporate":
      return (
        <>
          <FlameSVG x={115} y={95} />
          <BeakerSVG x={100} y={45} liquidColor={liquidColor} />
          {/* steam/vapor */}
          <path d="M110,40 Q108,30 112,20" fill="none" stroke="#94A3B8" strokeWidth="1.5" opacity="0.4" />
          <path d="M120,38 Q118,25 122,15" fill="none" stroke="#94A3B8" strokeWidth="1.5" opacity="0.3" />
          <path d="M130,40 Q128,28 132,18" fill="none" stroke="#94A3B8" strokeWidth="1.5" opacity="0.35" />
        </>
      );
    case "observe":
      return (
        <>
          <BeakerSVG x={110} y={55} liquidColor={liquidColor} />
          <EyeSVG x={120} y={20} />
          <ArrowSVG x1={135} y1={38} x2={135} y2={52} />
        </>
      );
    case "record":
      return (
        <>
          {/* clipboard */}
          <g transform="translate(100,25)">
            <rect x="0" y="5" width="45" height="55" rx="3" fill="white" stroke="#94A3B8" strokeWidth="2" />
            <rect x="10" y="0" width="25" height="10" rx="5" fill="#94A3B8" />
            <line x1="8" y1="22" x2="37" y2="22" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="8" y1="30" x2="37" y2="30" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="8" y1="38" x2="25" y2="38" stroke="#CBD5E1" strokeWidth="1.5" />
          </g>
          <HandSVG x={150} y={40} />
          {/* pencil */}
          <g transform="translate(170,65) rotate(30)">
            <rect x="0" y="0" width="4" height="30" rx="1" fill="#FACC15" />
            <polygon points="0,30 4,30 2,36" fill="#F8B4B4" />
          </g>
        </>
      );
    case "smell":
      return (
        <>
          <TestTubeSVG x={120} y={45} number={tubeNumber} liquidColor={liquidColor} />
          <HandSVG x={100} y={25} />
          {/* wafting lines */}
          <path d="M140,40 Q145,35 142,28" fill="none" stroke="#94A3B8" strokeWidth="1" opacity="0.5" />
          <path d="M145,42 Q150,35 148,26" fill="none" stroke="#94A3B8" strokeWidth="1" opacity="0.4" />
          <path d="M150,44 Q155,37 153,30" fill="none" stroke="#94A3B8" strokeWidth="1" opacity="0.3" />
          {/* nose hint */}
          <g transform="translate(165,15)">
            <path d="M0,15 Q5,5 10,15" fill="none" stroke="#D97706" strokeWidth="2" />
          </g>
        </>
      );
    default:
      return (
        <>
          <TestTubeSVG x={100} y={40} number={tubeNumber} liquidColor={liquidColor} label={tubeName} />
          <HandSVG x={75} y={20} />
          <BeakerSVG x={155} y={55} liquidColor={liquidColor} />
        </>
      );
  }
}

export function StepIllustration({ instruction, testTubeNumber, testTubeName, stepIndex, expectedObservation }: StepIllustrationProps) {
  const action = detectAction(instruction);
  const colors = ACTION_COLORS[action];
  const liquidColor = getLiquidColor(instruction, testTubeName);

  const actionLabels: Record<ActionType, string> = {
    pour: "Pour", stir: "Stir", heat: "Heat", filter: "Filter",
    measure: "Measure", observe: "Observe", mix: "Mix", add: "Add",
    hold: "Show to Camera", shake: "Shake", weigh: "Weigh",
    dissolve: "Dissolve", evaporate: "Evaporate", record: "Record",
    smell: "Waft & Smell", default: "Perform Step",
  };

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: colors.accent + "30" }}>
      <div className="relative" style={{ backgroundColor: colors.bg }}>
        {/* Step number badge */}
        <div
          className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
          style={{ backgroundColor: colors.accent }}
        >
          {stepIndex + 1}
        </div>
        {/* Action badge */}
        <div
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: colors.accent }}
        >
          {actionLabels[action]}
        </div>

        <svg viewBox="0 0 260 150" className="w-full" xmlns="http://www.w3.org/2000/svg">
          {renderScene(action, liquidColor, testTubeNumber, testTubeName)}
          {/* subtle floor line */}
          <line x1="30" y1="140" x2="230" y2="140" stroke="#CBD5E1" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
      {expectedObservation && (
        <div className="px-3 py-1.5 text-[10px] text-center font-medium" style={{ color: colors.accent, backgroundColor: colors.accent + "08" }}>
          👁 {expectedObservation.length > 80 ? expectedObservation.slice(0, 77) + "…" : expectedObservation}
        </div>
      )}
    </div>
  );
}
