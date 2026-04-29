const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber,
  TabStopType, TabStopPosition, PageBreak
} = require('docx');
const fs = require('fs');

// ─── Color Palette (same as Domain I reference) ───────────────────────────────
const C = {
  darkBlue:  "1A3C5E",
  blue:      "2E75B6",
  deepBlue:  "1F4D78",
  lightBlue: "D6E4F0",
  infoBg:    "EBF5FB",
  infoBorder:"2E75B6",
  warnBg:    "FEF9E7",
  warnBorder:"F39C12",
  tipBg:     "EAFAF1",
  tipBorder: "27AE60",
  headerBg:  "1A3C5E",
  rowAlt:    "F2F7FB",
  gray:      "404040",
  white:     "FFFFFF",
  // Modul IV accent — warm terracotta/orange matching the photo slide
  modul4Bg:  "8B2500",
  modul4Light:"FAE5DC",
  modul4Border:"C0392B",
};

// ─── Borders ──────────────────────────────────────────────────────────────────
const thinBorder = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 4, color });
const noBorder   = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const tableBorders = (color = "BDC3C7") => ({
  top: thinBorder(color), bottom: thinBorder(color),
  left: thinBorder(color), right: thinBorder(color),
  insideH: thinBorder(color), insideV: thinBorder(color)
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sp(before = 0, after = 0) { return { before, after }; }

function run(text, opts = {}) {
  return new TextRun({ text, font: "Arial", size: opts.size || 22, bold: opts.bold || false, color: opts.color || C.gray, ...opts });
}

function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    spacing: opts.spacing || sp(0, 120),
    alignment: opts.alignment || AlignmentType.LEFT,
    ...opts
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: C.darkBlue })],
    spacing: sp(320, 160),
    pageBreakBefore: true,
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: C.blue })],
    spacing: sp(200, 100),
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: C.deepBlue })],
    spacing: sp(160, 80),
  });
}

function bodyText(text) {
  return para([run(text, { size: 22, color: "333333" })], { spacing: sp(0, 120) });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [run(text, { size: 22, color: "333333" })],
    spacing: sp(0, 80),
  });
}

function emptyPara(before = 0, after = 0) {
  return para([run("")], { spacing: sp(before, after) });
}

// ─── Info / Warn / Tip Boxes ──────────────────────────────────────────────────
function makeBox(labelText, items, borderColor, bgColor, labelColor) {
  const cellBorders = {
    top:    { style: BorderStyle.SINGLE, size: 8,  color: borderColor },
    bottom: thinBorder(borderColor),
    left:   { style: BorderStyle.SINGLE, size: 16, color: borderColor },
    right:  thinBorder(borderColor),
  };
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [new TableRow({
      children: [new TableCell({
        borders: cellBorders,
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        width: { size: 9026, type: WidthType.DXA },
        children: [
          para([run(labelText, { bold: true, size: 22, color: labelColor })], { spacing: sp(0, 80) }),
          ...items.map(t => new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            children: [run(t, { size: 22, color: "333333" })],
            spacing: sp(0, 60),
          }))
        ]
      })]
    })]
  });
}

function infoBox(label, items) { return makeBox(label, items, C.infoBorder, C.infoBg, C.deepBlue); }
function warnBox(label, items) { return makeBox(label, items, "E67E22", C.warnBg, "7D6608"); }
function tipBox(label, items)  { return makeBox(label, items, "27AE60", C.tipBg, "145A32"); }

// ─── Data Table ───────────────────────────────────────────────────────────────
function dataTable(headers, rows_data, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      shading: { fill: C.headerBg, type: ShadingType.CLEAR },
      borders: tableBorders(C.darkBlue),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colWidths[i], type: WidthType.DXA },
      children: [para([run(h, { bold: true, size: 20, color: C.white })], { spacing: sp(0, 0) })]
    }))
  });
  const dataRows = rows_data.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      shading: { fill: ri % 2 === 0 ? C.white : C.rowAlt, type: ShadingType.CLEAR },
      borders: tableBorders(),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colWidths[ci], type: WidthType.DXA },
      children: [para([run(cell, { size: 20, color: ci === 0 ? C.darkBlue : "333333", bold: ci === 0 })], { spacing: sp(0, 0) })]
    }))
  }));
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ─── Cover Page ───────────────────────────────────────────────────────────────
function coverPage() {
  return [
    emptyPara(2880, 0),
    para([run("MATERI PERSIAPAN TES KNMP", { bold: true, size: 56, color: C.darkBlue })],
      { alignment: AlignmentType.CENTER, spacing: sp(0, 120) }),
    para([run("(Kompetensi Nelayan Menengah Perikanan)", { size: 28, color: C.deepBlue })],
      { alignment: AlignmentType.CENTER, spacing: sp(0, 400) }),
    new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [9026],
      rows: [new TableRow({
        children: [new TableCell({
          shading: { fill: C.modul4Bg, type: ShadingType.CLEAR },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          margins: { top: 240, bottom: 240, left: 360, right: 360 },
          width: { size: 9026, type: WidthType.DXA },
          children: [
            para([run("🌊  MODUL IV: PEMBERDAYAAN MASYARAKAT NELAYAN & PESISIR", { bold: true, size: 28, color: C.white })],
              { alignment: AlignmentType.CENTER, spacing: sp(0, 80) }),
            para([run("Peningkatan kapasitas, kesejahteraan, dan partisipasi komunitas kelautan  |  Bobot: 18%", { size: 22, color: "FAC8B5" })],
              { alignment: AlignmentType.CENTER, spacing: sp(0, 0) }),
          ]
        })]
      })]
    }),
    emptyPara(400, 0),
    para([run("Pemerintah Indonesia", { size: 22, color: C.deepBlue })],
      { alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── TOC ─────────────────────────────────────────────────────────────────────
function tocPage() {
  const tocItems = [
    "BAB 1: Pengembangan Kapasitas SDM",
    "BAB 2: Sosial Ekonomi Masyarakat Pesisir",
    "BAB 3: Pengelolaan Berbasis Komunitas",
    "BAB 4: Pengembangan Ekonomi Pesisir",
    "BAB 5: Ringkasan & Soal Latihan",
  ];
  return [
    para([run("DAFTAR ISI", { bold: true, size: 32, color: C.darkBlue })],
      { alignment: AlignmentType.CENTER, spacing: sp(0, 240) }),
    ...tocItems.map(item => new Paragraph({
      numbering: { reference: "numbers", level: 0 },
      children: [run(item, { size: 24, color: C.deepBlue })],
      spacing: sp(60, 60),
    })),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 1: PENGEMBANGAN KAPASITAS SDM
// ═══════════════════════════════════════════════════════════════════════════════
function bab1() {
  return [
    heading1("BAB 1: PENGEMBANGAN KAPASITAS SDM"),
    bodyText(
      "Pengembangan kapasitas sumber daya manusia (SDM) nelayan merupakan pilar utama pemberdayaan " +
      "masyarakat pesisir. Peningkatan keterampilan teknis, literasi keuangan, dan penguatan " +
      "kelembagaan kelompok nelayan secara langsung berdampak pada produktivitas, pendapatan, " +
      "dan ketahanan sosial komunitas kelautan Indonesia."
    ),
    emptyPara(),

    heading2("1.1 Pelatihan Teknis Nelayan dan Pembudidaya"),
    bodyText(
      "Pelatihan teknis adalah program terstruktur yang meningkatkan keterampilan operasional " +
      "nelayan dalam kegiatan penangkapan, budi daya, penanganan pasca-panen, dan keselamatan " +
      "kerja di laut. Pelatihan diselenggarakan oleh KKP melalui Unit Pelaksana Teknis (UPT) " +
      "dan Balai Pelatihan dan Penyuluhan Perikanan (BPPP)."
    ),
    emptyPara(0, 80),
    heading3("Jenis-Jenis Pelatihan Teknis KKP"),
    dataTable(
      ["Jenis Pelatihan", "Materi Utama", "Sasaran Peserta", "Penyelenggara"],
      [
        ["Penangkapan Ikan Modern", "Penggunaan GPS, fish finder, setting alat tangkap selektif, navigasi", "Nelayan kapal 5–30 GT", "BPPP KKP / Dinas DKP"],
        ["Budi Daya Perikanan", "Teknik pembesaran udang, bandeng, kerapu; manajemen kualitas air", "Pembudidaya tambak & KJA", "BPPP / BBI / BBIS"],
        ["Keselamatan di Laut (BST)", "Basic Safety Training: P3K, penggunaan life jacket, EPIRB, sinyal distress", "Seluruh ABK kapal perikanan", "BKI / Syahbandar"],
        ["Penanganan Pasca-Panen", "Rantai dingin, pengemasan, sanitasi, grade mutu ikan", "Nelayan & bakul ikan (ponggawa)", "BPPP / BKIPM"],
        ["Pengoperasian Mesin Kapal", "Perawatan mesin diesel, penanganan kerusakan di laut, logistik BBM", "Masinis / Juru mesin kapal", "BPPP / BP2IP"],
        ["Sertifikasi Kompetensi", "Ahli Nautika Kapal Penangkap Ikan (ANKAPIN), ATKAPIN", "Nakhoda & Mualim kapal > 35 GT", "BP2IP / SMK Pelayaran"],
      ],
      [2200, 3200, 1800, 1826]
    ),
    emptyPara(0, 120),
    infoBox(
      "💡 Program Pelatihan Unggulan KKP — Wajib Diketahui",
      [
        "BPPP (Balai Pelatihan dan Penyuluhan Perikanan): 12 unit di seluruh Indonesia, menerima peserta nelayan gratis.",
        "Sertifikasi ANKAPIN I-III: wajib bagi nakhoda kapal penangkap ikan > 35 GT; dikeluarkan BP2IP.",
        "Program Kartu Prakerja: nelayan dapat mengakses pelatihan digital, budidaya, dan pengolahan ikan secara online.",
        "Pelatihan Aquaculture berbasis Biosecurity: khusus pembudidaya udang vaname mencegah penyakit EMS/AHPND.",
      ]
    ),
    emptyPara(0, 120),

    heading2("1.2 Pendidikan Vokasi dan Literasi Keuangan"),
    bodyText(
      "Pendidikan vokasi menyiapkan generasi nelayan muda dengan kompetensi teknis dan manajerial " +
      "yang relevan dengan kebutuhan industri perikanan modern. Literasi keuangan yang rendah " +
      "menjadi salah satu penyebab utama kemiskinan kronis di komunitas nelayan pesisir."
    ),
    emptyPara(0, 80),
    heading3("Jalur Pendidikan Vokasi Perikanan"),
    dataTable(
      ["Jalur Pendidikan", "Institusi", "Durasi", "Kompetensi yang Diperoleh"],
      [
        ["SMK Perikanan dan Kelautan", "Kemendikbud / Pemprov", "3 tahun", "Teknologi budidaya, nautika, pengolahan ikan"],
        ["Politeknik KP (Kelautan-Perikanan)", "KKP", "4 tahun (D-IV)", "Teknologi penangkapan, budi daya, pengolahan modern"],
        ["Satuan Pendidikan Non-Formal", "BPPP / LKP terakreditasi", "1–6 bulan", "Sertifikasi kompetensi spesifik (BST, ANKAPIN)"],
        ["Sekolah Usaha Perikanan Menengah (SUPM)", "KKP", "3 tahun", "Nautika & teknik kapal penangkap ikan (setara SMK)"],
      ],
      [2400, 2400, 1200, 3026]
    ),
    emptyPara(0, 80),
    heading3("Materi Literasi Keuangan untuk Nelayan"),
    dataTable(
      ["Topik Literasi Keuangan", "Isi Materi", "Manfaat Langsung"],
      [
        ["Pencatatan Keuangan Sederhana", "Buku kas harian, laporan trip, buku piutang", "Mengetahui laba/rugi nyata per trip"],
        ["Menabung & Berinvestasi", "Tabungan di bank / koperasi, deposito, reksa dana sederhana", "Dana darurat, persiapan off-season"],
        ["Akses Kredit Formal", "Cara mengajukan KUR, LPMUKP, syarat dokumen, menghitung cicilan", "Terhindar dari rentenir/lintah darat"],
        ["Asuransi Nelayan (BPAN)", "Cara mendaftar, manfaat santunan, klaim asuransi", "Perlindungan finansial jika kecelakaan"],
        ["Perencanaan Keuangan Keluarga", "Budgeting bulanan, prioritas pengeluaran, dana pendidikan anak", "Stabilitas ekonomi rumah tangga"],
      ],
      [2400, 3200, 3426]
    ),
    emptyPara(0, 120),
    warnBox(
      "⚠️ Masalah Literasi Keuangan Umum di Komunitas Nelayan",
      [
        "Ketergantungan pada 'ponggawa/toke' (tengkulak) yang memberi modal dengan bunga terselubung hingga 30% per musim.",
        "Tidak memisahkan keuangan usaha dengan kebutuhan rumah tangga, sehingga modal habis tidak terasa.",
        "Absen dari program tabungan & asuransi formal karena tidak memiliki KTP/rekening bank yang aktif.",
        "Perilaku konsumtif saat musim panen ikan berlimpah, tanpa cadangan untuk musim paceklik.",
      ]
    ),
    emptyPara(0, 120),

    heading2("1.3 Penyuluhan Perikanan dan Adopsi Teknologi"),
    bodyText(
      "Penyuluhan perikanan adalah kegiatan pendampingan terstruktur oleh Penyuluh Perikanan " +
      "untuk meningkatkan pengetahuan, keterampilan, dan sikap nelayan dalam mengadopsi " +
      "inovasi teknologi dan praktik perikanan yang lebih efisien dan lestari."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Jenis Teknologi", "Deskripsi", "Manfaat untuk Nelayan"],
      [
        ["Fish Finder / Sonar", "Alat deteksi keberadaan dan kedalaman gerombolan ikan secara elektronik", "Hemat BBM, trip lebih produktif, tangkap lebih akurat"],
        ["GPS & Chartplotter", "Navigasi presisi, perekaman daerah penangkapan (fishing ground)", "Keamanan navigasi, peta fishing ground pribadi"],
        ["Aplikasi Laut Nusantara (KKP)", "Prakiraan cuaca, potensi ikan, harga pasar, info SPBN real-time di HP", "Keputusan melaut lebih aman dan efisien"],
        ["Alat Tangkap Selektif", "Bubu, pancing, gill net mesh-size standar — mengurangi bycatch", "Menjaga stok ikan, mematuhi regulasi KKP"],
        ["Mesin Pendingin (Cold Box / IFO)", "Pendinginan ikan di atas kapal dengan es kering atau blast freezer portable", "Mutu ikan terjaga, harga jual lebih tinggi"],
        ["Solar Cell / Energi Terbarukan", "Panel surya untuk penerangan kapal, charging GPS, lampu pemikat ikan", "Hemat BBM, ramah lingkungan, operasi lebih lama"],
      ],
      [2200, 3400, 3426]
    ),
    emptyPara(0, 120),

    heading2("1.4 Penguatan Kelompok Usaha Bersama (KUB)"),
    bodyText(
      "Kelompok Usaha Bersama (KUB) adalah wadah kerjasama nelayan yang dibentuk secara sukarela " +
      "untuk meningkatkan produktivitas, akses modal, dan posisi tawar bersama. KUB menjadi unit " +
      "sasaran program bantuan pemerintah dan pendampingan penyuluh perikanan."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Aspek KUB", "Ketentuan / Isi"],
      [
        ["Dasar Hukum", "Permen KP No. 14/2012 tentang Usaha Perikanan Tangkap; Permen KP No. 18/2016 tentang Jaminan Perlindungan"],
        ["Jumlah Anggota", "Minimal 10 orang nelayan per KUB; dapat berkembang menjadi koperasi"],
        ["Pengurus", "Ketua, Sekretaris, Bendahara — dipilih demokratis oleh anggota"],
        ["Kegiatan Utama", "Pengajuan bantuan kapal/alat tangkap, pembelian solar bersama, pemasaran kolektif"],
        ["Syarat Menerima Bantuan", "KUB terdaftar di Dinas DKP, memiliki KUSUKA, rekening KUB aktif, laporan kegiatan rutin"],
        ["Bantuan yang Dapat Diakses", "Bantuan kapal fiber 3 GT, mesin tempel, alat tangkap ramah lingkungan, GPS, life jacket"],
      ],
      [2800, 6226]
    ),
    emptyPara(0, 120),
    tipBox(
      "✅ Langkah Mendirikan dan Mendaftarkan KUB",
      [
        "Kumpulkan minimal 10 nelayan yang memiliki KTP, KK, dan Kartu Nelayan (KUSUKA) aktif.",
        "Buat Berita Acara pembentukan KUB, pilih pengurus, dan susun AD/ART sederhana.",
        "Daftarkan KUB ke Dinas Kelautan dan Perikanan Kabupaten/Kota setempat.",
        "Buka rekening bank atas nama KUB (bukan pribadi) sebagai syarat penerima bantuan pemerintah.",
        "Lakukan pertemuan rutin minimal sebulan sekali dan buat notulen sebagai bukti keaktifan KUB.",
      ]
    ),
    emptyPara(0, 120),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 2: SOSIAL EKONOMI MASYARAKAT PESISIR
// ═══════════════════════════════════════════════════════════════════════════════
function bab2() {
  return [
    heading1("BAB 2: SOSIAL EKONOMI MASYARAKAT PESISIR"),
    bodyText(
      "Kondisi sosial ekonomi masyarakat pesisir di Indonesia ditandai oleh tingginya angka kemiskinan, " +
      "kerentanan terhadap guncangan ekonomi dan bencana alam, serta keterbatasan akses layanan " +
      "publik. Pemahaman mendalam tentang dinamika sosial ekonomi pesisir menjadi dasar perumusan " +
      "kebijakan dan program pemberdayaan yang tepat sasaran."
    ),
    emptyPara(),

    heading2("2.1 Profil Kemiskinan dan Kerentanan Nelayan"),
    bodyText(
      "Masyarakat nelayan merupakan salah satu kelompok paling rentan terhadap kemiskinan di " +
      "Indonesia. Data BPS menunjukkan bahwa sekitar 25% dari 12.400 desa pesisir di Indonesia " +
      "masih tergolong desa tertinggal. Kemiskinan nelayan bersifat multidimensional dan " +
      "dipengaruhi oleh faktor alam, struktural, dan kultural."
    ),
    emptyPara(0, 80),
    heading3("Faktor Penyebab Kemiskinan Nelayan"),
    dataTable(
      ["Faktor", "Penyebab Spesifik", "Dampak"],
      [
        ["Ketergantungan Musim", "Musim paceklik (angin barat/timur) 3–4 bulan/tahun tanpa penghasilan alternatif", "Utang menumpuk, anak putus sekolah"],
        ["Fluktuasi Harga Ikan", "Harga ikan sangat bergantung musim, cuaca, dan oversupply lokal tanpa cold storage", "Pendapatan tidak stabil dan tidak dapat diprediksi"],
        ["Ketergantungan pada Ponggawa", "Pengepul merangkap pemberi modal; nelayan terikat jual ke ponggawa dengan harga rendah", "Margin nelayan sangat kecil, sulit keluar dari siklus kemiskinan"],
        ["Akses Terbatas Layanan Sosial", "Jarak dari pusat kota, minimnya PAUD, puskesmas, dan sekolah menengah di pulau terpencil", "Kualitas SDM rendah, tingginya buta huruf"],
        ["Bencana dan Perubahan Iklim", "Badai, gelombang tinggi, abrasi pantai, bleaching karang merusak fishing ground", "Kehilangan kapal/alat tangkap, pergeseran fishing ground"],
        ["Keterbatasan Aset Produktif", "Kapal, alat tangkap, dan lahan tambak tidak dimiliki — hanya buruh (pandega)", "Tidak punya agunan untuk kredit; tereksklusi dari bantuan modal"],
      ],
      [2200, 3600, 3226]
    ),
    emptyPara(0, 80),
    infoBox(
      "💡 Indikator Kemiskinan Multidimensi Masyarakat Nelayan (Data KKP & BPS)",
      [
        "Pendapatan: rata-rata nelayan kecil Rp 1,5–2,5 juta/bulan (di bawah UMK sebagian besar daerah).",
        "Pendidikan: 60% kepala keluarga nelayan hanya tamat SD; 15% tidak tamat SD (BPS 2023).",
        "Kesehatan: prevalensi stunting di desa pesisir tertinggal mencapai 35–42% (di atas rata-rata nasional 21,6%).",
        "Hunian: 40% rumah nelayan tidak layak huni — lantai tanah, atap bocor, tanpa sanitasi layak.",
        "Akses keuangan: 70% nelayan kecil tidak memiliki rekening bank aktif (unbanked).",
      ]
    ),
    emptyPara(0, 120),

    heading2("2.2 Diversifikasi Mata Pencaharian Pesisir"),
    bodyText(
      "Diversifikasi mata pencaharian adalah strategi kunci untuk mengurangi kerentanan ekonomi " +
      "nelayan terhadap fluktuasi musim dan harga ikan. Komunitas pesisir yang resilien memiliki " +
      "beragam sumber pendapatan yang saling melengkapi dan menstabilkan ekonomi rumah tangga."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Mata Pencaharian Alternatif", "Deskripsi", "Potensi Pendapatan Tambahan", "Musim Optimal"],
      [
        ["Pengolahan Hasil Laut", "Produksi abon ikan, kerupuk, dendeng, terasi, ikan asin oleh ibu nelayan", "Rp 500.000–2.000.000/bulan", "Sepanjang tahun"],
        ["Budi Daya Rumput Laut", "Eucheuma cottonii / Gracilaria — siklus panen 45 hari, modal rendah", "Rp 1–3 juta per siklus panen", "Sepanjang tahun"],
        ["Pariwisata Bahari", "Jasa guide snorkel/diving, sewa perahu wisata, homestay nelayan", "Rp 1–5 juta/bulan (musim wisata)", "Musim kemarau / liburan"],
        ["Keramba Jaring Apung (KJA)", "Pembesaran kerapu, kakap, bawal bintang di perairan tenang", "Rp 3–10 juta per siklus panen", "Musim kemarau (ombak tenang)"],
        ["Tambak Tradisional", "Udang, bandeng, kepiting bakau — diversifikasi dari tangkap ke budi daya", "Rp 2–8 juta/panen (3–4 bulan)", "Musim kemarau"],
        ["Jasa Transportasi Laut", "Angkutan penumpang antar pulau, angkutan barang, jasa sewa kapal", "Rp 1,5–4 juta/bulan", "Sepanjang tahun"],
      ],
      [2200, 2800, 2000, 2026]
    ),
    emptyPara(0, 120),

    heading2("2.3 Perlindungan Sosial dan Asuransi Nelayan (BPAN)"),
    bodyText(
      "Sistem perlindungan sosial bagi nelayan mencakup asuransi jiwa, jaminan kesehatan, " +
      "dan bantuan sosial yang diberikan oleh pemerintah untuk melindungi nelayan dari risiko " +
      "kecelakaan kerja, kematian, dan kemiskinan mendadak akibat bencana."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Program Perlindungan Sosial", "Pengelola", "Manfaat / Cakupan", "Syarat Penerima"],
      [
        ["BPAN (Bantuan Premi Asuransi Nelayan)", "PT Jasindo / KKP", "Santunan kematian kecelakaan Rp 200 juta; cacat tetap Rp 100 juta; biaya pengobatan Rp 20 juta", "Nelayan kecil, WNI, punya KUSUKA, kapal < 10 GT"],
        ["BPJS Ketenagakerjaan", "BPJS TK", "JKK (kecelakaan kerja), JKM (kematian Rp 42 juta), JHT, JP", "Nelayan yang memiliki NIK dan daftar mandiri/kolektif lewat koperasi"],
        ["BPJS Kesehatan (PBI-JK)", "BPJS Kesehatan / Kemensos", "Layanan kesehatan gratis kelas III di faskes pemerintah", "Miskin/tidak mampu terdata di DTKS Kemensos"],
        ["Bantuan Langsung Tunai (BLT)", "Kemensos / Pemda", "Bantuan tunai Rp 200.000–600.000/bulan saat krisis/bencana", "Terdata sebagai penerima manfaat program PKH/BPNT"],
        ["Rumah Subsidi (FLPP)", "Kementerian PUPR / bank", "KPR bersubsidi dengan suku bunga 5% dan DP rendah", "Berpenghasilan < Rp 8 juta/bulan, belum punya rumah"],
      ],
      [2000, 1600, 3200, 2226]
    ),
    emptyPara(0, 80),
    warnBox(
      "⚠️ Cara Klaim BPAN Jika Terjadi Kecelakaan di Laut",
      [
        "Laporkan kecelakaan ke Syahbandar atau Dinas DKP setempat dalam 7 hari setelah kejadian.",
        "Siapkan dokumen: Surat keterangan kecelakaan, KUSUKA, KTP ahli waris, akta kematian (jika meninggal).",
        "Ajukan klaim melalui kantor PT Jasindo terdekat atau melalui UPT KKP / Dinas DKP.",
        "Proses klaim diselesaikan maksimal 14 hari kerja setelah dokumen lengkap diterima Jasindo.",
      ]
    ),
    emptyPara(0, 120),

    heading2("2.4 Kesetaraan Gender dalam Usaha Perikanan"),
    bodyText(
      "Perempuan pesisir memainkan peran ekonomi yang signifikan dalam industri perikanan, " +
      "terutama di sektor pasca-panen, pengolahan, dan pemasaran. Namun, kontribusi ini sering " +
      "tidak diakui secara formal dan perempuan masih menghadapi hambatan akses modal, " +
      "pelatihan, dan pengambilan keputusan dalam kelembagaan perikanan."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Peran Perempuan Pesisir", "Kontribusi Ekonomi", "Hambatan yang Dihadapi"],
      [
        ["Pengolah Ikan (Pemindang, Pemasin)", "Nilai tambah produk ikan olahan hingga 200–400% dari harga ikan segar", "Tidak punya akses KUR atas nama sendiri; suami yang mengurus izin"],
        ["Penjual / Pedagang Ikan (Bakul)", "Distribusi ikan dari TPI ke pasar lokal; penghubung nelayan-konsumen", "Modal kecil, jam kerja panjang, tidak terdata sebagai pelaku usaha formal"],
        ["Penjaga Rumah & Manajer Keuangan Keluarga", "Mengatur pengeluaran rumah tangga dan alokasi penghasilan trip suami", "Tidak dilibatkan dalam pelatihan manajemen keuangan usaha"],
        ["Anggota Kelompok Perempuan Pesisir", "Produksi kerajinan, abon, kerupuk, terasi — UMKM berbasis pesisir", "Sulit mendapat izin PIRT/NIB atas nama sendiri tanpa KTP domisili tetap"],
      ],
      [2200, 3400, 3426]
    ),
    emptyPara(0, 120),
    tipBox(
      "✅ Program KKP untuk Pemberdayaan Perempuan Pesisir",
      [
        "PUMP-P2HP (Pengembangan Usaha Mitra Pengolahan & Pemasaran): bantuan alat pengolahan ikan untuk kelompok perempuan.",
        "Sekolah Lapang Perempuan Pesisir: pelatihan literasi keuangan, sanitasi, dan gizi keluarga nelayan.",
        "Fasilitasi NIB dan PIRT: pendampingan perizinan berusaha untuk produk olahan ikan rumahan.",
        "Kuota perempuan dalam pengurus KUB/koperasi: minimal 30% kepengurusan untuk akses bantuan KKP.",
      ]
    ),
    emptyPara(0, 120),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 3: PENGELOLAAN BERBASIS KOMUNITAS
// ═══════════════════════════════════════════════════════════════════════════════
function bab3() {
  return [
    heading1("BAB 3: PENGELOLAAN BERBASIS KOMUNITAS"),
    bodyText(
      "Pengelolaan perikanan berbasis komunitas (Community-Based Fisheries Management / CBFM) " +
      "menempatkan masyarakat nelayan lokal sebagai aktor utama dalam pengambilan keputusan " +
      "tentang pemanfaatan dan pelestarian sumber daya laut di wilayah mereka. Pendekatan ini " +
      "terbukti lebih efektif dan berkelanjutan dibanding pengelolaan top-down dari pemerintah pusat."
    ),
    emptyPara(),

    heading2("3.1 Co-Management Sumber Daya Perikanan"),
    bodyText(
      "Co-management adalah model berbagi kewenangan pengelolaan sumber daya perikanan antara " +
      "pemerintah dan komunitas nelayan. Model ini mengakui hak-hak tradisional nelayan lokal " +
      "sekaligus memastikan kepatuhan terhadap standar pengelolaan yang lestari."
    ),
    emptyPara(0, 80),
    heading3("Spektrum Model Co-Management"),
    dataTable(
      ["Level Co-Management", "Peran Pemerintah", "Peran Komunitas", "Contoh di Indonesia"],
      [
        ["Instruktif", "Penuh; komunitas hanya menerima informasi", "Pasif / pendengar", "Penetapan kuota WPP oleh KKP tanpa konsultasi"],
        ["Konsultatif", "Dominan; konsultasi komunitas sebelum keputusan", "Memberikan masukan", "KKPD (Kawasan Konservasi Perairan Daerah) Wakatobi"],
        ["Kerjasama", "Berbagi beban dan tanggung jawab seimbang", "Aktif dalam monitoring & penegakan aturan", "Model TURF (Territorial Use Rights in Fisheries) di Sulawesi Tenggara"],
        ["Konsultatif-Terbalik", "Pemerintah memberi saran kepada komunitas", "Mengambil sebagian besar keputusan", "Sasi laut Maluku — pemerintah desa mengesahkan aturan sasi"],
        ["Informatif", "Hanya menerima laporan dari komunitas", "Penuh; komunitas mengatur sendiri", "Awig-awig Bali — regulasi adat mandiri yang diakui negara"],
      ],
      [2000, 2200, 2600, 2226]
    ),
    emptyPara(0, 120),

    heading2("3.2 Sistem Sasi dan Kearifan Lokal"),
    bodyText(
      "Kearifan lokal pengelolaan laut di Indonesia memiliki keragaman yang luar biasa. " +
      "Sistem-sistem tradisional ini telah terbukti mampu menjaga kelestarian sumber daya " +
      "laut selama berabad-abad sebelum sistem pengelolaan modern diperkenalkan."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Kearifan Lokal", "Daerah Asal", "Mekanisme Pengelolaan", "Sumber Daya yang Dilindungi"],
      [
        ["Sasi Laut", "Maluku & Maluku Utara", "Penutupan musim panen (sasi tutup) & pembukaan panen (sasi buka) berdasarkan kalender adat", "Lola (teripang), bia (kerang), ikan karang, lobster"],
        ["Awig-Awig", "Bali & NTB (Lombok)", "Aturan adat tertulis yang mengatur waktu, alat tangkap, dan wilayah penangkapan di perairan desa", "Ikan, karang, mangrove, wilayah perairan desa"],
        ["Sero", "Sulawesi Selatan", "Sistem perangkap ikan tradisional komunal di muara sungai/teluk; pengelolaan giliran", "Ikan muara: bandeng, udang, belanak"],
        ["Panglima Laot", "Aceh", "Lembaga adat yang mengatur semua aspek penangkapan ikan: hari layar, pembagian hasil, penyelesaian konflik", "Seluruh sumber daya laut di wilayah adat Aceh"],
        ["Mane'e", "Talaud (Sulawesi Utara)", "Ritual penangkapan ikan komunal setahun sekali dipimpin tetua adat; hasil dibagi rata semua keluarga", "Ikan pelagis kecil (layang, kembung) musiman"],
        ["Hak Ulayat Laut (HUL)", "Berbagai daerah", "Hak eksklusif komunitas nelayan adat atas wilayah perairan tertentu yang diakui hukum adat", "Semua sumber daya dalam batas wilayah adat laut"],
      ],
      [1800, 1800, 3200, 2226]
    ),
    emptyPara(0, 80),
    infoBox(
      "💡 Pengakuan Hukum atas Kearifan Lokal Pengelolaan Laut",
      [
        "UU No. 27/2007 jo. UU No. 1/2014 tentang Pengelolaan Wilayah Pesisir: mengakui hak masyarakat adat atas ruang laut.",
        "Permen KP No. 17/2008: panduan penetapan kawasan konservasi yang mengintegrasikan pengetahuan lokal.",
        "Putusan MK No. 35/PUU-X/2012: hutan adat bukan hutan negara — prinsip yang mulai diterapkan ke wilayah laut adat.",
        "Desa adat yang memiliki hak ulayat laut dapat mengajukan peraturan desa (Perdes) tentang zonasi perairan desa.",
      ]
    ),
    emptyPara(0, 120),

    heading2("3.3 Partisipasi Masyarakat dalam Pengambilan Keputusan"),
    bodyText(
      "Partisipasi masyarakat nelayan dalam proses pengambilan keputusan tentang pengelolaan " +
      "sumber daya laut adalah hak konstitusional sekaligus kunci keberhasilan implementasi " +
      "kebijakan perikanan. Partisipasi yang bermakna melampaui sekadar konsultasi formalitas."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Mekanisme Partisipasi", "Bentuk Keterlibatan", "Level Pengambilan Keputusan"],
      [
        ["Musyawarah Desa/Pesisir (Musdes)", "Nelayan membahas rencana zonasi, aturan tangkap, dan konflik pemanfaatan", "Desa — Perdes tentang wilayah tangkap lokal"],
        ["Forum Koordinasi DAS / WPP", "Perwakilan nelayan duduk dalam forum koordinasi lintas sektor di WPP", "Provinsi/nasional — rencana pengelolaan WPP"],
        ["Perwakilan dalam Dewan Perikanan", "Anggota KUB/Koperasi mewakili nelayan di Dewan Perikanan Nasional", "Nasional — masukan kebijakan KKP"],
        ["Konsultasi Publik AMDAL", "Nelayan menyampaikan keberatan/masukan dalam proses AMDAL industri pesisir", "Proyek — izin lingkungan kegiatan industri"],
        ["Citizen Science / Monitoring Partisipatif", "Nelayan mencatat data tangkapan, kondisi karang, dan spesies langka secara mandiri", "Lokal — data untuk manajemen adaptif"],
      ],
      [2400, 3400, 3226]
    ),
    emptyPara(0, 120),

    heading2("3.4 Penyelesaian Konflik Nelayan"),
    bodyText(
      "Konflik antar nelayan merupakan masalah yang lazim dalam pengelolaan perikanan, terutama " +
      "akibat perebutan wilayah tangkap, penggunaan alat tangkap yang merusak, dan persaingan " +
      "antara nelayan tradisional dengan kapal industri. Penyelesaian konflik yang efektif " +
      "membutuhkan mekanisme yang adil, cepat, dan diterima semua pihak."
    ),
    emptyPara(0, 80),
    heading3("Jenis Konflik Nelayan yang Umum Terjadi"),
    dataTable(
      ["Jenis Konflik", "Penyebab", "Contoh Kasus"],
      [
        ["Konflik Wilayah Tangkap", "Klaim tumpang-tindih atas fishing ground; tidak ada batas jelas antar desa", "Bentrokan nelayan Jawa vs Madura di Selat Madura"],
        ["Konflik Alat Tangkap", "Jaring insang nelayan kecil rusak oleh trawl / purse seine kapal besar", "Konflik purse seine vs nelayan pancing di WPP 711"],
        ["Konflik Antar-Komunitas", "Persaingan nelayan lokal vs pendatang (andon) dari daerah lain", "Nelayan Sulawesi andon di Papua — konflik sosial"],
        ["Konflik Industri vs Nelayan", "Pertambangan, reklamasi, budidaya tambak merusak fishing ground tradisional", "Tambak udang vs nelayan tangkap di Teluk Balikpapan"],
        ["Konflik Internal KUB/Koperasi", "Pembagian hasil tidak adil, penyalahgunaan dana bantuan pemerintah", "Perselisihan pembagian kapal bantuan KKP dalam KUB"],
      ],
      [2000, 3200, 3826]
    ),
    emptyPara(0, 80),
    heading3("Mekanisme Penyelesaian Konflik"),
    dataTable(
      ["Mekanisme", "Proses", "Kelebihan", "Keterbatasan"],
      [
        ["Musyawarah Adat", "Mediasi oleh tokoh adat / Panglima Laot / Kepala Suku", "Cepat, murah, diterima budaya lokal", "Tidak mengikat secara hukum formal"],
        ["Mediasi PSDKP", "Pengawas PSDKP KKP memfasilitasi negosiasi kedua pihak", "Ada otoritas pemerintah, semi-formal", "Lambat jika kasus melibatkan multi-daerah"],
        ["Pengadilan Perikanan", "Gugatan perdata/pidana melalui Pengadilan Negeri (Pasal 76 UU No. 45/2009)", "Putusan berkekuatan hukum tetap", "Mahal, lama, sering intimidasi nelayan kecil"],
        ["Ombudsman / Komnas HAM", "Laporan pelanggaran hak nelayan oleh korporasi atau pemerintah", "Netral, berwibawa untuk kasus besar", "Rekomendasi tidak wajib dilaksanakan"],
      ],
      [2000, 2800, 2200, 2026]
    ),
    emptyPara(0, 120),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 4: PENGEMBANGAN EKONOMI PESISIR
// ═══════════════════════════════════════════════════════════════════════════════
function bab4() {
  return [
    heading1("BAB 4: PENGEMBANGAN EKONOMI PESISIR"),
    bodyText(
      "Pengembangan ekonomi pesisir melampaui sektor perikanan tangkap. Dengan memanfaatkan " +
      "keindahan alam, kearifan budaya, dan posisi strategis wilayah pesisir, komunitas nelayan " +
      "dapat mengembangkan beragam usaha ekonomi yang saling memperkuat dan memberikan " +
      "ketahanan ekonomi yang lebih besar bagi seluruh anggota komunitas."
    ),
    emptyPara(),

    heading2("4.1 Ekowisata Bahari Berbasis Masyarakat"),
    bodyText(
      "Ekowisata bahari berbasis masyarakat (Community-Based Marine Ecotourism / CBME) adalah " +
      "pengembangan pariwisata di kawasan pesisir yang dikelola oleh dan untuk masyarakat lokal, " +
      "dengan prinsip konservasi alam dan pemberdayaan ekonomi komunitas nelayan."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Produk Wisata Bahari", "Deskripsi", "Potensi Pendapatan", "Persyaratan"],
      [
        ["Snorkeling & Diving Guide", "Pemandu wisata bawah laut di kawasan karang yang sehat", "Rp 150.000–500.000/orang/kunjungan", "Sertifikat selam, bahasa Inggris dasar"],
        ["Wisata Perahu Tradisional", "Sewa perahu nelayan untuk island hopping, sunset cruise, fishing trip", "Rp 300.000–1.500.000/perahu/hari", "Perahu layak, life jacket, ijin wisata"],
        ["Homestay Nelayan", "Akomodasi di rumah nelayan; turis merasakan kehidupan pesisir asli", "Rp 150.000–400.000/malam/kamar", "Kamar bersih, MCK layak, PHRI lokal"],
        ["Wisata Edukasi Perikanan", "Kunjungan ke tambak, KJA, pengasapan ikan, proses budidaya", "Rp 50.000–200.000/orang", "Paket edukatif, pemandu lokal terlatih"],
        ["Festival Budaya Nelayan", "Ritual adat laut, lomba perahu, pameran kuliner pesisir", "Efek multiplier ke seluruh UMKM lokal", "Koordinasi pemda, promosi dinas pariwisata"],
      ],
      [2000, 2800, 2000, 2226]
    ),
    emptyPara(0, 80),
    infoBox(
      "💡 Syarat Pengembangan Ekowisata Bahari yang Bertanggung Jawab",
      [
        "Daya Dukung Lingkungan (Carrying Capacity): jumlah wisatawan harus di bawah batas yang merusak ekosistem karang.",
        "Benefit sharing: sebagian besar pendapatan wisata masuk ke kas desa/komunitas, bukan hanya pemilik perahu.",
        "Panduan wisatawan: dilarang menginjak karang, menyentuh satwa laut, membuang sampah di laut.",
        "Sertifikasi pemandu: pandu wisata lokal harus memiliki sertifikat Pemandu Wisata Selam dari PADI/SSI atau BNSP.",
      ]
    ),
    emptyPara(0, 120),

    heading2("4.2 Pengembangan Kampung Nelayan Modern"),
    bodyText(
      "Program Kampung Nelayan Modern (KALAMO) merupakan program KKP untuk merevitalisasi " +
      "pemukiman nelayan menjadi kawasan yang tertata, produktif, dan memiliki fasilitas " +
      "infrastruktur memadai — sekaligus menjadi sentra produksi dan pemasaran produk perikanan."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Komponen KALAMO", "Deskripsi Pembangunan", "Sumber Pembiayaan"],
      [
        ["Infrastruktur Fisik", "Dermaga kapal, jalan cor, instalasi air bersih, listrik, MCK komunal", "APBN KKP, APBD Prov/Kab, BPD"],
        ["Fasilitas Pengolahan Ikan", "Cold storage komunal, unit pengolahan ikan (UPI) desa, pabrik es mini", "Hibah KKP, BUMN (Perindo), CSR swasta"],
        ["Pasar Ikan Higien", "Tempat pelelangan ikan (TPI) modern bersertifikasi SNI, fasilitas lelang elektronik", "APBN KKP / Pemda"],
        ["Rumah Layak Huni", "Bedah rumah nelayan, RTLH (Rumah Tidak Layak Huni) melalui BSPS Kemen PUPR", "BSPS Kemen PUPR, APBD"],
        ["Fasilitas Sosial", "PAUD, posyandu, pusat pelatihan vokasi, WiFi gratis nelayan, taman bermain", "Dana Desa (Kemendesa), APBD, CSR"],
        ["Energi Terbarukan", "PLTS (Pembangkit Listrik Tenaga Surya) komunal untuk penerangan kapal dan cold storage", "ESDM / PLN / BUMN Energi"],
      ],
      [2200, 4000, 2826]
    ),
    emptyPara(0, 120),

    heading2("4.3 Akses Pasar dan Teknologi Informasi"),
    bodyText(
      "Keterbatasan akses pasar menjadi penyebab utama rendahnya harga jual ikan di tingkat " +
      "nelayan. Pemanfaatan teknologi informasi dan komunikasi (TIK) membuka akses ke informasi " +
      "harga, cuaca, dan pasar yang sebelumnya hanya dikuasai oleh pengepul dan pedagang besar."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Teknologi / Platform", "Fungsi untuk Nelayan", "Cara Akses"],
      [
        ["Aplikasi Laut Nusantara (KKP)", "Prakiraan cuaca, potensi ikan per WPP, harga ikan di PPI/TPI terdekat, SPBN", "Gratis di Play Store / App Store"],
        ["Sistem Informasi Harga Ikan (SIHATI)", "Data harga ikan harian di 34 provinsi, tren harga nasional", "Website KKP / Dinas DKP Provinsi"],
        ["iMOS (Integrated Monitoring Ocean System)", "Monitoring kapal, logistik perikanan, armada nasional real-time", "Khusus petugas KKP & pengusaha berizin"],
        ["WhatsApp Business Group", "Grup informasi harga pasar antar nelayan, info cuaca BMKG, berbagi lokasi fishing ground", "HP Android dengan paket data minimal"],
        ["Marketplace (Shopee/Tokopedia)", "Penjualan ikan olahan, rumput laut, produk pesisir UMKM ke seluruh Indonesia", "Daftar gratis, butuh PIRT & foto produk"],
        ["E-Lelang Ikan Online", "Sistem lelang elektronik di TPI modern — nelayan tahu harga sebelum berlabuh", "Dikembangkan KKP bersama Pemda & Perindo"],
      ],
      [2400, 3200, 3426]
    ),
    emptyPara(0, 120),

    heading2("4.4 Koperasi Nelayan dan Lembaga Keuangan Mikro"),
    bodyText(
      "Koperasi nelayan dan lembaga keuangan mikro adalah tulang punggung inklusi keuangan " +
      "bagi komunitas pesisir. Keberadaan lembaga keuangan yang dekat, terpercaya, dan " +
      "memahami siklus usaha nelayan sangat krusial untuk mengurangi ketergantungan pada " +
      "rentenir dan sistem ijon yang merugikan."
    ),
    emptyPara(0, 80),
    dataTable(
      ["Lembaga", "Jenis Layanan", "Keunggulan untuk Nelayan", "Regulasi"],
      [
        ["Koperasi Nelayan (KSP/USP)", "Simpan pinjam, jual-beli kolektif, pengadaan BBM/es bersama", "Bunga rendah, proses cepat, persyaratan fleksibel", "UU No. 25/1992 tentang Perkoperasian"],
        ["BPR / BPRS Pesisir", "Kredit modal kerja, deposito, tabungan nelayan", "Jangkauan ke desa pesisir, memahami musim ikan", "UU No. 7/1992 jo. UU No. 10/1998"],
        ["LPMUKP (KKP)", "Pinjaman modal usaha perikanan bunga rendah 3% p.a.", "Bunga terjangkau, diperuntukkan khusus nelayan", "Permen KP No. 2/2019"],
        ["Agen BRILink / Laku Pandai", "Agen perbankan di desa pesisir terpencil: setor, tarik tunai, transfer", "Akses keuangan tanpa perlu ke kota", "POJK No. 19/2014 tentang Laku Pandai"],
        ["Dana Bergulir Desa (BUMDes)", "Modal usaha bagi nelayan warga desa melalui unit usaha BUMDes", "Dana desa dikelola lokal, tanpa agunan ketat", "UU No. 6/2014 tentang Desa"],
      ],
      [2000, 2600, 2600, 1826]
    ),
    emptyPara(0, 80),
    warnBox(
      "⚠️ Ciri-Ciri Rentenir / Lintah Darat yang Harus Dihindari Nelayan",
      [
        "Bunga tidak jelas / dihitung harian atau per trip (bukan per tahun) — efektif bisa 200–500% per tahun.",
        "Mensyaratkan nelayan menjual hasil tangkap hanya kepada pemberi pinjaman dengan harga ditetapkan sepihak.",
        "Tidak ada perjanjian tertulis — hanya lisan sehingga sulit disengketakan secara hukum.",
        "Mengambil agunan berlebihan: sertifikat rumah/tanah untuk pinjaman kecil Rp 5–10 juta.",
        "Solusi: Segera hubungi koperasi nelayan, LPMUKP, atau KUR Nelayan di bank Himbara terdekat.",
      ]
    ),
    emptyPara(0, 120),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 5: RINGKASAN & SOAL LATIHAN
// ═══════════════════════════════════════════════════════════════════════════════
function bab5() {
  return [
    heading1("BAB 5: RINGKASAN & SOAL LATIHAN"),

    heading2("5.1 Poin-Poin Kunci Modul IV"),
    dataTable(
      ["Topik", "Poin Kunci (Hafal!)"],
      [
        ["BPPP", "12 Balai Pelatihan & Penyuluhan Perikanan KKP di seluruh Indonesia — pelatihan gratis nelayan"],
        ["ANKAPIN", "Sertifikasi wajib nakhoda kapal > 35 GT; diterbitkan BP2IP (Balai Pendidikan & Pelatihan Ilmu Pelayaran)"],
        ["KUB", "Kelompok Usaha Bersama; minimal 10 anggota; dasar hukum Permen KP No. 14/2012"],
        ["BPAN", "Bantuan Premi Asuransi Nelayan; santunan kematian Rp 200 juta; syarat: KUSUKA, kapal < 10 GT"],
        ["Sasi Laut", "Kearifan lokal Maluku — sistem buka/tutup musim panen (sasi buka/tutup) untuk kelestarian laut"],
        ["Panglima Laot", "Lembaga adat pengelola laut di Aceh — mengatur hari layar, bagi hasil, dan konflik nelayan"],
        ["Awig-Awig", "Aturan adat tertulis tentang penangkapan ikan di Bali & NTB (Lombok) — diakui hukum adat"],
        ["CBFM", "Community-Based Fisheries Management — co-management antara pemerintah dan komunitas nelayan"],
        ["KALAMO", "Kampung Nelayan Modern — program KKP merevitalisasi pemukiman nelayan; mencakup cold storage, TPI, dll."],
        ["LPMUKP", "Lembaga Pengelola Modal Usaha Kelautan dan Perikanan; pinjaman bunga 3% p.a., maks. Rp 250 juta"],
        ["Carrying Capacity", "Daya dukung lingkungan ekowisata — jumlah wisatawan maksimum agar ekosistem karang tidak rusak"],
        ["Perempuan Pesisir", "Peran penting di pengolahan, pemasaran, keuangan rumah tangga; hambatan: akses modal & perizinan"],
      ],
      [2800, 6226]
    ),
    emptyPara(0, 160),

    heading2("5.2 Istilah-Istilah Penting Modul IV"),
    dataTable(
      ["Istilah", "Arti"],
      [
        ["KUB", "Kelompok Usaha Bersama — kelompok kolektif minimal 10 nelayan untuk akses bantuan & modal"],
        ["KUSUKA", "Kartu Pelaku Usaha Kelautan dan Perikanan — identitas resmi nelayan, syarat program KKP"],
        ["BPAN", "Bantuan Premi Asuransi Nelayan — program subsidi premi asuransi jiwa nelayan kecil dari KKP"],
        ["CBFM", "Community-Based Fisheries Management — pengelolaan perikanan berbasis komunitas"],
        ["Co-Management", "Model berbagi kewenangan pengelolaan SDA antara pemerintah dan komunitas lokal"],
        ["TURF", "Territorial Use Rights in Fisheries — hak eksklusif komunitas atas wilayah penangkapan tertentu"],
        ["Sasi", "Sistem adat buka-tutup musim panen laut di Maluku untuk menjaga kelestarian sumber daya"],
        ["Panglima Laot", "Lembaga adat pengatur seluruh kegiatan penangkapan ikan di Aceh"],
        ["KALAMO", "Kampung Nelayan Modern — program KKP revitalisasi pemukiman & infrastruktur pesisir"],
        ["CBME", "Community-Based Marine Ecotourism — ekowisata bahari yang dikelola oleh masyarakat lokal"],
        ["LPMUKP", "Lembaga Pengelola Modal Usaha Kelautan dan Perikanan — dana bergulir KKP bunga 3% p.a."],
        ["BUMDes", "Badan Usaha Milik Desa — unit usaha yang mengelola dana dan aset desa untuk kesejahteraan warga"],
        ["Ponggawa/Toke", "Pengepul yang merangkap pemberi modal — sering menciptakan ketergantungan finansial nelayan"],
        ["DTKS", "Data Terpadu Kesejahteraan Sosial — basis data penerima program bantuan sosial (Kemensos)"],
      ],
      [2200, 6826]
    ),
    emptyPara(0, 160),

    heading2("5.3 Soal Latihan"),
    bodyText("Jawab pertanyaan berikut untuk mengukur pemahaman Modul IV:"),
    emptyPara(0, 80),
    ...[
      "1. Sebutkan dan jelaskan 4 jenis pelatihan teknis yang disediakan KKP melalui BPPP untuk meningkatkan kapasitas nelayan Indonesia!",
      "2. Apa yang dimaksud dengan sistem Sasi di Maluku? Bagaimana mekanisme sasi buka dan sasi tutup bekerja untuk menjaga kelestarian sumber daya laut?",
      "3. Jelaskan perbedaan antara model co-management konsultatif dan co-management kerjasama (cooperative)! Berikan contoh penerapan masing-masing di Indonesia!",
      "4. Seorang nelayan mengalami kecelakaan di laut dan menderita cacat tetap. Jelaskan langkah-langkah yang harus dilakukan untuk mengklaim manfaat BPAN!",
      "5. Apa saja hambatan yang dihadapi perempuan pesisir dalam mengembangkan usaha pengolahan ikan? Sebutkan minimal 3 program KKP yang dirancang untuk mengatasi hambatan tersebut!",
      "6. Jelaskan konsep 'carrying capacity' dalam ekowisata bahari! Mengapa konsep ini penting untuk keberlangsungan wisata di kawasan terumbu karang?",
      "7. Apa perbedaan antara KSP/USP Koperasi Nelayan dengan LPMUKP dalam hal suku bunga, plafond, dan persyaratan? Mana yang lebih cocok untuk nelayan kecil?",
      "8. Sebutkan 3 jenis konflik nelayan yang umum terjadi di Indonesia beserta mekanisme penyelesaian yang paling tepat untuk masing-masing konflik!",
    ].map(q => bodyText(q)),
    emptyPara(0, 80),
    tipBox(
      "📝 Kunci Jawaban Soal No. 4 — Klaim BPAN",
      [
        "Langkah 1: Laporkan kecelakaan ke Syahbandar atau Dinas DKP setempat dalam 7 hari setelah kejadian.",
        "Langkah 2: Siapkan dokumen — surat keterangan kecelakaan, KUSUKA, KTP korban, surat keterangan cacat dari dokter.",
        "Langkah 3: Ajukan klaim ke kantor PT Jasindo terdekat atau melalui UPT KKP / Dinas DKP Kabupaten.",
        "Langkah 4: Tunggu proses verifikasi — maksimal 14 hari kerja setelah dokumen lengkap diterima Jasindo.",
        "Besaran santunan cacat tetap total: Rp 100 juta; biaya pengobatan ditanggung hingga Rp 20 juta.",
      ]
    ),
    emptyPara(0, 120),
  ];
}

// ─── Header & Footer ──────────────────────────────────────────────────────────
function makeHeader() {
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 4, color: C.darkBlue } },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: sp(0, 80),
      children: [
        new TextRun({ text: "MATERI PERSIAPAN TES KNMP  |  Kompetensi Nelayan Menengah Perikanan", bold: true, color: C.darkBlue, size: 18, font: "Arial" }),
        new TextRun({ text: "\t", font: "Arial" }),
        new TextRun({ text: "Modul IV: Pemberdayaan Masyarakat Nelayan & Pesisir", bold: true, color: C.blue, size: 18, font: "Arial" }),
      ]
    })]
  });
}

function makeFooter() {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, space: 4, color: C.darkBlue } },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: sp(80, 0),
      children: [
        new TextRun({ text: "Pemerintah Indonesia \u2014 KKP  |  Materi Belajar KNMP", color: C.gray, size: 18, font: "Arial" }),
        new TextRun({ text: "\tHalaman ", color: C.gray, size: 18, font: "Arial" }),
        new TextRun({ children: [PageNumber.CURRENT], color: C.gray, size: 18, font: "Arial" }),
      ]
    })]
  });
}

// ─── Build Document ───────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: C.darkBlue },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.blue },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.deepBlue },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: { default: makeHeader() },
    footers: { default: makeFooter() },
    children: [
      ...coverPage(),
      ...tocPage(),
      ...bab1(),
      ...bab2(),
      ...bab3(),
      ...bab4(),
      ...bab5(),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("./KNMP_Modul_IV_Pemberdayaan_Nelayan_Pesisir.docx", buffer);
  console.log("Done!");
}).catch(err => console.error(err));