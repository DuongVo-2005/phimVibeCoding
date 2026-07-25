/**
 * Dữ liệu mock tối thiểu để render UI trang xem phim (`design/watchmovie.html`) — KHÔNG gọi API,
 * không phải dữ liệu thật. Route `/xem-phim/[slug]` chỉ có 1 nội dung mock cố định, không suy
 * diễn theo `slug` (cùng lý do đã áp dụng ở `/phim/[slug]`, Phase 10.4).
 *
 * Desktop/mobile trong design có vài giá trị lệch nhau (năm phát hành, ảnh nền) do 2 file
 * Mobile/Desktop cũ được gộp lại — chỉ giữ 1 bộ giá trị duy nhất (theo bản desktop) cho cây
 * component responsive thống nhất.
 */

export const filmInfo = {
  title: 'Kẻ Truy Tìm Di Sản',
  year: '2026',
  rating: '9.2',
  badges: ['4K UHD', 'HDR10+'],
  director: 'Christopher Nolan',
  cast: 'Leonardo DiCaprio, Tom Hardy',
  genre: 'Sci-Fi, Hành Động',
  duration: '145 Phút',
  description:
    'Trong một tương lai xa xôi, một thợ săn tiền thưởng vô tình phát hiện ra một bí mật cổ xưa có thể thay đổi vận mệnh của cả thiên hà. Hành trình đưa anh qua những hành tinh hoang tàn và những thành phố neon lộng lẫy, nơi ranh giới giữa người và máy trở nên mờ nhạt.',
  backdropSrc:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA8i5UFxM-7fORj76W1g1dhxsiXPc5SJcWa79K9FfaDZR3ICQAh2QyNSGfd9smfpT7nMiJFZtv9ygbkr01OiYfp4Y5aAJfR9_W3N3DZvQ2LLVA6tCa32HqsII2K2-N45cRinJiKv8z9X7GSOjcJFHA4lGuBcl5pqhK2BTtPP9N-Qt5odugnYbH1z7BHXybQcWr1nu7eVFThCaLjH3LhjT1ObNVIQ7GCUgvGqGEPJD30rp4rKDJgBGNdHc2-PcwyuA3IuS6xwPJpzc8j',
  currentTimeLabel: '24:12 / 1:45:00',
};

/** Tổng số bình luận hiển thị trong heading — độc lập với độ dài mảng `comments` (chỉ mock 2 mục). */
export const commentTotalLabel = '1.240';

/**
 * `active` = tập đang xem (khớp icon "equalizer" + viền primary trong design), khác `locked`
 * (Phase 10.4) — trang này không có khái niệm khoá tập, chỉ có trạng thái đang xem/chưa xem.
 */
export const episodes = [
  {
    id: 'wm-ep-1',
    number: 1,
    title: 'Tập 1: Bản đồ bí ẩn',
    duration: '45 phút',
    active: true,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCDCRIFFALe6OhiExP0BxD6MO7CEe4ZXIaw61-gwHVhw-ORDl6jU0Uo1ZUllFX71LsJ56a_p-UklXQPCjDa4TJmL1rlpjXwuwVb0ho945ywaDsGTRxVo2-Z2JoYfIPgDdtuouZcUFa73GByfYmUqwTgVG9xLesyiwF5QXyQsSF1S3Fwc7MZTqXiPFBZi8zC6O-6MZ_EnFubiQeG-KaBiijSg4HZtfb7cMOy1cLcfN12hveFiMiQHmpTpUe4ynUB-ItuWyy01Dylyv4v',
  },
  {
    id: 'wm-ep-2',
    number: 2,
    title: 'Tập 2: Cuộc rượt đuổi',
    duration: '42 phút',
    active: false,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_LC4WM-1CzxIJGJ1vBT3B1vLoeLjIb6U7chnws7Sg4zY853yQjscK4Khd7Ir0pVRRJK_-krM04CWkCFKUhrFHxayglZHcOSSB8-rwkGeABXIjwy5Hb-n4yWOBMZ-R2p557JZA8LbEPMYWsCZCG3xLkZtSEPfhK8UTugwGuOwRgNUiLQ4WUGW3Nu7lIag3FAzhcyJRmDxZ4oCkjQhr48qpecRmUWUPYThRgG_S13irrgMjcX1D1YZoq5QqG9WQRt7IsiIpaiNemZi1',
  },
  {
    id: 'wm-ep-3',
    number: 3,
    title: 'Tập 3: Ngôi đền cổ',
    duration: '48 phút',
    active: false,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_XEm5lUferhOS3clt8-ASevByi_oTHVbbo9eFwlZ5Q19garxSmwx3tumboQqSzrDKIJe4qHai39ljwVBXGvwZO_gXUQFcteW-S64k1kKODVuC9YrZJZaEiy7BjuTz05PO_hY3n8ylnivr4yPjjgfDzh65sIFp5fHAnKAKADFp42veKg-u6HcueCIca9fR3ZZIRkDXCHC6A6Qs3t4BSVW7NYWzATXNH9imFhFZy8jQzcw9eJOpv-oIK3Aqd9AKlavy4uurFdCgd5hH',
  },
];

export const relatedMovies = [
  {
    id: 'wm-rel-1',
    title: 'Cánh Cửa Thứ 7',
    subtitle: 'Hành Động • 2025',
    rating: '8.8',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD_0Xf40iE8IKDaSS4R7U0hFZqxl948zT9IbFNz3d-WGwFI1CJTp2r4Qc1Ade1YqiDtP4kB81fEj71suoSJ8J2eKoFAnbc5Gy-PX6iIalKIDap68qP-oO7rpkABmTaeZcRJTqsTLCtnkYc0LxSI5__aHmtRYeM2MuRlR6WMW_kH7ZqlwRHhlMMIcpiS9obljhRtMKEvesdIpRm6tfgbdF7aoLr9zzKcnkRANWyhHln0rqO29OE7awtaKn72Qf-lyUwWRsnjSXajIIY3',
  },
  {
    id: 'wm-rel-2',
    title: 'Hành Tinh Lẻ Loi',
    subtitle: 'Sci-Fi • 2026',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5Wtg1PuIyqU4nOYGg_hU19xt3RfXVPSlzwCSEisPFc0XhOepZUkAUcBkokoha7xwt2OUjqTGRfwOIfB-SSl5Ja_Xmg5jRDo4Hqwpjb1M3DaSj3HiSGgH8ax3rrZGuYka1RE4pLfXNOofgFxvyB7cDtjKLJEhTeE86kB_zz8aOxMoePF1SRitOPF9w28qdZoENRzw6V7Fym3WkpbyTwdLoTUkhLqWDz3Pbie180-pZjS2dxMZB3mXLQr-OjMCj10k9WaWYX9hZt6ss',
  },
  {
    id: 'wm-rel-3',
    title: 'Nhịp Điệu Đêm',
    subtitle: 'Âm Nhạc • 2024',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDR0fWaJBlIxxt281OkOQQ6q1guLNytVwh_qWZKha26LBoY9G8kOE_dxFTfmxXE5ovMF7c0r3fLdxM0hYqWPLagTRp6g5x-jDueNhhawS0dBlAnvwnVaYC4hcFSgBRceElZd9rEDbkg32NqDpvDSxoOv6ahL-OmRcm1D8CWMzBV7_dQSAoUbQT---RV77TJU4nGOcZxC_lT-0bpjyEsElQRbG9XwJ_nC8QsSVdFKRF-RLjIFZMA6dpFClk0ZmvxhiwlDVhZEKv5ieS7',
  },
  {
    id: 'wm-rel-4',
    title: 'Ngọn Đăng Băng',
    subtitle: 'Kinh Dị • 2025',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCv9CkFnFF5GTqkAF_Jx8oLmuk6DWs0rHV1vNxH8I2ITxatwFD_tVQI1LYkIn_9krrGHh6urvRbySQE7OBEY2VoySNHrqr7ZduA0W-VqEaLl78SNpDBk6KN45ndvskdoLSOEzfw4PIs2XcW50dTZc_HwDsJdwAKa8sBG1gLejke0oAfBxGVUVjdGoqFj7Us3p4xDCeVSlpZ6v0WnjFHapcXQ2XiB9ANegsCvtCsJ9zFyhgRavppTBjwSKIBKe8d_PHCCL1OzYfZXpq9',
  },
  {
    id: 'wm-rel-5',
    title: 'Thành Phố Không Ngủ',
    subtitle: 'Viễn Tưởng • 2026',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJAjNY9aD7NhmHEJxPTTPueQEDPqUe0JhAPIPeGbU95blIkshdiUYFP56YWKSZMs39m3Nf-d0TH8BOE02b3_yEovFcWW2YY3cZgCFv4a6lCI05QzSIvLiK85pQYLjU3oKsQ06Fh0HlwtCR0ahLrn98ZgYVCywQj-NqHq7sM5NILz_HJKH7YM-i6D4buDEQexwhzCsDfEFaqvavzwBvWDfZMF8URYqC5UuTn8ChPgy8He8TJq3uCsxY4UuguDx7GjHzUlVihJV1nsLC',
  },
  {
    id: 'wm-rel-6',
    title: 'Lời Chưa Nói',
    subtitle: 'Lãng Mạn • 2025',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAijURHIsroNP0rQx6_aYZAxXAloIpcLxPg4xXBzHDF4cF7k3320rwFys-wisjTPVgXZ3VxKTONvdkhHr6hqpL0kyC41PqXh7_BGk-SVFIUN0Cd23ppvimYGv_cZLC_fWllf9--DJdimQZOYgWi-LM9vg9neuYgBAzdPr2VoCD-pVMLAJ7KZnZpUYpBfhj03cwYOdzFVJpVZ9wYrK8WiUqMU4_-DZBXuQ_6YA8c3DTusQKd1BlTfYCHb4QMpegQ3GI7V__xZsHUcHSm',
  },
];

export const recommendedMovies = [
  {
    id: 'wm-rec-1',
    category: 'HÀNH ĐỘNG',
    title: 'Mật Vụ Bóng Đêm',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5GBnUaTC5qk-jlefNI6T-Lkhq7F6-fki7gzFzQ1tq1yd0kThPeVpD-L2WjFtoZrX0eRPzcGY_i9qUa_9V9r7rl2QPcrwTY5bwUZyWxAFvTdrN7ZEFkrlodWXKvhEzfx0pzCShT2iLhidlWtgEFpqjCgaO0ZI2fUB1e2gma8H1bmNj6DH2FoM-5LH_Yy_uoIjYWEGlKRIioA8c2lzO6bsn9JVYUeDcvJRbG8i_aUOFhEHf55uYLsrQNOBgy778ev4bgk9QUFy0YPb8',
  },
  {
    id: 'wm-rec-2',
    category: 'TÂM LÝ',
    title: 'Ký Ức Đánh Mất',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABctvw69-XIBaAY5kdkehnUm52tLDJvHRZ1o_MHCksz7B4eQSKlmamTZvxXFwz1CFy3s-9TKOsm-BoBkuKMvNI98DSKj_dlpaS1mzJl7upjQyKoxr4EWnxwJ5oCzxPDloAbwtDTImskLG95TGRuQCcmexKe3ZdJ_mnze0OcZor1lef17fwiL8ylb0Ef7EsrmHPAm6g8HyeF08G1t1Zb0UysbaQp9wzjQedKITh7Ye1JVd-azmkOBTk0cp2IGO9KnDwaMbvJ5T8tKRx',
  },
  {
    id: 'wm-rec-3',
    category: 'PHANTASY',
    title: 'Đế Chế Bay',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCim2KOTpqqrtw-6SWQSXqv_ecJZhHku97zDoy90cN6W1oxeOrMrL-HF8c4jiUMn4lW3hvXGpwkiOrziN_dk-TIcOAtcHNwJQH44_0Ri8YDkfoaxnxY5J4OrZiayQl3NR0WKweP7RNqbqzI-5p5xFJB_Pe18FVkyPXAkA4mYflGi4hcHV8erM-8zeiw8vGIElsVE27tMGHSDeAeDFfiqYDo8o1Usxcsdo5Ec9K0PQxQOIDYITleL7GDuSo7id9P99ICjretyilG9sQS',
  },
];

export const comments = [
  {
    id: 'wm-cmt-1',
    author: 'Hoàng Nam',
    timeAgo: '2 giờ trước',
    content: 'Phim quá tuyệt vời, kỹ xảo đỉnh cao nhất từ trước đến nay. Mong chờ tập tiếp theo!',
    likeCount: 124,
    avatarSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAMIFFj9zppgkD45LZAWxxhHE5joVc5Zeq-uDUPqcywRQqAiZFdd22vfErDe663VuFsPWoEnaPQ3oNEaUWWDi0WQCbMKirEY_jLuu-okWeiXdBmZzGddQC1yW9m_aq1n0DGEryV3KruHhDh7tXnQWXUq0SmaTtmQDVbn4Vateh7wrlzzle5GyiAFm8DNjeLMSds2Eb9MaVpowBGkvAdPJfCFPdKPyYcMgfHZ5oHJ_F52FiZqxSHgatGhTgkKchUUZeHepv7igw6J_Pi',
  },
  {
    id: 'wm-cmt-2',
    author: 'Thanh Trúc',
    timeAgo: '5 giờ trước',
    content:
      'Cốt truyện có chiều sâu, dàn diễn viên thực sự xuất sắc. Nhạc phim cũng rất ấn tượng.',
    likeCount: 86,
    avatarSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBqndKDFa2IDpkYxxzUEbJLy50-kUhYal1bSr24iwzmHWByrUKMyeg12zE0IraRUkqFWKED7BIZpGH15Q-sHb_HOvAkvhF5ow8og0FhrnIpp5--ma3rMizvDFSx2YC2LbCHc14mjmdHL8vKI0gwg3XIekSdhyEOakaLkAHrgbLeyAhhemIbfLZgYNeYbuHPJhACC2EFOTSEFdOSYd2vvsI0tpBbD5x94zAxZpJKGKKzIR1CsJJizqkf8GHUyxwztPo3h7VWg1AdkAJt',
  },
];
