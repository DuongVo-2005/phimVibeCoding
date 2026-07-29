import type { ReactNode } from 'react';

/**
 * AdminTable — khung bảng dùng riêng cho Admin (Phase 19B.1). Chỉ là lớp vỏ trình bày (thead +
 * cấu trúc bảng chung) — không biết gì về "phim"; nội dung từng dòng (`<tbody>`) do nơi gọi tự
 * truyền qua `children` (`<tr>`/`<td>` tuỳ domain), giữ component này tái dùng được cho bảng admin
 * khác sau này (Users, Comments...) mà không cần sửa lại.
 */
export function AdminTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-body-md">
        <thead className="bg-surface-container-high text-label-md text-on-surface-variant">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-md py-sm font-bold whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}
