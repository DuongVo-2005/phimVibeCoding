/**
 * Dữ liệu mock tối thiểu để render UI trang danh sách phim (`design/moviecategory.html`) —
 * KHÔNG gọi API, không phải dữ liệu thật. Dùng chung cho 3 route /phim-le, /phim-bo,
 * /the-loai/[slug] (Phase 10.3 audit — đã xác nhận với người dùng).
 */

export const genreChips = [
  { id: 'hanh-dong', label: 'Hành Động', active: true },
  { id: 'kinh-di', label: 'Kinh Dị', active: false },
  { id: 'tinh-cam', label: 'Tình Cảm', active: false },
  { id: 'vien-tuong', label: 'Viễn Tưởng', active: false },
  { id: 'hoat-hinh', label: 'Hoạt Hình', active: false },
  { id: 'hai-huoc', label: 'Hài Hước', active: false },
];

export const countryOptions = ['Tất cả quốc gia', 'Hoa Kỳ', 'Hàn Quốc', 'Nhật Bản', 'Việt Nam'];

export const sortOptions = [
  { id: 'newest', label: 'Mới nhất', active: true },
  { id: 'most-viewed', label: 'Xem nhiều nhất', active: false },
  { id: 'top-rated', label: 'Đánh giá cao nhất', active: false },
];

export const movieGrid = [
  {
    id: 'mc-1',
    title: 'Chiến Binh Ánh Sáng',
    rating: '8.9',
    genreLine: 'Hành Động, Viễn Tưởng',
    badge: '4K HDR',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXvllO06KrypAXeQk65DHluCearRgd5cUGwmy47Nsbb2jxBJFXrnWrSzFzbpaR-x1bpw0ODHGbTs4x333GhUVRr2l4AnkkIpyRomV91CaHCPdu77nNUw5jzWOQVPu4EJL6CEX-F-oIg7sMPmuQU3x7VCyEZ7jycZnONa0lLG7bWRA7Zq7maiZ2Z4uQ1StZpV6kGen6qLinyxwUMhsvGGCYQIClwM9PjbUlDEQEjfZV3ZCtO0k964IfQjnkwmTxlat6S3sZ8rzvm13y',
  },
  {
    id: 'mc-2',
    title: 'Mật Mã Đen',
    rating: '8.4',
    genreLine: 'Hình Sự, Kịch Tính',
    badge: 'FHD',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAq1QZYAWc9DY3qa1hFJgmEbWguoTsrxfUD52OJen0Hm8rqpGmJJXFSHkTveEvvE-Pci0yjZ11NC1zReIBAk1B_TJ1FbfeCOneplKMnUCJsPU4i5Te16Qr4mVZG8-ZJdNK-G6jHlgT2QkK6r3HaDd_1hSJ1YHRRBCCh86cPH8_IYX2CM4g64c1PKGT27UZe-QExRq_wpd9OmOUmRsDslnEl-uW9v43lDjHaryPEkEp-kPuXNC8pp6XVfbyu5oN1kVohdXoPOmxJ4Zhn',
  },
  {
    id: 'mc-3',
    title: 'Thung Lũng Bất Tận',
    rating: '9.2',
    genreLine: 'Phiêu Lưu, Kỳ Ảo',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDt2hgWadG1BdGXzgd--a5x2IuVgyzYdD87PGPJdq99psdbsnxaOC3YXxogWtVIAJtKaYiu0W0tAtWSNN1o5rKnO-z1p52vVBUJjqyAeREFfODPRlb3Rbw8vpio3WIBzhVwgQ55g3VLiBS7FYtj0iCz3dl1shZcWakfUB_X5ydmO1NjCUduab6rPuuD8qAwgDXS_JqhQ3SShJciiImuyIQClby78UZFBvg6c9_6qES8jrlf0YW4W19y-7tSiaux7606RIM19vI84VeV',
  },
  {
    id: 'mc-4',
    title: 'Tốc Độ Cuối',
    rating: '7.8',
    genreLine: 'Hành Động, Đua Xe',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYq2EpHITmhXWEuJnAB48QL1cPpcSlniO_lBTNNRW5RIS2lpOF9nO-3ZoTp683vMWXSjzORwlxDEn3Lu9y7ZrdFXhqEmGfSnzmiXXcGdcvQ520gKffsow5oJJ6SqoRkdHezJLRCFp-F_hczMAZvt7FuVZXM8fx_0dK3m-VZA5yZLdp0sDLqYqvDamU4Cu4OFbsOJQO40FNVSYUKnpu-SWzNuZPzFEy-bLlnm7TCD-DsC_08ek3cMqVUalQujpALhTCBVeyqIGkEja3',
  },
  {
    id: 'mc-5',
    title: 'Hồn Robot',
    rating: '8.1',
    genreLine: 'Hoạt Hình, Robot',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDS0aJ7ubfVg0jmMxMwrZy2MWKimsNApUmH1uWsrboB_2r1nSJ9apISMiWOKRAUL2Sg2dE275itgcsP2TVn63AX02a73DcMV4R8nK_CrTf5wu6O1mf6LpLOqzpI_n9TlIPq_AreDBUE7UhtWR5bb2oD_iLPBidMlGduvEbPSlrcXZcOs2l-X6lksrMzprqxl4-u3WR2X6HVLzUpY9Bjc6wttpFaaQr7o2hejrVCy44IXiSe1l6KQL_L3-fBBXXacvAsUN660pr95tM3',
  },
  {
    id: 'mc-6',
    title: 'Tiếng Gọi Rừng Sâu',
    rating: '7.5',
    genreLine: 'Kinh Dị, Huyền Bí',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDCMozfcsW-2jJgayVMD3muAVJCV34C2JkeBm0lHm5pnrPkZnAN84yKGxr-liDD3UOb-Srsp9GmtdGqTwADO9C5HlgB3jlZ42GFzekT7z_5xK4AShWalCwCfbwIWqWPLN69XbaGUfgsCwrchC3FbWwlMaZRVg-EHKlb2yM922BRr72dK3KRrc7RYOObHytyuYe8maK_oeWIFWic2ukYIgB6SUKmhgRC3Hedk5Sme4jL1YRl5Mg4xR54Mt6XiuPeuPimo4RDMWT8aNps',
  },
  {
    id: 'mc-7',
    title: 'Mùa Yêu Đầu',
    rating: '8.0',
    genreLine: 'Tình Cảm, Lãng Mạn',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9aFAeKQ0pRo4S_QLAPOfo-aW-O6WdHoSVNmIwU7epFUA87Tx0BuMf4m_wY2452bQUU3RKyNzma92FNs5v3CMUjQlJmpvVwbLf3NOZGPt9mFzQl9qx69hVjgD__6KawCE8cRbtvBWxK8_1OQlb4YlctrScQhgJEHFVTXmy_zrZnifi7l9mnwKTiJGTvtDzBS5aOv8D1DMoOob8M9eFFBU9ca97c6IJzwLRe0Xn1adYqgUizvFod1VSZtvYSum6z3a08a7rB1UUu1NA',
  },
  {
    id: 'mc-8',
    title: 'Đột Kích Tầng Cao',
    rating: '8.7',
    genreLine: 'Hành Động, Kịch Tính',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD4CGjyvlhlAvBia9IwOzs1Sjq8hyhkEnvtGElTIh5QXmAwz7JJCBkxERycBKDxvOytexwvBcxhrWbINZof7LclNIzuDPDO0cpKsgz9MYW2F4JkftaVCa-pbFkwJkOMWTibz4OJyib34ZHW6CJspHv6WVSzKN-H9ICk_yYEITFNovckYMQFs1SfdM5zC9WItViY2ZwQtJop_CF7gFavjkFg_iiADcZfLFdvYzDFX2iXNb7SFSn5aLlzk-vEGw33CpAa7TIStNjQIJjF',
  },
  {
    id: 'mc-9',
    title: 'Vương Quốc Dưới Biển',
    rating: '9.0',
    genreLine: 'Hoạt Hình, Gia Đình',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAbrw18E0lohwhJWSLQx94NWXKCypqcSkNy3pmoCslyR1lN6B-sFwKiGEURnE8unkAuu-bbw6Y6U0dOmm57U9Xkfq1Oh5eUa9aRyjvVdcBjukO3FQoFyBV5GbRg-EiHs7KlHAkH5lkJZlzcjdaRJucQaUANPaTlaCzhifHFoBvJp5_ob4rVCvjg0vchcrLIh8buNlveNhHVMN89PKyDPqwemDUb81ubPRDRIxphAny0hpWd4yNZLWEgVAaw6R73MLsbjQ0iiKR6odzm',
  },
  {
    id: 'mc-10',
    title: 'Đế Chế Cuối Cùng',
    rating: '8.3',
    genreLine: 'Lịch Sử, Hành Động',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNE9LVtWGlMrASE9k9SwO_3BUGvyT1iOyGMI5iM4uOFC-S-nmpwA5XmwTvaSIb4PZ8Hj3nvHs_HvY7r23EF_Kj1CI-OWm0xx_whZUkBPxPp2zFGryCkFn7aw7_B33t2Clwj8JcK_blp2jKPngbEV3XjtKB_xZYLeakTElKZGZKGeL8kruVJlkHi3eo58jMOBKUg5kHVJDtRVrL6DvFsRoG1kul_aTBvwhKyycv063-dm713wEXN4ByAyLAnmMqRzp0HlcIlaKJ15o0',
  },
];

/** Khớp thanh phân trang trong design/moviecategory.html: 1 (active), 2, 3, ..., 48. */
export const pagination = {
  currentPage: 1,
  pages: [1, 2, 3],
  lastPage: 48,
};
