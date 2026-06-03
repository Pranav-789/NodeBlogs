import { useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, BookOpen, PenTool, MessageCircle, BarChart, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const learnMoreRef = useRef<HTMLDivElement>(null);

  const scrollToLearnMore = () => {
    learnMoreRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                B
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">NodeBlogs</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/explore')}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors mr-2"
              >
                Explore
              </button>
              {user ? (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-sm"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/login')}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => navigate('/register')}
                    className="px-5 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 text-sm"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Now with Rich Text Editing
                </motion.div>
                
                <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8 leading-tight">
                    Write, Share, & <br/>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Inspire the World</span>
                </motion.h1>
                
                <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                    A powerful, minimalistic platform for students and creators to share their ideas. Built with modern tools for a seamless writing experience.
                </motion.p>
                
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={() => user ? navigate('/dashboard') : navigate('/register')}
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                    >
                        Start Writing Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                        onClick={() => navigate('/explore')}
                        className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-900 text-gray-700 dark:text-white font-bold text-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                        Explore Blogs
                    </button>
                </motion.div>
            </motion.div>
            
            {/* Dashboard Preview / Floating UI Elements */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-20 relative mx-auto max-w-5xl"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <img 
                        src="/image.png" 
                        alt="Platform Preview" 
                        className="w-full h-auto object-cover opacity-90 dark:opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-900 dark:via-transparent dark:to-transparent h-full w-full"></div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={learnMoreRef} className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">Why choose NodeBlogs?</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to create compelling content and manage your workflow efficiently.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<PenTool className="w-6 h-6 text-white" />}
                    title="Rich Text Editor"
                    description="Write beautifully with our new integrated rich text editor efficiently."
                    color="bg-purple-500"
                />
                <FeatureCard 
                    icon={<MessageCircle className="w-6 h-6 text-white" />}
                    title="Interactive Comments"
                    description="Engage with your audience through real-time commenting and discussions."
                    color="bg-blue-500"
                />
                <FeatureCard 
                    icon={<BarChart className="w-6 h-6 text-white" />}
                    title="Real-time Analytics"
                    description="Track your post performance, views, and engagement metrics effortlessly."
                    color="bg-green-500"
                />
                 <FeatureCard 
                    icon={<Shield className="w-6 h-6 text-white" />}
                    title="Secure Auth"
                    description="Enterprise-grade security for your account and data protection."
                    color="bg-red-500"
                />
                 <FeatureCard 
                    icon={<BookOpen className="w-6 h-6 text-white" />}
                    title="Easy Management"
                    description="Manage all your blogs, drafts, and published content in one place."
                    color="bg-orange-500"
                />
                 <FeatureCard 
                    icon={<CheckCircle className="w-6 h-6 text-white" />}
                    title="SEO Optimized"
                    description="Your content is automatically optimized for search engines out of the box."
                    color="bg-indigo-500"
                />
            </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                
                <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to start your journey?</h2>
                <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
                    Join thousands of students and creators who are already sharing their stories on NodeBlogs.
                </p>
                <button 
                     onClick={() => navigate('/register')}
                    className="px-10 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl relative z-10"
                >
                    Create Free Account
                </button>
            </div>
        </div>
      </section>

      <footer className="bg-gray-50 dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
              <p>&copy; {new Date().getFullYear()} NodeBlogs. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-${color.replace('bg-', '')}/30`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
        </div>
    );
}
