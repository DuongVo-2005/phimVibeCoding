/**
 * FilterSidebar — khớp sidebar bộ lọc trong design/moviecategory.html (chip thể loại, dropdown
 * quốc gia, khoảng năm, sắp xếp). Chỉ hiện ở desktop (`hidden lg:flex`, đúng design). CHỈ UI tĩnh
 * — không state/onChange/onClick, dữ liệu do trang gọi truyền vào (mock, Phase 10.3 đã xác nhận
 * không cho phép tương tác tại chỗ). Link "Yêu thích"/"Danh sách" ở cuối sidebar gốc trong design
 * KHÔNG dựng — cùng bản chất account-widget đã loại ở SideNavBar (Phase 10.1).
 */
export function FilterSidebar({
  genres,
  countries,
  sorts,
}: {
  genres: Array<{ id: string; label: string; active: boolean }>;
  countries: string[];
  sorts: Array<{ id: string; label: string; active: boolean }>;
}) {
  return (
    <aside className="hidden lg:flex flex-col gap-lg w-72 shrink-0 h-[calc(100vh-120px)] sticky top-24 overflow-y-auto pr-base">
      <div>
        <h3 className="text-label-md font-label-md text-primary mb-md flex items-center gap-xs uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            filter_list
          </span>
          Bộ lọc phim
        </h3>

        <div className="mb-lg">
          <p className="text-body-md font-label-md text-on-surface-variant mb-base">Thể loại</p>
          <div className="flex flex-wrap gap-xs">
            {genres.map((genre) => (
              <span
                key={genre.id}
                className={
                  genre.active
                    ? 'px-sm py-1 bg-primary text-on-primary rounded-lg text-label-md cursor-default'
                    : 'px-sm py-1 bg-surface-container-high text-on-surface-variant rounded-lg text-label-md cursor-default'
                }
              >
                {genre.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-lg">
          <p className="text-body-md font-label-md text-on-surface-variant mb-base">Quốc gia</p>
          <select
            disabled
            className="w-full bg-surface-container-high border-none text-on-surface text-label-md rounded-xl p-md"
            defaultValue={countries[0]}
          >
            {countries.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </div>

        <div className="mb-lg">
          <p className="text-body-md font-label-md text-on-surface-variant mb-base">
            Năm phát hành
          </p>
          <div className="grid grid-cols-2 gap-sm">
            <input
              type="number"
              placeholder="Từ"
              readOnly
              className="bg-surface-container-high border-none text-on-surface text-label-md rounded-xl p-md placeholder:text-on-surface-variant/50"
            />
            <input
              type="number"
              placeholder="Đến"
              readOnly
              className="bg-surface-container-high border-none text-on-surface text-label-md rounded-xl p-md placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <div className="mb-lg">
          <p className="text-body-md font-label-md text-on-surface-variant mb-base">Sắp xếp theo</p>
          <div className="flex flex-col gap-xs">
            {sorts.map((sort) => (
              <label
                key={sort.id}
                className={
                  sort.active
                    ? 'flex items-center gap-sm p-sm bg-primary/10 border border-primary/20 rounded-xl'
                    : 'flex items-center gap-sm p-sm rounded-xl'
                }
              >
                <input
                  type="radio"
                  name="sort"
                  checked={sort.active}
                  readOnly
                  className="text-primary bg-transparent border-outline"
                />
                <span
                  className={
                    sort.active
                      ? 'text-label-md text-primary'
                      : 'text-label-md text-on-surface-variant'
                  }
                >
                  {sort.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
