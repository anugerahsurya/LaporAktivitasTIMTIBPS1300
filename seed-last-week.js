async function seed() {
  const apiUrl = 'https://script.google.com/macros/s/AKfycbzQvB33TCwNhn2acs6XmQo_tWEma8Lyrg_D5OVcBJjdK8P3p3JUADC0Ab62hVRXkalG5Q/exec';

  const dataToSeed = [
    {
      pegawai_id: '2',
      pegawai_nama: 'Tri Hayuni Syardi',
      activities: [
        { kegiatan: '', target: 'Piket Sibeken' },
        { kegiatan: '', target: 'Piket Ngibar SE' }
      ]
    },
    {
      pegawai_id: '8',
      pegawai_nama: 'M. Hafiz Al Ihsan',
      activities: [
        { kegiatan: '', target: 'Pengumpulan Bukti Dukung ISO' }
      ]
    },
    {
      pegawai_id: '9',
      pegawai_nama: 'Giani Jovita Jane',
      activities: [
        { kegiatan: '', target: 'Piket Ngibar SE' }
      ]
    },
    {
      pegawai_id: '5',
      pegawai_nama: 'Hardini Juliarti',
      activities: [
        { kegiatan: '', target: 'Piket Sibeken' },
        { kegiatan: '', target: 'Pengolahan Data Sakernas' },
        { kegiatan: '', target: 'Pengolahan Data Ubinan KSA' }
      ]
    },
    {
      pegawai_id: '1',
      pegawai_nama: 'Ihsan Pratama',
      activities: [
        { kegiatan: '', target: 'Piket Ngibar SE' }
      ]
    },
    {
      pegawai_id: '10',
      pegawai_nama: 'Anugerah Surya Atmaja',
      activities: [
        { kegiatan: '', target: 'Piket Sibeken' },
        { kegiatan: '', target: 'Piket Ngibar SE' }
      ]
    },
    {
      pegawai_id: '4',
      pegawai_nama: 'Benny Firmansyah',
      activities: [
        { kegiatan: '', target: 'Supporting Fasih SE2026' },
        { kegiatan: '', target: 'Piket Sibeken' }
      ]
    }
  ];

  for (const item of dataToSeed) {
    const payload = {
      action: 'addActivity',
      periode: '2026-06-14',
      pegawai_id: item.pegawai_id,
      pegawai_nama: item.pegawai_nama,
      activities: item.activities,
      kehadiran: 'Hadir'
    };

    console.log(`Seeding data for ${item.pegawai_nama}...`);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      console.log(`Result for ${item.pegawai_nama}:`, resData);
    } catch (e) {
      console.error(`Failed seeding data for ${item.pegawai_nama}:`, e);
    }
  }
}

seed();
