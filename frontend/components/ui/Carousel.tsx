'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type TouchEvent,
} from 'react';

const AUTO_PLAY_MS = 4000;
const GAP_PX = 16; // khớp `gap-md` (`--spacing-md` trong globals.css)
const SWIPE_THRESHOLD_PX = 40;
// Thời gian transition dùng trực tiếp qua class Tailwind tĩnh `duration-300` (JIT compiler cần
// chuỗi class tĩnh, không thể ghép động từ hằng số) — 300ms nằm trong khoảng 200-300ms yêu cầu.

export interface CarouselItem {
  key: string;
  content: ReactNode;
}

// `useLayoutEffect` gây warning khi render trên server (SSR) — Carousel luôn là Client Component
// nhưng Next.js vẫn server-render lần đầu, nên fallback về `useEffect` phía server, dùng
// `useLayoutEffect` thật khi đã ở browser (đo `slideWidth` trước khi paint, tránh 1 frame lệch vị
// trí lúc mount).
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Carousel — Phase 16B: tự build hoàn toàn bằng React, KHÔNG dùng thư viện (Swiper/Embla/Keen...).
 * Dùng chung cho mọi carousel homepage (Trending/LatestSeries/MostCommented/LatestMovies).
 *
 * Kỹ thuật vòng lặp vô hạn: nhân bản phần tử cuối/đầu ("clone") vào 2 đầu mảng hiển thị
 * (`[last, ...items, first]`), trượt tới clone rồi "nhảy" tức thời (tắt transition đúng 1 frame
 * qua `onTransitionEnd`) về vị trí thật tương ứng — người dùng không thấy giật hình.
 *
 * Trượt từng 1 thẻ/lần, chiều rộng đo THẬT qua `getBoundingClientRect` của thẻ đầu tiên (không
 * hardcode theo breakpoint) — tự đúng ở mọi kích thước màn hình, kể cả khi đổi cỡ cửa sổ.
 *
 * Auto-slide 4s (`AUTO_PLAY_MS`), dừng khi hover (`isHovering`) — không dừng khi bàn phím
 * focus/dots/nút prev-next đang tương tác vì đó là hành động chủ động của người dùng, không cần
 * thêm điều kiện riêng (rời chuột ra là chạy tiếp, đúng kỳ vọng thông thường).
 */
export function Carousel({ items, ariaLabel }: { items: CarouselItem[]; ariaLabel: string }) {
  const count = items.length;
  const canLoop = count > 1;
  const extended = canLoop ? [items[count - 1], ...items, items[0]] : items;

  const firstItemRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const [renderIndex, setRenderIndex] = useState(canLoop ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);

  const measure = useCallback(() => {
    if (firstItemRef.current) {
      setSlideWidth(firstItemRef.current.getBoundingClientRect().width + GAP_PX);
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();
  }, [measure, count]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const goTo = useCallback((next: number) => {
    setWithTransition(true);
    setRenderIndex(next);
  }, []);

  const next = useCallback(() => {
    if (!canLoop) return;
    setWithTransition(true);
    setRenderIndex((current) => current + 1);
  }, [canLoop]);

  const prev = useCallback(() => {
    if (!canLoop) return;
    setWithTransition(true);
    setRenderIndex((current) => current - 1);
  }, [canLoop]);

  // Auto-slide — dừng khi hover hoặc chỉ có 0-1 phần tử (không có gì để trượt).
  useEffect(() => {
    if (!canLoop || isHovering) {
      return;
    }
    const id = window.setInterval(next, AUTO_PLAY_MS);
    return () => window.clearInterval(id);
  }, [canLoop, isHovering, next]);

  // Chạm tới clone ở 2 đầu → tắt transition, nhảy tức thời về vị trí thật tương ứng.
  const handleTransitionEnd = () => {
    if (!canLoop) return;
    if (renderIndex === 0) {
      setWithTransition(false);
      setRenderIndex(count);
    } else if (renderIndex === count + 1) {
      setWithTransition(false);
      setRenderIndex(1);
    }
  };

  // Bật lại transition ở frame kế tiếp sau khi tắt để nhảy — nếu không, lần trượt kế tiếp sẽ
  // không có animation.
  useEffect(() => {
    if (!withTransition) {
      const id = requestAnimationFrame(() => setWithTransition(true));
      return () => cancelAnimationFrame(id);
    }
  }, [withTransition]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD_PX) {
      prev();
    } else if (delta < -SWIPE_THRESHOLD_PX) {
      next();
    }
    touchStartX.current = null;
  };

  if (count === 0) {
    return null;
  }

  const activeDot = canLoop ? (renderIndex - 1 + count) % count : 0;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div
          className={`flex gap-md pb-2 ${withTransition ? `transition-transform duration-300 ease-out` : ''}`}
          style={{ transform: `translateX(-${renderIndex * slideWidth}px)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extended.map((item, index) => (
            <div
              key={`${item.key}-${index}`}
              ref={index === 1 ? firstItemRef : undefined}
              className="min-w-[200px] lg:min-w-[240px] flex-shrink-0"
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>

      {canLoop ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Xem phim trước"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container/90 backdrop-blur flex items-center justify-center text-on-surface shadow-lg transition-transform duration-300 ease-out hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_left
            </span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Xem phim tiếp theo"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container/90 backdrop-blur flex items-center justify-center text-on-surface shadow-lg transition-transform duration-300 ease-out hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_right
            </span>
          </button>
          <div
            className="flex justify-center flex-wrap gap-xs mt-base"
            role="tablist"
            aria-label="Chọn slide"
          >
            {items.map((item, index) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={index === activeDot}
                aria-label={`Tới slide ${index + 1}`}
                onClick={() => goTo(index + 1)}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  index === activeDot ? 'bg-primary' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
