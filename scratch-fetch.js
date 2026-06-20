async function test() {
  const apiUrl = 'https://script.google.com/macros/s/AKfycbzQvB33TCwNhn2acs6XmQo_tWEma8Lyrg_D5OVcBJjdK8P3p3JUADC0Ab62hVRXkalG5Q/exec';
  try {
    const res = await fetch(`${apiUrl}?action=getActivities&periode=2026-06-21`);
    const data = await res.json();
    console.log('Activities for 2026-06-21:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error fetching activities:', e);
  }
}

test();
