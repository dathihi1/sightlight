import { ContentBlockNode } from "@/lib/lesson-types";

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-ink-900)]">{title}</h1>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 text-sm">
          {topic && (
            <span className="px-3 py-1 bg-[var(--color-brand-100)] text-[var(--color-brand-700)] rounded-full">
              {topic}
            </span>
          )}
          {targetLevel && (
            <span className="px-3 py-1 bg-[var(--color-ink-100)] text-[var(--color-ink-700)] rounded-full">
              {targetLevel}
            </span>
          )}
          {estimatedMinutes && (
            <span className="px-3 py-1 bg-[var(--color-ink-100)] text-[var(--color-ink-700)] rounded-full">
              {estimatedMinutes} phút
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="p-4 bg-[var(--color-brand-50)] rounded-lg">
          <p className="text-[var(--color-ink-700)]">{summary}</p>
        </div>
      )}

      {/* Learning Objectives */}
      {learningObjectives && learningObjectives.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Mục tiêu học tập</h2>
          <ul className="space-y-2">
            {learningObjectives.map((objective, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[var(--color-brand-600)] mt-1">✓</span>
                <span className="text-[var(--color-ink-700)]">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Blocks */}
      {blocks && blocks.length > 0 && (
        <div className="space-y-4">
          {blocks.map((block) => (
            <ContentBlock key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Start Button */}
      <div className="pt-4">
        <button
          onClick={onStart}
          className="w-full py-3 px-6 bg-[var(--color-brand-600)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-700)] transition-colors"
        >
          Bắt đầu luyện tập
        </button>
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
    <div className="p-4 bg-white border border-[var(--color-ink-200)] rounded-lg">
      {block.title && <h3 className="font-semibold text-[var(--color-ink-900)] mb-2">{block.title}</h3>}
      {block.bodyText && <p className="text-[var(--color-ink-700)]">{block.bodyText}</p>}
    </div>
  );
}

function ObjectivesBlock({ block }: { block: ContentBlockNode }) {
  const objectives = block.payload?.objectives || [];
  return (
    <div className="p-4 bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] rounded-lg">
      <h3 className="font-semibold text-[var(--color-ink-900)] mb-3">Mục tiêu</h3>
      <ul className="space-y-2">
        {objectives.map((obj: string, idx: number) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-[var(--color-brand-600)]">✓</span>
            <span className="text-[var(--color-ink-700)]">{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignCardBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="p-4 bg-white border-2 border-[var(--color-brand-300)] rounded-lg">
      {block.title && <h3 className="text-xl font-bold text-[var(--color-ink-900)] mb-2">{block.title}</h3>}
      {block.bodyText && <p className="text-[var(--color-ink-700)] mb-3">{block.bodyText}</p>}
      {block.mediaRef && (
        <div className="rounded overflow-hidden bg-[var(--color-ink-100)]">
          <video src={block.mediaRef} controls className="w-full" />
        </div>
      )}
    </div>
  );
}

function MemoryTipBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="p-4 bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-2xl">💡</span>
        <div>
          <h3 className="font-semibold text-[var(--color-ink-900)] mb-1">Mẹo ghi nhớ</h3>
          {block.bodyText && <p className="text-[var(--color-ink-700)]">{block.bodyText}</p>}
        </div>
      </div>
    </div>
  );
}

function ExampleBlock({ block }: { block: ContentBlockNode }) {
  return (
    <div className="p-4 bg-[var(--color-ink-50)] border border-[var(--color-ink-200)] rounded-lg">
      <h3 className="font-semibold text-[var(--color-ink-900)] mb-2">Ví dụ</h3>
      {block.bodyText && <p className="text-[var(--color-ink-700)] italic">{block.bodyText}</p>}
      {block.payload?.translation && (
        <p className="text-[var(--color-ink-600)] text-sm mt-1">→ {block.payload.translation}</p>
      )}
    </div>
  );
}

function SummaryBlock({ block }: { block: ContentBlockNode }) {
  const keyPoints = block.payload?.keyPoints || [];
  return (
    <div className="p-4 bg-[var(--color-success-50)] border border-[var(--color-success-200)] rounded-lg">
      <h3 className="font-semibold text-[var(--color-ink-900)] mb-2">Tóm tắt</h3>
      {block.bodyText && <p className="text-[var(--color-ink-700)] mb-3">{block.bodyText}</p>}
      {keyPoints.length > 0 && (
        <ul className="space-y-1">
          {keyPoints.map((point: string, idx: number) => (
            <li key={idx} className="text-[var(--color-ink-700)] text-sm">
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
    <div className="p-4 bg-white border border-[var(--color-ink-200)] rounded-lg">
      {block.title && <h3 className="font-semibold text-[var(--color-ink-900)] mb-2">{block.title}</h3>}
      {block.bodyText && <p className="text-[var(--color-ink-700)]">{block.bodyText}</p>}
    </div>
  );
}
