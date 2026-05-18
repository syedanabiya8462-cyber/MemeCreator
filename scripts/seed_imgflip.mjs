import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.replace(/\\n/gm, '\n');
    }
    value = value.replace(/(^['"]|['"]$)/g, '').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Fetching top 100 templates from Imgflip API...');
  
  try {
    const response = await fetch('https://api.imgflip.com/get_memes');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch from Imgflip');
    }

    const imgflipMemes = data.data.memes;
    console.log(`Fetched ${imgflipMemes.length} templates. Preparing to insert...`);

    const templates = imgflipMemes.map(meme => ({
      name: meme.name,
      image_url: meme.url,
      category: 'Reaction', // default category
      tags: [meme.name.toLowerCase().split(' ').join('_')],
      usage_count: Math.floor(Math.random() * 100000), // Mock usage count
      is_custom: false
    }));

    const { data: tData, error: tError } = await supabase.from('templates').insert(templates).select();
    
    if (tError) {
      console.error('Template insert error:', tError);
      return;
    }
    console.log(`Successfully inserted ${tData.length} templates.`);

    // Also seed some trending memes based on these templates
    console.log('Seeding memes for trending...');
    const userId = '00000000-0000-0000-0000-000000000001';

    // Mock captions for generic templates
    const mockCaptions = [
      { top: "When you finally fix the bug", bottom: "But create 10 new ones" },
      { top: "What I think I do", bottom: "What I actually do" },
      { top: "Me looking at my bank account", bottom: "After buying coffee every day" },
      { top: "Nobody:", bottom: "Me explaining lore at 3AM" },
      { top: "How it started", bottom: "How it's going" }
    ];

    const trendingMemes = tData.slice(0, 20).map((template, index) => {
      const caption = mockCaptions[index % mockCaptions.length];
      return {
        user_id: userId,
        image_url: template.image_url,
        template_id: template.id,
        caption_top: caption.top,
        caption_bottom: caption.bottom,
        is_public: true,
        is_ai_generated: false,
        likes_count: Math.floor(Math.random() * 50000) + 1000,
        comments_count: Math.floor(Math.random() * 1000) + 10,
        shares_count: Math.floor(Math.random() * 500) + 5
      };
    });

    const { data: mData, error: mError } = await supabase.from('memes').insert(trendingMemes);
    if (mError) {
      console.error('Meme insert error:', mError);
    } else {
      console.log(`Successfully inserted ${trendingMemes.length} trending memes.`);
    }

  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed().catch(console.error);
