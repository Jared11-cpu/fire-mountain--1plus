import { Camera, Film, HeartHandshake, Sparkles } from 'lucide-react';
import type { SmartRoute } from '../types/route';

type RouteInsightPanelProps = {
  route: SmartRoute;
};

export function RouteInsightPanel({ route }: RouteInsightPanelProps) {
  const crowdEntries = Object.entries(route.sceneryAnalysis.crowdTips);

  return (
    <section className="glass rounded-[1.75rem] p-5 shadow-soft">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-jade/10 px-3 py-1 text-xs font-black text-jade">
            <Sparkles className="h-4 w-4" />
            沿途 AI 观察
          </div>
          <h3 className="mt-2 font-display text-3xl font-black text-ink">沿途风景与记录点分析</h3>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-ink/62">
          {route.city} · {route.points.length} 个路线点
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightColumn icon={Sparkles} title="风景亮点" items={route.sceneryAnalysis.highlights} />
        <InsightColumn icon={Camera} title="最佳拍照时间" items={route.sceneryAnalysis.bestPhotoTimes} />
        <InsightColumn icon={Film} title="短视频镜头" items={route.sceneryAnalysis.videoShots} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <div className="text-sm font-black text-jade">朋友圈 / 小红书文案</div>
          <p className="mt-3 leading-7 text-white/75">{route.sceneryAnalysis.socialCopy}</p>
        </div>

        <div className="rounded-2xl bg-white/70 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
            <HeartHandshake className="h-5 w-5 text-river" />
            不同人群记录重点
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {crowdEntries.map(([crowd, tip]) => (
              <div key={crowd} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="font-black text-river">{crowd}</div>
                <p className="mt-1 text-sm leading-6 text-ink/62">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InsightColumn({ icon: Icon, title, items }: { icon: typeof Sparkles; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-river" />
        <h4 className="font-black text-ink">{title}</h4>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-ink/5 px-3 py-2 text-sm font-semibold leading-6 text-ink/66">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
