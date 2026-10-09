import React from 'react';
import {
  Cpu,
  Layers,
  Network,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileCode2,
} from 'lucide-react';
import { FeaturesAndFunctionality } from '../types/audit';

interface FeaturesTabProps {
  featuresData: FeaturesAndFunctionality;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ featuresData }) => {
  const { overview, coreFeatures, apiSurfaceAndEndpoints, authAndDataFlow } = featuresData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Complete':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
            <CheckCircle className="w-3 h-3" /> Complete
          </span>
        );
      case 'Flawed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium">
            <AlertCircle className="w-3 h-3" /> Security Flaw
          </span>
        );
      case 'Incomplete':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
            <HelpCircle className="w-3 h-3" /> Incomplete
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            {status}
          </span>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    const m = method.toUpperCase();
    const color =
      m === 'GET'
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        : m === 'POST'
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : m === 'PUT' || m === 'PATCH'
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

    return (
      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${color}`}>
        {m}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Functional Overview */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">Application Purpose & Functionality</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {overview}
        </p>
      </div>

      {/* Discovered Core Features Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Discovered Features & Modules ({coreFeatures.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coreFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-white">{feature.name}</span>
                {getStatusBadge(feature.status)}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Discovered API Surface / Routes Table */}
      {apiSurfaceAndEndpoints && apiSurfaceAndEndpoints.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              API Surface & Endpoints ({apiSurfaceAndEndpoints.length})
            </h3>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Method</th>
                    <th className="py-2.5 px-4 font-semibold">Route Path</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold">Auth Protection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {apiSurfaceAndEndpoints.map((ep, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-4">{getMethodBadge(ep.method)}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-200">{ep.path}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 text-xs">
                        {ep.description}
                      </td>
                      <td className="py-2.5 px-4 font-sans">
                        {ep.authRequired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                            <Lock className="w-3 h-3" /> Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            <Unlock className="w-3 h-3 text-slate-500" /> Public
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Authentication and Data Flow Topology */}
      {authAndDataFlow && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Authentication & Data Flow Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {authAndDataFlow}
          </p>
        </div>
      )}
    </div>
  );
};
