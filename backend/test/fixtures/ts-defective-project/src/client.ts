export async function fetchNonexistentData() {
  const res = await fetch('/api/missing-reports');
  return res.json();
}
