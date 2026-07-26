const SCORES = Array.from({ length: 10 }, (_, index) => index + 1);

/**
 * RatingInput — Phase 14B: widget chọn điểm 1-10, dùng CHUNG cho Movie Detail và Watch Page (chỉ
 * 1 component, không tạo biến thể khác). Không có trong Figma (đã ghi nhận OUT OF SCOPE ở audit
 * Phase 11.6C) — tạo mới theo yêu cầu tường minh của phase này. Chỉ số 1-10, không animation
 * (không dùng class `transition-*`), không popup/modal.
 */
export function RatingInput({
  myRating,
  onSelect,
  disabled = false,
}: {
  myRating: number | null;
  onSelect: (score: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Chấm điểm phim từ 1 đến 10">
      {SCORES.map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          aria-pressed={myRating === score}
          onClick={() => onSelect(score)}
          className={
            myRating === score
              ? 'w-7 h-7 rounded text-label-md font-bold bg-primary text-on-primary'
              : 'w-7 h-7 rounded text-label-md font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }
        >
          {score}
        </button>
      ))}
    </div>
  );
}
