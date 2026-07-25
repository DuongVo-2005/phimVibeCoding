/**
 * Dữ liệu mock cho trang hồ sơ diễn viên (`design/actorprofile.html`) — KHÔNG gọi API. Route
 * `/dien-vien/[slug]` chỉ có 1 nội dung mock cố định, không suy diễn theo slug (cùng lý do đã áp
 * dụng ở `/phim/[slug]`, Phase 10.4).
 *
 * Ảnh nền hero: design lệch giữa desktop và mobile (2 ảnh khác nhau cho cùng 1 diễn viên) — chỉ
 * giữ 1 ảnh (theo bản desktop) cho cây responsive thống nhất, cùng nguyên tắc từ Phase 10.2.
 *
 * Giải thưởng: desktop (4 mục) và mobile (3 mục, tên/mô tả khác) là 2 bộ dữ liệu không khớp trong
 * design gốc — chỉ giữ bộ desktop (đầy đủ hơn) cho mọi kích thước.
 *
 * Tác phẩm nổi bật: hợp nhất 2 danh sách (desktop 4 phim không có rating, mobile 3 phim có rating)
 * — giữ ảnh + rating gốc theo đúng nguồn xuất hiện (phim có ở cả 2 bản dùng ảnh + rating từ bản
 * mobile vì đó là nơi có dữ liệu rating thật; phim chỉ có ở desktop giữ nguyên, không có rating).
 */

export const actorProfile = {
  name: 'Timothy Chalamet',
  roleLabel: 'DIỄN VIÊN CHÍNH',
  rating: '9.8',
  ratingLabel: 'Phổ biến',
  ageLocation: '28 Tuổi • New York, Hoa Kỳ',
  heroImageSrc:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD4hkA4AgEXvBpMuOj3lGlWUd2fWQuA7vJMkuCwO5IEpJjceqdqM8uqWunA_wLOrVwbHwpxwTIE68wS-hF489jHiiauQkeLDCu8ToKpsxejuU9-36Sze3KeUyC2mfnHQVsLKG24A7UvKol7akunSWJ1LfL0LNW4O27OEJffTxbzUDXiXD67eS_rLVSEogIto0K5ZWTE9rqXM11yfMG5Knj3N6vxFFjNFu22lP6DgJZdtOJH6VHg9y9dMCoj7dIprXCJtr1o3dP-Nsk8',
  shortBio:
    'Nam diễn viên người Mỹ tài năng được biết đến qua các vai diễn đầy chiều sâu trong Dune, Wonka và Call Me by Your Name.',
  fullBio:
    'Timothée Hal Chalamet là một nam diễn viên người Mỹ. Anh bắt đầu sự nghiệp diễn xuất của mình trong các bộ phim ngắn và quảng cáo, trước khi xuất hiện trong loạt phim truyền hình Homeland. Anh có màn ra mắt điện ảnh trong bộ phim hài kịch Men, Women & Children và xuất hiện trong bộ phim khoa học viễn tưởng Interstellar của Christopher Nolan. Chalamet bắt đầu nổi tiếng toàn cầu với vai chính Elio Perlman trong bộ phim chính kịch lãng mạn Call Me by Your Name, vai diễn đã mang về cho anh một đề cử Giải Oscar cho Nam diễn viên chính xuất sắc nhất.',
  birthDate: '27 tháng 12, 1995',
  birthPlace: "Hell's Kitchen, Manhattan, New York",
  occupation: 'Diễn viên, Người mẫu',
  height: '1.78 m',
};

export const awards = [
  {
    id: 'award-1',
    icon: 'military_tech',
    title: 'Đề cử Oscar',
    description: 'Nam chính xuất sắc nhất (2018)',
  },
  {
    id: 'award-2',
    icon: 'trophy',
    title: 'Giải Quả Cầu Vàng',
    description: '3 đề cử diễn xuất',
  },
  {
    id: 'award-3',
    icon: 'workspace_premium',
    title: 'BAFTA Awards',
    description: '2 đề cử Ngôi sao đang nổi',
  },
  {
    id: 'award-4',
    icon: 'star_half',
    title: "Critics' Choice",
    description: 'Chiến thắng Nam diễn viên chính',
  },
];

export interface FilmographyItem {
  id: string;
  title: string;
  year: string;
  genre: string;
  imageSrc: string;
  rating?: string;
}

export const filmography: FilmographyItem[] = [
  {
    id: 'film-1',
    title: 'Dune: Part Two',
    year: '2024',
    genre: 'Sci-Fi',
    rating: '8.6',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBgjYFCgi6To0t57AIhDd9Bm4cPTRFv4Dc7_yucoREx9Ib02OW4wyF2VxE6O2QDv8ztQ9XheJN3PCL0SQX2bG9VaaQreI1veHAhB84re95nPJUy7maX4F2s0MTrwadqKPe-pWzU7K-Iip_ghoz4vPCzKnCmTztGkEevFjG7xUinIXHhF0ARZIiWcL-9iLNss4EwWz8G9cZRxjWFin0iX91OIPCpPBOKeG0B7GC74OkSROjeTL6lqtOpjdQHk-pNaPyunBRFbdXhWez3',
  },
  {
    id: 'film-2',
    title: 'Wonka',
    year: '2023',
    genre: 'Fantasy',
    rating: '7.0',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD4tFHMHkQlukTAhmSGn5eXuZgym-0jT8S5kaSoWnWtTtOopcBZq8VC_f8u7_yt8WsU0ZOgjnv-bRGuOjp97-KJclwelv3LlgXZTQW_EALXAiuzAm-SAK17zdoXZvJdFNllS0Oh9vtf8A3xpgaVXNZOdppLhRx-8TFhaFpoHGi8FROgdL0heKH3eZ_jENvRoDG_x8Y5gUsfiUz_2FJ2y1AnUjvTdBkNKRGTLRpcAfa53mVrRSxtZw8KQDZrJW6enjUUqe8cmwXkevAd',
  },
  {
    id: 'film-3',
    title: 'Call Me by Your Name',
    year: '2017',
    genre: 'Romance',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPaonEAPmy6fZwQZP9TNYkDpPKejJtE6TSCGsdwZDy5JhyVmGwthuaYI16eB7AuzxZCBjK5-8I-L5BB6cwVPgo-jKSRVFtVlg6o1jzKbDWEVdJWMP87fp4aHuN0gytm05SsGZR50ch0pNxbhjSD41jwzj04_QFYek02LDE8tAVmp4Xxd3_GhVN39-9Wenk23PPQ1V0xGX9Fqx_JRt8i89ZAy1Z2JK9sUsmu_PKZYSDrYRlBX3sx2t8YJmwLLTRtTRgTaFDgQvsjwye',
  },
  {
    id: 'film-4',
    title: 'Interstellar',
    year: '2014',
    genre: 'Sci-Fi',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBhcnqwqdT-N45sqvZUf0pnqyWnL0DRmNxzNoqL1sETpWfByyRJtyXD-d3AM6sGkko0hnvBUlZeA4mhD-BsSOpaqFhgA2NAzZ1THMN5qNQcYgEe9gWt6Xa-ZEiGDq0rfdYgiSvghe71BV0TbMmuhNEw-nQO82pPScZVZInMg2ujIoQh-CXb_0QFHpyiWEEQuR9e9j0c7C_RDdRuM3Gq6NhoKA9MOBciQ56n7PuM7zoZuOX1lGrs3TINOE86LTmWcUhRF4RHA0xbxQQI',
  },
  {
    id: 'film-5',
    title: 'Bones and All',
    year: '2022',
    genre: 'Horror',
    rating: '6.8',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBFzuf6RBYSjm1iUGs-Svv35Mue1xQHi9lgvl_OY0Poln9GItbQ_rxSrZtbmisAdC5TR8kByjyCIj-grFM2twDQUJ9LSqo4scTBzAfYYvukXMI-aQn6GPq8ckBKJlWY77XACrqFOjlsxw4sBY7-f04I7LDsg1Jlj-RVA3Q9SqsVHw1_hLzM6D7X6b5N2lkjazwlVoMlDQegYF4eimdjMu-hQnv9YqQCLQIPjxqCJ_YAr6Me7A4XVOC1TAmqEaDgZGgLserBKCy8qVuU',
  },
];
