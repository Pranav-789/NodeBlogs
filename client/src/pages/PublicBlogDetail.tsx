import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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
  likesCount: { likes: number };
}

export default function PublicBlogDetail() {
  const { blogId } = useParams<{ blogId: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/blogs/${blogId}`, { replace: true });
    }
  }, [user, navigate, blogId]);

  const fetchBlogData = async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const [blogRes, commentsRes] = await Promise.all([
        blogAPI.getPublicById(Number(blogId)),
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans pb-12">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 mb-8">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/explore" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Explore
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error || !blog ? (
        <div className="text-center p-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            {error || 'Blog post not found'}
          </h2>
          <Link
            to="/explore"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Explore More Blogs
          </Link>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-8 px-4 animate-fade-in-up">
          <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8 md:p-10 border border-gray-100 dark:border-gray-800">
            <header className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
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
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight break-words">
                {blog.title}
              </h1>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {blog.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {blog.authorName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
                </div>
              </div>
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

            <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-lg text-gray-700 dark:text-gray-300">{blog.likesCount.likes} Likes</span>
              </div>
              
               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
                 <span className="font-semibold text-gray-700 dark:text-gray-300">{comments.length} Comments</span>
               </div>
            </div>
          </article>

          <section className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Discussion ({comments.length})
                </h3>
                <Link to="/login" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Sign in to comment
                </Link>
            </div>
            
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-4 p-5 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shrink-0">
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {comment.userName}
                      </span>
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
                <div className="text-center py-12 text-gray-400 italic">
                  No comments yet.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
