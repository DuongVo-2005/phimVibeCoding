/**
 * Dữ liệu mock tối thiểu để render UI trang chi tiết phim (`design/moviedentail.html`) — KHÔNG
 * gọi API, không phải dữ liệu thật. Route `/phim/[slug]` là động nhưng nội dung mock cố định
 * (không suy diễn tiêu đề theo `slug` — khác `/the-loai/[slug]` ở Phase 10.3, vì phim mock có
 * tên cố định lấy nguyên văn từ design, gán theo slug sẽ mâu thuẫn với tên đó).
 */

export const filmDetail = {
  title: 'Bóng Đêm Đô Thị',
  quality: '4K Ultra HD',
  year: '2026',
  duration: '135 Phút',
  rating: '8.9',
  genres: ['Hành Động', 'Viễn Tưởng', 'Kịch Tính'],
  description:
    'Trong một tương lai nơi ký ức có thể được mua bán như hàng hóa, một thám tử tư bị cuốn vào mạng lưới âm mưu của tập đoàn khi anh tìm thấy một mảnh ký ức không thuộc về bất kỳ ai. Cuộc rượt đuổi nghẹt thở giữa ánh đèn neon và những góc tối của xã hội.',
  posterSrc:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA0DPUnBKEYdn3sI6Sq4a6w7bcxH1Z0bRRjcZAc4U0XCiuyZiChzzM9QsvlCi9IAHbH5SujwyXZPHMlvfon_hnTO4D28zNNH2KgE7N7L_fFMiJJWY-g2zligMBIpZvQ2eToCIoJ1L70yfteG9fZZqMPVUm7Y0FDlYIToPa1jF4bkh3CIl4r0nc_gFrQnN4uYIs7EUM8eTRAkl4Wfw8aJYTTDW8Ofh22R86Mi818731qj4HxSdAe5J8E0Hd_1NcbQmjf2Zp1i6nXQdR5',
  backdropSrc:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBaIIXFFUpchheWq_ThsQhsumfG-MmMfVzsxXiM-tQftges_cd7tLkTmNs9CWf51q1-BzuHpf4VaLRa7mRrojKqUjNA5iO9IlwrCpOLgQ9Ogd3xox6ua0JDUV3fW0H7rlhqg_ySwhzxPE9NifWm7n-f-Q-v0Rhf3nn5XJYGG-gBXIRi4XxLKPDJJxRhDAmKQCmVmWQwAhVvdgssc46VusnhlQZDkuyblJm9eeps-lD1ARdrPmjJjG6XyUWSCwGMiofHH3glzHtzwbDf',
};

export const cast = [
  {
    id: 'cast-1',
    name: 'Duong Vo',
    avatarSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpHGFZnNleZKIUSlj98-58mW2WBZwWppf12OuL45Ztg2q0BlXAjmmip2AUcbCh3wEe5dPFnMKbg7vZ_ivvtjE2C1Ma8FxOM6ifQsMJjXArK9QWpx5LMo2iNJi3z3r5g9aZlasIQfWVP0kkIguh2N9kQ1wXEfg02vNj_M8o3vLjBkrfr0Y_nAOu-o50QLwfgReKtVM5NETQ4ipzRJVyl4Ddrl67w0RqilXPjE7JO3p0agV9pCGA_YimlA2JhoV9jTnpWIE4KRaZQaud',
  },
  {
    id: 'cast-2',
    name: 'Elena Smith',
    avatarSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIJsVRs4Y0tw92xo0ELsD2ejZ8j3q9nNlz-O1l59Pb7jYNzXo8aDeLqchv3Wg3fPsIozd8kC9lcSct51cy0sRWAmN3lbsSnpyKj_XwFpbmD_x2sb2gAS_zGLQHf_N2IEnoJh8XGM3ihCyPGuQTBdQRjISGQgAeSgOxVfRPEtLy83aySkNns8KLfg74m1pg3mCKFIGvjWp6o0Dk8nhqKpFqQzrvRkPanRE6SK9vEOwRldvtYMe5RHSljNiEiiI6rJgjGkqpcZD8IldR',
  },
  {
    id: 'cast-3',
    name: 'Marcus J.',
    avatarSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB1NlNZ4P2BtHQxShgbhGj0p0JI4fXIbWDFIGzDJLEv3EBc6jhocAcwpPJ_-PUDWTXX2C-foP7FP_NeAoeGmJLZ2FGQsskSQk3-tNj51FvMQagFl4646IrVxuP33yGuvQC2jydSJ22MxSq5w_LSIihMTKq3oAEXk-cKfgfdV0nZ1-9MtCfUqmV9iVm1P_jAa2OFd9xwuNVh_4xqIS24EJv-fLfN6RQ7hlZ-OLMIojXR9xVpaT1nCJQNuhtscXiMwrbK1JAou5WkwgSp',
  },
];

/**
 * Danh sách tập — desktop dùng `thumbnailSrc`/`description`/`duration`; mobile dùng thêm
 * `locked` (khớp icon khoá trong design, chỉ là UI tĩnh mô phỏng, không có logic mở khoá thật).
 */
export const episodes = [
  {
    id: 'ep-1',
    number: 1,
    title: 'Tập 1: Khởi Đầu Của Bóng Tối',
    description: 'Ký ức bị đánh cắp bắt đầu lộ diện.',
    duration: '45:00',
    locked: false,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCsLeRqtkFF5_zBBmgDXPcemBIrvIWsQxt_VuE_TCMoXl5rLYN_JxwT9ovZf_DnazDkpTW3WetePvtjYqYAJqj3yK7iH6-7DRrTbxTIlet56J0cpk-LqHFF3QxLoii8uobHq7U5DRAuIu6TU7NRw5Wn3p530iXTdLhFS-qoUlXkW8FukdkDsfSADmZbdwa5HrAICJjTsd0XBZzcBZCjAfDkcdXpphj2wQ3lT-60FSCzIOu9W-tLU9d2vs8yN54L9nYlsMzHU3tw4f1f',
  },
  {
    id: 'ep-2',
    number: 2,
    title: 'Tập 2: Mạng Lưới Răng Me',
    description: 'Sự thật đằng sau những con số.',
    duration: '42:15',
    locked: true,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5cLGV5BFivRRTM1r_K1xbT0Wce-IGxZmnECKfrxTN0NCdOBXxDKaDpsDwjQQkNSeOL72gxHoAE-qgrw_7fh2vmthWecclB51MBUnok-mvNpeyGqOKTClni1twKoW1fyAdnQbFaosIRI8_3CfpAxkY8N7KX0d_RIYTFeOiZWMtWUzSeu7wrZq7_n0YOez2Q72Ryhbs1j9V24lO6d7Bn4hI3yuTKWG72_y8XBMIjrSLJFd2tY6HFNKbdxmVoNsCsLsMCrJgMUI0FJzL',
  },
  {
    id: 'ep-3',
    number: 3,
    title: 'Tập 3: Ký Ức Lạc Lối',
    description: 'Quá khứ không bao giờ ngủ yên.',
    duration: '48:30',
    locked: true,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvt6anTR79I0vz4qCwKPiCNzQWcBCpJkYbmqjmgPx7UObIJbolU_qHOZKW6huWYK2LxzS2jZpPT50NJmxQjBAknkCqQy3_f7WlEbTTuPpPwyJ3RWa8_50c4XKwBa7vc9gkmMIiPpN_FCb3qRoHnzrTBJiTtzhtchVUtt0NXTdkEFvdKPRkxUWWKpEEdP21Kx3Q_5r6YlqVMpvUS8r6QRu02nkInsGnG_AUWkp7_nWjbT--04m0tCLlpff_18z5UjfLIvONim9tqx3_',
  },
  {
    id: 'ep-4',
    number: 4,
    title: 'Tập 4: Đối Mặt Kẻ Thù',
    description: 'Danh tính thật của tên trùm.',
    duration: '44:50',
    locked: true,
    thumbnailSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDj_68cTy3vK1ulUxh07Zj3LPcRpiVpx_9F3Vza_eBHw2OhbxFphadaHj9Ybv48DwTt6_OqAE1yXugewW-2B4lEQNjDnu1KBd3_S-ju6BykBXKPmxrlVFqQ4kYEaW1NB8iArFoK-UeM_f8PMFte_YzPmBG813xa5T6pOh9-8mgtzWmdy-kwF3vbH64MpFArDbCMOZSusFQjm7Emzmc9HPeM_eqhkBxuZLWsDmqu1adwnNII8CrhqxgzjNh7k3SaUR0MwCxKD7IG9MdN',
  },
];

export const similarMovies = [
  {
    id: 'sim-1',
    title: 'Thành Phố Mưa',
    rating: '8.5',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVmNOaFRQ_DKBNNTrE4nDqIljMj2FyRcG6i9Txiw8lnBdF77LO-_3lPgX38NkqwMsB2K0fTynd1QAGEysTymjvdDsw8NcfytxZYUgAEIAceQpOPZoKzR8fFZSeec8Bt1ICfvfX2Ww4_ZWUtkrlViimEswm_RPBFoPToxGpwuyF-yS_tJoOSuO4T4KrFwKXbkIFgrMO6ywTBXSm5Nli5ri2wIEyNrzs01aPN9oLCa6IKxjo-WSrXhTfKxwmGHJFQZOHVMepkGZIIOrc',
  },
  {
    id: 'sim-2',
    title: 'Vô Tận',
    rating: '9.2',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAfJKOShlxEHx6QxdTKV2E7YATtniDIU4Is3REd5XXC42JB67xWf_ANKN6WJpzDHy9q-Y1Hka2QBKiRnicEThI0z33oMJ8SSbiPp7l-P1ts2WMc2WlIlTeoF1f_MpyUH4AfQhOi5Q8oUZPf0OnA4UbWC93sAE05sH8BTJJGUzO5EKXaaB4DWwvERCMo39FYwKXyPc3RQ2-ecP4z0owBCabpPf3E6aWfEKTd9WuBqZ9SUK1aJR6kaMiWOFz2j2tKCQsTIN339CZxyTkO',
  },
  {
    id: 'sim-3',
    title: 'Tốc Độ Tối Thượng',
    rating: '7.8',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtlo6xefWrHzv9jH9nJLbSVln7SjsFwAC9oO5kNqYmNiDcuCyABuJFkbne09OiyNYhElqzzcPeinHpMfi89kCz9pH7aXD6LHzNRjm8-zXkpmhBxq--FKdrG3iJRGJyHkXNsnLNcFXDbRz5XUROCnjC3ThGI_EVduy-MloTiI_JUSY7VtlNM3wHCtZtUE4awil3B4P-Je3dQaGNUi5N5sEcJIte69zUbpsWXsB6cttYntpPj8Rv4XGRWAqLEDtjOhUywA5FO7Hkjte7',
  },
  {
    id: 'sim-4',
    title: 'Tiếng Vọng',
    rating: '8.1',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBpX5HDs1r9y8OLNObDIcv14-C4Ay_ZjCqhiitagg3WwFqhWPpo4s5VD0mOZODtEAvGkWrwIQDPCqdWuo-okNKANSoLcRnZE2eIZQmKfj0Qqbrm7C4EEzg7BpXNPS9SGnRKT8k5CkwrNpTLddqEmEmCDbfofNm0STaBzppO3id22GP9kvmnHoaZJoOzAus-9flwQNWbjw248_ZFvZ9uql6CSbpBx9GImD7hTa_Djf6wdTZ5gykSg6KVh8VF93WUUin9pm4BHpDur3Z',
  },
  {
    id: 'sim-5',
    title: 'Vương Triều Cuối',
    rating: '8.8',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDg5uknL-bMvkKtUxhrvZBE9nhhjoOu62LObyhbKTEPJ9s2-pToMdPsQI1FOYVUlzDEHROCnPYIsjpelqVLel3jb6EoeaFQpIFG-MTpsmbjtp1epsYwhInRAuO3bjEgzOZhTUc5ZvGZuVm8i8GWnBUkYU7htWapwQ65gn7_byQjSTpXRDYDPOOYD4FxmKnYwroANXgrk6HEmHy_P0BE_HXV9p_Y0zaiOCcWR49LxBWAfK5aBZb_to4cjAp2jdizaLVsSGd1KJTSBwAu',
  },
  {
    id: 'sim-6',
    title: 'Xứ Sở Kỳ Diệu',
    rating: '9.0',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDiBu0TZPiE9X3C6ge0JR3wZ0KraABypQldc_Pkm946uPkYOfT4oc-TwkKSfD37pd-vd3mu01P9CdgrSZvdqa5I5CI1wWkbX7uevYs8YFJ2cxq07OcTEf1GJvrvXn-DjOmNJailH0pjWiblUUxH3rgBci97bitWseh9IzqNYyXTN3TxumOLGnlSCkbdabt_ytuuUDG1oR5naPEYds3-0y2OBeCH1wb8psG_GJhJ9AK8c8to5irAssNWkPSwjSTLPFg31PzJI49a1QY9',
  },
];
