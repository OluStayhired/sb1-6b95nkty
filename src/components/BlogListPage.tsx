import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Loader2, Tag, Calendar, User, AlertCircle, PenTool, Send, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

// Interfaces for data structures
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  description: string;
  featured_image_url: string | null;
  author_name: string | null;
  created_at: string; // ISO string
  categories: BlogCategory[]; // To store associated categories
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

// Helper function to truncate text for descriptions
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// BlogCard Sub-component: Displays an individual blog post
interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const formattedDate = format(new Date(post.created_at), 'dd MMM, yyyy');
  const truncatedDescription = truncateText(post.description || '', 150);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <a href={`/blog/${post.slug}`}>
      {post.featured_image_url && (
        <img
          src={post.featured_image_url}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{truncatedDescription}</p>
        <div className="flex items-center text-gray-500 text-xs mb-4">
          {post.author_name && (
            <span className="flex items-center mr-3">
              <User className="w-3 h-3 mr-1" /> {post.author_name}
            </span>
          )}
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> {formattedDate}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories.map(category => (
            <span
              key={category.id}
              className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {category.name}
            </span>
          ))}
        </div>
        <a
          href={`/blog/${post.slug}`} // Link to individual blog post page (you might need to create this route later)
          className="inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Read More &rarr;
        </a>
      </div>
      </a>
    </div>
  );
};

// CategoryFilter Sub-component: Allows users to filter blogs by category
interface CategoryFilterProps {
  categories: BlogCategory[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-12">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          selectedCategory === null
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            selectedCategory === category.id
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

// Main BlogListPage Component
export function BlogListPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // For pagination, 0-indexed
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 9;

  const handleLoginClick = () => {
    // This navigates to an external URL, not an internal route
    window.location.href = 'https://app.sosavvy.so/login';
  };

  // Function to fetch blog posts with pagination and optional category filtering
  const fetchBlogPosts = useCallback(async (
    pageNum: number,
    categoryId: number | null,
    append: boolean = false
  ) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('blog_post')
        .select(
          `
          id,
          title,
          slug,
          content,
          description,
          featured_image_url,
          author_name,
          created_at,
          blog_post_categories!left(categories_id, blog_categories(id, name, slug))
          `
        )
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (categoryId !== null) {
        // Filter by category using the join table
        query = query.filter('blog_post_categories.categories_id', 'eq', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map the data to the BlogPost interface, flattening categories
      const fetchedPosts: BlogPost[] = data.map((post: any) => ({
        ...post,
        // Ensure categories array is always present, even if empty
        categories: post.blog_post_categories
          ? post.blog_post_categories.map((bpc: any) => bpc.blog_categories)
          : [],
      }));

      if (append) {
        setBlogPosts((prevPosts) => [...prevPosts, ...fetchedPosts]);
      } else {
        setBlogPosts(fetchedPosts);
      }

      // Determine if there are more posts to load
      setHasMore(fetchedPosts.length === POSTS_PER_PAGE);

    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [POSTS_PER_PAGE]);

  // Function to fetch all available categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    }
  }, []);

  // Effect to fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Effect to fetch blog posts when selected category or page changes
  useEffect(() => {
    setPage(0); // Reset page when category changes
    setBlogPosts([]); // Clear posts to show loading state for new category
    setHasMore(true); // Assume there are more posts for the new category
    fetchBlogPosts(0, selectedCategory, false);
  }, [selectedCategory, fetchBlogPosts]);

  // Handler for "Load More" button
  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
    fetchBlogPosts(page + 1, selectedCategory, true);
  };

  // Handler for category selection
  const handleSelectCategory = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  return (
  <div className="pb-16 bg-gray-50 min-h-screen">
    
    <nav className="px-4 py-3 flex items-center justify-between sm:px-6 sm:py-4">
        <div className="flex items-center space-x-2">

         <div className="bg-blue-600 rounded-full p-1.5 rotate-180 sm:p-2">
            <PenTool className="h-7 w-7 fill-white stroke-blue-600 sm:h-9 sm:w-9" />
          </div>
          <span className="text-2xl  font-bold text-black sm:text-2xl">SoSavvy</span>
        </div>
        
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

        
    
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Title for the Blog List Page */}
        <div className="text-center mb-16">
        <h1 className="mt-24 text-5xl font-bold text-gray-900 mb-4">
            Learn How to Build Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Brand</span> 
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Grow faster on <b>LinkedIn</b> and <b>Twitter(X)</b> with the latest tools, tips & insights.👇
          </p>
        </div>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Loading, Error, and No Posts States */}
        {loading && blogPosts.length === 0 && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 py-10">
            <AlertCircle className="w-6 h-6 inline-block mr-2" />
            {error}
          </div>
        )}

        {!loading && blogPosts.length === 0 && !error && (
          <div className="text-center text-gray-600 py-10">
            No blog posts found for this category.
          </div>
        )}

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Loading More...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
