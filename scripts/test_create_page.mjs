async function test() {
  try {
    const res = await fetch('http://localhost:3000/create');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body snippet:', text.slice(0, 1000));
  } catch (err) {
    console.error('Error fetching /create:', err);
  }
}
test();
