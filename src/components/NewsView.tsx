import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (initialArticleId) {
      const found = dispatches.find((d) => d.id === initialArticleId);
      if (found) setActiveStory(found);
    }
  }, [initialArticleId, dispatches]);

  useEffect(() => {
    if (!activeStory) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveStory(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStory]);

  const categories = ['All', ...Array.from(new Set(dispatches.map((d) => d.category)))];
  const visible = dispatches.filter(
    (d) => category === 'All' || d.category === category
  );

  const resolveStoryImage = (story: FleetDispatch) =>
    story.imageUrl ||
    DISPATCH_IMAGES[story.id] ||
    '/src/assets/images/hero_robotics_floor_1795701351020.jpg';

  return (
    <div className="pb-6 space-y-4">
      <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Fleet Updates
          </h1>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            Hardware launches & operational notes
          </p>
        </div>
        <span className="px-2 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] font-mono text-[10.5px] font-semibold text-[#475569] dark:text-[#CBD5E1]">
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
                  ? 'bg-[#0B1220] dark:bg-[#2563EB] text-white'
                  : 'bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] text-[#475569] dark:text-[#94A3B8] hover:border-[#CBD5E1]'
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
              className="bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl overflow-hidden cursor-pointer hover:border-[#CBD5E1] dark:hover:border-[#334155] transition-colors"
            >
              <div className="aspect-[16/9] bg-[#F1F5F9] dark:bg-[#1E293B] overflow-hidden">
                <RobotImage
                  src={resolveStoryImage(story)}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-[10.5px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#1D4ED8] dark:text-[#60A5FA] font-semibold">
                    {story.category}
                  </span>
                  <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">
                    {story.publishedAt}
                  </span>
                </div>
                <h2 className="font-display text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">
                  {story.title}
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                  {story.summary}
                </p>
                <span className="pt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA]">
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
          onClick={() => setActiveStory(null)}
          className="fixed inset-0 z-50 bg-[#0B1220]/70 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] max-h-[85dvh] overflow-y-auto bg-white dark:bg-[#111827] rounded-t-2xl border-t border-[#E2E8F0] dark:border-[#1E293B] p-5 space-y-4"
          >
            <div className="w-10 h-1 rounded-full bg-[#CBD5E1] dark:bg-[#334155] mx-auto" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-[#EFF6FF] dark:bg-[#1E3A8A]/40 text-[#1D4ED8] dark:text-[#60A5FA] font-semibold">
                  {activeStory.category}
                </span>
                <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">
                  {activeStory.publishedAt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStory(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-lg border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#F1F5F9] dark:bg-[#1E293B]">
              <RobotImage
                src={resolveStoryImage(activeStory)}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-display text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">
              {activeStory.title}
            </h3>
            <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
              {activeStory.summary} Active telemetry synchronization and multi-chain Binance
              crypto settlements remain available 24/7 across all deployed hardware clusters.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
