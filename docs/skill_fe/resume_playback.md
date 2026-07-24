# Skill: Tiếp tục xem phim (Resume Playback) - Frontend

Skill này hướng dẫn cách tích hợp tính năng lưu và khôi phục thời gian xem phim trên giao diện React/Javascript.

## 1. Theo dõi thời gian (Tracking)

Sử dụng sự kiện `timeupdate` của HTML5 Video hoặc API của các Player (như JWPlayer, Video.js).

```javascript
const handleTimeUpdate = (e) => {
  const currentTime = Math.floor(e.target.currentTime);
  const totalTime = Math.floor(e.target.duration);

  // Chỉ gửi API sau mỗi 15 giây để tiết kiệm tài nguyên
  if (currentTime % 15 === 0 && currentTime > 0) {
    saveProgress(currentTime, totalTime);
  }
};
```

## 2. Gửi tiến trình lên Server (Debounce/Throttle)

Để tránh spam API, nên sử dụng cơ chế kiểm tra thời gian hoặc `throttle`.

```javascript
const saveProgress = async (time, total) => {
  try {
    await axios.post('/watch-history/update', {
      filmId: currentFilmId,
      episodeSlug: currentEpisodeSlug,
      serverName: 'Vietsub',
      duration: time,
      totalDuration: total
    });
  } catch (err) {
    console.error('Không thể lưu tiến trình xem');
  }
};
```

## 3. Khôi phục vị trí xem (Resume)

Khi trang phim được load, hãy fetch tiến trình từ server và thiết lập `currentTime` cho player.

```javascript
useEffect(() => {
  const fetchProgress = async () => {
    const res = await axios.get(`/watch-history/film/${filmId}/episode/${episodeSlug}`);
    if (res.data && res.data.duration > 0) {
      // Nhảy đến thời gian đã lưu
      videoRef.current.currentTime = res.data.duration;
      alert(`Đang xem tiếp tại ${formatTime(res.data.duration)}`);
    }
  };
  fetchProgress();
}, [episodeSlug]);
```

## 4. Lưu ý quan trọng
- Nên lưu vào `localStorage` như một phương án dự phòng nếu người dùng chưa đăng nhập.
- Khi video kết thúc (`onEnded`), hãy cập nhật `duration = 0` hoặc đánh dấu là đã hoàn thành.
