import type { PlayerType } from '@/lib/watch/playback-state';
import { EmptyPlayer } from './EmptyPlayer';
import { HlsPlayer } from './HlsPlayer';
import { IframePlayer } from './IframePlayer';

/**
 * PlayerResolver — Phase 13B: chọn đúng player con theo `playerType` đã derive sẵn ở
 * `PlaybackState` (`lib/watch/playback-state.ts`, dựa trên `episode.m3u8Url`/`embedUrl`) — KHÔNG
 * tự suy luận lại `playerType` ở đây, chỉ đọc giá trị đã có sẵn (tránh 2 nơi cùng quyết định 1
 * việc, dễ lệch nhau). `VideoPlayer` (layout ngoài) là nơi DUY NHẤT gọi component này — bản thân
 * `VideoPlayer` không còn nhánh `if (playerType)`.
 */
export function PlayerResolver({
  playerType,
  currentVideoUrl,
  onVideoRef,
}: {
  playerType: PlayerType | undefined;
  currentVideoUrl: string;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
}) {
  if (playerType === 'hls') {
    return <HlsPlayer src={currentVideoUrl} onVideoRef={onVideoRef} />;
  }

  if (playerType === 'iframe') {
    return <IframePlayer src={currentVideoUrl} />;
  }

  return <EmptyPlayer />;
}
