'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/**
 * useMovieSearch — logic submit dùng chung cho mọi ô tìm kiếm phim trong app (Header, MovieListing)
 * — Phase 16A: tránh lặp lại `router.push`/`encodeURIComponent` ở từng nơi gọi ("Không duplicate
 * logic"). Chỉ điều hướng tới `/tim-kiem?q=...`, KHÔNG tự gọi API ở đây — trang `/tim-kiem` tái
 * dùng `MovieListing` để fetch thật.
 */
export function useMovieSearch(defaultValue = '') {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    router.push(`/tim-kiem?q=${encodeURIComponent(trimmed)}`);
  };

  return { value, setValue, handleSubmit };
}
