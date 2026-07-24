# Skill: Lưu tiến trình xem phim (Watch History) - Backend

Skill này hướng dẫn cách xây dựng hệ thống lưu trữ thời lượng đã xem của phim để người dùng có thể xem tiếp từ vị trí đã dừng.

## 1. Schema (Cơ sở dữ liệu)

Sử dụng Mongoose để lưu trữ thông tin tiến trình.

```typescript
// watch-history.schema.ts
@Schema({ timestamps: true, collection: 'watch_histories' })
export class WatchHistory extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Film', required: true })
  filmId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  episodeSlug: string;

  @Prop()
  serverName: string;

  @Prop({ default: 0 })
  duration: number; // Giây hiện tại

  @Prop({ default: 0 })
  totalDuration: number; // Tổng thời lượng
}
```

## 2. API Endpoints

Hệ thống cung cấp các API chính:

- `POST /watch-history/update`: Cập nhật tiến trình (gọi định kỳ từ frontend).
- `GET /watch-history/film/:filmId`: Lấy tiến trình của tất cả các tập trong một bộ phim.
- `GET /watch-history/recent`: Lấy danh sách các phim đã xem gần đây.

## 3. Cách thức hoạt động

1. Khi người dùng xem phim, frontend sẽ gửi request `update` sau mỗi 10-15 giây.
2. Backend sử dụng `findOneAndUpdate` với option `upsert: true` để tạo mới hoặc cập nhật bản ghi duy nhất cho mỗi bộ phim + tập phim của người dùng đó.
3. Khi người dùng quay lại tập phim đó, frontend gọi API lấy `duration` đã lưu để nhảy đến vị trí cũ.
