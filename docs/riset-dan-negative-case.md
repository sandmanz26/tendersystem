# Riset fitur & negative case: Kru v0.2

## Temuan riset (ringkas)

| Sumber | Temuan | Diterapkan di Kru |
|---|---|---|
| Aplikasi rental event (Rentman, RentalWorks QuikScan, Sortly, InventoryCloud) | Scan setiap barang saat **keluar** dan **kembali**. Tandai barang rusak dari aplikasi, dengan foto. Ada audit trail siapa scan apa. **Tanda tangan digital** sebagai bukti serah terima. | Gate scan 4 checkpoint. Lapor rusak dari scanner + foto. Jejak scan per fase (jam + nama). Tanda tangan admin gudang saat barang keluar & kembali. |
| Praktik scanning gudang (offline-first) | Respons scan harus terasa instan (<300 ms) dan **divalidasi di perangkat**. Scan disimpan lokal **berurutan** lalu disinkron. Status sinkron harus terlihat. Jaringan tidak boleh menghambat crew. | Validasi lokal, bunyi + getar per hasil. Antrean offline dengan banner status & ikon "antre". Sinkron otomatis saat online. Mode "Simulasi tanpa sinyal" untuk latihan. |
| Aplikasi day-of wedding | Tampilan "**sekarang / berikutnya**" dari rundown, checklist per momen, kontak cadangan yang mudah dijangkau. | Kartu Sekarang/Berikutnya, checklist Setup & Acara yang menahan fase, kontak penting di tab Info. |

Catatan: sebagian besar sumber adalah halaman vendor. Gunakan sebagai referensi pola, bukan standar baku.

## Yang ditambahkan di v0.2

1. **Mode offline + antrean sinkron.** Venue sering tanpa sinyal (basement ballroom, kebun).
2. **Batalkan scan** (8 detik setelah scan), untuk salah scan.
3. **Checklist** di fase Setup & Acara. Fase tidak bisa lanjut sebelum semua dicentang.
4. **Serah terima bertanda tangan** saat Muat di Gudang & Kembali di Gudang.
5. **Lokasi barang** (di gudang / di event mana) + jadwal pemakaian barang.
6. **Tab Barang** global: cari inventaris berdasarkan nama, kode, atau rak.
7. **Sekarang / Berikutnya** dari rundown pada hari H.
8. UI baru: grouped card, segmented tabs, progress ring, floating tab bar dengan tombol Scan di tengah, font Geist.

## Matriks negative case

### Scan
| Kasus | Perilaku |
|---|---|
| Kode tidak terdaftar di inventaris | Merah + bunyi error: "Kode tidak dikenal, label mungkin rusak" + tombol Lapor |
| Format kode salah (`hello`) | "Format kode salah" + contoh format |
| Ketik huruf kecil / spasi (`krs tfc 01`) | Dinormalisasi otomatis → `KRS-TFC-01` |
| Barang milik event lain (salah muat) | Merah: "dijadwalkan untuk [event], jangan dimuat" |
| Barang **masih di event lain** (belum kembali) saat Muat | Diblokir: "belum kembali dari [event]" (double booking / label tertukar) |
| Scan ganda | Abu-abu: "sudah tercatat jam X oleh Y". Tidak dihitung dua kali |
| Lewat checkpoint (tiba di venue tapi tidak discan saat muat) | Tetap dicatat, tapi ditandai kuning, muncul di ringkasan penutupan fase |
| Barang kondisi "Perlu cek" dimuat | Kuning + catatan kondisi |
| Salah scan | Tombol **Batal** 8 detik |
| Barang hilang / rusak / kurang | Tombol Lapor per barang. Laporan menggantikan scan agar tim tidak tertahan, tapi tercatat |
| Kamera ditolak / browser tidak mendukung | Pesan jelas, input manual tetap jalan |
| Kamera tetap menyala saat keluar halaman | Stream dimatikan saat unmount / saat sheet penutupan dibuka |
| Bukan crew event tersebut | Scanner diblokir. Halaman event menampilkan banner read-only |
| Fase tanpa scan / event ditutup | Layar penjelasan + kembali ke event |
| Muat untuk event yang masih >1 hari lagi | Pengingat "pastikan event yang benar" |

### Fase
| Kasus | Perilaku |
|---|---|
| Masih ada barang belum discan | Tombol lanjut nonaktif, menampilkan "N barang lagi" |
| Checklist belum lengkap | Tombol lanjut nonaktif |
| Serah terima tanpa nama / tanda tangan | Tombol nonaktif. Titik/tap kecil tidak dianggap tanda tangan |
| Tombol basi (data berubah, double tap) | Gate dicek ulang di store. Kalau gagal → toast, fase tidak berubah |
| Fase yang sudah ditutup | Tidak bisa dibuka ulang dari aplikasi (dikonfirmasi sebelum menutup) |

### Laporan
| Kasus | Perilaku |
|---|---|
| Field wajib kosong | Ditandai merah per field + toast |
| Deskripsi terlalu pendek / panjang | Min 10, maks 500 karakter, dengan penghitung |
| Barang sama sudah dilaporkan di fase ini | Info + tautan ke laporan lama (hindari duplikat) |
| File bukan gambar / >15 MB / gagal dibaca | Ditolak dengan pesan per file |
| Lebih dari 4 foto | Sisanya ditolak dengan pesan |
| Kirim dua kali | Tombol dikunci saat submit |
| Keluar saat form terisi | Dialog "Buang laporan ini?" + peringatan saat reload / tutup tab |
| Offline | Laporan disimpan & dikirim otomatis, label "antre" |
| Event sudah ditutup | Tetap bisa lapor untuk riwayat, dengan keterangan |
| Urgensi tinggi | Tombol telepon langsung ke koordinator |
| Update di laporan yang sudah selesai | Membuka ulang laporan ke status Diproses |

### Sistem
| Kasus | Perilaku |
|---|---|
| Penyimpanan browser penuh (foto) | Toast peringatan, aplikasi tetap jalan di memori |
| Data tersimpan korup | Fallback ke data awal |
| Keluar / reset saat ada data belum terkirim | Diperingatkan dulu |
| Pengguna dengan reduced motion | Animasi dimatikan |

## Belum dikerjakan (butuh backend)
- Konflik multi-device (dua crew scan barang yang sama bersamaan): perlu server sebagai sumber kebenaran.
- Login, peran (crew vs koordinator), dan approval laporan oleh koordinator.
- Notifikasi push saat laporan dibalas.
- Hitung jumlah per unit (mis. 36 gelas per krat) saat bongkar, dan cetak label QR dari aplikasi.
