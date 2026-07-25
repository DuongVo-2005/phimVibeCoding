/**
 * AwardCard — khớp mục "Giải thưởng & Đề cử" trong `design/actorprofile.html`. Chỉ presentational.
 */
export function AwardCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface-container p-md rounded-xl flex items-center gap-md border border-white/5">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div>
        <h4 className="text-label-md font-bold text-on-surface">{title}</h4>
        <p className="text-body-md text-on-surface-variant/70">{description}</p>
      </div>
    </div>
  );
}
