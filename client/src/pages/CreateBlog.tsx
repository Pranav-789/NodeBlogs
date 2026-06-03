import { useState } from 'react';
import { blogAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export default function CreateBlog() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const editor = useCreateBlockNote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return; // Should be protected by Route but good to check

    setLoading(true);
    setError('');

    if (editor.document.length === 0 || (editor.document.length === 1 && (!editor.document[0].content || (Array.isArray(editor.document[0].content) && editor.document[0].content.length === 0)))) {
       setError("Content cannot be empty");
       setLoading(false);
       return;
    }

    const documentJson = JSON.stringify(editor.document);

    try {
      await blogAPI.create({
        title,
        content: documentJson,
      });
      navigate('/blogs');
    } catch (err: unknown) {
      const errorMessage = (err as any).response?.data?.message || 'Failed to create blog post';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0 min-h-[calc(100vh-6rem)] flex flex-col">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 shadow-sm border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px]">
        
        {/* Editor Action Bar */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/80 sticky top-0 z-10 backdrop-blur-sm flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 dark:text-gray-300 font-medium">Create New Post</span>
          </div>

          <div className="flex justify-end gap-3 ml-auto">
            <button
              type="button"
              onClick={() => navigate('/blogs')}
              className="px-4 py-1.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-1.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20 text-sm"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-8 md:p-12 flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl md:text-3xl font-bold text-gray-900 dark:text-white bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-600 mb-8 border-none focus:ring-0 p-0 md:pl-12 pl-4"
            placeholder="Document Title"
            required
            maxLength={100}
          />
          
          <div className="flex-1 w-full blocknote-container">
            <BlockNoteView editor={editor} theme={theme} className="min-h-[300px]" />
          </div>
        </div>
      </form>
    </div>
  );
}
