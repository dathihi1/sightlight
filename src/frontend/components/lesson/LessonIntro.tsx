import Link from "next/link";
import { ContentBlockNode } from "@/lib/lesson-types";
import { Mascot } from "@/components/ui/Mascot";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { IconCheck } from "@/components/ui/Icons";

interface LessonIntroProps {
  title: string;
  summary?: string;
  topic?: string;
  targetLevel?: string;
  estimatedMinutes?: number;
  learningObjectives?: string[];
  blocks?: ContentBlockNode[];
  onStart: () => void;
}

/**
 * Component hiển thị phần giới thiệu bài học trước khi bắt đầu luyện tập.
 * Bao gồm: title, summary, objectives, content blocks.
 */
export function LessonIntro({
  title,
  summary,
  topic,
  targetLevel,
  estimatedMinutes,
  learningObjectives,
  blocks,
  onStart,
}: LessonIntroProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-8">
      <Link href="/hoc" className="btn btn-ghost btn-sm -ml-3">
        ← Lộ trình
      </Link>

      <div className="mt-4 flex items-center gap-5">
        <Mascot className="w-24 shrink-0" wave />
        <div>
          <div className="flex flex-wrap gap-2">
            {topic && <span className="chip bg-brand-100 text-brand-700">{topic}</span>}
            {targetLevel && <span className="chip bg-sky-100 text-sky-700">{targetLevel}</span>}
            {estimatedMinutes && <span className="chip bg-sun-100 text-sun-700">{estimatedMinutes} phút</span>}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
        </div>
      </div>

      {summary && <p className="mt-6 text-lg leading-relaxed text-ink-600">{summary}</p>}

      {learningObjectives && learningObjectives.length > 0 && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold text-ink-900">Sau bài này bạn sẽ</h2>
          <ul className="mt-3 space-y-3">
            {learningObjectives.map((objective, idx) => (
              <li key={idx} className="flex items-start gap-3 text-base text-ink-700 font-semibold">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-400 text-white">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}

      {blocks && blocks.length > 0 && (
        <div className="mt-6 space-y-4">
          {blocks.map((block) => (
            <ContentBlock key={block.id} block={block} />
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white">
        <div className="mx-auto flex max-w-2xl justify-end px-4 py-5">
          <button onClick={onStart} className="btn btn-primary btn-lg w-full sm:w-64">
            Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Render a single content block based on its type
 */
function ContentBlock({ block }: { block: ContentBlockNode }) {
  const renderContent = () => {
    switch (block.blockType) {
      case "INTRO":
        return <IntroBlock block={block} />;
      case "OBJECTIVES":
        return <ObjectivesBlock block={block} />;
      case "SIGN_CARD":
        return <SignCardBlock block={block} />;
      case "MEMORY_TIP":
        return <MemoryTipBlock block={block} />;
      case "EXAMPLE":
        return <ExampleBlock block={block} />;
      case "SUMMARY":
        return <SummaryBlock block={block} />;
      default:
        return <GenericBlock block={block} />;
    }
  };

  return <div className="content-block">{renderContent()}</div>;
}

function IntroBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="card-flat p-5">
      {block.title && <h3 className="font-bold text-ink-900 mb-2">{block.title}</h3>}
      {block.bodyText && <p className="text-ink-700 font-semibold">{block.bodyText}</p>}
    </div>
  );
}

function ObjectivesBlock({ block }: { block: ContentBlockNode }) {
  const objectives = block.payload?.objectives || [];
  return (
    <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
      <h3 className="font-bold text-ink-900 mb-3">Mục tiêu</h3>
      <ul className="space-y-2">
        {objectives.map((obj: string, idx: number) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-brand-600">✓</span>
            <span className="text-ink-700 font-semibold">{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignCardBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="card p-5">
      {block.title && <h3 className="text-xl font-bold text-ink-900 mb-2">{block.title}</h3>}
      {block.bodyText && <p className="text-ink-700 font-semibold mb-3">{block.bodyText}</p>}
      {block.mediaRef && (
        <SignVideoPlayer videoUrl={block.mediaRef} title={block.title} autoPlay={false} />
      )}
    </div>
  );
}

function MemoryTipBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="rounded-3xl border border-sun-200 bg-sun-50 p-5">
      <div className="flex items-start gap-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sun-400 text-lg font-bold text-ink-900" aria-hidden="true">!</span>
        <div>
          <h3 className="font-bold text-ink-900 mb-1">Mẹo ghi nhớ</h3>
          {block.bodyText && <p className="text-ink-700 font-semibold">{block.bodyText}</p>}
        </div>
      </div>
    </div>
  );
}

function ExampleBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="rounded-3xl border border-ink-200 bg-ink-50 p-5">
      <h3 className="font-bold text-ink-900 mb-2">Ví dụ</h3>
      {block.bodyText && <p className="text-ink-700 font-semibold italic">{block.bodyText}</p>}
      {block.payload?.translation && (
        <p className="text-ink-600 text-sm mt-1">→ {block.payload.translation}</p>
      )}
    </div>
  );
}

function SummaryBlock({ block }: { block: ContentBlockNode }) {
  const keyPoints = block.payload?.keyPoints || [];
  return (
    <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
      <h3 className="font-bold text-ink-900 mb-2">Tóm tắt</h3>
      {block.bodyText && <p className="text-ink-700 font-semibold mb-3">{block.bodyText}</p>}
      {keyPoints.length > 0 && (
        <ul className="space-y-1">
          {keyPoints.map((point: string, idx: number) => (
            <li key={idx} className="text-ink-700 font-semibold text-sm">
              • {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GenericBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="card-flat p-5">
      {block.title && <h3 className="font-bold text-ink-900 mb-2">{block.title}</h3>}
      {block.bodyText && <p className="text-ink-700 font-semibold">{block.bodyText}</p>}
    </div>
  );
}
