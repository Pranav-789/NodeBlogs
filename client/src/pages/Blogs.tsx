import { useEffect, useState } from 'react';
import { blogAPI } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';

interface BlogPost {
  id: number;
  title: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  _count: {
    likes: number;
  };
}

export default function Blogs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'recent' | 'popular'>('recent');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  /* const { user } = useAuth(); */

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'recent') {
        response = await blogAPI.getRecent(page);
      } else {
        response = await blogAPI.getPopular(page);
      }
      setBlogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch blogs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [activeTab, page]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Blogs</h1>
        <Link
          to="/blogs/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Blog
        </Link>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { setActiveTab('recent'); setPage(1); }}
          className={`py-2 px-4 border-b-2 font-medium transition-colors ${
            activeTab === 'recent'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => { setActiveTab('popular'); setPage(1); }}
          className={`py-2 px-4 border-b-2 font-medium transition-colors ${
            activeTab === 'popular'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Popular
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {blogs.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No blogs found.
            </div>
          ) : (
            blogs.map((blog) => (
              <Link
                key={blog.id}
                to={`/blogs/${blog.id}`}
                className="block bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group hover:-translate-y-1"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/profile/${blog.authorId}`);
                        }}
                        className="font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors z-10 relative"
                      >
                        {blog.authorName}
                      </button>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-5 py-3 rounded-xl shrink-0">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{blog._count?.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-8">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-gray-700 dark:text-gray-300">Page {page}</span>
        <button
          disabled={blogs.length < 10} 
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
