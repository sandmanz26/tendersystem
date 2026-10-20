# Kru: aplikasi crew lapangan (Wedding Organizer)

Mobile web untuk pekerja lapangan WO. Front-end saja: React + Vite + Tailwind v4 + shadcn/ui, dengan mock data (tersimpan di `localStorage`, bisa di-reset dari halaman Profil).

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

## Fitur

| Kebutuhan | Di mana |
|---|---|
| Banyak event dalam 1 app | Beranda: *Sedang berjalan*, *Mendatang*, *Selesai* |
| Info event | Detail event, tab **Info**: lokasi & catatan loading, rundown, catatan crew, kontak penting |
| Scan barang per fase | Detail event → **Mulai scan**, atau tab **Scan** |
| Info barang | Tab **Barang** (inventaris global) atau tab Barang di event → lokasi saat ini, kondisi, jejak scan, jadwal pemakaian, riwayat laporan |
| Lapor masalah | **Laporan → Lapor**, atau dari event |
| Lapor barang rusak/hilang | Dari scanner (tombol *Lapor*), detail barang, atau form laporan |
| Siapa saja yang terlibat | Tab **Tim**: crew internal (lead ditandai) + vendor, tombol WA/telepon |

## Riset & negative case

Lihat [`docs/riset-dan-negative-case.md`](docs/riset-dan-negative-case.md): temuan riset, fitur v0.2, dan matriks negative case.

## Alur fase & gate scan

`Muat di Gudang → Tiba di Venue → Setup & Dekor → Acara → Bongkar & Muat → Kembali di Gudang`

Fase Setup & Acara punya **checklist** yang harus lengkap. Muat di Gudang & Kembali di Gudang butuh **tanda tangan admin gudang**. Mode offline bisa dicoba dari Profil → *Simulasi tanpa sinyal*.

Fase bertanda scan (Muat, Tiba, Bongkar, Gudang) **tidak bisa dilanjutkan** sampai setiap barang di manifest event discan. Barang yang rusak/hilang bisa *dilaporkan* dari scanner. Laporan itu menggantikan scan untuk fase tersebut, jadi satu barang bermasalah tidak menahan seluruh tim, tapi tetap tercatat.

Scanner mendukung:
- **Kamera** via `BarcodeDetector` (Chrome Android). Tombol nonaktif di browser yang tidak mendukung.
- **Ketik kode** dari label (mis. `KRS-TFG-01`).
- **Scan demo**: memilih acak barang yang belum discan, untuk presentasi.

Hasil scan dibedakan: berhasil, sudah discan (duplikat), dan kode tidak terdaftar di event (salah muat).

## Struktur

```
src/
  data/        types, fase, mock data (tanggal relatif ke hari ini)
  store/       context + localStorage
  lib/         logika progress fase, format tanggal, lookup
  components/  ui/ (shadcn), shell, phase track, rows
  pages/       home, event-detail, scan, item-detail, report-*, profile
```

Komponen shadcn ada di `src/components/ui` (ditulis manual karena registry shadcn tidak bisa diakses dari environment build. API-nya sama, `components.json` sudah disiapkan untuk `npx shadcn add` berikutnya).
