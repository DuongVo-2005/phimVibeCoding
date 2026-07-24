# Mongoose Database Schema cho Web Phim

Dựa trên bảng yêu cầu tính năng và các API từ tài liệu, dưới đây là thiết kế chi tiết Database Schema cho MongoDB sử dụng Mongoose. Thiết kế này bao phủ toàn bộ các tính năng từ Trang chủ, Quản lý tài khoản, Xem phim, Đánh giá/Bình luận đến Danh mục (Playlist).

---

## 1. User Collection (`users`)
Lưu trữ thông tin người dùng, danh sách yêu thích và các tuỳ chọn cá nhân.

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  avatar: { type: String }, // Có thể chọn từ hệ thống (ImgAvatars) hoặc tự upload
  favoriteFilms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Film' }], // Phim yêu thích
  favoriteActors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }], // Diễn viên yêu thích
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

---

## 2. Film Collection (`films`)
Lưu trữ thông tin chi tiết về phim.

```javascript
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tên phim
  description: { type: String }, // Mô tả phim
  thumb_url: { type: String }, // Ảnh thumbnail nhỏ
  poster_url: { type: String }, // Ảnh bìa lớn
  views: { type: Number, default: 0 }, // Lượt xem
  isPublic: { type: Boolean, default: true }, // Trạng thái hiển thị
  
  // Khóa ngoại
  types: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Type' }], // Thể loại phim
  actors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }], // Diễn viên tham gia
  
  galleries: [{ type: String }], // Gallery phim (video trailer, ảnh)
  status: { type: String, enum: ['ongoing', 'completed', 'trailer'], default: 'completed' },
  releaseYear: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Film', filmSchema);
```

---

## 3. Type / Genre Collection (`types`)
Lưu trữ danh sách thể loại phim (Hành động, Tình cảm, Anime...).

```javascript
const typeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  slug: { type: String, unique: true },
  isPublic: { type: Boolean, default: true } // Dùng cho API TypesController_findAllPublic
}, { timestamps: true });

module.exports = mongoose.model('Type', typeSchema);
```

---

## 4. Actor Collection (`actors`)
Lưu trữ thông tin chi tiết của diễn viên.

```javascript
const actorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String },
  bio: { type: String },
  birthDate: { type: Date },
  nationality: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Actor', actorSchema);
```

---

## 5. Comment Collection (`comments`)
Quản lý bình luận, bình luận con (trả lời) và số lượt vote.

```javascript
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Film', required: true },
  content: { type: String, required: true },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Hỗ trợ Reply Comment
  upVotes: { type: Number, default: 0 },   // Vote thích
  downVotes: { type: Number, default: 0 }, // Vote chê
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
```

---

## 6. Rating Collection (`ratings`)
Lưu trữ đánh giá (chấm điểm sao) của người dùng về phim.

```javascript
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Film', required: true },
  score: { type: Number, required: true, min: 1, max: 10 }, // Điểm đánh giá
  content: { type: String }, // Đánh giá có thể kèm nội dung review
  upVotes: { type: Number, default: 0 },
  downVotes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);
```

---

## 7. Playlist Collection (`playlists`)
Danh mục phim tùy chỉnh do người dùng tự tạo.

```javascript
const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // Tên danh mục (VD: Phim xem cuối tuần)
  description: { type: String },
  films: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Film' }], // Danh sách phim đã thêm vào playlist
  isPublic: { type: Boolean, default: false } // Công khai danh mục hay không
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);
```

---

## 8. Watch History Collection (`watch_histories`)
Lịch sử xem phim để gợi ý tính năng "Xem tiếp".

```javascript
const watchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Film', required: true },
  progress: { type: Number, default: 0 }, // Tiến độ xem (số giây hoặc % video)
  episode: { type: Number, default: 1 }, // Tập phim đang xem (đối với phim bộ)
  watchedAt: { type: Date, default: Date.now } // Cập nhật lần xem cuối cùng
}, { timestamps: true });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
```

---

## 9. TypeAvatar Collection (`type_avatars`)
Phân loại các ảnh đại diện có sẵn trên hệ thống (VD: Mặc định, Anime, Siêu anh hùng...).

```javascript
const typeAvatarSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên danh mục avatar
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TypeAvatar', typeAvatarSchema);
```

---

## 10. ImgAvatar Collection (`img_avatars`)
Chứa các URL ảnh đại diện cho người dùng chọn lọc theo TypeAvatar.

```javascript
const imgAvatarSchema = new mongoose.Schema({
  typeAvatarId: { type: mongoose.Schema.Types.ObjectId, ref: 'TypeAvatar', required: true },
  url: { type: String, required: true } // Đường dẫn ảnh avatar
}, { timestamps: true });

module.exports = mongoose.model('ImgAvatar', imgAvatarSchema);
```

---

## 11. Film Report Collection (`film_reports`)
Hỗ trợ chức năng báo cáo phim bị lỗi (lỗi video, lỗi sub, v.v...).

```javascript
const filmReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Có thể lưu lại ai báo cáo nếu đã đăng nhập
  filmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Film', required: true },
  issueType: { type: String, required: true }, // Vd: Lỗi hình ảnh, Lỗi vietsub, Tập chưa có
  description: { type: String }, // Chi tiết lỗi do người dùng nhập
  status: { type: String, enum: ['pending', 'resolved', 'ignored'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('FilmReport', filmReportSchema);
```
