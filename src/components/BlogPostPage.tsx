import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Loader2, AlertCircle, User, Calendar, PenTool, Send, Menu } from 'lucide-react';
// Reusing BlogCard from BlogListPage for the "You May Also Like" section
import  { BlogCard }  from './BlogListPage';
import BlueskyLogo from '../images/bluesky-logo.svg';
import BlueskyLogoWhite from '../images/bluesky-logo-white.svg';
import LinkedInLogo from '../images/linkedin-logo.svg';
import LinkedInSolidLogo from '../images/linkedin-solid-logo.svg';
import LinkedInSolidLogoWhite from '../images/linkedin-solid-logo-white.svg';
import XLogo from '../images/x-logo.svg';

// Interfaces for data structures (can be reused or defined here)
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  description: string;
  featured_image_url: string | null;
  author_name: string | null;
  created_at: string; // ISO string
  // If you need categories for the main post, you'd fetch them here too
  // categories?: BlogCategory[];
}

// Helper function to truncate text for descriptions (reused from BlogListPage)
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Component for the right sidebar's recent blog item
interface RecentBlogItemProps {
  post: BlogPost;
}

const RecentBlogItem: React.FC<RecentBlogItemProps> = ({ post }) => {
  return (
    <Link to={`/blog/${post.slug}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group">
      {post.featured_image_url && (
        <img
          src={post.featured_image_url}
          alt={post.title}
          className="w-16 h-12 object-cover rounded-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
        />
      )}
      <h4 className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
        {truncateText(post.title, 60)}
      </h4>
    </Link>
  );
};

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   const handleLoginClick = () => {
    // This navigates to an external URL, not an internal route
    window.location.href = 'https://app.sosavvy.so/login';
  };

  // Fetch single blog post
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('blog_post')
          .select('*') // Fetch all columns for the main post
          .eq('slug', slug)
          .single();

        if (error) {
          throw error;
        }
        setPost(data);
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post. Please try again later.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // Fetch recent and related posts
  useEffect(() => {
    const fetchSidebarPosts = async () => {
      try {
        // Fetch recent posts (top 10, excluding current post)
        const { data: recentData, error: recentError } = await supabase
          .from('blog_post')
          .select('id, title, slug, featured_image_url') // Only fetch necessary fields
          .order('created_at', { ascending: false })
          .neq('slug', slug) // Exclude current post
          .limit(10);

        if (recentError) throw recentError;
        setRecentPosts(recentData || []);

        // Fetch 3 random related posts (excluding current and recent posts)
        // This is a simplified random fetch. For a more robust solution, consider
        // fetching by tags/categories or implementing a more complex random query.
        const { data: randomData, error: randomError } = await supabase
          .from('blog_post')
          .select('id, title, slug, description, featured_image_url, author_name, created_at')
          .neq('slug', slug) // Exclude current post
          .order('created_at', { ascending: true }) // Order by something to make limit consistent, then shuffle client-side
          .limit(100); // Fetch more than 3 to ensure randomness after filtering

        if (randomError) throw randomError;

        // Filter out posts that are already in the recent posts list
        const filteredRandomData = (randomData || []).filter(
          (rp: BlogPost) => !recentPosts.some(recP => recP.id === rp.id)
        );

        // Shuffle and pick 3
        const shuffled = filteredRandomData.sort(() => 0.5 - Math.random());
        setRelatedPosts(shuffled.slice(0, 3));

      } catch (err: any) {
        console.error('Error fetching sidebar posts:', err);
        // Handle error for sidebar posts gracefully without blocking main content
      }
    };

    if (slug) {
      fetchSidebarPosts();
    }
  }, [slug, recentPosts]); // Depend on recentPosts to filter related posts correctly

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-20">
        <AlertCircle className="w-6 h-6 inline-block mr-2" />
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center text-gray-600 py-20">
        <AlertCircle className="w-6 h-6 inline-block mr-2" />
        Blog post not found.
      </div>
    );
  }

  const formattedDate = post.created_at ? format(new Date(post.created_at), 'dd MMM, yyyy') : 'N/A';

  return (
    
     <div className="pb-16 bg-gray-50 min-h-screen">
    
    <nav className="px-4 py-3 flex items-center justify-between sm:px-6 sm:py-4">
    <a href="https://www.sosavvy.so">
        <div className="flex items-center space-x-2">

         <div className="bg-blue-600 rounded-full p-1.5 rotate-180 sm:p-2">
            <PenTool className="h-7 w-7 fill-white stroke-blue-600 sm:h-9 sm:w-9" />
          </div>
          <span className="text-2xl  font-bold text-black sm:text-2xl">SoSavvy</span>
        </div>
        </a>
        
        {/*Desktop Navigation Buttons */}
        {/*  <div className="hidden flex space-x-2 space-x-4 sm:space-y-0 sm:space-x-2">*/}
          
        <div className="hidden sm:flex items-center space-x-4">
          <div className="items-center justify-center space-x-2">
              <button
            onClick={() => {
              window.location.href = 'https://www.sosavvy.so/#how_it_works';
              }}
              className="px-4 py-2 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
>
            How it works
          </button> 

             <button
            onClick={() => {
              window.location.href = 'https://www.sosavvy.so/#key_features';
              }}
              className="px-4 py-2 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
>
            Features
          </button> 

          <button
            onClick={() => {
              window.location.href = 'https://www.sosavvy.so/#testimonial';
              }}
              className="px-4 py-2 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
>
            Testimonials
          </button> 

          <button
            onClick={() => {
              window.location.href = 'https://www.sosavvy.so/#FAQ';
              }}
              className="px-4 py-2 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
>
            FAQ
          </button> 

           <button
            onClick={() => {
              window.location.href = 'https://www.sosavvy.so/#pricing';
              }}
              className="px-4 py-2 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
>
            Pricing
          </button> 

        <Link
          to="/blog"
          className="px-4 py-2 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors">    
          
          Blog

        </Link>   
            
      </div> 
          
          <button
          
            //onClick={openWaitlistModal}
            onClick={handleLoginClick}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors              
            shadow-lg shadow-blue-500/60       
             hover:shadow-xl hover:shadow-blue-500/80 "
          >
            <Send className="w-3.5 h-3.5"/>
           <span>Start for Free</span>
          </button>
          
          
        </div>
        
     {/* Mobile Menu Button (Hamburger) (Visible on mobile, hidden on sm and up) */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

 {/* Mobile Menu Overlay */}
      {/* This part of the code is generally correct for the overlay. */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 bg-white z-40 flex flex-col items-center justify-center space-y-4 py-6"> 

          <button
            onClick={() => {
              window.location.href = '#how_it_works';
              setIsMobileMenuOpen(false);           
              }}
              className="w-11/12 max-w-sm px-4 py-3 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
            How it works
          </button>
          <button
            onClick={() => {
              window.location.href = '#key_features';
              setIsMobileMenuOpen(false);           
              }}
              className="w-11/12 max-w-sm px-4 py-3 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
            Features
          </button>
          <button
            onClick={() => {
              window.location.href = '#testimonial';
              setIsMobileMenuOpen(false);           
              }}
              className="w-11/12 max-w-sm px-4 py-3 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
            Testimonials
          </button>

          <button
            onClick={() => {
              window.location.href = '#FAQ';
              setIsMobileMenuOpen(false);           
              }}
              className="w-11/12 max-w-sm px-4 py-3 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
            FAQ
          </button>
          
          <button
            onClick={() => {
              window.location.href = '#pricing';
              setIsMobileMenuOpen(false);           
              }}
              className="w-11/12 max-w-sm px-4 py-3 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
            Pricing
          </button>

           <button
            onClick={() => {
              window.location.href = '#pricing';
              setIsMobileMenuOpen(false);           
              }}
              className="w-11/12 max-w-sm px-4 py-3 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
            Pricing
          </button>

          
          {/* Close button within the overlay */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            aria-label="Close navigation"
          >
            <X className="h-6 w-6" />
          </button>
          
          <button
           
            //onClick={openWaitlistModal}
            onClick={handleLoginClick}
            className="flex items-center justify-center space-x-2 w-11/12 max-w-sm px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-semibold sm:text-lg"
          >
           <Send className="w-4 h-4"/>
           <span>Start for Free</span>
          </button>
        
        </div>
      )}
        
      </nav>
      <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Blog Post Content */}
          <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
            <div className="flex items-center text-gray-500 text-sm mb-6">
              {post.author_name && (
                <span className="flex items-center mr-4">
                  <User className="w-4 h-4 mr-1" /> {post.author_name}
                </span>
              )}
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> {formattedDate}
              </span>
            </div>
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-96 object-cover rounded-lg mb-8"
              />
            )}
            {/*
              WARNING: Using dangerouslySetInnerHTML can expose your application to XSS attacks
              if the content is not sanitized. Ensure 'post.content' is trusted or properly sanitized
              before rendering. For Markdown content, consider using a library like 'react-markdown'..
            */}
            <div
              className="prose prose-lg max-w-none h-full text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-10">
            {/* Advertising Section */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Boost Your Social Presence!</h3>
              <img
                //src="https://images.pexels.com/photos/3184433/pexels-photo-3184433.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" // Example image from Pexels
                src="https://selrznkggmoxbpflzwjz.supabase.co/storage/v1/object/public/blog_images/cf606bf7-cf80-429c-836a-cbd0d01256a6/sosavvy_advert_image_1.png"
                alt="Advertisement"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <p className="text-gray-600 mb-4">
                Discover how SoSavvy saves Solopreneurs <br/> 10 hours every week.👇 
              </p>
              {/*
              <Link
                to="/signup"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Get Started Free
              </Link>
          */}

              <button
                onClick={handleLoginClick}
                className="inline-block space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:bg-blue-700                   transition-colors shadow-lg shadow-blue-500/60 hover:shadow-xl hover:shadow-blue-500/80 ">
                      <span>Get Started for Free</span>         
              </button>
            </div>

            {/* Recent Posts */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Posts</h3>
              <div className="space-y-4">
                {recentPosts.length > 0 ? (
                  recentPosts.map((rp) => <RecentBlogItem key={rp.id} post={rp} />)
                ) : (
                  <p className="text-gray-600">No recent posts available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* "You may also Like" Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedPosts.length > 0 ? (
              relatedPosts.map((rp) => <BlogCard key={rp.id} post={{ ...rp, categories: [] }} />) // Pass empty categories array or fetch them if needed
            ) : (
              <p className="text-center text-gray-600 col-span-full">No related posts found.</p>
            )}
          </div>
        </div>
           {/* Start Footer - Full Foot Breakdown */}

<footer className="mt-24 border-t border-gray-300 text-left">
  <div className="max-w-7xl mx-auto px-4 py-12">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"> {/* Responsive grid */}
      {/* Company Info */}
      <div className="space-y-4">

              <div className="inline-flex bg-blue-600 rounded-full p-2 rotate-180">
                <PenTool className="h-9 w-9 fill-white stroke-blue-600" />
              </div>
        {/*
        <div className="flex  items-center space-x-2">
          <img src={klaowtIcon} alt="Klaowt Icon in-App" className="w-9 h-9 bg-blue-200 p-1.5 rounded-full" />
          <span className="font-bold text-xl">Klaowt</span>
        </div>
        */}
        
        <p className="text-sm text-gray-600">
          The smart solution for audience builders on Bluesky <img src={BlueskyLogo} alt="Bluesky" className="inline-block w-3 h-3 align-middle" /> LinkedIn <img src={LinkedInSolidLogo} alt="LinkedIn" className="inline-block w-3 h-3 align-middle" /> and Twitter <img src={XLogo} alt="Twitter" className="inline-block w-3 h-3 align-middle" />
        </p>
        {/* Social links */}
      </div>

      {/* Product Links */}
      <div>
        <h3 className="font-semibold mb-4">Product</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li> <a href="#key_features" className="no-underline hover:text-blue-400 transition-colors">Features</a></li>
          <li> <a href="#pricing" className="no-underline hover:text-blue-400 transition-colors">Pricing</a></li>
          <li> <a href="#testimonial" className="no-underline hover:text-blue-400 transition-colors">Testimonials</a></li>
          <li className="text-gray-400">Roadmap <em>(soon)</em></li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h3 className="font-semibold mb-4">Resources</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {/*<li className="text-gray-400">Blog <em>(soon)</em></li>
          <li className="text-gray-400">Docs <em>(soon)</em></li>
      <li className="text-gray-400">Support <em>(soon)</em></li>*/}
          <li> <a href="#FAQ" className="no-underline hover:text-blue-400 transition-colors">FAQ</a></li>
        </ul>
      </div>

      {/* Legal */}
      <div>
        <h3 className="font-semibold mb-4">Legal</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <a href="/privacy.html" className="flex items-center gap-3 hover:text-blue-400 transition-colors">Privacy Policy</a>      
          </li>
          <li>
              <a href="/terms.html" className="flex items-center gap-3 hover:text-blue-400 transition-colors">Terms of Service</a>
          </li>
              <a href="/cookie.html" className="flex items-center gap-3 hover:text-blue-400 transition-colors">Cookie Policy</a>
        </ul>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600"> {/* Responsive flex */}
      <p className="order-2 sm:order-1">&copy; 2025 SoSavvy.so All rights reserved.</p> {/* Order for mobile */}
        <div className="flex space-x-6 order-1 sm:order-2"> 
          {/* Order for mobile */}
          <span>Made with ❤️ for founders and business owners building their personal brand with purpose</span>
            <a href="https://www.linkedin.com/in/oluadedeji" className="text-blue-500 hover:text-blue-600">Olu on LinkedIn (9k followers)
          </a>
        </div>
      </div>
    </div>
  </div>
</footer>
      </div>
    </div>
  );
}
