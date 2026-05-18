import fetch from 'node-fetch'; // wait, node-fetch isn't necessary in Node 18+ since global fetch is available

async function test() {
  try {
    // 1. Fetch home page to get the CSS file path
    const pageRes = await fetch('http://localhost:3000/create');
    const html = await pageRes.text();
    console.log('HTML fetched successfully.');

    // Find the css file link
    const match = html.match(/href="(\/_next\/static\/css\/app\/layout\.css[^"]*)"/);
    if (!match) {
      console.log('No CSS link found in HTML!');
      return;
    }

    const cssPath = match[1];
    console.log('Found CSS path:', cssPath);

    // 2. Fetch the CSS content
    const cssRes = await fetch(`http://localhost:3000${cssPath}`);
    const cssText = await cssRes.text();
    console.log('CSS size:', cssText.length, 'bytes');
    console.log('CSS Sample (first 500 chars):', cssText.slice(0, 500));

    // Check if standard tailwind classes are present
    const hasHidden = cssText.includes('.hidden');
    const hasFlex = cssText.includes('.flex');
    const hasMdFlex = cssText.includes('md\\:flex'); // md:flex matches md\:flex in CSS

    console.log('Has .hidden class:', hasHidden);
    console.log('Has .flex class:', hasFlex);
    console.log('Has md:flex class:', hasMdFlex);

  } catch (err) {
    console.error('Error fetching CSS:', err);
  }
}

test();
