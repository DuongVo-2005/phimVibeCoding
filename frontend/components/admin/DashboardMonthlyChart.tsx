import type { DashboardMonthlyBucket } from '@/lib/types/dashboard';

/**
 * DashboardMonthlyChart — Phase 32 (v1.1 — Dashboard API). Biểu đồ cột SVG tự dựng, KHÔNG thêm
 * thư viện chart mới (recharts/chart.js...) — dữ liệu chỉ là chuỗi 1-24 điểm theo tháng, không
 * cần tương tác phức tạp (zoom/tooltip động/legend nhiều chuỗi) để biện minh cho 1 dependency mới,
 * cùng tinh thần tránh over-engineering đã áp dụng ở Phase 31 (không thêm `sharp` khi chưa cần).
 */
export function DashboardMonthlyChart({
  title,
  data,
}: {
  title: string;
  data: DashboardMonthlyBucket[];
}) {
  const max = Math.max(1, ...data.map((bucket) => bucket.count));

  return (
    <div className="flex flex-col gap-sm rounded-2xl bg-surface-container p-lg">
      <h3 className="text-label-lg font-label-lg text-on-surface">{title}</h3>
      {data.every((bucket) => bucket.count === 0) ? (
        <p className="text-label-md text-on-surface-variant py-lg text-center">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {data.map((bucket) => (
            <div
              key={bucket.period}
              className="flex-1 flex flex-col items-center justify-end gap-1 h-full group"
            >
              <span className="text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                {bucket.count}
              </span>
              <div
                className="w-full rounded-t bg-primary/70 group-hover:bg-primary transition-colors"
                style={{ height: `${Math.max(2, (bucket.count / max) * 100)}%` }}
                title={`${bucket.period}: ${bucket.count}`}
              />
              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                {bucket.period.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
