import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DOMPurify from 'dompurify';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

function BlockNoteRenderer({ content, theme }: { content: string, theme: 'light' | 'dark' }) {
  const initialContent = JSON.parse(content);
  const editor = useCreateBlockNote({ initialContent });
  return (
    <div className="w-full max-w-none blocknote-container mb-8">
      <BlockNoteView editor={editor} editable={false} theme={theme} className="w-full !bg-transparent" />
    </div>
  );
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
}

interface BlogPost {
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  isLiked: boolean;
  likesCount: { likes: number };
}

export default function BlogDetail() {
  const { blogId } = useParams<{ blogId: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const fetchBlogData = async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const [blogRes, commentsRes] = await Promise.all([
        blogAPI.getById(Number(blogId)),
        blogAPI.getComments(Number(blogId)),
      ]);
      setBlog(blogRes.data.data);
      setComments(commentsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogData();
  }, [blogId]);

  const handleLike = async () => {
    if (!blogId) return;
    try {
      await blogAPI.like(Number(blogId));
      // Optimistic update
      setBlog((prev) =>
        prev
          ? {
              ...prev,
              isLiked: !prev.isLiked,
              likesCount: {
                likes: prev.isLiked
                  ? prev.likesCount.likes - 1
                  : prev.likesCount.likes + 1,
              },
            }
          : null
      );
    } catch (error) {
      console.error('Failed to like post');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogId || !newComment.trim() || !user) return;

    try {
      await blogAPI.comment({
        blogId: Number(blogId),
        content: newComment,
      });
      setNewComment('');
      // Refresh comments
      const commentsRes = await blogAPI.getComments(Number(blogId));
      setComments(commentsRes.data.data);
    } catch (error) {
        console.error('Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          {error || 'Blog post not found'}
        </h2>
        <button
          onClick={() => navigate('/blogs')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
        <header className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              Article
            </span>
            <span>•</span>
            <time dateTime={blog.createdAt}>
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight break-words">
            {blog.title}
          </h1>
          <Link to={`/profile/${blog.authorId}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all">
              {blog.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {blog.authorName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Author</p>
            </div>
          </Link>
        </header>

        {(() => {
          let isJsonArray = false;
          try {
            const parsed = JSON.parse(blog.content);
            isJsonArray = Array.isArray(parsed);
          } catch (e) {
            isJsonArray = false;
          }

          if (isJsonArray) {
            return <BlockNoteRenderer content={blog.content} theme={theme} />;
          }

          return (
            <div
              className="prose dark:prose-invert max-w-none mb-8 text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap font-serif"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
            />
          );
        })()}

        <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 group transition-all duration-300 ${
              blog.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <div
              className={`p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors ${
                blog.isLiked ? 'bg-red-50 dark:bg-red-900/20' : ''
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 transition-transform group-active:scale-125 ${
                  blog.isLiked ? 'fill-current' : 'fill-none stroke-current'
                }`}
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <span className="font-semibold text-lg">{blog.likesCount.likes}</span>
          </button>
          
           <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
             </svg>
             <span>{comments.length} Comments</span>
           </div>
        </div>
      </article>

      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 md:p-8 space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Discussion ({comments.length})
        </h3>
        
        <form onSubmit={handleCommentSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none shadow-sm"
            placeholder="Add a comment..."
            rows={3}
            required
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        <div className="space-y-4 mt-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="group flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md"
            >
              <Link to={`/profile/${comment.userId}`} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shrink-0 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                {comment.userName.charAt(0).toUpperCase()}
              </Link>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Link to={`/profile/${comment.userId}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {comment.userName}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm break-words">
                    {comment.content}
                </p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
