import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { FleetDispatch } from '../types.ts';
import { RobotImage } from './RobotImage.tsx';

interface NewsViewProps {
  dispatches: FleetDispatch[];
  initialArticleId?: string | null;
}

const DISPATCH_IMAGES: Record<string, string> = {
  'disp-01': '/src/assets/images/hero_robotics_floor_1795701351020.jpg',
  'disp-02': '/src/assets/images/robot_humanoid_unit_1795701351108.jpg',
  'disp-03': '/src/assets/images/robot_logistics_amr_1795701350768.jpg',
};

export function NewsView({ dispatches, initialArticleId }: NewsViewProps) {
  const [category, setCategory] = useState('All');
  const [activeStory, setActiveStory] = useState<FleetDispatch | null>(
    initialArticleId
      ? dispatches.find((d) => d.id === initialArticleId) ?? null
      : null
  );

  const categories = ['All', ...Array.from(new Set(dispatches.map((d) => d.category)))];
  const visible = dispatches.filter(
    (d) => category === 'All' || d.category === category
  );

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-base font-bold text-[#0F172A]">
            Fleet Updates
          </h1>
          <p className="text-[11px] text-[#64748B]">
            Hardware launches & operational notes
          </p>
        </div>
        <span className="px-2 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono text-[10.5px] font-semibold text-[#475569]">
          {dispatches.length} stories
        </span>
      </header>

      <div className="px-4 space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === cat
                  ? 'bg-[#0B1220] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3.5">
          {visible.map((story) => (
            <article
              key={story.id}
              onClick={() => setActiveStory(story)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveStory(story);
                }
              }}
              className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden cursor-pointer hover:border-[#CBD5E1] transition-colors"
            >
              <div className="aspect-[16/9] bg-[#F1F5F9] overflow-hidden">
                <RobotImage
                  src={
                    DISPATCH_IMAGES[story.id] ??
                    '/src/assets/images/hero_robotics_floor_1795701351020.jpg'
                  }
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-semibold">
                    {story.category}
                  </span>
                  <span className="font-mono text-[#64748B]">
                    {story.publishedAt}
                  </span>
                </div>
                <h2 className="font-display text-sm font-bold text-[#0F172A] leading-snug">
                  {story.title}
                </h2>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {story.summary}
                </p>
                <span className="pt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8]">
                  <span>Read dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {activeStory && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1220]/60 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[430px] max-h-[85dvh] overflow-y-auto bg-white rounded-t-2xl border-t border-[#E2E8F0] p-5 space-y-4">
            <div className="w-10 h-1 rounded-full bg-[#CBD5E1] mx-auto" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-semibold">
                  {activeStory.category}
                </span>
                <span className="font-mono text-[#64748B]">
                  {activeStory.publishedAt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#F1F5F9]">
              <RobotImage
                src={
                  DISPATCH_IMAGES[activeStory.id] ??
                  '/src/assets/images/hero_robotics_floor_1795701351020.jpg'
                }
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0F172A] leading-snug">
              {activeStory.title}
            </h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              {activeStory.summary} Nexora AI continues expanding real-time facility telemetry
              across deployed robotics hardware while supporting instant crypto settlements
              through Binance-supported multi-chain deposits and withdrawals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
