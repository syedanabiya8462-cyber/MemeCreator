import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding templates...');
  const templates = [
    {
      name: 'Distracted Boyfriend',
      image_url: 'https://i.imgflip.com/1ur9b0.jpg',
      category: 'Relationships',
      tags: ['distracted', 'boyfriend', 'girlfriend', 'jealous'],
      usage_count: 15000,
      is_custom: false
    },
    {
      name: 'Drake Hotline Bling',
      image_url: 'https://i.imgflip.com/30b1gx.jpg',
      category: 'Reaction',
      tags: ['drake', 'reject', 'accept', 'prefer'],
      usage_count: 20000,
      is_custom: false
    },
    {
      name: 'Two Buttons',
      image_url: 'https://i.imgflip.com/1g8my4.jpg',
      category: 'Work',
      tags: ['buttons', 'choice', 'dilemma', 'sweating'],
      usage_count: 12000,
      is_custom: false
    },
    {
      name: 'Change My Mind',
      image_url: 'https://i.imgflip.com/24y43o.jpg',
      category: 'Classic',
      tags: ['crowder', 'change my mind', 'debate'],
      usage_count: 18000,
      is_custom: false
    },
    {
      name: 'Expanding Brain',
      image_url: 'https://i.imgflip.com/1jwhww.jpg',
      category: 'Gaming',
      tags: ['brain', 'smart', 'dumb', 'expanding'],
      usage_count: 9000,
      is_custom: false
    },
    {
      name: 'Batman Slapping Robin',
      image_url: 'https://i.imgflip.com/9ehk.jpg',
      category: 'Action',
      tags: ['batman', 'slap', 'robin', 'shut up'],
      usage_count: 5000,
      is_custom: false
    }
  ];

  const { data: tData, error: tError } = await supabase.from('templates').insert(templates).select();
  if (tError) {
    console.error('Template error:', tError);
  } else {
    console.log(`Inserted ${tData.length} templates.`);
  }

  console.log('Seeding memes for trending...');
  
  // Get an existing user or insert a dummy one
  const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
  let userId;
  if (users && users.length > 0) {
    userId = users[0].id;
  } else {
    console.log('Creating a dummy user for the memes...');
    // We cannot create auth users purely from SQL usually without raw queries, 
    // but maybe we can insert a dummy ID into public.users if RLS allows it (Service role bypasses RLS)
    userId = '00000000-0000-0000-0000-000000000001';
    await supabase.from('users').insert({
      id: userId,
      email: 'trending@example.com',
      username: 'trending_memer',
      display_name: 'Trending Memer'
    });
  }

  const memes = [
    {
      user_id: userId,
      image_url: 'https://i.imgflip.com/1ur9b0.jpg', // Placeholder for actual meme images
      template_id: tData?.[0]?.id || null,
      caption_top: 'Me trying to write clean code',
      caption_bottom: 'A quick and dirty hack',
      is_public: true,
      is_ai_generated: false,
      likes_count: 45000,
      comments_count: 1200,
      shares_count: 500
    },
    {
      user_id: userId,
      image_url: 'https://i.imgflip.com/30b1gx.jpg',
      template_id: tData?.[1]?.id || null,
      caption_top: 'Reading documentation',
      caption_bottom: 'Stack Overflow copy paste',
      is_public: true,
      is_ai_generated: false,
      likes_count: 32000,
      comments_count: 800,
      shares_count: 300
    },
    {
      user_id: userId,
      image_url: 'https://i.imgflip.com/1g8my4.jpg',
      template_id: tData?.[2]?.id || null,
      caption_top: 'Use React',
      caption_bottom: 'Use Vue',
      is_public: true,
      is_ai_generated: false,
      likes_count: 28000,
      comments_count: 950,
      shares_count: 420
    }
  ];

  const { data: mData, error: mError } = await supabase.from('memes').insert(memes);
  if (mError) {
    console.error('Meme error:', mError);
  } else {
    console.log('Inserted memes for trending.');
  }
}

seed().catch(console.error);
