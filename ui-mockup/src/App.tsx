import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beaker, 
  ChevronRight, 
  Play, 
  Mic, 
  MessageSquare, 
  Info, 
  AlertCircle, 
  Settings, 
  ArrowLeft,
  Camera,
  Scan,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Send,
  MoreVertical,
  Minus,
  Maximize2,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes (though we use vanilla mostly)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Screen = 'dashboard' | 'details' | 'session' | 'assistant';

interface Experiment {
  id: string;
  title: string;
  difficulty: string;
  time: string;
  icon: React.ReactNode;
}

// --- Mock Data ---
const EXPERIMENTS: Experiment[] = [
  { id: '1', title: 'Iodine Clock Reaction', difficulty: 'Intermediate', time: '15 min', icon: <Beaker size={24} /> },
  { id: '2', title: 'Elephant Toothpaste', difficulty: 'Easy', time: '10 min', icon: <Zap size={24} /> },
  { id: '3', title: 'Metal Flame Test', difficulty: 'Advanced', time: '20 min', icon: <Scan size={24} /> },
  { id: '4', title: 'Nylon Synthesis', difficulty: 'Advanced', time: '45 min', icon: <ShieldCheck size={24} /> },
];

// --- Components ---

const ScreenTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    className="h-full w-full overflow-y-auto scroll-container p-8"
  >
    {children}
  </motion.div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-1 border border-black rounded-full text-xs font-semibold uppercase tracking-wider">
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  return (
    <div className="h-screen w-screen bg-white text-black flex flex-col font-['Inter']">
      {/* Top Bar - Window Controls */}
      <div className="h-12 flex items-center justify-between px-6 border-b border-black/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full border border-black" />
          <div className="w-3 h-3 rounded-full border border-black" />
          <div className="w-3 h-3 rounded-full border border-black" />
        </div>
        <div className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">SenseBridge OS v1.0</div>
        <div className="w-12" />
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {screen === 'dashboard' && (
            <ScreenTransition key="dashboard">
              <Dashboard onSelect={(exp) => { setSelectedExp(exp); setScreen('details'); }} />
            </ScreenTransition>
          )}

          {screen === 'details' && (
            <ScreenTransition key="details">
              <Details experiment={selectedExp} onBack={() => setScreen('dashboard')} onStart={() => setScreen('session')} />
            </ScreenTransition>
          )}

          {screen === 'session' && (
            <ScreenTransition key="session">
              <Session experiment={selectedExp} onOpenAssistant={() => setScreen('assistant')} onBack={() => setScreen('details')} />
            </ScreenTransition>
          )}

          {screen === 'assistant' && (
            <ScreenTransition key="assistant">
              <Assistant onBack={() => setScreen('session')} experiment={selectedExp} />
            </ScreenTransition>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 text-center border-t border-black/5">
        <p className="text-[10px] uppercase tracking-widest font-medium opacity-40">
          Powered by AI • Computer Vision • OpenCV
        </p>
      </div>
    </div>
  );
}

// --- Screen 1: Dashboard ---
function Dashboard({ onSelect }: { onSelect: (exp: Experiment) => void }) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center py-12">
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6 inline-block p-4 border border-black rounded-3xl"
        >
          <Beaker size={48} strokeWidth={1.5} />
        </motion.div>
        <h1 className="text-5xl font-bold tracking-tighter mb-2">SenseBridge</h1>
        <p className="text-xl opacity-60 font-medium">AI Laboratory Assistant</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full">
        {EXPERIMENTS.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelect(exp)}
            className="group flex items-center justify-between p-8 border border-black rounded-[24px] cursor-pointer hover:bg-black hover:text-white transition-all duration-300"
          >
            <div className="flex items-center gap-6">
              <div className="p-3 border border-current rounded-2xl">
                {exp.icon}
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{exp.title}</h3>
            </div>
            <div className="flex items-center gap-4 opacity-60 group-hover:opacity-100">
              <span className="text-sm font-semibold">{exp.difficulty}</span>
              <div className="w-1 h-1 rounded-full bg-current" />
              <span className="text-sm font-semibold">{exp.time}</span>
              <ChevronRight size={20} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-12 pill-button px-12 py-5 text-lg"
      >
        <Play size={20} fill="currentColor" />
        Explore Library
      </motion.button>
    </div>
  );
}

// --- Screen 2: Details ---
function Details({ experiment, onBack, onStart }: { experiment: Experiment | null, onBack: () => void, onStart: () => void }) {
  if (!experiment) return null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col py-8">
      <button onClick={onBack} className="flex items-center gap-2 mb-12 opacity-60 hover:opacity-100 transition-opacity">
        <ArrowLeft size={20} />
        <span className="font-semibold">Back to Library</span>
      </button>

      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-4 mb-6">
          <h1 className="text-6xl font-bold tracking-tighter">{experiment.title}</h1>
          <div className="p-3 border border-black rounded-2xl">
            {experiment.icon}
          </div>
        </div>
        
        <div className="flex justify-center gap-3">
          <Badge>{experiment.difficulty}</Badge>
          <Badge>{experiment.time}</Badge>
          <Badge>AI Optimized</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-16">
        <Section title="Real-world Use" icon={<Info size={20} />}>
          This reaction is used to demonstrate chemical kinetics and the effect of concentration on reaction rates in forensic science.
        </Section>
        <Section title="Required Materials" icon={<Beaker size={20} />}>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>Hydrogen Peroxide (3%)</li>
            <li>Potassium Iodide Solution</li>
            <li>Soluble Starch</li>
            <li>Distilled Water</li>
          </ul>
        </Section>
        <Section title="Safety Precautions" icon={<ShieldCheck size={20} />}>
          Wear protective eyewear and gloves. Handle Hydrogen Peroxide with care as it is a strong oxidizer. Use in a ventilated area.
        </Section>
        <Section title="Procedure Overview" icon={<Zap size={20} />}>
          Mixing Solution A and B will trigger a delayed color change from clear to deep blue. The timing depends on the temperature.
        </Section>
      </div>

      <div className="flex justify-center">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="pill-button px-16 py-6 text-xl bg-black text-white hover:bg-white hover:text-black"
        >
          Start Lab Session
        </motion.button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="p-8 border border-black rounded-[24px] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-base leading-relaxed opacity-70 font-medium">
        {children}
      </div>
    </div>
  );
}

// --- Screen 3: Live Session ---
function Session({ experiment, onOpenAssistant, onBack }: { experiment: Experiment | null, onOpenAssistant: () => void, onBack: () => void }) {
  const [step, setStep] = useState(1);
  
  return (
    <div className="h-full flex flex-col gap-8">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Beaker size={24} />
          <span className="text-xl font-bold tracking-tight">SenseBridge</span>
        </div>
        <div className="text-lg font-bold tracking-tight">{experiment?.title}</div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-1 border border-black rounded-full font-bold">Step {step} / 4</div>
          <button onClick={onBack} className="p-2 border border-black rounded-full hover:bg-black hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-8">
        {/* Camera Feed Area */}
        <div className="flex-1 relative border border-black rounded-[24px] overflow-hidden group">
          <div className="absolute inset-0 bg-neutral-50 flex items-center justify-center">
             <Camera size={64} className="opacity-10" />
             <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-[400px] h-[300px] border border-black rounded-xl flex items-start justify-end p-4"
                >
                  <div className="px-3 py-1 border border-black rounded-full text-[10px] font-bold uppercase bg-white">
                    Target: Beaker (Detected)
                  </div>
                </motion.div>
             </div>
          </div>
          
          {/* AI Labels */}
          <div className="absolute bottom-8 left-8 flex gap-4">
            <div className="px-4 py-2 border border-black bg-white rounded-xl text-sm font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
              Monitoring Fluid Levels
            </div>
          </div>

          <div className="absolute top-8 right-8">
            <div className="p-4 border border-black bg-white rounded-2xl flex flex-col items-center gap-1">
              <Scan size={24} />
              <span className="text-[10px] font-bold uppercase">Active Scan</span>
            </div>
          </div>
        </div>

        {/* Instructions Side Panel */}
        <div className="w-80 flex flex-col gap-6">
          <div className="p-8 border border-black rounded-[24px] flex-1 flex flex-col gap-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Current Step</h4>
              <p className="text-2xl font-bold leading-tight">Pour 50ml of Solution A into the main reaction beaker.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 opacity-60">
                <CheckCircle2 size={18} className="mt-1" />
                <p className="text-sm font-medium">Verify concentration labels on container.</p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-1" />
                <p className="text-sm font-bold italic">Wait for AI to confirm volume detection.</p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-black/10">
               <div className="flex items-center gap-3 mb-4">
                 <ShieldCheck size={20} />
                 <span className="text-xs font-bold uppercase tracking-wider">Safety Status: Secure</span>
               </div>
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 className="w-full py-4 border border-black rounded-full font-bold hover:bg-black hover:text-white transition-colors"
               >
                 Mark Step Complete
               </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Button */}
      <motion.button
        onClick={onOpenAssistant}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-12 w-20 h-20 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-xl hover:bg-black hover:text-white transition-colors z-50"
      >
        <MessageSquare size={32} />
      </motion.button>
    </div>
  );
}

// --- Screen 4: Assistant ---
function Assistant({ onBack, experiment }: { onBack: () => void, experiment: Experiment | null }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hello! I'm your SenseBridge Assistant. I'm monitoring your ${experiment?.title} experiment. How can I help?` },
    { role: 'user', text: "What happens if I add more Potassium Iodide?" }
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 font-bold uppercase tracking-wider">
          <ArrowLeft size={18} />
          Back to Session
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-widest">AI Assistant Active</span>
        </div>
        <div className="px-4 py-1 border border-black rounded-full text-xs font-bold uppercase">
          {experiment?.title}
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Chat Side */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto scroll-container flex flex-col gap-6 pr-4">
            {messages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "max-w-[80%] p-6 rounded-[24px] text-lg font-medium leading-relaxed",
                  m.role === 'user' ? "self-end border border-black" : "self-start bg-black text-white"
                )}
              >
                {m.text}
              </motion.div>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-4 p-2 border border-black rounded-full bg-white">
              <input 
                placeholder="Ask about the experiment..." 
                className="flex-1 px-6 bg-transparent outline-none font-medium"
              />
              <button className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:scale-105 transition-transform">
                <Send size={20} />
              </button>
            </div>
            <div className="flex justify-center mt-6">
              <motion.button
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 border border-black rounded-full flex items-center justify-center hover:bg-neutral-50"
              >
                <Mic size={24} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Context Side */}
        <div className="w-80 border-l border-black/10 pl-8 flex flex-col gap-8">
           <div>
             <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-4">Context Awareness</h4>
             <div className="space-y-4">
                <div className="p-4 border border-black rounded-xl">
                  <div className="text-xs font-bold uppercase mb-1">Current Status</div>
                  <div className="text-sm font-medium">Beaker A is ready. Waiting for Solution B addition.</div>
                </div>
                <div className="p-4 border border-black rounded-xl">
                  <div className="text-xs font-bold uppercase mb-1">AI Suggestion</div>
                  <div className="text-sm font-medium italic">"Ensure the room temperature is stable for accurate timing."</div>
                </div>
             </div>
           </div>

           <div>
             <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-4">Experiment Metadata</h4>
             <div className="grid grid-cols-2 gap-2">
                <div className="p-3 border border-black/10 rounded-lg text-center">
                  <div className="text-[10px] font-bold opacity-40">TEMP</div>
                  <div className="text-sm font-bold">22.4°C</div>
                </div>
                <div className="p-3 border border-black/10 rounded-lg text-center">
                  <div className="text-[10px] font-bold opacity-40">PH</div>
                  <div className="text-sm font-bold">7.0</div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
