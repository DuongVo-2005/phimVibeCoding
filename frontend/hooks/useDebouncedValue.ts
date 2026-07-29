'use client';

import { useEffect, useState } from 'react';

/**
 * useDebouncedValue — Phase 19B.2: tách từ pattern debounce đã lặp lại thủ công ở
 * `AdminMovieListView` (ô tìm tên phim) và giờ cần thêm 2 lần nữa cho `MovieForm` (tìm đạo diễn/
 * diễn viên) — đủ 3 nơi dùng để tách thành hook dùng chung, tránh chép lại `useEffect`/
 * `setTimeout` giống hệt nhau.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
