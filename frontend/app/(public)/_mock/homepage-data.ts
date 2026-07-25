/**
 * Dữ liệu mock tối thiểu để render UI trang chủ đúng theo `design/homepage.html` — KHÔNG gọi
 * API, không phải dữ liệu thật. Nội dung/ảnh lấy nguyên văn từ design (đối chiếu Phase 10.2 audit,
 * bản desktop — bản mobile trong design có nội dung hero khác do gộp 2 file cũ, ở đây dùng 1 bộ
 * nội dung duy nhất cho cây component responsive thống nhất theo quyết định Phase 10.1).
 * Thư mục `_mock` (prefix `_`) không tạo route — theo quy ước Next.js App Router.
 */

export const heroFilm = {
  title: 'Vương Triều Bóng Đêm',
  badge: '#1 Xu hướng tuần này',
  meta: '2026 • 2h 45m • Hành động • 4K HDR',
  description:
    'Hành trình tìm lại công lý của những hiệp sĩ cuối cùng trong một thế giới đang dần bị nuốt chửng bởi hư không. Một kiệt tác điện ảnh không thể bỏ lỡ.',
  imageSrc:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDHp2pS-Q20UinoO__e6998fPNoDyGmHJWFl4pZFVuFzSFZEEZlD-l2y-tO304vJhtvrOovZwDB9Uv4b2Cf5W91ycnGP6_hjtu7l38RUdeqA5mXNiYgBVwEwlejFKdBCpW4RNkwA6PUcUW4-I5KY1VV-3lPDo_HnUOWVNRV1qssyMYm4AHko0yK0morNB5gTLH4Tc16TpRkfEdvq0IWHo1zEJlc-pjs4dEjCCTJbmcmgLmiUFjUqrxXy0eExomJoeHFHOZhkyRBKmh6',
};

export const continueWatching = [
  {
    id: 'cw-1',
    title: 'Kỷ Nguyên Mới',
    subtitle: 'Tập 04 • Còn 22 phút',
    progressPercent: 65,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD6oQ_UeusgTzY4cBmx1G4omFO4OwGYEgeqE7j-gYiklbjH9Kswte_ZnOhzWQuRtgAKkKN60QGbVwY5Zkx78SZRAjfJbNr2REsBKFWjfNxoMgQaCspv_lWKWZbOqlIZRwpuNGumNExGZ2g9NdAbU9aftFwJ4G-aBO1VhrebQx16S7Xlh4F7U_E_CLT2P6Ty70bULJSn79NerQhYFKIXWJSR-sLwMehcg932atj4C8rCZsHv6aRO5cm-sCGnquxWOcDnC4AxI7tb8-DH',
  },
  {
    id: 'cw-2',
    title: 'Thế Giới Ảo',
    subtitle: 'Phim Lẻ • Còn 1h 45 phút',
    progressPercent: 30,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBW08SZHGgakBiw79y-fwiUxhdeVq6rgq8bLwX82QLpCZDboSgE-sZ1OLtPxYXesa0j1E3RhbmkJbLATYNoiRY3N3Tchv6w4WwXxogL1eH2njgTwSfMkWgs40Cl_UpE1WqV7Mu1_TTRGwl45mwsYLbvfgnO97E1hn-A6GGwfFk8jkwA--RM8otTtZf60qgA6yrXb2kWVYGjZKa3UckBPwEXEbC88feN-uDmlnXdRutUwyUFB7JWMwqDtifJsKaMNS2FcgQyzSAsxZJ1',
  },
];

export const trending = [
  {
    id: 'tr-1',
    title: 'Bóng Đêm Trỗi Dậy',
    badges: ['4K', 'HDR'],
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC4n0b_VYI9g2XgnrccYOs9Klx85Q-657Hzmio9nGz2cDWqtxkdVlv1ShOncPDw9amfls7mzqtcCipZ1vKMRw6CH2Ui-ihb48y3IrKL25KzQXW6Nidkk7oOECSlFHq_tTkSArtxv1euUcnjJtweWjnJpzlSynXgvUg3JsYGdubpa8THALt7eXv4yRdmIPosvjZNzCbM0ihD3pFq2O3rgzf03xNOtSOFKf-OU7EzLPWS8EHdDLfLkmsqYCTlpDxb8_CrNSN3WgeZYTCt',
  },
  {
    id: 'tr-2',
    title: 'Tốc Độ Tử Thần',
    badges: ['HD'],
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNWu8Sd0AA87lkfeoehK9dcu9thO9fPPo3myoZGWi0MEBHfc3Plp6Dt8ShQmoEARmBK7nUN3XMJPgAdtyVMJ659fad_UbKRial0tURfJPF9h0-djJSe58ApW5OoK8pBj_04162cyLP5ApwH_5tKyW6kjcHeB-TWnQ_LzARxDwXo35Zc4rXpnVuPffS2DNKS97hawZ0ew8Enc5d7uFuNeaJZtM2usBjkYe-EC5IDpQGCYyD7gHMlv1UzcKXmxFENKG4YRVotCOqKRPq',
  },
  {
    id: 'tr-3',
    title: 'Vương Quyền',
    badges: ['4K'],
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBg-oEIVX8KfDai3PLk66I3ptAIE6_jg97-tlVAe-SSCvYviSCE0ySEiz08Nznj4pixCS7VNw0bi3YF14sZdEnj_xMjXgw88rrsHow4FSkFz76Eppj3n4__7CWvJQvsxwYJxMaIri25emKyG8aR9J3V7qgBozSLev7ZpRXPC-eIyHZdTDX6eGY-ShKQy9TDHnUHRr6OnmwwNLx1KaYSZN-jFsN9mkj-Y7NKyuJvb006ZfUZ_AFRr7k8qZ0g8Xo-E21krhsx3RxLUc95',
  },
  {
    id: 'tr-4',
    title: 'Hải Vương',
    badges: ['HDR'],
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPTQCwiDBGsQ6AIjhfTwQ6kSqsDMQZqai5cNWhNjM0HJfVKeHm8kwbQzAHnLNyrv25_T5Da_Qq5O-9ss_mw4OQDx3wbfcO9hEuGO1i_VoUreuZV8QIZKzu0mHeU9pKXS2D0WuKbdJFScZseW3peIXEvd9ZFj8YAM1EycfiruSJdfx2pYpyzqwFjsm2IJM-YkLsiiM3seWEOFUfcg2QmrwpP1DSbJF8rhwteMwzjJqcw8yKIBqfcWxJ57a-SlyQ1p6DDpmxL8nOzfCo',
  },
  {
    id: 'tr-5',
    title: 'Tư Duy Nhân Tạo',
    badges: ['4K'],
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArcx3Uz-MRAmEfM2K-fFqhBnZ5Z-8Ec2uk54qCn128PXgq6lHZEosIuHSz2AmTKolgNNL1-Kz3oC8U0neGIQrOjcgltzROZnj-CmVGmuYkgVDYaDtxnjRilLd71FbSYAmPSSfIR2btmf34UcXlf7GOMRI0_2xbwQBRkhohxoypRH9MQysVwRvLvAtmzOGhDOuvV8rKVwy5gy4ySZ3UFfzWRsYtMw5LyYd86lJOCaxCIr451ScF-YpQbE6pkLegh_ySyEZznVFPguYl',
  },
];

export const categoryTiles = [
  {
    id: 'cat-hanh-dong',
    label: 'Hành Động',
    size: 'large' as const,
    overlayClassName: 'bg-black/40 group-hover:bg-black/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdMpmjmd6JAJ1V1aW_vFEchEd829131-muO9tUs2QKiFyj31qkGH3WJON_kkWLoHPImoU9Kjegn67sgn0W8H73GrNb4vXUy7CvLUsc5cOsW_vOzJWpff6IO1Lk0CrYfnB4Cv2qpPtzgfRH7t3hG9YXcWw5LCGjpTb-6SUnNvw_tW_uzoHZeSOr4EQ5pMbunqk5RgBmSMRLA1Ot0y0iwhXHkSGqy66nJKAwtgmAnh80JZikCT62xQtpl8ewq5jfNKqqMvYSzonNcQZB',
  },
  {
    id: 'cat-kinh-di',
    label: 'Kinh Dị',
    size: 'small' as const,
    overlayClassName: 'bg-purple-900/40 group-hover:bg-purple-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDLHcsNjDUI-PfprOG8DVen3Duym5UaqpDLxWMj-guDGRixL1ecwYydMqRyQTUfCCpGOx6h2Ir6sOjBmFCNTlyRG82ACeEkFO8HEJRiEwIVHmV9N5qAy4CmPOxaoygd93VsMe0MmX3wd-fFuK2cHtG1RjdMUqxwPLGRNcsyUXZdNfQvRJ1UODiIvgU2J0iocBmsVkAA69it9qqnVi36ngBdrAo07lMduBRe9aIVHCrR1Nrgo2w8bHAWQlxL-4gI_jz0oqBgWMFtpQwY',
  },
  {
    id: 'cat-vien-tuong',
    label: 'Viễn Tưởng',
    size: 'small' as const,
    overlayClassName: 'bg-blue-900/40 group-hover:bg-blue-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_0wywHHvfz_gcQipnHwgMwx6nu-_JZRfk7RGKgFIJiAJcIpiqO81JVsu-RD3Q5hf-ZzFdLraGmQd8KLLcAvB717JM15ARDAHUCJ2yQVhJICfhAAtDRoBu_CXV0dpTaWkAFl2kAfG0k9m5OxbQdLgy8f-dVieDK5TjKgM15iAQesMS2yiXW9nsmDAJSmgce5hDWv1f_XtlGCvnWHUGGAtffUHDr7uM3aDIsfu3fmBVVfGvD9AvmwjpdHVA112MBgC76juCBWyRFFVi',
  },
  {
    id: 'cat-lang-man',
    label: 'Lãng Mạn',
    size: 'small' as const,
    overlayClassName: 'bg-red-900/40 group-hover:bg-red-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAqjR3dHAObrB3ZrxvQ3jJsXL3o90HLhVl1vDs0Y56S9gUH0q2IzXPgAJpD8YxxSiALlBSQoKtab9RVDSmCq0KUpAbjIHFwnu6j3NijtwgL2kObvGAdWP7QqKbnKKOZWMA7gKyWykPPTzyZR8OZX72BqGwHBVq5PYEnqSHJqpqzSClIQEEMMzFT3CeCoVvbJ8Trd9CyPK2rReweCYr69K65UZP-ShAiPLJG2-ju_PAQQuwkDqm5ZReuMpPET1_WK3NDU03rBJYxceSs',
  },
  {
    id: 'cat-hoat-hinh',
    label: 'Hoạt Hình',
    size: 'small' as const,
    overlayClassName: 'bg-green-900/40 group-hover:bg-green-900/20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDizdWYU365AciMgByYzrgqXMb9xVb89qM3IosvGXLMUucnXYblF86P44SyaPKcNFCHo0xsQhj4TkWNyCmccezWasm1gjnilwev-uLAQl6Vbb0QEQYysddlq-ivIQqELjOAxLLcXXNIMB9RNX8YcJAuLCHXWjJ0KXEHlfMsN4S1vMSfrpcDssqVtkHOG3PkEJsFIJrLntus_RkuHVnvUjb-e9w_rmt7zo2e0SgvTFVH-E9D6tUG8bO4oTXoOJuOgPO8xKdcaDyREa-z',
  },
];

export const topRated = [
  {
    id: 'top-1',
    title: 'Huyền Thoại Trở Lại',
    score: '9.2',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYZialT86_9lYjwrVQ2Xq7X4kZbApbLfP_bKlTwBLP30Liyo_xje_Y5f5PKkrWw3tfRmPPn7joLoyWfKhfkNL4YWtEo6G_ADP5llH43lGvadGb2Jce1hWA5WLD259zdGoRHKst0qkGA6YOcwXx8zydiAK4XadSg3ufIjO3Lp8IyK5KgXGbLRWO63wKFPBXJn1WgHNPj1ajL6TdTNZBhgdAOl-mRvRo4WTSqNPY29Vx-INlPU_ovXn5fUNACI2pa5Ykr8kHQC57sKrm',
  },
  {
    id: 'top-2',
    title: 'Vết Sẹo Cuối Cùng',
    score: '8.8',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdPP2VAtyBGpiAngL0gxRZUAhc2Iw5Hju83SdArUw_9DAUuxcFV-HISbeewSO20GvKArUgAjhaj9fu_qvjBnI-zVXC9RY6sNUvSfHqXjkjvMGlE3SCK2dieITJ4yUVFlJuBcSJXssr_Gl5mbRiwNPLxJa1vTOQXxaieujdNjczq-EozMdkhtGylYtfMWv4ZJLWnsEOcnYqF4UByqSSTAAnu-3Fuq4tfZtLvUwDmn_6huW1ekZVhcN8c9ZByOUZ9d2ijkn11BrpOV-H',
  },
  {
    id: 'top-3',
    title: 'Hành Tinh Cát',
    score: '8.5',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD9rm07nJ-kwY0uhwPJprIGJCqlXu0g-h9Jr_3ivJ6K3O_F9HyHEk4yq0UINJG7gR2fWA9NR5qEhp7Upxr1nQwyUL7HBll2OKmpuGAcK8ra2TLNvWbYymyj_MbHwwxqVxrIZbDWjEpnBYuANZAe4pWWgXgsv2rd3d1xN3U_bTUGYZ7Q33lsrXmKvQ3CCMwRKxH_2TB8Qj24prjPhhuP3a9NtpZOlpUjebF0bcJqBLglOLSwHA_e1aqqmizhB6t9r7waUb_46NfvvU10',
  },
];

export const recommendations = [
  {
    id: 'rec-1',
    title: 'Thiên Hà Mới',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDSsYUD6MuUDzqVNG-LeaBjm5JInZqzY52pDAyw2Ii8d-4Yg4mMsCeFnpUPECa0_dkWLaKYBVndKUFYsWyCma-RfcrCHuZAdkkwWB0jVygMilwKPTAyXH6F8j1uYnhjsHR-CckHJMQ6VHGdUVfYAhd1h4jIy196D-15GYS03RI6EyQkKQXJnW9HHOacALP5zc6nfW5nFgJ-mc19s6YPYnYZPZWEAQ5ZmfeQWfqpDD5C0EQQlzQo5NCeaZij9ErjQ7H7IaM_ieSD87UA',
  },
  {
    id: 'rec-2',
    title: 'Thám Tử Đêm Mưa',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAKMojeF-pw1OrxVkPqM-8VwVSffydyVPG0RPTxMjg19SvZ4Rg4f19INIM3Pu55KHSXq6fFqSs9OJqzK8i8CTzU8o-h7f3sAv0gAoTaHPth4Q5XtKua4Q8OHFA4jl-kENw0RIlxzDPmmOk-tDe9C_e0umGIrcPQsStCdqolp4PgYam-sNHb_ysNc91k-uYKbiy1tALBIiX9ArRskx03E0x1q6CNQ-yXsa8GJRBIJrkzQGE-gHKnSo7yKu3DcBWMjgqNAJg-Luoxojht',
  },
  {
    id: 'rec-3',
    title: 'Phi Thuyền Tốc Độ',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC2zrzY2MEkaR-eX_Epf9_mshIMbMX0F4ad_j1DeKEMhmgRD-gKyHpuOUqL42A-kT0caA3cTzH91l37M6LbM9qkbx-I3vIctcrkPXMrrECBaeSpXZN5T9n1i2wJ5w4k3F8K714NVcYeD5EYYIxkZoHkvSKGTSx681V9Phm6e08cs0z06eXbgNiNDpIZ0cxBAPPzscn2ckJHgFe1FXSRG0QKcmmeCX_IfmvfdZP6MDtpTotvtjED8vQxUSJQBpWHzL8-9olEio9t99IX',
  },
  {
    id: 'rec-4',
    title: 'Kỷ Nguyên Khủng Long',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuASNBxJ3hB7Bw9kZQvOw-hTN6zYzkmaQ_91MFNVxXnU1C4GUDRTCY33YBKX3rZbj4NLO8UlnVuzA6hbPcMtKfYLWFWqa7CgstWUMBGFRBEiONHWRgAz_IGPzCALYVfqlJDJtwjoa9L-J-r8_R8lC6ifsG0AfhacBGACA-PB98MTYnGBdHDbfoJf4Ogj6_NYGuCuJOQ4-l6DsH9vUj2wCrLt480tKmipfqmxoKKVYpXftBQlllTY-lVk7f_4agcQgIKrWcfx6bEczoWp',
  },
  {
    id: 'rec-5',
    title: 'Phòng Thí Nghiệm Tương Lai',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApUOshVPo_LEJ0yyXPJ2FiqcSlfvfCWrN1ek-MHmVOAZQ9NEHNQhWgL8pwGeD117AMvImdL971c23UY-_olJf7NQpddp-lvUgH7fvMZJEa58DiQ5scWY-MnVen_pQ_mbzUeRKfup8GX9FIsVLSjmLMZl6_9vwDcrv34MNT7PJIxne8y0-WfiqmvUNWeRLJ9GzgE0QeMxffwNPzGTMrIzf1rmSnBKeGTs_tVxx4LHwDk703_wr0pIGbQI7oqXes9EwTSzOL_HVksilW',
  },
  {
    id: 'rec-6',
    title: 'Đấu Trường La Mã Cổ Đại',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnsdaQy2saRbk9xCBwKcvovyH4fTHdxMay74MKmVlCyU5H0SrZh_g8F6R-VMUdQJwBvvl2DEZqtjko0X4pzGabZnK0ByTNxxsr0w_9__zyNQtpTlTCPOEm9LAjz9Twbe1kw0Xtiws3JrVAbWn-_9iV1b-J6NgVIA8QWP5903hX_ePUKDL3VUzyiu--hJgbR7Gv8oNzeV6qr9_zsGDDcRbm64CojEdYsfrHMPMtbtoFF7DsxV-XDsygbNSBHo60dze0tWFD0v6Y7DFs',
  },
];
