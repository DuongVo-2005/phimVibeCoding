/**
 * Dữ liệu mock cho trang danh sách diễn viên (`design/actorderectory.html`) — KHÔNG gọi API.
 *
 * Chỉ giữ lại diễn viên có ảnh thật trong design gốc (5 mục có `src` cụ thể); các mục do JS sinh
 * thêm trong design (Song Hye-kyo, Cillian Murphy...) chỉ có `img: "placeholder"` — không có URL
 * thật nên không đưa vào mock (không tự bịa ảnh).
 *
 * Quốc gia dịch sang tiếng Việt (design gốc dùng "South Korea"/"USA"... không nhất quán với phần
 * còn lại của UI vốn 100% tiếng Việt theo `frontend.md` §1) — cùng nguyên tắc đã áp dụng cho mọi
 * mock data từ Phase 10.2.
 *
 * Sidebar tài khoản (tên/email) xuất hiện trong bản desktop của design — theo xác nhận Phase 10.6
 * quyết định A, KHÔNG mang bất kỳ phần nào của nó (kể cả PII) sang mock data này.
 */

export interface ActorListItem {
  id: string;
  name: string;
  country: string;
  filmCountLabel: string;
  imageSrc: string;
}

export const actors: ActorListItem[] = [
  {
    id: 'actor-1',
    name: 'Lee Min-ho',
    country: 'Hàn Quốc',
    filmCountLabel: '82 Phim đã đóng',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCwvwE_jTEEbysef3jDUABwYyfp4pEM2_-VTnD2KeNpVa7wuZ0okGdtLyNRGM21wfDtNTc-_bvGCJTIzN8blReDPsD1Edab8LLYXkoO1ox1BoGOcdScsKXZgAmNNw3dIgrr1MhqxZvBPrlJyF2zdEym4QhV62yJek7OD7T5xOrwfGwgtjt7ZRtHBJZmmSnyurpwKypK1IQuBMrAZjU2D_toz4yPXXpLmcWSlSDvXBGH9XiNPzzhJWXbzYFAQ5YIR7M3rZFVXWwiwamU',
  },
  {
    id: 'actor-2',
    name: 'Emma Stone',
    country: 'Mỹ',
    filmCountLabel: '45 Phim đã đóng',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBA-LmIDtbGTmScn9OjLTqYXSstAh24hZAiItyGcFme1k8hYynWmK60lz22CKiNDPTfgthGqm_B9_C-m1nzXGIrI_CuH03nfaiIqVUxk4vZuFBjJn92e3X5o54yhu7NVivax7iz_fjChdIW58eWB58dTMJ8S7pNLE0BrwPU1ZkFzZ8YqimMQauBZjtImxC-x9I8lu4UboucA99U0tNCbLHkCVqWg00qM_8tgaDZOaA3SkpntJuEMCuDJLU3SgCFe3rn3raWoG26_W13',
  },
  {
    id: 'actor-3',
    name: 'Donnie Yen',
    country: 'Trung Quốc',
    filmCountLabel: '112 Phim đã đóng',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCHLTJDOx5THPi3dbsZQNdakwszHyAFRJeimQDBegAZhhmCrhDJszr-CpBbiKODGffXrH_EtN8MLiVcB19d5jsp92Ev62xhrIHspZH1RgUndhipH_ZAaEEvp6FzPlINdu96W3Z4HT8VjY83_pFnP0CX36AG_FkRixvtU9tQUTWO-Klg4VllS44HSocPtvasD1V6Lsr1bt0IPiq5-K-ET1p8jDoX6mgJeFIZfSSNFfgB-K5TeafH6MUNE3uztWErIfHofNdeO79yqaPI',
  },
  {
    id: 'actor-4',
    name: 'Ninh Dương Lan Ngọc',
    country: 'Việt Nam',
    filmCountLabel: '36 Phim đã đóng',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD402D2JsZMptf6KU2CrByHTQrTbpydLZ5kK4I20EbR_Az9Lu_tdcVj98LmqMUCAowuAEsZaObY_OuFScxWH9_UCgwlMebG_0hXfR5umQdVsM_ky7XuhgJWXmCw94UpJDKQeDLiM2AntWJssOVf-uK4kiPdqGLkyQK00Ua9cdAyw0Zp6CiNiQOD7r0JrijcM8VnvslFiJZs9nIcLIk1ucFPuB-JqR7IJ-lPDRzB6yjJXDdi6DKN2pSIKpvsudv1XWHFTXZ1ZgVHxDGi',
  },
  {
    id: 'actor-5',
    name: 'Takeru Satoh',
    country: 'Nhật Bản',
    filmCountLabel: '28 Phim đã đóng',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCdk9s_R2iX8fGcPQSN-W7m480OABULN5HCbj5sXodOwtKtpKnK4S7fyvt7oQS6ohD8vAdNaI6imRkxL5RIYnPzqoxm-ThQKZdF5pE3QpZ_XpcImonTyLuJBPFtlqgogU7GbAA3QAEcC6ZjHVen3eRnVJLP6Ps1-r74-vlJbZKo7xCA8kCnHJxsEMaf9X3frJr7VI3YBJDOixQvvJuBkcinl6xBh2eda2c8E3DxDTWivSJ3rSBM6U8X5Z5H0fATXqyrs-IMIUVfPszr',
  },
];

export const regionTags = ['Hàn Quốc', 'Âu Mỹ', 'Việt Nam', 'Trung Quốc', 'Nhật Bản', 'Thái Lan'];
