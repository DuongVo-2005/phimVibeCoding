import type { Metadata } from 'next';
import { AdminCommentListView } from '@/components/admin/AdminCommentListView';

export const metadata: Metadata = {
  title: 'Kiểm duyệt bình luận',
};

export default function AdminCommentsPage() {
  return <AdminCommentListView />;
}
