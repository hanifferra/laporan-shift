const {  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,  BorderStyle, WidthType, ShadingType, PageNumber,  TabStopType, TabStopPosition, PageBreak} = require('docx');
const fs = require('fs');

const C = {  
  darkBlue:  "1A3C5E",  
  blue:      "2E75B6",  
  deepBlue:  "1F4D78",  
  infoBg:    "EBF5FB",  
  infoBorder:"2E75B6",  
  warnBg:    "FEF9E7",  
  tipBg:     "EAFAF1",  
  headerBg:  "1A3C5E",  
  rowAlt:    "F2F7FB",  
  gray:      "404040",  
  white:     "FFFFFF",  
  // Modul V accent — purple matching the slide  
  modul5Bg:  "4A148C",  
  modul5Light:"EDE7F6",
};

const thinBorder = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 4, color });
const noBorder   = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const tableBorders = (color = "BDC3C7") => ({  
  top: thinBorder(color), bottom: thinBorder(color),  
  left: thinBorder(color), right: thinBorder(color),  
  insideH: thinBorder(color), insideV: thinBorder(color)
});

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

function emptyPara(before = 0, after = 0) {  
  return para([run("")], { spacing: sp(before, after) });
}

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
          shading: { fill: C.modul5Bg, type: ShadingType.CLEAR },          
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },          
          margins: { top: 240, bottom: 240, left: 360, right: 360 },          
          width: { size: 9026, type: WidthType.DXA },          
          children: [            
            para([run("⚖️  MODUL V: ASPEK KELEMBAGAAN KELAUTAN & PERIKANAN", { bold: true, size: 28, color: C.white })],              
              { alignment: AlignmentType.CENTER, spacing: sp(0, 80) }),            
            para([run("Regulasi, kebijakan, organisasi, dan tata kelola sektor kelautan-perikanan  |  Bobot: 15%", { size: 22, color: "CE93D8" })],              
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

function tocPage() {  
  return [    
    para([run("DAFTAR ISI", { bold: true, size: 32, color: C.darkBlue })],      
      { alignment: AlignmentType.CENTER, spacing: sp(0, 240) }),    
    ...[      
      "BAB 1: Regulasi & Kebijakan Perikanan",      
      "BAB 2: Struktur Kelembagaan Pemerintah",      
      "BAB 3: Tata Kelola & Pengawasan",      
      "BAB 4: Kerjasama & Perjanjian Internasional",      
      "BAB 5: Ringkasan & Soal Latihan",    
    ].map(item => new Paragraph({      
      numbering: { reference: "numbers", level: 0 },      
      children: [run(item, { size: 24, color: C.deepBlue })],      
      spacing: sp(60, 60),    
    })),    
    new Paragraph({ children: [new PageBreak()] }),  
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 1: REGULASI & KEBIJAKAN
// ═══════════════════════════════════════════════════════════════════════════════
function bab1() {  
  return [    
    heading1("BAB 1: REGULASI & KEBIJAKAN PERIKANAN"),    
    bodyText(      
      "Regulasi dan kebijakan perikanan merupakan instrumen hukum yang mengatur seluruh aspek " +      
      "pengelolaan sumber daya kelautan dan perikanan Indonesia. Pemahaman terhadap hierarki " +      
      "peraturan perundang-undangan perikanan adalah kompetensi dasar yang wajib dimiliki oleh " +      
      "setiap nelayan menengah dan pelaku usaha perikanan yang profesional."    
    ),    
    emptyPara(),    
    heading2("1.1 UU No. 45/2009 tentang Perikanan dan Perubahannya"),    
    bodyText(      
      "Undang-Undang No. 31/2004 yang kemudian diubah dengan UU No. 45/2009 tentang Perikanan " +      
      "merupakan landasan hukum utama pengelolaan dan penangkapan ikan di seluruh wilayah " +      
      "perairan Indonesia. Undang-undang ini mengatur mulai dari hak penangkapan, perizinan, " +      
      "pengawasan, hingga sanksi pidana bagi pelanggar."    
    ),    
    emptyPara(0, 80),    
    heading3("Pokok-Pokok Materi UU No. 45/2009"),    
    dataTable(      
      ["Pasal / Bab", "Pokok Pengaturan", "Ketentuan Penting"],      
      [        
        ["Pasal 1", "Definisi dan ruang lingkup", "Definisi ikan, perikanan, WPP, nelayan kecil, ABK, kapal perikanan"],        
        ["Pasal 7", "Kewenangan KKP menetapkan kebijakan", "KKP berwenang menetapkan JTB, musim penangkapan, alat tangkap, jalur penangkapan"],        
        ["Pasal 12", "Larangan alat tangkap & bahan berbahaya", "Dilarang: bahan peledak, racun, listrik, trawl di perairan tertentu"],        
        ["Pasal 26–27", "Perizinan usaha perikanan", "SIUP wajib bagi usaha perikanan; SIPI wajib per unit kapal penangkap"],        
        ["Pasal 36", "Kewajiban penggunaan nakhoda WNI", "Kapal perikanan Indonesia wajib dinakhodai WNI bersertifikat"],        
        ["Pasal 42–43", "Logbook dan pelaporan", "Wajib isi logbook; kapal > 30 GT wajib lapor via e-logbook / VMS"],        
        ["Pasal 69", "Kewenangan penyidik PSDKP", "Penyidik PPNS KKP berwenang menangkap kapal, menyita, dan memeriksa"],        
        ["Pasal 84–93", "Ketentuan pidana", "Sanksi bom ikan: 10 tahun; tanpa SIPI: 6 tahun; IUU Fishing berat: seumur hidup"],      
      ],      
      [2000, 3000, 4026]    
    ),    
    emptyPara(0, 80),    
    infoBox(      
      "💡 Perubahan Signifikan UU No. 45/2009 dari UU No. 31/2004",      
      [        
        "Penguatan sanksi pidana: ancaman penjara dan denda diperberat secara signifikan untuk pelaku IUU Fishing.",        
        "Penambahan kewenangan PSDKP: pengawas KKP kini berstatus PPNS dengan kewenangan penyidikan penuh.",        
        "Pasal 69A: kapal IUU Fishing dapat ditenggelamkan oleh PSDKP tanpa menunggu putusan pengadilan.",        
        "Perlindungan nelayan kecil (< 10 GT) diperkuat: tidak diwajibkan SIPI, cukup tanda daftar (TDKPK).",      
      ]    
    ),    
    emptyPara(0, 120),    
    heading2("1.2 UU No. 27/2007 tentang Pengelolaan Wilayah Pesisir"),    
    bodyText(      
      "Undang-Undang No. 27/2007 jo. UU No. 1/2014 tentang Pengelolaan Wilayah Pesisir dan " +      
      "Pulau-Pulau Kecil (PWP3K) mengatur perencanaan, pemanfaatan, pengawasan, dan pengendalian " +      
      "wilayah pesisir secara terpadu dan berkelanjutan. UU ini memperkenalkan instrumen " +      
      "Rencana Zonasi Wilayah Pesisir dan Pulau-Pulau Kecil (RZWP3K)."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Instrumen Perencanaan", "Cakupan Wilayah", "Penyusun", "Masa Berlaku"],      
      [        
        ["RSWP3K (Rencana Strategis)", "Nasional — seluruh WP3K Indonesia", "KKP bersama K/L terkait", "20 tahun (dapat direvisi)"],        
        ["RZONASI Nasional (RZWP3K Nasional)", "Perairan laut nasional, ZEEI, Landas Kontinen", "KKP dan Kemenko Maritim", "20 tahun"],        
        ["RZWP3K Provinsi", "0–12 mil laut dari garis pantai provinsi", "Pemerintah Provinsi + DPRD", "20 tahun (review 5 tahun)"],        
        ["RENCANA ZONASI KAW. STRATEGIS (RZKN)", "Kawasan tertentu: pelabuhan, industri, konservasi", "K/L teknis + Pemda", "10–20 tahun"],        
        ["HP3 (Hak Pengusahaan Perairan Pesisir)", "Area konsesi pemanfaatan oleh swasta/masyarakat", "Diberikan KKP/Pemda", "20 tahun, dapat diperpanjang"],      
      ],      
      [2600, 2200, 2200, 2026]    
    ),    
    emptyPara(0, 80),    
    warnBox(      
      "⚠️ Larangan dalam UU No. 27/2007 jo. UU No. 1/2014",      
      [        
        "Dilarang memanfaatkan wilayah pesisir tanpa izin KKPRL (Kesesuaian Kegiatan Pemanfaatan Ruang Laut).",        
        "Dilarang melakukan reklamasi tanpa persetujuan Menteri KKP dan analisis AMDAL yang tuntas.",        
        "Dilarang mengkonversi mangrove dan ekosistem pesisir kritis tanpa izin lingkungan — sanksi pidana 2 tahun.",        
        "Pelanggaran RZWP3K: penjara maks. 2 tahun dan/atau denda maks. Rp 2 miliar (Pasal 75 UU No. 1/2014).",      
      ]    
    ),    
    emptyPara(0, 120),    
    heading2("1.3 Kebijakan Penangkapan Ikan Terukur (PIT)"),    
    bodyText(      
      "Penangkapan Ikan Terukur (PIT) adalah kebijakan transformasi tata kelola perikanan tangkap " +      
      "Indonesia yang diatur melalui PP No. 11/2023 dan Permen KP No. 28/2023. PIT menggantikan " +      
      "sistem perizinan lama yang berbasis ukuran kapal dengan sistem kuota berbasis " +      
      "Wilayah Pengelolaan Perikanan (WPP) dan jenis ikan."    
    ),    
    emptyPara(0, 80),    
    heading3("Arsitektur Sistem Penangkapan Ikan Terukur"),    
    dataTable(      
      ["Komponen PIT", "Deskripsi Detail"],      
      [        
        ["Dasar Hukum", "PP No. 11/2023 tentang Penangkapan Ikan Terukur; Permen KP No. 28/2023 tentang Pola Penangkapan Ikan Terukur"],        
        ["Prinsip Dasar", "Kuota berbasis stok ikan (MSY) per WPP per jenis ikan; JTB = 80% × MSY"],        
        ["Zona PIT 1", "Perairan pantai dan laut teritorial; pelaku: nelayan kecil & lokal; wajib mendarat di pelabuhan zona 1"],        
        ["Zona PIT 2", "WPP menengah, semi-offshore; pelaku: kapal 10–30 GT; wajib logbook harian dan laporan bulanan"],        
        ["Zona PIT 3", "ZEEI dan offshore industri; pelaku: kapal > 30 GT dan kapal asing; wajib VMS, e-logbook, observer"],        
        ["Sistem Kuota", "Kuota ditetapkan per tahun oleh KKP berdasarkan hasil kajian stok; dibagikan melalui lelang/penunjukan"],        
        ["PNBP PIT", "Penerimaan Negara Bukan Pajak berbasis hasil tangkapan nyata (bukan flat fee per kapal seperti sebelumnya)"],        
        ["Sanksi PIT", "Kapal yang melampaui kuota: SIPI dicabut; tangkapan di luar kuota disita; denda administratif"],      
      ],      
      [2600, 6426]    
    ),    
    emptyPara(0, 120),    
    heading2("1.4 Regulasi Karantina dan Bea Cukai Hasil Laut"),    
    bodyText(      
      "Karantina ikan dan pengawasan bea cukai hasil laut adalah gerbang terakhir pengendalian " +      
      "mutu dan kepatuhan perdagangan produk perikanan. Regulasi ini melindungi konsumen " +      
      "domestik dan menjaga kepercayaan mitra dagang internasional terhadap produk perikanan Indonesia."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Regulasi", "Instansi Pelaksana", "Ruang Lingkup", "Sanksi Pelanggaran"],      
      [        
        ["UU No. 21/2019 tentang Karantina Hewan, Ikan, dan Tumbuhan", "BKIPM KKP", "Pemeriksaan kesehatan ikan masuk/keluar wilayah RI; sertifikasi sanitasi ekspor", "Penjara maks. 2 tahun + denda Rp 2 miliar"],        
        ["PP No. 15/2002 tentang Karantina Ikan", "BKIPM KKP", "Prosedur karantina di pelabuhan; persyaratan Health Certificate (HC)", "Ikan ditolak masuk / dimusnahkan"],        
        ["Permen KP No. 53/2014 tentang Pemasukan Ikan", "KKP + Bea Cukai", "Daftar positif ikan yang boleh diimpor; dokumen Sertifikat Asal (Certificate of Origin)", "Ikan dimusnahkan, importir diblokir"],        
        ["PMK No. 26/2017 tentang Bea Masuk Ikan", "Ditjen Bea Cukai Kemenkeu", "Tarif bea masuk ikan: 0–5% (MFN); 0% untuk negara mitra FTA (ASEAN, Australia, dll)", "Sanksi denda bea cukai + bunga"],        
        ["Peraturan BKIPM Ekspor", "BKIPM KKP", "Health Certificate (HC), Free Sale Certificate (FSC) wajib untuk ekspor ke EU/AS/Jepang", "Ditolak masuk negara tujuan, denda importir"],      
      ],      
      [2400, 1600, 3000, 2026]    
    ),    
    emptyPara(0, 120),  
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 2: STRUKTUR KELEMBAGAAN PEMERINTAH
// ═══════════════════════════════════════════════════════════════════════════════
function bab2() {  
  return [    
    heading1("BAB 2: STRUKTUR KELEMBAGAAN PEMERINTAH"),    
    bodyText(      
      "Tata kelola sektor kelautan dan perikanan melibatkan banyak kementerian, lembaga, dan " +      
      "pemerintah daerah yang memiliki kewenangan berbeda namun saling berkaitan. " +      
      "Pemahaman tentang siapa berbuat apa di sektor ini penting agar pelaku usaha perikanan " +      
      "tahu ke mana mengurus izin, laporan, pengaduan, dan bantuan."    
    ),    
    emptyPara(),    
    heading2("2.1 Kewenangan KKP dan Dinas Kelautan & Perikanan Daerah"),    
    bodyText(      
      "Kementerian Kelautan dan Perikanan (KKP) adalah kementerian teknis yang bertanggung jawab " +      
      "atas pengelolaan dan pemanfaatan sumber daya kelautan dan perikanan secara nasional. " +      
      "Pascadesentralisasi, sebagian kewenangan dilimpahkan ke Dinas Kelautan & Perikanan (DKP) " +      
      "tingkat provinsi dan kabupaten/kota."    
    ),    
    emptyPara(0, 80),    
    heading3("Kewenangan Berdasarkan Hierarki Pemerintahan"),    
    dataTable(      
      ["Level", "Instansi", "Kewenangan Utama", "Jenis Izin yang Diterbitkan"],      
      [        
        ["Pusat", "Kementerian Kelautan & Perikanan (KKP)", "Kebijakan nasional, WPP, ZEEI, kapal > 30 GT, standar mutu, karantina ekspor", "SIUP > 30 GT, SIPI > 30 GT, IUPKAA, izin ekspor ikan"],        
        ["Provinsi", "Dinas Kelautan & Perikanan Provinsi", "Perairan 4–12 mil laut, kapal 10–30 GT, RZWP3K Provinsi", "SIUP 10–30 GT, SIPI 10–30 GT, SIKPI 10–30 GT"],        
        ["Kab/Kota", "Dinas DKP Kabupaten / Kota", "Perairan 0–4 mil laut, nelayan kecil, TPI/PPI, tambak desa", "TDKPK (< 10 GT), izin TPI/PPI kecil, izin tambak rakyat"],        
        ["Desa", "BPD / BUMDes / Panglima Laot", "Perairan desa, zonasi lokal, aturan adat laut", "Perdes zonasi, surat keterangan nelayan lokal"],      
      ],      
      [1400, 2200, 3200, 2226]    
    ),    
    emptyPara(0, 80),    
    heading3("Unit Pelaksana Teknis (UPT) Utama KKP"),    
    dataTable(      
      ["UPT / Satker", "Singkatan", "Fungsi Utama", "Lokasi"],      
      [        
        ["Direktorat Jenderal Perikanan Tangkap", "DJPT", "Regulasi, perizinan, dan pengembangan perikanan tangkap nasional", "Jakarta Pusat"],        
        ["Direktorat Jenderal Perikanan Budidaya", "DJPB", "Regulasi budi daya ikan, udang, rumput laut, dan mutiara", "Jakarta Pusat"],        
        ["Direktorat Jenderal Penguatan Daya Saing Produk KP", "DJPDSPKP", "Pengolahan, mutu, pemasaran, dan investasi produk perikanan", "Jakarta Pusat"],        
        ["Badan Karantina Ikan, Pengendalian Mutu", "BKIPM", "Karantina ikan, sertifikasi ekspor, Health Certificate, HACCP", "Seluruh pelabuhan laut & bandara"],        
        ["Pusat Pengendalian Sistem Informasi & Data", "PSDKP", "Pengawasan kapal, penindakan IUU Fishing, VMS, logbook", "Jakarta + 14 stasiun daerah"],        
        ["Balai Pelatihan & Penyuluhan Perikanan", "BPPP", "Pelatihan teknis, penyuluhan, sertifikasi kompetensi nelayan", "12 lokasi di seluruh Indonesia"],        
        ["Loka Riset Perikanan Tuna", "LRPT", "Penelitian stok, biologi, dan pengelolaan ikan tuna", "Benoa, Bali"],      
      ],      
      [2800, 1400, 3000, 1826]    
    ),    
    emptyPara(0, 120),    
    heading2("2.2 Koordinasi Lintas Sektor (BNPP, BAKAMLA, TNI-AL)"),    
    bodyText(      
      "Pengelolaan wilayah laut Indonesia yang begitu luas memerlukan koordinasi antar-lembaga " +      
      "yang efektif. Sektor perikanan bersinggungan dengan pertahanan, keamanan, imigrasi, " +      
      "dan batas wilayah — yang masing-masing ditangani oleh lembaga berbeda."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Lembaga", "Kepanjangan", "Peran dalam Sektor Kelautan-Perikanan", "Koordinasi dengan KKP"],      
      [        
        ["BNPP", "Badan Nasional Pengelola Perbatasan", "Pengembangan infrastruktur pulau-pulau terluar; pemukiman nelayan perbatasan", "Data nelayan perbatasan, program pemberdayaan pesisir terluar"],        
        ["BAKAMLA", "Badan Keamanan Laut RI", "Patroli keamanan maritim terpadu; koordinasi pemberantasan IUU Fishing di ZEEI", "Joint operation pengawasan kapal; pertukaran data VMS"],        
        ["TNI-AL", "Tentara Nasional Indonesia Angkatan Laut", "Penegakan hukum di ZEEI; penenggelaman kapal pencuri ikan; pengawalan kapal nelayan", "MOU penegakan hukum bersama di laut; dukungan operasi PSDKP"],        
        ["POLAIRUD", "Polisi Air dan Udara (Polri)", "Penyidikan tindak pidana perikanan di perairan dalam negeri", "Bantuan penyidikan kasus IUU Fishing di perairan non-ZEEI"],        
        ["Bea Cukai DJBC", "Direktorat Jenderal Bea dan Cukai", "Pengawasan ekspor-impor ikan; pemberantasan penyelundupan lobster, kepiting, benih ikan", "Joint operation di pelabuhan ekspor ikan; pertukaran data manifest kapal"],        
        ["Kemenhub (HUBLA)", "Direktorat Jenderal Perhubungan Laut", "Keselamatan kapal perikanan, sertifikasi laik laut, syahbandar pelabuhan", "Sinkronisasi data kapal, sertifikat BST ABK, SIPI vs dokumen kapal"],      
      ],      
      [1400, 2000, 3200, 2426]    
    ),    
    emptyPara(0, 120),    
    heading2("2.3 Desentralisasi dan Otonomi Daerah Bidang Kelautan"),    
    bodyText(      
      "Pasca-reformasi, UU No. 23/2014 tentang Pemerintahan Daerah mengatur kembali pembagian " +      
      "kewenangan di bidang kelautan dan perikanan. Perubahan ini berdampak besar pada " +      
      "penerbitan izin, pengelolaan TPI, dan program pemberdayaan nelayan di daerah."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Aspek Otonomi Daerah", "Sebelum UU 23/2014", "Sesudah UU 23/2014", "Dampak bagi Nelayan"],      
      [        
        ["Izin kapal 10–30 GT", "Bisa diterbitkan Kab/Kota", "Wajib diterbitkan Provinsi", "Nelayan harus ke ibu kota provinsi untuk urus SIPI"],        
        ["Pengelolaan TPI", "Kewenangan Kab/Kota", "Tetap Kab/Kota (TPI kecil)", "Tidak berubah untuk PPI/TPI kecil"],        
        ["Kawasan Konservasi (KKPD)", "Bisa ditetapkan Kab/Kota", "Wajib penetapan Provinsi", "Proses lebih panjang, koordinasi provinsi wajib"],        
        ["Data nelayan & kapal", "Tersebar di Kab/Kota", "Terintegrasi di sistem KKP (One Map Policy)", "Pendaftaran KUSUKA terpusat lebih mudah via online"],        
        ["Program bantuan kapal", "Melalui Dinas Kab/Kota", "Melalui Dinas Provinsi (koordinasi KKP)", "KUB harus terdaftar di Dinas Provinsi, bukan hanya Kab"],      
      ],      
      [2200, 2200, 2200, 2426]    
    ),    
    emptyPara(0, 120),    
    heading2("2.4 Badan Pengelola WPP Nasional"),    
    bodyText(      
      "Badan Pengelola WPP (BP-WPP) Nasional adalah lembaga koordinatif yang bertugas " +      
      "mengoordinasikan pengelolaan sumber daya ikan di 11 Wilayah Pengelolaan Perikanan (WPP) " +      
      "secara terpadu, melibatkan pemerintah pusat, daerah, akademisi, dan industri perikanan."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["WPP RI", "Cakupan Wilayah", "Komoditas Unggulan", "Isu Utama"],      
      [        
        ["WPP 571", "Selat Malaka & Laut Andaman", "Udang, kakap, tengiri", "Overfishing, konflik RI-Malaysia"],        
        ["WPP 572", "Samudera Hindia barat Sumatera", "Tuna, cakalang, tongkol", "Kapal asing ilegal, penangkapan berlebih tuna"],        
        ["WPP 573", "Samudera Hindia selatan Jawa–NTT", "Tuna sirip biru, lobster, cumi", "Penangkapan lobster berlebih"],        
        ["WPP 711", "Selat Karimata, Laut Natuna, Laut Cina Selatan", "Ikan pelagis kecil, cumi, kepiting", "Sengketa LCS, kapal Tiongkok illegal fishing"],        
        ["WPP 712", "Laut Jawa", "Udang, bawal, ikan demersal", "Overfishing berat, TPI penuh"],        
        ["WPP 713", "Selat Makassar, Teluk Bone, Laut Flores", "Cakalang, tuna, udang", "Bom ikan, kerusakan karang"],        
        ["WPP 714", "Teluk Tolo, Laut Banda", "Tuna, cakalang, teri", "IUU Fishing oleh kapal eks-asing"],        
        ["WPP 715", "Teluk Tomini, Laut Maluku, Laut Halmahera", "Ikan karang, tuna, udang", "Penangkapan ikan karang berlebih"],        
        ["WPP 716", "Laut Sulawesi, Samudera Pasifik (utara)", "Tuna sirip kuning, cakalang", "Penangkapan oleh kapal filipina & taiwan"],        
        ["WPP 717", "Teluk Cendrawasih, Samudera Pasifik (Papua)", "Tuna, udang barramundi, hiu paus", "Kawasan konservasi laut terbesar, akses terbatas"],        
        ["WPP 718", "Laut Aru, Laut Arafuru, Laut Timor", "Udang tiger, ikan demersal, teripang", "Overfishing udang, konflik RI-Australia"],      
      ],      
      [1200, 2600, 2400, 2826]    
    ),    
    emptyPara(0, 120),  
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 3: TATA KELOLA & PENGAWASAN
// ═══════════════════════════════════════════════════════════════════════════════
function bab3() {  
  return [    
    heading1("BAB 3: TATA KELOLA & PENGAWASAN"),    
    bodyText(      
      "Sistem tata kelola dan pengawasan perikanan Indonesia dirancang untuk memastikan " +      
      "bahwa setiap kapal penangkap ikan beroperasi sesuai dengan izin, kuota, jalur, dan " +      
      "alat tangkap yang diizinkan. Sistem pengawasan yang kuat adalah kunci memberantas " +      
      "praktik IUU Fishing yang merugikan nelayan sah dan menghancurkan ekosistem laut."    
    ),    
    emptyPara(),    
    heading2("3.1 Sistem Pengawasan SDKP (PSDKP)"),    
    bodyText(      
      "Direktorat Jenderal Pengawasan Sumber Daya Kelautan dan Perikanan (PSDKP) adalah " +      
      "lembaga penegak hukum di bawah KKP yang bertugas mengawasi dan menindak pelanggaran " +      
      "di bidang kelautan dan perikanan. PSDKP memiliki Penyidik Pegawai Negeri Sipil (PPNS) " +      
      "yang berwenang melakukan penyelidikan dan penyidikan tindak pidana perikanan."    
    ),    
    emptyPara(0, 80),    
    heading3("Struktur dan Kewenangan PSDKP"),    
    dataTable(      
      ["Unit PSDKP", "Cakupan Wilayah", "Armada & Fasilitas", "Kewenangan Hukum"],      
      [        
        ["Ditjen PSDKP (Pusat)", "Nasional — seluruh WPP RI & ZEEI", "Kapal Pengawas (KP) besar, helikopter, drone laut", "Penangkapan kapal, penyitaan, koordinasi penegakan hukum"],        
        ["Stasiun PSDKP (14 lokasi)", "Wilayah laut regional per zona", "KP sedang, RIB (Rigid Inflatable Boat), radar pantai", "Patroli rutin, pemeriksaan di pelabuhan, PPNS daerah"],        
        ["Satker Pengawasan Perikanan", "Kabupaten/Kota pesisir", "Speedboat pengawas, pos pengawasan TPI", "Pengawasan TPI, logbook, kapal < 30 GT"],        
        ["Kapal Pengawas (KP) PSDKP", "Seluruh perairan RI & ZEEI", "54 KP aktif (dari 30 GT hingga 1.200 GT)", "Stop, periksa, tangkap kapal pelanggar di semua zona"],      
      ],      
      [2200, 2200, 2600, 2026]    
    ),    
    emptyPara(0, 80),    
    infoBox(      
      "💡 Prosedur Pemeriksaan Kapal oleh PSDKP di Laut",      
      [        
        "Kapal pengawas PSDKP memberikan sinyal berhenti (VHF Ch. 16 + klakson + lampu) — kapal wajib berhenti.",        
        "Tim pemeriksa naik kapal dan meminta: SIPI, logbook, sertifikat kapal, daftar ABK, kondisi VMS.",        
        "Jika ditemukan pelanggaran: kapal digiring ke pelabuhan terdekat, nakhoda diperiksa, barang bukti disita.",        
        "Nelayan BERHAK meminta surat perintah pemeriksaan resmi dari PSDKP sebelum naik ke kapalnya.",      
      ]    
    ),    
    emptyPara(0, 120),    
    heading2("3.2 Vessel Monitoring System (VMS)"),    
    bodyText(      
      "VMS atau Sistem Pemantauan Kapal Perikanan (SPKP) adalah sistem pemantauan berbasis " +      
      "satelit yang melacak posisi dan pergerakan kapal perikanan secara real-time. Data VMS " +      
      "diterima oleh Fisheries Monitoring Center (FMC) KKP di Jakarta selama 24 jam penuh."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Aspek VMS", "Ketentuan / Detail"],      
      [        
        ["Dasar Hukum", "Permen KP No. 42/2015 tentang Sistem Pemantauan Kapal Perikanan; Permen KP No. 28/2023 (PIT)"],        
        ["Kapal Wajib VMS", "Semua kapal perikanan berbendera Indonesia > 30 GT; semua kapal asing (IUPKAA) tanpa batas GT"],        
        ["Frekuensi Pelaporan", "Otomatis setiap 30 menit saat di laut; setiap 60 menit saat di pelabuhan (standby mode)"],        
        ["Jenis Transponder", "Type Approved oleh KKP: Inmarsat-C, Iridium, atau VSAT sesuai zona operasi"],        
        ["Data yang Dikirim", "Posisi GPS (lintang/bujur), kecepatan, heading (arah haluan), waktu, identitas kapal"],        
        ["Larangan Keras", "Dilarang mematikan transponder di laut; dilarang memanipulasi sinyal; denda + cabut SIPI"],        
        ["Dark Vessel Detection", "Kapal yang mematikan VMS > 12 jam terdeteksi via citra satelit SAR (Bakamla + KKP)"],        
        ["Data VMS & Logbook", "Data VMS dicocokkan dengan logbook — inkonsistensi posisi vs tangkapan = indikasi IUU Fishing"],      
      ],      
      [2600, 6426]    
    ),    
    emptyPara(0, 120),    
    heading2("3.3 Pemberantasan IUU Fishing"),    
    bodyText(      
      "IUU Fishing (Illegal, Unreported, Unregulated Fishing) adalah ancaman terbesar bagi " +      
      "keberlanjutan sumber daya perikanan Indonesia. Kerugian akibat IUU Fishing diperkirakan " +      
      "mencapai USD 3–4 miliar per tahun. Indonesia telah menjadi pemimpin global dalam " +      
      "kebijakan pemberantasan IUU Fishing, terutama di era 2014–2019."    
    ),    
    emptyPara(0, 80),    
    heading3("Definisi dan Klasifikasi IUU Fishing"),    
    dataTable(      
      ["Kategori", "Definisi", "Contoh Pelanggaran di Indonesia"],      
      [        
        ["Illegal Fishing", "Penangkapan tanpa izin atau melanggar ketentuan izin yang berlaku", "Kapal asing masuk ZEEI tanpa IUPKAA; kapal dalam negeri tanpa SIPI; menangkap di luar jalur izin"],        
        ["Unreported Fishing", "Penangkapan yang tidak dilaporkan atau dilaporkan tidak akurat kepada otoritas yang berwenang", "Logbook diisi tidak jujur; tangkapan dijual langsung ke cold storage swasta tanpa melalui TPI; alih muatan (transhipment) di laut gelap"],        
        ["Unregulated Fishing", "Penangkapan di area tanpa regulasi atau oleh entitas yang tidak tunduk pada perjanjian konservasi", "Penangkapan di laut lepas di luar kewenangan RFMO; spesies baru tanpa regulasi khusus"],      
      ],      
      [1800, 2800, 4426]    
    ),    
    emptyPara(0, 80),    
    heading3("Kebijakan Pemberantasan IUU Fishing Indonesia"),    
    dataTable(      
      ["Kebijakan / Tindakan", "Dasar Hukum", "Dampak"],      
      [        
        ["Moratorium kapal eks-asing (2014)", "Permen KP No. 56/2014", "Ratusan kapal asing yang berpindah bendera dilarang beroperasi"],        
        ["Penenggelaman kapal pelanggar", "Pasal 69A UU No. 45/2009", "400+ kapal asing ditenggelamkan 2014–2019; efek jera signifikan"],        
        ["Larangan alih muatan (transhipment) di laut", "Permen KP No. 57/2014", "Seluruh hasil tangkapan wajib dibongkar di pelabuhan Indonesia"],        
        ["Pemantauan VMS 24 jam", "Permen KP No. 42/2015", "FMC KKP memantau 3.000+ kapal secara real-time"],        
        ["Port State Measures Agreement (PSMA)", "Perpres No. 43/2016", "RI menolak kapal IUU Fishing asing bersandar di pelabuhan Indonesia"],        
        ["Sertifikasi Catch Certificate", "Permen KP No. 43/2017", "Setiap ikan yang diekspor wajib dilengkapi sertifikat asal tangkapan yang sah"],      
      ],      
      [2400, 2200, 4426]    
    ),    
    emptyPara(0, 80),    
    warnBox(      
      "⚠️ Sanksi Pidana IUU Fishing — Tabel Hukuman (UU No. 45/2009)",      
      [        
        "Menangkap ikan tanpa SIPI: penjara maks. 6 tahun + denda maks. Rp 2 miliar (Pasal 93).",        
        "Menggunakan bahan peledak / racun / listrik: penjara maks. 10 tahun + denda maks. Rp 1,2 miliar (Pasal 84).",        
        "Kapal asing tanpa izin di ZEEI: penjara maks. 6 tahun + denda maks. Rp 20 miliar (Pasal 93 Ayat 2).",        
        "Memalsukan dokumen kapal / SIPI: penjara maks. 7 tahun + denda maks. Rp 3 miliar (Pasal 100B).",        
        "Tindak pidana oleh korporasi: denda diperberat 3× + pencabutan izin usaha (Pasal 101).",      
      ]    
    ),    
    emptyPara(0, 120),    
    heading2("3.4 Akuntabilitas dan Transparansi Pengelolaan"),    
    bodyText(      
      "Akuntabilitas dan transparansi dalam tata kelola perikanan memastikan bahwa sumber daya " +      
      "laut dikelola untuk kepentingan publik, bukan kepentingan segelintir pihak. Instrumen " +      
      "transparansi mencakup keterbukaan data, audit independen, dan partisipasi publik dalam " +      
      "pengambilan kebijakan perikanan."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Instrumen Transparansi", "Wujud Nyata", "Manfaat bagi Nelayan"],      
      [        
        ["Satu Data Kelautan & Perikanan (One Data KKP)", "Portal data.kkp.go.id: data produksi, harga ikan, jumlah kapal, WPP, stok ikan dapat diakses publik", "Nelayan bisa cek kuota tersisa, data harga, regulasi terbaru secara mandiri"],        
        ["Laporan Tahunan KKP", "Laporan kinerja dipublikasikan setiap tahun di website KKP; dapat diunduh oleh siapapun", "Transparansi penggunaan anggaran dan pencapaian program pemberdayaan nelayan"],        
        ["SILK (Sistem Informasi Logistik KP)", "Platform digital untuk memonitor distribusi ikan dari pelabuhan ke pasar — mencegah mark-up harga", "Nelayan mendapat harga referensi yang lebih jujur dari pengepul"],        
        ["Pengaduan Masyarakat (Lapor!)", "Platform lapor.go.id dan call center KKP 1500-313 untuk laporan illegal fishing & korupsi", "Nelayan dapat melaporkan kapal illegal atau oknum pungutan liar tanpa takut"],        
        ["Catch Documentation Scheme (CDS)", "Sertifikasi legalitas tangkapan ikan dari kapal ke konsumen akhir (ekspor)", "Produk nelayan sah mendapat harga premium karena dapat dibuktikan legal"],      
      ],      
      [2400, 3600, 3026]    
    ),    
    emptyPara(0, 120),  
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 4: KERJASAMA & PERJANJIAN INTERNASIONAL
// ═══════════════════════════════════════════════════════════════════════════════
function bab4() {  
  return [    
    heading1("BAB 4: KERJASAMA & PERJANJIAN INTERNASIONAL"),    
    bodyText(      
      "Indonesia sebagai negara kepulauan terbesar di dunia dengan ZEE terluas kedua di dunia " +      
      "memiliki kepentingan strategis dalam forum internasional kelautan dan perikanan. " +      
      "Perjanjian dan kerjasama internasional memengaruhi langsung hak nelayan Indonesia, " +      
      "akses ekspor, standar mutu, dan pengelolaan stok ikan lintas batas."    
    ),    
    emptyPara(),    
    heading2("4.1 UNCLOS 1982 dan Implementasinya"),    
    bodyText(      
      "United Nations Convention on the Law of the Sea (UNCLOS) 1982 atau Konvensi Hukum Laut " +      
      "PBB adalah perjanjian internasional yang mengatur hak dan kewajiban negara di laut. " +      
      "Indonesia meratifikasi UNCLOS melalui UU No. 17/1985 dan UNCLOS menjadi dasar hukum " +      
      "klaim wilayah laut serta hak penangkapan ikan Indonesia."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Zona Laut UNCLOS", "Batas", "Hak Indonesia", "Kewajiban Indonesia"],      
      [        
        ["Perairan Pedalaman", "Di dalam garis pangkal lurus", "Kedaulatan penuh, hak eksklusif semua SDA", "Menjamin keselamatan navigasi di selat strategis"],        
        ["Laut Teritorial", "0–12 mil dari garis pangkal", "Kedaulatan penuh; kapal asing wajib izin lintas", "Memberikan hak lintas damai (innocent passage)"],        
        ["Zona Tambahan", "12–24 mil dari garis pangkal", "Penegakan bea cukai, imigrasi, sanitasi, fiskal", "Tidak ada hak eksklusif SDA di zona ini"],        
        ["Zona Ekonomi Eksklusif (ZEE/ZEEI)", "0–200 mil dari garis pangkal", "Hak eksklusif eksplorasi, eksploitasi, dan konservasi SDA", "Memberikan akses kepada negara landlocked; membagi surplus ke negara lain jika ada"],        
        ["Landas Kontinen", "Hingga 350 mil (sesuai geologi)", "Hak eksklusif eksplorasi SDA dasar laut (minyak, gas, mineral, karang)", "Membayar kontribusi ke ISA jika melampaui 200 mil"],        
        ["Laut Bebas (High Seas)", "Di luar 200 mil", "Hak lintas, penangkapan ikan, penelitian (tidak eksklusif)", "Wajib patuhi peraturan RFMO & konservasi spesies straddling"],      
      ],      
      [1800, 2000, 2800, 2426]    
    ),    
    emptyPara(0, 80),    
    infoBox(      
      "💡 Kasus Hukum Laut Penting yang Memengaruhi Perikanan Indonesia",      
      [        
        "Sengketa Natuna (2019–kini): kapal coast guard Tiongkok mengklaim LCS tumpang-tindih ZEEI RI di WPP 711 — RI menolak klaim 9-Dash Line berdasarkan UNCLOS.",        
        "Putusan Arbitrase Laut Cina Selatan (2016): Mahkamah Arbitrase UNCLOS memutuskan klaim 9-Dash Line Tiongkok tidak sah — mendukung posisi hukum Indonesia.",        
        "Timor Leste & Celah Timor: negosiasi batas maritim RI-Timor Leste; berdampak pada hak penangkapan ikan nelayan NTT di WPP 573.",        
        "Insiden Kapal Nelayan di Perairan Perbatasan: kasus penahanan nelayan RI oleh Malaysia/Vietnam sering menggunakan kerangka UNCLOS sebagai referensi sengketa.",      
      ]    
    ),    
    emptyPara(0, 120),    
    heading2("4.2 Kerjasama Regional Perikanan (WCPFC, IOTC)"),    
    bodyText(      
      "Sebagai negara produsen tuna terbesar di dunia, Indonesia adalah anggota aktif beberapa " +      
      "Organisasi Pengelolaan Perikanan Regional (RFMO) yang mengatur penangkapan ikan tuna " +      
      "dan spesies straddling di laut bebas dan ZEE negara anggota."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["RFMO", "Kepanjangan", "Cakupan Wilayah", "Peran Indonesia", "Kuota/Ketentuan Kunci"],      
      [        
        ["WCPFC", "Western and Central Pacific Fisheries Commission", "Samudera Pasifik Barat dan Tengah (WPP 716, 717)", "Anggota penuh; berkontribusi data tangkapan tuna", "Kuota tuna sirip kuning (bigeye) dibatasi per flag state"],        
        ["IOTC", "Indian Ocean Tuna Commission", "Samudera Hindia (WPP 572, 573)", "Anggota penuh; seat di komite ilmiah", "MSE (Management Strategy Evaluation) tuna sirip kuning & mata besar"],        
        ["CCSBT", "Commission for the Conservation of Southern Bluefin Tuna", "Seluruh distribusi tuna sirip biru selatan", "Anggota kerjasama (cooperating non-member)", "Kuota global 17.647 ton/tahun; RI mendapat jatah kecil sebagai CNM"],        
        ["APFIC", "Asia-Pacific Fishery Commission (FAO)", "Seluruh Asia-Pasifik termasuk perikanan pantai", "Anggota aktif, sering menjadi tuan rumah sidang", "Rekomendasi non-binding tentang pengelolaan perikanan pantai"],        
        ["CTI-CFF", "Coral Triangle Initiative on Coral Reefs, Fisheries and Food Security", "Segitiga Terumbu Karang (RI, Filipina, Malaysia, PNG, Timor Leste, Solomon)", "Salah satu pemrakarsa utama bersama AS", "Perlindungan 75% terumbu karang dunia; perlindungan habitat ikan pelagis"],      
      ],      
      [1200, 2400, 1800, 2000, 1626]    
    ),    
    emptyPara(0, 120),    
    heading2("4.3 FAO Code of Conduct for Responsible Fisheries (CCRF)"),    
    bodyText(      
      "Kode Etik Perikanan Bertanggung Jawab FAO (CCRF 1995) adalah panduan internasional non-mengikat " +      
      "yang mengatur standar perilaku bertanggung jawab dalam pengelolaan dan pengembangan perikanan. " +      
      "Meskipun tidak memiliki kekuatan hukum mengikat, CCRF menjadi referensi utama " +      
      "kebijakan perikanan di lebih dari 170 negara termasuk Indonesia."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Artikel CCRF", "Pokok Ketentuan", "Implementasi di Indonesia"],      
      [        
        ["Artikel 6 — Prinsip Umum", "Perikanan harus dikelola berdasarkan MSY dengan pendekatan kehati-hatian (precautionary approach)", "JTB = 80% MSY; closed season lobster; moratorium kapal eks-asing"],        
        ["Artikel 7 — Pengelolaan Perikanan", "Negara harus menetapkan standar teknis alat tangkap; memantau stok; menetapkan kuota berbasis sains", "Sistem PIT (PP No. 11/2023); kajian stok WPP oleh KKP; larangan trawl (Permen KP No. 2/2015)"],        
        ["Artikel 8 — Operasi Penangkapan", "Kapal harus berlayar dengan izin sah; logbook wajib; tidak melakukan transhipment ilegal di laut", "Wajib SIPI; logbook/e-logbook; larangan transhipment di laut (Permen KP No. 57/2014)"],        
        ["Artikel 9 — Budi Daya", "Budi daya harus memperhatikan lingkungan; biosecurity; tidak mengganggu ekosistem alami", "AMDAL/UKL-UPL tambak; standar CBIB (Cara Budi daya Ikan yang Baik) KKP"],        
        ["Artikel 11 — Pasca-Panen & Perdagangan", "Standar mutu dan keamanan pangan harus diterapkan; label asal produk transparan", "HACCP wajib ekspor; sertifikasi ekolabel MSC; Catch Certificate untuk ekspor"],        
        ["Artikel 12 — Penelitian Perikanan", "Negara harus mendanai penelitian stok; berbagi data dengan RFMO; integrasikan pengetahuan lokal", "BRIN + KKP melakukan kajian stok WPP; data dibagi ke IOTC & WCPFC"],      
      ],      
      [2000, 3200, 3826]    
    ),    
    emptyPara(0, 120),    
    heading2("4.4 Negosiasi Akses dan Perjanjian Bilateral Perikanan"),    
    bodyText(      
      "Perjanjian bilateral perikanan mengatur hak akses negara asing ke ZEE Indonesia dan " +      
      "sebaliknya. Indonesia juga menegosiasikan akses pasar untuk produk ikan melalui " +      
      "perjanjian perdagangan bebas (FTA) yang berdampak langsung pada nilai ekspor dan " +      
      "harga di tingkat nelayan."    
    ),    
    emptyPara(0, 80),    
    dataTable(      
      ["Perjanjian / Kerjasama", "Negara Mitra", "Substansi Utama", "Dampak bagi Nelayan"],      
      [        
        ["Perjanjian Bilateral Perikanan RI-PNG", "Papua Nugini", "Akses kapal RI ke ZEE PNG; kewajiban pembayaran akses fee; ketentuan awak kapal lokal", "Armada tuna RI mendapat akses legal ke fishing ground di Pasifik"],        
        ["IJEPA — Indonesia Japan EPA", "Jepang", "Tarif bea masuk 0% untuk udang, tuna, ikan segar RI ke Jepang; sertifikasi HACCP wajib", "Ekspor udang & tuna RI ke Jepang lebih kompetitif; tuntutan mutu ketat"],        
        ["ASEAN Trade in Goods Agreement (ATIGA)", "Seluruh ASEAN", "Tarif 0% produk ikan antar negara ASEAN; kemudahan sertifikasi asal (SKA Form D)", "Ekspor ikan RI ke Thailand, Vietnam, Singapura bebas bea; persaingan dengan Vietnam ketat"],        
        ["RI-EU Comprehensive Economic Partnership (CEPA)", "Uni Eropa (27 negara)", "Akses pasar ikan RI ke EU; kewajiban HACCP, MSC, Catch Certificate; IUU Fishing warning card", "Peluang ekspor besar ke EU; syarat keberlanjutan sangat ketat"],        
        ["Perjanjian Akses Timbal Balik RI-Australia", "Australia", "Hak tradisional nelayan Madura di Ashmore Reef; batas wilayah tangkap", "Nelayan tradisional Sulawesi/NTT dilindungi haknya di perairan tertentu"],        
        ["CTI-CFF Marine Protected Area Plan", "6 negara Segitiga Terumbu Karang", "Jaringan MPA lintas batas; restorasi karang bersama; bagi data monitoring", "Kawasan konservasi laut terlindungi; pembatasan tangkap di zona inti CTI"],      
      ],      
      [2400, 1600, 2600, 2426]    
    ),    
    emptyPara(0, 80),    
    tipBox(      
      "✅ Dokumen Ekspor Ikan yang Harus Disiapkan Pengusaha Perikanan",      
      [        
        "Health Certificate (HC): diterbitkan BKIPM KKP — bukti ikan bebas penyakit dan aman dikonsumsi.",        
        "Catch Certificate (CC): membuktikan ikan ditangkap secara legal (bukan IUU Fishing) — wajib untuk ekspor ke EU.",        
        "Certificate of Origin (SKA Form D / Form E): membuktikan asal produk Indonesia — syarat tarif preferensial ASEAN/FTA.",        
        "HACCP Certificate: wajib untuk ekspor ke AS (FDA), Jepang (MHLW), dan EU (RASFF) — diterbitkan BKIPM.",        
        "Free Sale Certificate (FSC): bukti produk legal beredar di Indonesia — diperlukan beberapa negara tujuan ekspor.",      
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
    heading2("5.1 Poin-Poin Kunci Modul V"),    
    dataTable(      
      ["Topik", "Poin Kunci (Hafal!)"],      
      [        
        ["UU No. 45/2009", "Landasan hukum utama perikanan RI; Pasal 69A: kapal IUU Fishing bisa ditenggelamkan tanpa pengadilan"],        
        ["UU No. 27/2007", "PWP3K: mengatur RZWP3K Provinsi (0–12 mil); HP3 (Hak Pengusahaan Perairan Pesisir)"],        
        ["PIT", "Penangkapan Ikan Terukur; PP No. 11/2023; 3 zona kuota; PNBP berbasis hasil tangkap nyata"],        
        ["BKIPM", "Badan Karantina Ikan, Pengendalian Mutu & Keamanan Hasil Perikanan — penerbit HC dan HACCP"],        
        ["PSDKP", "Pengawasan SDKP; 54 Kapal Pengawas; PPNS berwenang penyidikan; 14 stasiun daerah"],        
        ["VMS/SPKP", "Wajib kapal > 30 GT; transponder kirim data setiap 30 menit; dilarang dimatikan saat beroperasi"],        
        ["IUU Fishing", "Illegal + Unreported + Unregulated Fishing; kerugian USD 3–4 miliar/tahun bagi RI"],        
        ["UNCLOS 1982", "ZEE = 200 mil; hak eksklusif Indonesia; diratifikasi UU No. 17/1985"],        
        ["WPP 711", "Laut Natuna/LCS — rawan konflik kapal Tiongkok; RI tolak 9-Dash Line berdasarkan UNCLOS"],        
        ["WCPFC", "RFMO Pasifik Barat-Tengah; kuota tuna bigeye per flag state; RI anggota penuh"],        
        ["IOTC", "RFMO Samudera Hindia; kuota tuna sirip kuning & mata besar; RI anggota penuh"],        
        ["CCRF FAO 1995", "Kode etik perikanan bertanggung jawab; tidak mengikat hukum tetapi menjadi acuan global"],        
        ["Catch Certificate", "Dokumen wajib ekspor ikan ke EU — membuktikan ikan ditangkap secara legal (bukan IUU Fishing)"],        
        ["Penenggelaman Kapal", "Pasal 69A UU 45/2009; 400+ kapal asing ditenggelamkan 2014–2019 sebagai efek jera IUU Fishing"],      
      ],      
      [2800, 6226]    
    ),    
    emptyPara(0, 160),    
    heading2("5.2 Istilah-Istilah Penting Modul V"),    
    dataTable(      
      ["Istilah", "Arti"],      
      [        
        ["UNCLOS", "United Nations Convention on the Law of the Sea — Konvensi Hukum Laut PBB 1982"],        
        ["ZEEI", "Zona Ekonomi Eksklusif Indonesia — wilayah laut 200 mil dari garis pangkal; hak eksklusif SDA"],        
        ["WPP", "Wilayah Pengelolaan Perikanan — 11 zona pengelolaan ikan di seluruh perairan Indonesia"],        
        ["RFMO", "Regional Fisheries Management Organization — organisasi regional pengelola perikanan laut bebas"],        
        ["WCPFC", "Western and Central Pacific Fisheries Commission — RFMO Samudera Pasifik Barat-Tengah (tuna)"],        
        ["IOTC", "Indian Ocean Tuna Commission — RFMO Samudera Hindia (tuna)"],        
        ["CCRF", "Code of Conduct for Responsible Fisheries FAO 1995 — kode etik perikanan bertanggung jawab"],        
        ["IUU Fishing", "Illegal, Unreported, Unregulated Fishing — penangkapan ikan ilegal, tidak dilaporkan, tidak diatur"],        
        ["PSDKP", "Direktorat Jenderal Pengawasan Sumber Daya Kelautan dan Perikanan — penegak hukum perikanan KKP"],        
        ["PPNS", "Penyidik Pegawai Negeri Sipil — pegawai KKP/PSDKP yang berwenang melakukan penyidikan pidana"],        
        ["VMS/SPKP", "Vessel Monitoring System / Sistem Pemantauan Kapal Perikanan — pelacak GPS satelit kapal"],        
        ["FMC", "Fisheries Monitoring Center — pusat pemantauan kapal perikanan berbasis VMS milik KKP"],        
        ["PIT", "Penangkapan Ikan Terukur — sistem kuota berbasis WPP dan jenis ikan (PP No. 11/2023)"],        
        ["HP3", "Hak Pengusahaan Perairan Pesisir — izin konsesi pemanfaatan kawasan pesisir jangka panjang"],        
        ["RZWP3K", "Rencana Zonasi Wilayah Pesisir dan Pulau-Pulau Kecil — tata ruang laut 0–12 mil laut"],        
        ["Catch Certificate", "Sertifikat tangkapan legal — wajib untuk ekspor ikan ke Uni Eropa; mencegah produk IUU masuk pasar"],        
        ["PSMA", "Port State Measures Agreement — perjanjian melarang kapal IUU Fishing masuk pelabuhan negara anggota"],        
        ["CTI-CFF", "Coral Triangle Initiative — kerjasama 6 negara perlindungan terumbu karang & perikanan Segitiga Terumbu Karang"],      
      ],      
      [2200, 6826]    
    ),    
    emptyPara(0, 160),    
    heading2("5.3 Soal Latihan"),    
    bodyText("Jawab pertanyaan berikut untuk mengukur pemahaman Modul V:"),    
    emptyPara(0, 80),    
    ...[      
      "1. Jelaskan perbedaan antara Laut Teritorial (0–12 mil) dan Zona Ekonomi Eksklusif (0–200 mil) Indonesia berdasarkan UNCLOS 1982! Hak apa yang dimiliki Indonesia di masing-masing zona tersebut?",      
      "2. Apa yang dimaksud dengan IUU Fishing? Jelaskan ketiga kategorinya (Illegal, Unreported, Unregulated) beserta contoh konkret yang pernah terjadi di perairan Indonesia!",      
      "3. Sebutkan 4 dokumen yang wajib disiapkan pengusaha perikanan Indonesia untuk mengekspor produk ikan ke Uni Eropa! Jelaskan fungsi masing-masing dokumen!",      
      "4. Mengapa Indonesia bergabung dengan WCPFC dan IOTC? Apa konsekuensi keanggotaan tersebut terhadap hak penangkapan tuna oleh armada kapal Indonesia?",      
      "5. Jelaskan perubahan kewenangan perizinan kapal 10–30 GT setelah berlakunya UU No. 23/2014 tentang Pemerintahan Daerah! Apa dampaknya bagi nelayan di daerah terpencil?",      
      "6. Apa yang dimaksud dengan Penangkapan Ikan Terukur (PIT)? Jelaskan perbedaan kewajiban antara Zona PIT 1, 2, dan 3!",      
      "7. Seorang nakhoda kapal 50 GT mematikan transponder VMS selama 18 jam di ZEEI. Apa konsekuensi hukumnya berdasarkan regulasi yang berlaku?",      
      "8. Jelaskan bagaimana Panglima Laot di Aceh berfungsi sebagai instrumen co-management dalam kerangka sistem hukum perikanan Indonesia yang formal!",    
    ].map(q => bodyText(q)),    
    emptyPara(0, 80),    
    tipBox(      
      "📝 Kunci Jawaban Soal No. 7 — Sanksi Mematikan VMS",      
      [        
        "Berdasarkan Permen KP No. 42/2015: kapal wajib menjaga VMS aktif selama beroperasi di laut.",        
        "Mematikan VMS > 12 jam terdeteksi sebagai 'dark vessel' melalui citra satelit SAR (Bakamla + KKP).",        
        "Sanksi administratif: SIPI dapat dicabut; kapal dipanggil ke pelabuhan untuk pemeriksaan PSDKP.",        
        "Jika terbukti mematikan VMS untuk menyembunyikan aktivitas IUU Fishing: dikenakan pasal pemalsuan data + pidana perikanan.",        
        "Nakhoda juga dapat dikenai Pasal 100B UU No. 45/2009: penjara maks. 7 tahun + denda Rp 3 miliar.",      
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
        new TextRun({ text: "Modul V: Aspek Kelembagaan Kelautan & Perikanan", bold: true, color: C.blue, size: 18, font: "Arial" }),      
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
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },      
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },    
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
  fs.writeFileSync("./KNMP_Modul_V_Kelembagaan_Kelautan_Perikanan.docx", buffer);  
  console.log("Done!");
}).catch(err => console.error(err));