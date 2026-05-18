async function test() {
  try {
    const res = await fetch('http://localhost:3000/_next/static/css/app/layout.css');
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Body start:', text.slice(0, 300));
  } catch (err) {
    console.error('Error fetching directly:', err);
  }
}
test();
