import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import he from 'he';
import CustomBlog from './models/customBlog.js';

dotenv.config({ path: path.resolve('src/Backend/.env') });

const XML_PATH = 'C:/Users/ZulqarnainHafeez/Downloads/Posts-Export-2026-April-23-0517.xml';

async function migrate() {
  try {
    console.log('--- Starting Enhanced Migration ---');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Read XML
    const xmlData = fs.readFileSync(XML_PATH, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);
    
    const posts = result.data.post;
    const postsArray = Array.isArray(posts) ? posts : [posts];
    console.log(`Processing ${postsArray.length} posts...`);

    let importedCount = 0;

    for (const p of postsArray) {
      let rawContent = p.Content || '';
      
      // 1. SMART IMAGE REPLACEMENT
      // Get all URLs and Titles from the pipe-separated strings
      const imageUrls = (p.ImageURL || '').split('|');
      const imageFeatured = p.ImageFeatured || '';

      // Replace [vc_single_image image="ID" ...] with actual tags
      // Since map ID to URL is hard, we'll try to find images in the content or use the featured image if one exists
      let cleanedContent = rawContent;
      
      // Replace [vc_single_image] with the first useful image if we can find one
      // If we can't find specific ones, we'll just ensure HTML is decoded
      cleanedContent = cleanedContent.replace(/\[vc_single_image[^\]]+\]/gi, () => {
        // Here we can try to inject an image from the list if available
        return `<div class="content-image-wrapper"><img src="${imageFeatured}" class="blog-internal-image" /></div>`;
      });

      // Strip other WP shortcodes but KEEP HTML
      cleanedContent = cleanedContent.replace(/\[\/?(vc_|wgl_|rs_)[^\]]*\]/gi, '');
      
      // Decode HTML entities
      cleanedContent = he.decode(cleanedContent);

      // Fix specific itcs.com.pk links to be absolute if they are relative
      cleanedContent = cleanedContent.replace(/href="\//g, 'href="https://itcs.com.pk/');

      // 2. Prepare Blog Data
      const blogData = {
        title: p.Title || 'Untitled Blog',
        slug: p.Slug || `imported-${p.ID}`,
        excerpt: p.Excerpt || (cleanedContent.substring(0, 200).replace(/<[^>]*>/g, '') + '...'),
        coverImage: imageFeatured,
        coverImageCaption: p.ImageCaption || '',
        author: p.AuthorUsername || 'ITCS Admin',
        tags: (p.Tags || '').split('|').filter(t => t),
        status: (p.Status === 'publish') ? 'published' : 'draft',
        createdAt: p.Date ? new Date(p.Date) : new Date(),
        publishedAt: p.Date ? new Date(p.Date) : new Date(),
        sections: [
          {
            id: `section-${Date.now()}-${p.ID}`,
            layout: "1",
            columns: [
              {
                id: `column-${Date.now()}-${p.ID}`,
                widgets: [
                  {
                    id: `widget-${Date.now()}-${p.ID}`,
                    type: 'text',
                    settings: {
                      content: cleanedContent,
                      align: 'left',
                      color: '#cecece',
                      fontSize: 18,
                    }
                  }
                ]
              }
            ]
          }
        ]
      };

      // 3. Upsert into DB
      await CustomBlog.findOneAndUpdate(
        { slug: blogData.slug },
        blogData,
        { upsert: true, new: true }
      );

      importedCount++;
      if (importedCount % 20 === 0) console.log(`Processed ${importedCount}...`);
    }

    console.log(`--- Enhanced Migration Complete! ---`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
