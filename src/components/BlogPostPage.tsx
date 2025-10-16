import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Loader2, AlertCircle, User, Calendar, PenTool, Send, Menu, X } from 'lucide-react';
// Reusing BlogCard from BlogListPage for the "You May Also Like" section
import  { BlogCard }  from './BlogListPage';
import BlueskyLogo from '../images/bluesky-logo.svg';
import BlueskyLogoWhite from '../images/bluesky-logo-white.svg';
import LinkedInLogo from '../images/linkedin-logo.svg';
import LinkedInSolidLogo from '../images/linkedin-solid-logo.svg';
import LinkedInSolidLogoWhite from '../images/linkedin-solid-logo-white.svg';
import XLogo from '../images/x-logo.svg';
import { Helmet } from 'react-helmet-async'; // CRITICAL: For dynamic meta tags

const DEFAULT_META_IMAGE = 'https://sosavvy.so/images/sosavvy_meta_img_v4.png';
// CRITICAL: Define the base domain for absolute URLs
const BLOG_BASE_URL = "https://sosavvy.so/blog"; 

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

  // CRITICAL FIX: Define safe meta variables here, at the top of the component,
  // so they are available immediately for the initial Helmet render.
  const canonicalUrl = slug ? `${BLOG_BASE_URL}/${slug}` : BLOG_BASE_URL;
  const metaTitle = post?.title || 'SoSavvy Blog'; // Default title while loading
  const metaDescription = post?.description || 'Discover the latest insights from SoSavvy.'; // Default description
  const metaImageUrl = post?.featured_image_url || DEFAULT_META_IMAGE;


   const handleLoginClick = () => {
    // This navigates to an external URL, not an internal route
    window.location.href = 'https://app.sosavvy.so/login';
  };


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

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="ml-2 text-gray-600">Loading post details...</p>
        </div>
      );
  }

  // The original redundant loading checks are removed from here.

  if (!post) {
    return <div className="text-center p-8 text-red-500">Blog post not found.</div>;
  }
  
  // Destructuring moved up for post data usage (already handled by metaTitle/metaDescription above)
  const formattedDate = post.created_at ? format(new Date(post.created_at), 'dd MMM, yyyy') : 'N/A';

  //const metaTitle = post?.title || 'SoSavvy Blog'; // Default title while loading
  //console.log('Blog Post metaTitle', metaTitle)
  //console.log('Slug Url from canonical',canonicalUrl)

  return (

    <>

<style>
        {`
          .subtle-scrollbar::-webkit-scrollbar {
            width: 6px; /* 1. SCROLLBAR WIDTH: Reduced to 6px */
          }
          
          /* 2. SCROLLBAR TRACK (The path): 
            Set the background to a very low-opacity white/light-gray color. 
            The '0.3' means 30% opacity.
          */
          .subtle-scrollbar::-webkit-scrollbar-track {
            background: rgba(243, 244, 246, 0.3); 
            border-radius: 10px;
          }

          /* 3. SCROLLBAR THUMB (The draggable handle): 
            Set the color to a light gray with moderate transparency. 
            The '0.6' means 60% opacity.
          */
          .subtle-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(189, 192, 196, 0.6); 
            border-radius: 10px;
          }

          /* 4. THUMB ON HOVER: 
            Slightly darker color (higher opacity) when the mouse is over it.
          */
          .subtle-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.8); 
          }
        `}
      </style>
    
    {/* CRITICAL FIX: HELMET IS MOVED HERE! 
        It executes on every render, ensuring the 'og:url' (using canonicalUrl) 
        is available even during the first render before data loads. 
    */}

    {/*
    <meta property="og:url" content="https://sosavvy.so/" id="og-url" />
    <meta property="og:title" content="Meet your social media manager" id="og-title" />
    <meta property="og:description" content="Grow inquiries and book appointments with High Converting social media posts done for you" id="og-description" />
    <meta property="og:image" content="https://sosavvy.so/images/sosavvy_meta_img_v4.png" id="og-image" />
    <meta property="og:type" content="website" id="og-type" />
  */}

      <Helmet>
        {/* Base Tags */}
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" />
        
        {/* Open Graph Tags (for LinkedIn/Facebook) */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImageUrl} />
        {/* This tag is the key fix, as canonicalUrl is based on 'slug' which is available immediately */}
        <meta property="og:url" content={canonicalUrl} /> 
        {/*<meta property="og:url" content="https://sosavvy.so/blog/3-rules-for-posting-consistently-on-linkedin-with-ai-scheduling" id="og-url" />*/}
        <meta property="og:type" content="article" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImageUrl} />
      </Helmet>
    
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
        {/* <div className="hidden flex space-x-2 space-x-4 sm:space-y-0 sm:space-x-2">*/}
          
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
      
            {/*
            //Remove Featured Image in URL
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-96 object-cover rounded-lg mb-8"
              />
            )}
            */}

            {/*
              WARNING: Using dangerouslySetInnerHTML can expose your application to XSS attacks
              if the content is not sanitized. Ensure 'post.content' is trusted or properly sanitized
              before rendering. For Markdown content, consider using a library like 'react-markdown'..
            */}
            
            
            
            <div
              className="prose max-w-none h-full text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-10 sticky top-8 self-start overflow-y-auto max-h-[90vh] **subtle-scrollbar**">
          {/*<div className="lg:col-span-1 space-y-10 sticky top-8 self-start">*/}
          {/*<div className="lg:col-span-1 space-y-10 sticky top-8 self-start overflow-y-auto max-h-[90vh]">*/}
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
              // Note: You originally passed an empty categories array which I've maintained for type safety
              relatedPosts.map((rp) => <BlogCard key={rp.id} post={{ ...rp, categories: [] }} />) 
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
          <li> <a href="https://sosavvy.so/#key_features" className="no-underline hover:text-blue-400 transition-colors">Features</a></li>
          <li> <a href="https://sosavvy.so/#pricing" className="no-underline hover:text-blue-400 transition-colors">Pricing</a></li>
          <li> <a href="https://sosavvy.so/#testimonial" className="no-underline hover:text-blue-400 transition-colors">Testimonials</a></li>
          <li className="text-gray-400">Roadmap <em>(soon)</em></li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h3 className="font-semibold mb-4">Tools and Resources</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {/*<li className="text-gray-400">Blog <em>(soon)</em></li>
          <li className="text-gray-400">Docs <em>(soon)</em></li>
      <li className="text-gray-400">Support <em>(soon)</em></li>*/}
          <li> <a href="https://sosavvy.so/#FAQ" className="no-underline hover:text-blue-400 transition-colors">Frequently Asked Questions</a></li>
          <li> <a href="https://sosavvy.so/blog/the-sosavvy-playbook-linkedin-content-without-the-grind" className="no-underline hover:text-blue-400 transition-colors">LinkedIn Content Strategy Playboook</a></li>
          <li> <a href="https://sosavvy.so/blog/10-ai-hook-prompts-for-scroll-stopping-linkedin-posts" className="no-underline hover:text-blue-400 transition-colors">Best AI Prompts for Viral LinkedIn Posts</a></li>
          <li> <a href="https://sosavvy.so/blog/7-ai-prompts-to-boost-linkedin-event-attendance" className="no-underline hover:text-blue-400 transition-colors">7 Prompts to Boost Your LinkedIn Events</a></li>
          <li> <a href="https://sosavvy.so/blog/3-rules-for-posting-consistently-on-linkedin-with-ai-scheduling" className="no-underline hover:text-blue-400 transition-colors">How to Post Consistently on LinkedIn</a></li>
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
  </>
  );
}
