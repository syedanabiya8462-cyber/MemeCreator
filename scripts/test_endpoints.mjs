import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log('Testing /api/explore endpoint...');
  try {
    const exploreRes = await fetch('http://localhost:3000/api/explore?sortBy=trending&timeFrame=all&page=1');
    const exploreData = await exploreRes.json();
    console.log(`Explore status: ${exploreRes.status}`);
    console.log(`Fetched ${exploreData.length} memes.`);
    if (exploreData.length > 0) {
      console.log('Sample Meme:', {
        id: exploreData[0].id,
        image_url: exploreData[0].image_url,
        likes_count: exploreData[0].likes_count,
        template: exploreData[0].template?.name
      });
    }
  } catch (err) {
    console.error('Explore endpoint test failed:', err);
  }

  console.log('\nTesting /api/ai/agent endpoint...');
  try {
    const agentRes = await fetch('http://localhost:3000/api/ai/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'when my code compiles on the first try but fails in production' })
    });
    const agentData = await agentRes.json();
    console.log(`Agent status: ${agentRes.status}`);
    console.log('Agent response:', agentData);
  } catch (err) {
    console.error('Agent endpoint test failed:', err);
  }
  console.log('\nTesting /api/ai/generate-image endpoint...');
  try {
    const imageRes = await fetch('http://localhost:3000/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'writing code at 3 AM with coffee', style: 'funny' })
    });
    const imageData = await imageRes.json();
    console.log(`Image Gen status: ${imageRes.status}`);
    console.log('Image Gen response:', imageData);
  } catch (err) {
    console.error('Image Gen endpoint test failed:', err);
  }
}

test();
