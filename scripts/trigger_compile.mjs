async function test() {
  try {
    console.log('Sending request to /create to trigger compilation...');
    const res = await fetch('http://localhost:3000/create');
    console.log('Response status:', res.status);
  } catch (err) {
    console.error('Error triggering compilation:', err);
  }
}
test();
