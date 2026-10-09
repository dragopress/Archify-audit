import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Layers,
  Terminal,
  Gauge,
  CheckCircle2,
  Clock,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { Recommendations, ActionPlanPhase } from '../types/audit';

interface RecommendationsTabProps {
  recommendations: Recommendations;
  actionPlan: ActionPlanPhase[];
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  recommendations,
  actionPlan,
}) => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemKey: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const sections = [
    {
      title: 'Architectural Design & Structure',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      items: recommendations.architecture,
      borderColor: 'border-indigo-500/30',
      badgeColor: 'bg-indigo-500/10 text-indigo-300',
    },
    {
      title: 'Security Hardening & Zero-Trust',
      icon: <Shield className="w-4 h-4 text-rose-400" />,
      items: recommendations.securityHardening,
      borderColor: 'border-rose-500/30',
      badgeColor: 'bg-rose-500/10 text-rose-300',
    },
    {
      title: 'DevOps, Containers & CI/CD',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />,
      items: recommendations.devOpsAndCI,
      borderColor: 'border-cyan-500/30',
      badgeColor: 'bg-cyan-500/10 text-cyan-300',
    },
    {
      title: 'Performance & Observability',
      icon: <Gauge className="w-4 h-4 text-amber-400" />,
      items: recommendations.performanceAndScalability,
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/10 text-amber-300',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Phased Remediation Roadmap */}
      {actionPlan && actionPlan.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">
                Prioritized Remediation Roadmap
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {completedItems.size} tasks resolved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actionPlan.map((phase, pIdx) => (
              <div
                key={pIdx}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                      Phase {pIdx + 1}
                    </span>
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {phase.timeframe}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white">
                    {phase.phase}
                  </h3>

                  <ul className="mt-3 space-y-2">
                    {phase.items.map((item, iIdx) => {
                      const itemKey = `${pIdx}-${iIdx}`;
                      const isDone = completedItems.has(itemKey);

                      return (
                        <li
                          key={iIdx}
                          onClick={() => toggleItem(itemKey)}
                          className={`flex items-start gap-2 text-xs cursor-pointer p-2 rounded-lg transition select-none ${
                            isDone
                              ? 'bg-emerald-950/20 text-slate-500 line-through'
                              : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/40'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition ${
                              isDone ? 'text-emerald-400 fill-emerald-500/20' : 'text-slate-600'
                            }`}
                          />
                          <span className="leading-snug">{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">
            Engineering & Security Best Practice Guidance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-slate-900/50 border ${section.borderColor} shadow-md space-y-3`}
            >
              <div className="flex items-center gap-2">
                {section.icon}
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  {section.title}
                </h3>
              </div>

              <ul className="space-y-2">
                {section.items.map((rec, rIdx) => (
                  <li
                    key={rIdx}
                    className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
