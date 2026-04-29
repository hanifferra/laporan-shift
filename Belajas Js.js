"console.log(typeof mahasiswa);     // object",
    ]),
    sp(100),

    sub("Null dan Undefined", col),
    sp(60),
    para("Null dan undefined keduanya mewakili \"tidak ada nilai\", tapi dengan nuansa berbeda:"),
    bul([trb("null: "), tr("nilai kosong yang disengaja. Programmer secara eksplisit menetapkan nilai ini untuk menandakan \"tidak ada data\".")]),
    bul([trb("undefined: "), tr("variabel yang sudah dideklarasikan tapi belum pernah diberi nilai. JavaScript memberikan undefined secara otomatis.")]),
    sp(40),
    codeBlockFlat([
      "let dataPengguna = null;       // sengaja dikosongkan",
      "let hasilPencarian;            // belum diisi → undefined",
      "",
      "console.log(dataPengguna);     // null",
      "console.log(hasilPencarian);   // undefined",
      "",
      "// Perbedaan typeof",
      "console.log(typeof null);      // \"object\" (quirk lama JavaScript)",
      "console.log(typeof undefined); // \"undefined\"",
      "",
      "// Cek null dengan ===",
      "if (dataPengguna === null) {",
      "  console.log(\"Data belum ada.\");",
      "}",
    ]),
    sp(60),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 3 — FUNGSI
// ═══════════════════════════════════════════════════════════════════════════════
function bab3() {
  const col = COLS[2];
  return [
    pgBreak,
    sectionBanner("Bab 03","","Fungsi (Function)", col),
    sp(80),
    para("Fungsi adalah salah satu konsep terpenting dalam pemrograman. Bayangkan fungsi seperti resep masakan: kamu tulis sekali, dan bisa digunakan berkali-kali setiap saat dibutuhkan, bahkan dengan bahan (parameter) yang berbeda-beda. Fungsi membuat kode lebih terorganisir, mudah dibaca, dan tidak berulang."),
    sp(40),
    para("Prinsip DRY (Don't Repeat Yourself) adalah alasan utama kita menggunakan fungsi — jika ada logika yang sama dipakai di banyak tempat, taruh di fungsi, lalu panggil dari mana saja."),
    sp(80),

    sub("Anatomi Sebuah Fungsi", col),
    sp(60),
    codeBlockFlat([
      "//  kata kunci   nama fungsi   parameter",
      "//       |            |            |",
      "function hitungLuas  (panjang, lebar) {",
      "  const luas = panjang * lebar; // isi / body fungsi",
      "  return luas;                  // nilai yang dikembalikan",
      "}",
      "",
      "// Memanggil fungsi:",
      "const hasilA = hitungLuas(10, 5);",
      "const hasilB = hitungLuas(8, 3);",
      "console.log(hasilA); // 50",
      "console.log(hasilB); // 24",
    ]),
    sp(100),

    sub("Function Declaration", col),
    sp(60),
    para("Function declaration adalah cara klasik mendefinisikan fungsi menggunakan kata kunci function. Keistimewaannya: function declaration mengalami hoisting — artinya fungsi bisa dipanggil bahkan sebelum baris kodenya muncul. Ini berguna tapi juga bisa membingungkan, sehingga kebiasaan baik tetap mendeklarasikan fungsi sebelum dipakai."),
    sp(40),
    codeBlockFlat([
      "// Fungsi tanpa nilai kembalian (void)",
      "function tampilkanSalam(nama) {",
      "  console.log(`Selamat datang, ${nama}!`);",
      "}",
      "",
      "// Fungsi dengan nilai kembalian",
      "function tambah(a, b) {",
      "  return a + b;",
      "}",
      "",
      "// Fungsi dengan parameter default",
      "function buatSapaan(nama, gelar = \"Kak\") {",
      "  return `Halo, ${gelar} ${nama}!`;",
      "}",
      "",
      "tampilkanSalam(\"Rudi\");            // Selamat datang, Rudi!",
      "console.log(tambah(15, 27));      // 42",
      "console.log(buatSapaan(\"Ani\"));   // Halo, Kak Ani!",
      "console.log(buatSapaan(\"Ahmad\", \"Pak\")); // Halo, Pak Ahmad!",
    ]),
    sp(100),

    sub("Arrow Function — Sintaks Modern", col),
    sp(60),
    para("Arrow function diperkenalkan di ES6 dan langsung populer karena penulisannya yang jauh lebih ringkas. Fungsi ini cocok untuk fungsi-fungsi pendek, callback, dan operasi transformasi data. Perlu diingat: arrow function tidak memiliki this sendiri — ia mewarisi this dari konteks di luarnya (ini penting saat bekerja dengan object dan class)."),
    sp(40),
    codeBlockFlat([
      "// Satu baris — tanda kurung dan return otomatis",
      "const kuadrat   = (n)      => n * n;",
      "const kalikan   = (a, b)   => a * b;",
      "const sapaPagi  = (nama)   => `Pagi, ${nama}!`;",
      "",
      "// Satu parameter — kurung boleh dihilangkan",
      "const duaKali   = n        => n * 2;",
      "",
      "// Tanpa parameter — kurung wajib",
      "const getNow    = ()       => new Date().getFullYear();",
      "",
      "// Multi-baris — butuh kurung kurawal dan return",
      "const hitungBMI = (berat, tinggi) => {",
      "  const tbm = tinggi / 100;         // ubah cm ke meter",
      "  const bmi = berat / (tbm * tbm);",
      "  return Math.round(bmi * 10) / 10; // bulatkan 1 desimal",
      "};",
      "",
      "console.log(kuadrat(9));            // 81",
      "console.log(hitungBMI(60, 165));    // 22",
    ]),
    sp(100),

    sub("Fungsi sebagai Nilai (First-Class Function)", col),
    sp(60),
    para("Di JavaScript, fungsi adalah first-class citizen — artinya fungsi bisa diperlakukan seperti nilai biasa: disimpan di variabel, dikirim sebagai argumen ke fungsi lain (callback), bahkan dikembalikan dari fungsi lain. Ini adalah fitur sangat kuat yang menjadi dasar dari functional programming."),
    sp(40),
    codeBlockFlat([
      "// Fungsi disimpan dalam variabel",
      "const sapa = function(nama) {",
      "  return `Hai, ${nama}!`;",
      "};",
      "",
      "// Fungsi sebagai argumen (callback)",
      "function prosesData(data, transform) {",
      "  return transform(data);",
      "}",
      "",
      "const hasilBesar = prosesData(\"halo\", (s) => s.toUpperCase());",
      "console.log(hasilBesar); // HALO",
      "",
      "// Immediately Invoked Function Expression (IIFE)",
      "const hasilLangsung = ((x, y) => x + y)(10, 20);",
      "console.log(hasilLangsung); // 30",
    ]),
    sp(60),
    infoBox([
      "Gunakan arrow function untuk fungsi pendek dan callback.",
      "Gunakan function declaration untuk fungsi utama yang lebih besar.",
      "Selalu beri nama yang deskriptif: hitungTotal lebih baik dari hitung.",
    ], col, "Tips Penulisan Fungsi"),
    sp(60),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 4 — KONTROL FLOW
// ═══════════════════════════════════════════════════════════════════════════════
function bab4() {
  const col = COLS[3];
  return [
    pgBreak,
    sectionBanner("Bab 04","","Kontrol Flow", col),
    sp(80),
    para("Kontrol flow (alur kendali) adalah mekanisme yang mengatur urutan eksekusi kode berdasarkan kondisi tertentu atau perulangan. Tanpa kontrol flow, program hanya berjalan lurus dari atas ke bawah tanpa bisa mengambil keputusan atau mengulang tugas."),
    sp(80),

    sub("If — Else If — Else", col),
    sp(60),
    para("Percabangan if-else adalah cara paling fundamental untuk membuat program mengambil keputusan. Program mengevaluasi kondisi (ekspresi yang menghasilkan boolean) — jika true, blok if dijalankan; jika false, lanjut ke else if atau else. Kondisi bisa berbentuk perbandingan, fungsi yang mengembalikan boolean, atau nilai apapun (karena JavaScript mengevaluasi truthy/falsy)."),
    sp(40),
    codeBlockFlat([
      "function tentukGrade(nilai) {",
      "  if (nilai >= 90) {",
      "    return \"A — Sangat Baik\";",
      "  } else if (nilai >= 80) {",
      "    return \"B — Baik\";",
      "  } else if (nilai >= 70) {",
      "    return \"C — Cukup\";",
      "  } else if (nilai >= 60) {",
      "    return \"D — Kurang\";",
      "  } else {",
      "    return \"E — Tidak Lulus\";",
      "}",
      "}",
      "",
      "console.log(tentukGrade(95));  // A — Sangat Baik",
      "console.log(tentukGrade(73));  // C — Cukup",
      "console.log(tentukGrade(45));  // E — Tidak Lulus",
    ]),
    sp(80),

    para("Untuk kondisi sederhana dengan dua kemungkinan, kamu bisa menggunakan ternary operator — cara lebih ringkas menulis if-else dalam satu baris:"),
    sp(40),
    codeBlockFlat([
      "// Ternary: kondisi ? nilaiJikaTrue : nilaiJikaFalse",
      "const umur = 20;",
      "const status = umur >= 18 ? \"Dewasa\" : \"Belum Dewasa\";",
      "console.log(status); // Dewasa",
      "",
      "// Logical OR untuk nilai default",
      "const namaPengguna = null;",
      "const tampil = namaPengguna || \"Tamu\";",
      "console.log(tampil); // Tamu",
      "",
      "// Nullish coalescing — hanya null/undefined yang diganti",
      "const skor = 0;",
      "console.log(skor ?? \"Belum ada\"); // 0 (bukan \"Belum ada\")",
    ]),
    sp(100),

    sub("Switch — Percabangan Multi-Nilai", col),
    sp(60),
    para("Switch digunakan ketika kamu ingin memeriksa satu nilai terhadap banyak kemungkinan. Dibanding serangkaian else-if, switch lebih mudah dibaca untuk kasus seperti ini. Setiap case harus diakhiri break untuk menghentikan evaluasi; tanpa break, JavaScript akan \"jatuh\" ke case berikutnya (fall-through) — ini bisa dimanfaatkan jika beberapa case perlu ditangani dengan cara sama."),
    sp(40),
    codeBlockFlat([
      "function deskripsiHari(hari) {",
      "  switch (hari.toLowerCase()) {",
      "    case \"senin\":",
      "      return \"Awal pekan, semangat mulai!\";",
      "    case \"rabu\":",
      "      return \"Tengah pekan, tahan sebentar lagi.\";",
      "    case \"jumat\":",
      "      return \"Hampir akhir pekan!\";",
      "    case \"sabtu\":",
      "    case \"minggu\":                     // fall-through",
      "      return \"Selamat menikmati akhir pekan!\";",
      "    default:",
      "      return \"Hari biasa, tetap produktif!\";",
      "  }",
      "}",
      "",
      "console.log(deskripsiHari(\"Jumat\"));  // Hampir akhir pekan!",
      "console.log(deskripsiHari(\"Minggu\")); // Selamat menikmati akhir pekan!",
    ]),
    sp(100),

    sub("For Loop — Perulangan dengan Hitungan", col),
    sp(60),
    para("For loop digunakan ketika kamu tahu berapa kali perulangan harus dilakukan. Terdiri dari tiga bagian dalam tanda kurung: inisialisasi (let i = 0), kondisi (i < n), dan increment/decrement (i++). Jika kondisi false, loop berhenti."),
    sp(40),
    codeBlockFlat([
      "// Hitung jumlah 1 sampai 10",
      "let total = 0;",
      "for (let i = 1; i <= 10; i++) {",
      "  total += i;",
      "}",
      "console.log(total); // 55",
      "",
      "// Loop mundur",
      "for (let i = 5; i >= 1; i--) {",
      "  console.log(`Hitung mundur: ${i}`);",
      "}",
      "// 5, 4, 3, 2, 1",
      "",
      "// Loop dengan step 2",
      "for (let i = 0; i <= 10; i += 2) {",
      "  console.log(i); // 0, 2, 4, 6, 8, 10",
      "}",
    ]),
    sp(100),

    sub("For...of dan For...in — Iterasi Modern", col),
    sp(60),
    para("for...of digunakan untuk mengiterasi nilai-nilai dari array, string, atau objek iterable lainnya. for...in digunakan untuk mengiterasi kunci (key) dari sebuah object. Keduanya lebih bersih dan mudah dibaca dibanding for biasa untuk keperluan iterasi data."),
    sp(40),
    codeBlockFlat([
      "// For...of — iterasi nilai array",
      "const mataPelajaran = [\"Matematika\", \"Fisika\", \"Kimia\", \"Biologi\"];",
      "for (const mapel of mataPelajaran) {",
      "  console.log(`- ${mapel}`);",
      "}",
      "",
      "// For...of pada string",
      "for (const huruf of \"JS\") {",
      "  console.log(huruf); // J, lalu S",
      "}",
      "",
      "// For...in — iterasi kunci object",
      "const profil = { nama: \"Dani\", usia: 22, kota: \"Surabaya\" };",
      "for (const kunci in profil) {",
      "  console.log(`${kunci}: ${profil[kunci]}`);",
      "}",
      "// nama: Dani",
      "// usia: 22",
      "// kota: Surabaya",
    ]),
    sp(100),

    sub("While Loop — Perulangan Berbasis Kondisi", col),
    sp(60),
    para("While loop terus berjalan selama kondisinya true. Berbeda dari for, while cocok digunakan ketika kamu tidak tahu persis berapa kali loop akan berjalan. Pastikan ada sesuatu di dalam loop yang akhirnya membuat kondisi menjadi false, agar tidak terjadi infinite loop."),
    sp(40),
    codeBlockFlat([
      "// Contoh: tebak angka (simulasi)",
      "let angkaTebakan = 1;",
      "const angkaRahasia = 7;",
      "",
      "while (angkaTebakan !== angkaRahasia) {",
      "  console.log(`Tebakan ${angkaTebakan} salah, coba lagi.`);",
      "  angkaTebakan++;",
      "}",
      "console.log(`Benar! Angka rahasianya adalah ${angkaTebakan}.`);",
      "",
      "// Do...while — kondisi dicek SETELAH iterasi pertama",
      "let percobaan = 0;",
      "do {",
      "  percobaan++;",
      "  console.log(`Percobaan ke-${percobaan}`);",
      "} while (percobaan < 3);",
      "// Percobaan ke-1, ke-2, ke-3",
    ]),
    sp(60),
    infoBox([
      "Gunakan for ketika jumlah iterasi sudah diketahui.",
      "Gunakan for...of untuk mengiterasi elemen array.",
      "Gunakan while ketika kondisi berhenti tidak bisa diprediksi.",
      "Selalu pastikan ada kondisi keluar di setiap loop!",
    ], col, "Kapan Pakai Loop Mana?"),
    sp(60),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 5 — OPERATOR
// ═══════════════════════════════════════════════════════════════════════════════
function bab5() {
  const col = COLS[4];
  const [accent,bg,dark] = col;

  function opTable(headers, rows, widths) {
    const total = widths.reduce((a,b)=>a+b,0);
    const hRow = new TableRow({ children: headers.map((h,ci)=>new TableCell({
      borders: allB(accent),
      shading:{fill:accent,type:ShadingType.CLEAR},
      margins:{top:90,bottom:90,left:140,right:140},
      width:{size:widths[ci],type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:h,font:"Arial",size:19,bold:true,color:P.white})]})]
    }))});
    const dRows = rows.map((row,ri)=>new TableRow({children:row.map((c,ci)=>new TableCell({
      borders:allB(P.border),
      shading:{fill:ri%2===0?P.white:bg,type:ShadingType.CLEAR},
      margins:{top:80,bottom:80,left:140,right:140},
      width:{size:widths[ci],type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({
        text:c, font:ci===0||ci===2||ci===3?"Courier New":"Arial",size:19,color:P.textDark
      })]})]
    }))}));
    return new Table({width:{size:total,type:WidthType.DXA},columnWidths:widths,rows:[hRow,...dRows]});
  }

  return [
    pgBreak,
    sectionBanner("Bab 05","","Operator", col),
    sp(80),
    para("Operator adalah simbol atau kata kunci yang digunakan untuk melakukan operasi pada nilai (operand). JavaScript memiliki beberapa kategori operator, masing-masing dengan kegunaan spesifik. Memilih operator yang tepat dan memahami cara kerjanya akan menghindarkan kamu dari banyak bug yang membingungkan."),
    sp(80),

    sub("Operator Aritmatika", col),
    sp(60),
    para("Digunakan untuk operasi matematika dasar pada nilai bertipe Number."),
    sp(40),
    opTable(["Operator","Nama","Contoh","Hasil"],[
      ["+","Penjumlahan","5 + 3","8"],
      ["-","Pengurangan","10 - 4","6"],
      ["*","Perkalian","3 * 7","21"],
      ["/","Pembagian","15 / 4","3.75"],
      ["%","Sisa bagi (modulo)","10 % 3","1"],
      ["**","Pangkat","2 ** 10","1024"],
      ["++","Increment (tambah 1)","let x=5; x++","6"],
      ["--","Decrement (kurang 1)","let y=5; y--","4"],
    ],[1800,3000,2500,1660]),
    sp(80),
    para("Operator + juga bisa digunakan untuk menggabungkan string (string concatenation):"),
    sp(40),
    codeBlockFlat([
      "console.log(\"Halo\" + \" \" + \"Dunia\"); // Halo Dunia",
      "console.log(\"Nilai: \" + 42);          // Nilai: 42",
      "// Hati-hati: angka ikut dikonversi ke string",
      "console.log(\"5\" + 3);                 // \"53\" (bukan 8!)",
      "console.log(\"5\" - 3);                 // 2 (- hanya untuk angka)",
    ]),
    sp(100),

    sub("Operator Perbandingan", col),
    sp(60),
    para("Menghasilkan nilai boolean (true/false). Penting: selalu gunakan === (triple equal) dan !== untuk perbandingan, bukan == atau !=, karena triple equal memeriksa nilai DAN tipe data sekaligus, sehingga lebih aman dan prediktibel."),
    sp(40),
    opTable(["Operator","Makna","Contoh","Hasil"],[
      ["===","Sama nilai & tipe (ketat)","5 === 5","true"],
      ["!==","Tidak sama (ketat)","5 !== \"5\"","true"],
      ["==","Sama nilai (longgar, hindari!)","5 == \"5\"","true"],
      [">","Lebih besar dari","10 > 5","true"],
      ["<","Lebih kecil dari","3 < 8","true"],
      [">=","Lebih besar atau sama dengan","5 >= 5","true"],
      ["<=","Lebih kecil atau sama dengan","4 <= 3","false"],
    ],[1800,3000,2500,1660]),
    sp(80),
    codeBlockFlat([
      "// Mengapa === lebih aman dari ==",
      "console.log(0 == false);    // true (berbahaya!)",
      "console.log(0 === false);   // false (benar!)",
      "console.log(\"\" == false);   // true (berbahaya!)",
      "console.log(\"\" === false);  // false (benar!)",
      "console.log(null == undefined);  // true",
      "console.log(null === undefined); // false",
    ]),
    sp(100),

    sub("Operator Logika", col),
    sp(60),
    para("Digunakan untuk mengkombinasikan beberapa kondisi boolean atau memberikan nilai default. Operator && (AND) mengembalikan nilai false pertama yang ditemukan, atau nilai terakhir jika semua truthy. Operator || (OR) mengembalikan nilai truthy pertama yang ditemukan, atau nilai terakhir jika semua falsy."),
    sp(40),
    opTable(["Operator","Nama","Contoh","Hasil"],[
      ["&&","DAN (AND)","true && false","false"],
      ["||","ATAU (OR)","false || true","true"],
      ["!","BUKAN (NOT)","!true","false"],
      ["??","Nullish Coalescing","null ?? \"default\"","\"default\""],
    ],[1800,3000,2900,1260]),
    sp(80),
    codeBlockFlat([
      "// Contoh penggunaan nyata",
      "const usia    = 20;",
      "const pelajar = true;",
      "",
      "// AND: semua kondisi harus terpenuhi",
      "if (usia >= 17 && pelajar) {",
      "  console.log(\"Bisa mendaftar beasiswa.\");",
      "}",
      "",
      "// OR: salah satu kondisi cukup",
      "const punya_KTP    = false;",
      "const punya_SIM    = true;",
      "if (punya_KTP || punya_SIM) {",
      "  console.log(\"Ada identitas yang valid.\");",
      "}",
      "",
      "// NOT: membalik boolean",
      "const tidakAktif = !true; // false",
    ]),
    sp(100),

    sub("Operator Assignment (Penugasan)", col),
    sp(60),
    para("Selain = biasa, JavaScript menyediakan shorthand assignment operators yang menggabungkan operasi aritmatika dengan penugasan:"),
    sp(40),
    opTable(["Operator","Setara dengan","Contoh","Setelah"],
    [
      ["+=","x = x + n","x += 5","x bertambah 5"],
      ["-=","x = x - n","x -= 3","x berkurang 3"],
      ["*=","x = x * n","x *= 2","x dikali 2"],
      ["/=","x = x / n","x /= 4","x dibagi 4"],
      ["%=","x = x % n","x %= 3","x jadi sisa bagi 3"],
    ],[1800,2500,2000,2700]),
    sp(60),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAB 6 — ARRAY DAN OBJECT
// ═══════════════════════════════════════════════════════════════════════════════
function bab6() {
  const col = COLS[5];
  return [
    pgBreak,
    sectionBanner("Bab 06","","Array dan Object", col),
    sp(80),
    para("Array dan Object adalah dua struktur data paling fundamental di JavaScript. Hampir semua aplikasi nyata — dari daftar belanja hingga profil pengguna, dari data tabel hingga respons API — menggunakan keduanya. Menguasai keduanya adalah kunci untuk membangun aplikasi yang sesungguhnya."),
    sp(80),

    sub("Array — Daftar Terurut", col),
    sp(60),
    para("Array menyimpan kumpulan nilai dalam urutan tertentu, diakses melalui indeks numerik yang dimulai dari 0. Array bersifat mutable (bisa diubah) dan bisa menampung berbagai tipe data, bahkan array lain (nested array)."),
    sp(40),
    codeBlockFlat([
      "// Membuat array",
      "const buah    = [\"apel\", \"mangga\", \"jeruk\"];",
      "const angka   = [1, 2, 3, 4, 5];",
      "const campuran = [\"teks\", 42, true, null, { id: 1 }];",
      "",
      "// Akses elemen",
      "console.log(buah[0]);              // apel",
      "console.log(buah[buah.length-1]); // jeruk (elemen terakhir)",
      "",
      "// Ubah nilai elemen",
      "buah[1] = \"pisang\";",
      "console.log(buah); // [\"apel\", \"pisang\", \"jeruk\"]",
    ]),
    sp(100),

    sub("Metode Array yang Sering Digunakan", col),
    sp(60),
    para("JavaScript menyediakan banyak built-in method untuk memanipulasi array. Berikut yang paling penting:"),
    sp(40),
    codeBlockFlat([
      "const kota = [\"Jakarta\", \"Bandung\", \"Surabaya\"];",
      "",
      "// Tambah dan hapus elemen",
      "kota.push(\"Medan\");        // Tambah di akhir: [..., \"Medan\"]",
      "kota.pop();                 // Hapus dari akhir: hapus \"Medan\"",
      "kota.unshift(\"Bali\");      // Tambah di awal: [\"Bali\", ...]",
      "kota.shift();               // Hapus dari awal: hapus \"Bali\"",
      "",
      "// Cek isi array",
      "console.log(kota.includes(\"Bandung\")); // true",
      "console.log(kota.indexOf(\"Surabaya\")); // 2",
      "",
      "// Gabung dan potong",
      "const kotaStr = kota.join(\" | \");  // \"Jakarta | Bandung | Surabaya\"",
      "const sebagian = kota.slice(0, 2); // [\"Jakarta\", \"Bandung\"]",
      "",
      "// Urutkan dan balik",
      "const angka = [3, 1, 4, 1, 5, 9];",
      "angka.sort((a, b) => a - b);   // [1, 1, 3, 4, 5, 9]",
      "angka.reverse();               // [9, 5, 4, 3, 1, 1]",
    ]),
    sp(100),

    sub("Metode Fungsional: map, filter, reduce", col),
    sp(60),
    para("Tiga method ini adalah senjata utama dalam memproses array secara elegan dan deklaratif. Ketiganya tidak mengubah array asli (immutable), melainkan menghasilkan array atau nilai baru."),
    sp(40),
    bul([trb(".map(): "), tr("Transformasi — mengubah setiap elemen dan mengembalikan array baru dengan jumlah elemen sama.")]),
    bul([trb(".filter(): "), tr("Penyaringan — memilih elemen yang memenuhi kondisi dan mengembalikan array baru.")]),
    bul([trb(".reduce(): "), tr("Akumulasi — mengolah semua elemen menjadi satu nilai akhir (jumlah, produk, string, dsb).")]),
    sp(40),
    codeBlockFlat([
      "const nilai = [78, 92, 65, 88, 55, 91];",
      "",
      "// map — tambah 5 poin ke semua nilai",
      "const nilaiBonus = nilai.map(n => n + 5);",
      "console.log(nilaiBonus); // [83, 97, 70, 93, 60, 96]",
      "",
      "// filter — ambil yang lulus (>= 75)",
      "const lulus = nilai.filter(n => n >= 75);",
      "console.log(lulus);      // [78, 92, 88, 91]",
      "",
      "// reduce — hitung rata-rata",
      "const total = nilai.reduce((akum, n) => akum + n, 0);",
      "const rataRata = total / nilai.length;",
      "console.log(rataRata);   // 78.17",
      "",
      "// Chaining — gabungkan beberapa method",
      "const rataBonus = nilai",
      "  .map(n => n + 5)",
      "  .filter(n => n >= 75)",
      "  .reduce((a, n, _, arr) => a + n / arr.length, 0);",
      "console.log(Math.round(rataBonus)); // 84",
    ]),
    sp(100),

    sub("Object — Data Terstruktur", col),
    sp(60),
    para("Object menyimpan data dalam bentuk pasangan kunci-nilai (key-value pairs). Kunci selalu berupa string (atau Symbol), sedangkan nilai bisa berupa tipe data apapun — termasuk fungsi (yang disebut method) dan object lain (nested object)."),
    sp(40),
    codeBlockFlat([
      "const produk = {",
      "  id      : \"P001\",",
      "  nama    : \"Laptop Gaming\",",
      "  harga   : 15000000,",
      "  stok    : 10,",
      "  spesifikasi: {             // nested object",
      "    ram     : \"16GB\",",
      "    storage : \"512GB SSD\",",
      "  },",
      "  // Method — fungsi di dalam object",
      "  infoHarga() {",
      "    return `${this.nama}: Rp ${this.harga.toLocaleString()}`;",
      "  },",
      "};",
      "",
      "// Akses properti",
      "console.log(produk.nama);                  // Laptop Gaming",
      "console.log(produk[\"harga\"]);              // 15000000",
      "console.log(produk.spesifikasi.ram);       // 16GB",
      "console.log(produk.infoHarga());",
      "// Laptop Gaming: Rp 15.000.000",
      "",
      "// Tambah dan hapus properti",
      "produk.diskon = 0.1;",
      "delete produk.stok;",
    ]),
    sp(100),

    sub("Destructuring, Spread, dan Rest", col),
    sp(60),
    para("ES6 memperkenalkan cara-cara modern yang sangat berguna untuk bekerja dengan array dan object:"),
    sp(40),
    codeBlockFlat([
      "// Destructuring Object — ambil properti jadi variabel",
      "const { nama, harga, diskon = 0 } = produk;",
      "console.log(nama);   // Laptop Gaming",
      "console.log(diskon); // 0.1",
      "",
      "// Destructuring Array",
      "const [pertama, kedua, ...sisanya] = [10, 20, 30, 40, 50];",
      "console.log(pertama);  // 10",
      "console.log(sisanya);  // [30, 40, 50]",
      "",
      "// Spread operator — salin/gabungkan",
      "const arr1 = [1, 2, 3];",
      "const arr2 = [4, 5, 6];",
      "const gabungan = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]",
      "",
      "const obj1 = { a: 1, b: 2 };",
      "const obj2 = { c: 3, d: 4 };",
      "const merged = { ...obj1, ...obj2 }; // { a:1, b:2, c:3, d:4 }",
      "",
      "// Rest parameter — kumpulkan argumen jadi array",
      "function jumlahkan(...angka) {",
      "  return angka.reduce((a, n) => a + n, 0);",
      "}",
      "console.log(jumlahkan(1, 2, 3, 4, 5)); // 15",
    ]),
    sp(60),
    infoBox([
      "Array = gunakan saat urutan data penting dan kamu butuh daftar.",
      "Object = gunakan saat data memiliki atribut/properti yang bermakna.",
      "Hindari mutasi langsung — salin dulu dengan spread (...) untuk kode yang lebih aman.",
    ], col, "Kapan Pakai Array vs Object?"),
    sp(60),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LATIHAN & CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════════════════
function babLatihan() {
  const col = COLS[0];
  const [accent,bg,dark] = col;
  const soal = [
    ["01","Variabel & Tipe Data","Buat variabel untuk menyimpan: nama lengkap, umur, kota asal, status pelajar, dan daftar mata pelajaran favorit (min. 3). Gunakan const atau let sesuai konteks. Tampilkan semuanya dengan console.log() beserta tipe datanya menggunakan typeof."],
    ["02","Fungsi","Buat fungsi konversiSuhu(celcius) yang mengonversi suhu dari Celcius ke Fahrenheit dan Kelvin. Rumus: F = (C \u00d7 9/5) + 32, K = C + 273.15. Kembalikan object { fahrenheit, kelvin }. Uji dengan suhu 0, 100, dan 37."],
    ["03","Kontrol Flow","Buat program simulasi mesin ATM: terima parameter saldo dan jumlahTarik. Tampilkan pesan yang sesuai: jika jumlahTarik > saldo (\"Saldo tidak cukup\"), jika jumlahTarik <= 0 (\"Jumlah tidak valid\"), jika berhasil tampilkan saldo akhir."],
    ["04","Loop & Array","Buat array berisi 8 angka acak (1-100). Gunakan loop untuk: (a) tampilkan semua angka, (b) hitung rata-rata, (c) temukan nilai terbesar dan terkecil, (d) tampilkan hanya angka yang lebih besar dari rata-rata."],
    ["05","Object","Buat sistem data buku: setiap buku punya properti judul, penulis, tahun, harga. Buat array berisi 4 buku. Gunakan .filter() untuk mencari buku tahun >= 2020, .map() untuk format tampilan, dan .sort() untuk urutkan berdasarkan harga."],
    ["06","Gabungan","Mini project: Buat program Kasir Sederhana. Buat array produk (nama, harga, stok). Implementasikan fungsi tambahKeranjang(), hitungTotal(), dan tampilkanStruk(). Tangani kasus stok habis dan diskon 10% jika total > Rp 500.000."],
  ];

  const rows = soal.map((s,idx)=>new TableRow({children:[
    new TableCell({
      borders:allB(P.border),
      shading:{fill:idx%2===0?P.white:bg,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:120,right:120},
      width:{size:700,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:s[0],font:"Courier New",size:20,bold:true,color:dark})]})]
    }),
    new TableCell({
      borders:allB(P.border),
      shading:{fill:idx%2===0?P.white:bg,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:120,right:120},
      width:{size:2000,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:s[1],font:"Arial",size:20,bold:true,color:dark})]})]
    }),
    new TableCell({
      borders:allB(P.border),
      shading:{fill:idx%2===0?P.white:bg,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:120,right:120},
      width:{size:6660,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:s[2],font:"Arial",size:20,color:P.textDark})]})]
    }),
  ]}));

  const hRow = new TableRow({children:[
    ["No","Topik","Soal"].map((h,ci)=>new TableCell({
      borders:allB(accent),
      shading:{fill:accent,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:120,right:120},
      width:{size:[700,2000,6660][ci],type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:h,font:"Arial",size:20,bold:true,color:P.white})]})]
    }))
  ].flat()});

  return [
    pgBreak,
    sectionBanner("Bab 07","","Latihan Soal", col),
    sp(80),
    para("Pemahaman teori saja tidak cukup — kamu perlu melatih kemampuan coding secara aktif. Kerjakan soal-soal berikut secara bertahap. Mulailah dari no. 1, selesaikan dulu sebelum lanjut ke berikutnya."),
    sp(80),
    new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[700,2000,6660],rows:[hRow,...rows]}),
    sp(60),
  ];
}

function cheatSheet() {
  const col = COLS[1];
  const [accent,bg,dark] = col;
  const items = [
    ["let x = 5","Deklarasi variabel yang bisa diubah"],
    ["const PI = 3.14","Deklarasi konstanta (tidak bisa diganti)"],
    ["typeof x","Cek tipe data variabel"],
    ["function f(a,b) { return a+b }","Function declaration dengan hoisting"],
    ["const f = (a,b) => a+b","Arrow function satu baris"],
    ["if(x>0){...}else{...}","Percabangan kondisi"],
    ["switch(x){ case 1:... }","Percabangan multi-nilai"],
    ["for(let i=0;i<n;i++){...}","Loop dengan hitungan"],
    ["for(const item of arr){...}","Iterasi nilai array"],
    ["while(kondisi){...}","Loop selama kondisi true"],
    ["arr.push(x) / arr.pop()","Tambah/hapus elemen array dari akhir"],
    ["arr.map(fn) / arr.filter(fn)","Transformasi / saring array"],
    ["arr.reduce((akum,n)=>akum+n,0)","Akumulasi nilai array"],
    ["obj.key / obj['key']","Akses properti object"],
    ["delete obj.key","Hapus properti object"],
    ["const {a,b} = obj","Destructuring object"],
    ["const [x,...rest] = arr","Destructuring array + rest"],
    ["[...arr1,...arr2]","Gabung array dengan spread"],
    ["x === y / x !== y","Perbandingan ketat (selalu pakai ini!)"],
    ["x ?? 'default'","Nilai default jika null/undefined"],
  ];
  const rows = items.map((item,idx)=>new TableRow({children:[
    new TableCell({
      borders:allB(P.border),
      shading:{fill:idx%2===0?P.white:bg,type:ShadingType.CLEAR},
      margins:{top:80,bottom:80,left:140,right:140},
      width:{size:3800,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:item[0],font:"Courier New",size:19,bold:true,color:dark})]})]
    }),
    new TableCell({
      borders:allB(P.border),
      shading:{fill:idx%2===0?P.white:bg,type:ShadingType.CLEAR},
      margins:{top:80,bottom:80,left:140,right:140},
      width:{size:5560,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:item[1],font:"Arial",size:20,color:P.textDark})]})]
    }),
  ]}));
  const hRow = new TableRow({children:[
    new TableCell({
      borders:allB(accent),shading:{fill:accent,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:140,right:140},width:{size:3800,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:"Sintaks",font:"Arial",size:20,bold:true,color:P.white})]})]
    }),
    new TableCell({
      borders:allB(accent),shading:{fill:accent,type:ShadingType.CLEAR},
      margins:{top:100,bottom:100,left:140,right:140},width:{size:5560,type:WidthType.DXA},
      children:[new Paragraph({spacing:{before:0,after:0},children:[new TextRun({text:"Kegunaan",font:"Arial",size:20,bold:true,color:P.white})]})]
    }),
  ]});

  return [
    pgBreak,
    sectionBanner("Bab 08","","Cheat Sheet — Referensi Cepat", col),
    sp(80),
    para("Gunakan halaman ini sebagai kartu referensi cepat saat kamu lupa sintaks. Simpan atau cetak halaman ini untuk diletakkan di meja belajar!"),
    sp(80),
    new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[3800,5560],rows:[hRow,...rows]}),
    sp(60),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      { reference:"bul", levels:[{ level:0, format:LevelFormat.BULLET, text:"\u2022", alignment:AlignmentType.LEFT,
          style:{paragraph:{indent:{left:560,hanging:280}}} }] },
    ]
  },
  styles: {
    default: { document: { run: { font:"Arial", size:22 } } },
  },
  sections: [
    // Cover
    {
      properties: {
        page: { size:{width:11906,height:16838}, margin:{top:1440,right:1440,bottom:1440,left:1440} }
      },
      children: cover(),
    },
    // Content
    {
      properties: {
        page: { size:{width:11906,height:16838}, margin:{top:1200,right:1080,bottom:1200,left:1080} }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            border:{bottom:{style:BorderStyle.SINGLE,size:3,color:P.lavender,space:4}},
            spacing:{before:0,after:80},
            children:[
              new TextRun({text:"Dasar-Dasar JavaScript", font:"Arial",size:18,bold:true,color:P.lavenderDark}),
              new TextRun({text:"   \u2022   Panduan Lengkap untuk Pemula", font:"Arial",size:18,color:P.textLight}),
            ]
          })
        ]})
      },
      footers: {
        default: new Footer({ children:[
          new Paragraph({
            border:{top:{style:BorderStyle.SINGLE,size:2,color:P.border,space:4}},
            spacing:{before:80,after:0},
            tabStops:[{type:TabStopType.RIGHT,position:9026}],
            children:[
              new TextRun({text:"JavaScript Dasar  \u2022  2025", font:"Arial",size:16,color:P.textLight}),
              new TextRun({text:"\t",font:"Arial",size:16}),
              new TextRun({children:[PageNumber.CURRENT],font:"Arial",size:16,color:P.textLight}),
            ]
          })
        ]})
      },
      children: [
        ...bab1(),
        ...bab2(),
        ...bab3(),
        ...bab4(),
        ...bab5(),
        ...bab6(),
        ...babLatihan(),
        ...cheatSheet(),
      ],
    }
  ]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("./JS_Pastel_Lengkap.docx", buf);
  console.log("Selesai!");
});