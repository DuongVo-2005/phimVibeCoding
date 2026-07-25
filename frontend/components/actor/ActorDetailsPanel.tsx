import { Fragment } from 'react';

/**
 * ActorDetailsPanel — khớp "Thông tin chi tiết" trong `design/actorprofile.html`. Design gốc chỉ
 * hiện Ngày sinh/Nơi sinh ở accordion mobile (2 field) và đủ 4 field ở panel desktop — vì trang
 * dùng 1 cây responsive duy nhất (không còn accordion riêng, xem quyết định C Phase 10.7), panel
 * này hiện đủ 4 field ở mọi kích thước (bổ sung thông tin cho mobile, không có field nào bịa mới).
 * Nút "Theo dõi diễn viên" chỉ là UI tĩnh, không có `onClick`.
 */
export function ActorDetailsPanel({
  birthDate,
  birthPlace,
  occupation,
  height,
}: {
  birthDate: string;
  birthPlace: string;
  occupation: string;
  height: string;
}) {
  const rows = [
    { label: 'Ngày sinh', value: birthDate },
    { label: 'Nơi sinh', value: birthPlace },
    { label: 'Nghề nghiệp', value: occupation },
    { label: 'Chiều cao', value: height },
  ];

  return (
    <div className="bg-surface-container-high p-lg rounded-2xl border border-white/10">
      <h3 className="text-headline-md font-headline-md mb-md text-on-surface">
        Thông tin chi tiết
      </h3>
      <div className="flex flex-col gap-md">
        {rows.map((row, index) => (
          <Fragment key={row.label}>
            <div className="flex flex-col">
              <span className="text-label-md text-on-surface/50">{row.label}</span>
              <span className="text-body-md font-bold text-on-surface">{row.value}</span>
            </div>
            {index < rows.length - 1 ? <div className="h-px bg-white/10" /> : null}
          </Fragment>
        ))}
      </div>
      <button
        type="button"
        className="w-full mt-lg bg-white/5 hover:bg-white/10 py-md rounded-xl text-label-md font-bold transition-all border border-white/10 text-on-surface"
      >
        Theo dõi diễn viên
      </button>
    </div>
  );
}
