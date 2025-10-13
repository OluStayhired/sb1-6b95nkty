// Set up imports using the modern Netlify functions approach (ES Modules)
//import { createClient } from 'npm:@supabase/supabase-js';
const { createClient } = require('@supabase/supabase-js');

// --- Configuration (Pulling from Netlify Environment Variables) ---
// IMPORTANT: You MUST set these variables in your Netlify UI under Site Settings > Build & deploy > Environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Check if configuration is missing before initialization
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables are not set. The function will fail.");
}

// Initialize Supabase client outside the handler for warm starts (better performance)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

// 2. Define the Netlify Function Handler
export async function handler(event, context) {
    const requestedPath = event.path;
    const BLOG_PREFIX = '/blog/';

    console.log(`Request received for path: ${requestedPath}`);

    // Check if the path is a blog post
    if (!requestedPath.startsWith(BLOG_PREFIX) || requestedPath.length <= BLOG_PREFIX.length) {
        // Not a blog path, allow the request to pass through to the main React SPA
        return {
            statusCode: 200,
            body: 'Not a blog path.',
        };
    }

    // Extract the slug from the path (e.g., /blog/post-title/ -> post-title)
    const slug = requestedPath.substring(BLOG_PREFIX.length).split('/')[0];
    let postData = null;

    try {
        // 3. Data Fetching (Actual Supabase Query)
        const { data, error } = await supabase
            .from('blog_posts')
            .select('title, excerpt, meta_image_url')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            console.error(`Supabase error for slug ${slug}:`, error ? error.message : 'No data found');
            // If post not found, return a 404 to ensure Netlify falls back to the client-side SPA route
            return {
                statusCode: 404,
                body: 'Post data not found in Supabase.',
            };
        }
        
        postData = data;
        
    } catch (e) {
        console.error('Server error during data fetch:', e);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error.' }),
        };
    }
    
    // 4. Construct the HTML Response
    const title = postData.title;
    const description = postData.excerpt;
    const imageUrl = postData.meta_image_url;
    // Note: It's best practice to use the host from the request headers if available, 
    // but we use the hardcoded URL for reliability in this simple function.
    const currentUrl = `https://sosavvy.so${requestedPath}`; 
    
    // This is the complete, small HTML document that is served to the bot/crawler.
    // It includes the essential meta tags AND the script tag to load your React app.
    const htmlContent = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <!-- Dynamic Content -->
    <meta name="description" content="${description}" />
    <meta property="og:url" content="${currentUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
</head>
<body>
    <!-- The main React application loader remains here for client-side hydration. -->
    <div id="root"></div> 
    <!-- This script loads your main React bundle for client-side routing and rendering -->
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

    // 5. Return the full HTML
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/html",
        },
        body: htmlContent,
    };
}
