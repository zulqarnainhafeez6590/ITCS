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
    console.log('--- Starting Migration ---');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Read XML
    const xmlData = fs.readFileSync(XML_PATH, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlData);
    
    const posts = result.data.post;
    console.log(`Found ${Array.isArray(posts) ? posts.length : 1} posts to process`);

    const postsArray = Array.isArray(posts) ? posts : [posts];
    let importedCount = 0;

    for (const p of postsArray) {
      // 1. Clean Content (Strip WP Shortcodes)
      let rawContent = p.Content || '';
      // Remove [vc_...], [wgl_...], [/vc_...], etc.
      let cleanedContent = rawContent.replace(/\[\/?(vc_|wgl_|rs_)[^\]]*\]/gi, '');
      // Decode HTML entities
      cleanedContent = he.decode(cleanedContent);
      // Remove excess empty p tags from cleaning
      cleanedContent = cleanedContent.replace(/<p>\s*<\/p>/g, '');

      // 2. Prepare Blog Data
      const blogData = {
        title: p.Title || 'Untitled Blog',
        slug: p.Slug || `imported-${p.ID || Date.now()}`,
        excerpt: p.Excerpt || (cleanedContent.substring(0, 160).replace(/<[^>]*>/g, '') + '...'),
        coverImage: p.ImageFeatured || '',
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
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: 400,
                      lineHeight: 1.7,
                      letterSpacing: 0
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
      if (importedCount % 10 === 0) console.log(`Processed ${importedCount} posts...`);
    }

    console.log(`--- Migration Complete! Imported ${importedCount} blogs ---`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
