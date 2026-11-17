/* ===== DATA DOKTER (dimuat dari data_dokter.txt via API PHP) ===== */
// Array ini diisi secara dinamis oleh muatDataDokter().
// Fallback ke data statis hanya jika API tidak tersedia.
let dokter = [
  { nama: "dr. Andi Pratama", poliklinik: "Umum", hari: "Senin", jam: "08.00 - 12.00", info: "Dokter umum" },
  { nama: "dr. Rina Kusuma", poliklinik: "Umum", hari: "Rabu", jam: "13.00 - 17.00", info: "Dokter umum" },
  { nama: "dr. Bayu Santoso", poliklinik: "Umum", hari: "Jumat", jam: "08.00 - 12.00", info: "Dokter umum" },
  { nama: "drg. Maya Anggraini", poliklinik: "Gigi", hari: "Selasa", jam: "08.00 - 12.00", info: "Dokter gigi" },
  { nama: "drg. Hendra Wijaya", poliklinik: "Gigi", hari: "Kamis", jam: "13.00 - 17.00", info: "Dokter gigi" },
  { nama: "drg. Sari Lestari", poliklinik: "Gigi", hari: "Sabtu", jam: "08.00 - 11.00", info: "Dokter gigi" },
  { nama: "dr. Dewi Safitri, Sp.OG", poliklinik: "KIA", hari: "Senin", jam: "13.00 - 16.00", info: "Kehamilan" },
  { nama: "dr. Citra Maharani, Sp.A", poliklinik: "KIA", hari: "Rabu", jam: "08.00 - 12.00", info: "Bayi dan anak" },
  { nama: "Bidan Lia Permata", poliklinik: "KIA", hari: "Jumat", jam: "13.00 - 16.00", info: "Imunisasi" },
  { nama: "Rahma Fitriani, S.Gz", poliklinik: "Gizi", hari: "Selasa", jam: "13.00 - 16.00", info: "Ahli gizi" },
  { nama: "Yoga Prasetyo, S.Gz", poliklinik: "Gizi", hari: "Kamis", jam: "08.00 - 12.00", info: "Ahli gizi" },
  { nama: "Tania Rosalina, S.Gz", poliklinik: "Gizi", hari: "Sabtu", jam: "08.00 - 11.00", info: "Ahli gizi" }
];

/* ===== MUAT DATA DOKTER DARI FILE TXT VIA PHP API ===== */
/**
 * Mengambil data dokter dari endpoint api/dokter.php yang membaca data_dokter.txt.
 * Jika berhasil, mengganti array `dokter` dan memperbarui tampilan halaman.
 * Jika gagal (misal: file tidak ada / bukan server PHP), tetap gunakan data fallback.
 */
function muatDataDokter() {
  fetch("api/dokter.php")
    .then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + ": " + res.statusText);
      }
      return res.json();
    })
    .then(function (json) {
      if (json.status !== "ok" || !Array.isArray(json.dokter) || json.dokter.length === 0) {
        console.warn("[Dokter] Data dari TXT kosong atau tidak valid, menggunakan data fallback.");
        return;
      }
      // Ganti data dokter global dengan data dari TXT
      dokter = json.dokter;
      console.info("[Dokter] Berhasil memuat " + dokter.length + " dokter dari data_dokter.txt.");

      // Perbarui tampilan grid kartu dokter (halaman dokter.html)
      if (el("daftar-dokter")) {
        tampilkanDokter(el("filter-poli") ? el("filter-poli").value || "Semua" : "Semua");
      }

      // Perbarui dropdown dokter pada form pendaftaran jika poli sudah dipilih
      if (el("poli") && el("dokter") && el("poli").value) {
        var poli = el("poli").value;
        var pilihanDokter = el("dokter");
        pilihanDokter.innerHTML = '<option value="">-- Pilih dokter --</option>';
        ambilDokterByPoli(poli).forEach(function (d) {
          var opsi = document.createElement("option");
          opsi.value = d.nama;
          opsi.textContent = d.nama + " (" + d.hari + ", " + d.jam + ")";
          pilihanDokter.appendChild(opsi);
        });
      }
    })
    .catch(function (err) {
      console.warn("[Dokter] Gagal memuat dari API, menggunakan data fallback:", err.message);
    });
}

// Jalankan saat halaman selesai dimuat
muatDataDokter();
const kodePoli = { Umum: "UMUM", Gigi: "GIGI", KIA: "KIA", Gizi: "GIZI" };
// Nomor antrean terakhir (simulasi), akan bertambah setiap ada pendaftaran
const antreanTerakhir = { Umum: 6, Gigi: 2, KIA: 4, Gizi: 1 };

/* ===== DAFTAR HARI LIBUR NASIONAL RESMI (Simulasi Standar Indonesia) ===== */
const daftarLiburNasional = {
  "01-01": "Tahun Baru Masehi",
  "05-01": "Hari Buruh Internasional",
  "06-01": "Hari Lahir Pancasila",
  "08-17": "Hari Kemerdekaan Republik Indonesia",
  "12-25": "Hari Raya Natal"
};

/* ===== FUNGSI PENGOLAHAN TANGGAL & PARSING YANG KUAT ===== */
function el(id) { return document.getElementById(id); }

function jamNol(tanggal) {
  const d = new Date(tanggal);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parsing tanggal fleksibel: mendukung format YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, atau Date object.
 * Menghindari bug konversi timezone (UTC vs waktu lokal).
 */
function parseTanggal(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : jamNol(input);
  }
  const teks = String(input).trim();
  if (!teks) return null;

  // Format standar HTML5: YYYY-MM-DD
  let match = teks.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const thn = parseInt(match[1], 10);
    const bln = parseInt(match[2], 10) - 1;
    const tgl = parseInt(match[3], 10);
    const d = new Date(thn, bln, tgl, 0, 0, 0, 0);
    if (d.getFullYear() === thn && d.getMonth() === bln && d.getDate() === tgl) {
      return d;
    }
  }

  // Format DD/MM/YYYY atau DD-MM-YYYY
  match = teks.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const tgl = parseInt(match[1], 10);
    const bln = parseInt(match[2], 10) - 1;
    const thn = parseInt(match[3], 10);
    const d = new Date(thn, bln, tgl, 0, 0, 0, 0);
    if (d.getFullYear() === thn && d.getMonth() === bln && d.getDate() === tgl) {
      return d;
    }
  }

  // Fallback standar
  const d = new Date(teks + "T00:00:00");
  return isNaN(d.getTime()) ? null : jamNol(d);
}

// Kompatibilitas dengan fungsi lama
function bacaTanggal(teks) {
  return parseTanggal(teks) || new Date(NaN);
}

// Mengubah Date ke format "YYYY-MM-DD"
function ubahKeTeks(tgl) {
  const d = parseTanggal(tgl);
  if (!d) return "";
  const thn = d.getFullYear();
  const bln = String(d.getMonth() + 1).padStart(2, "0");
  const hr = String(d.getDate()).padStart(2, "0");
  return thn + "-" + bln + "-" + hr;
}

// Format tanggal ke Bahasa Indonesia lengkap (contoh: "17 November 2026")
const namaBulanIndo = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
function formatTanggal(teks) {
  const d = parseTanggal(teks);
  if (!d) return "-";
  return d.getDate() + " " + namaBulanIndo[d.getMonth()] + " " + d.getFullYear();
}

function hitungUsia(tglLahir) {
  const d = parseTanggal(tglLahir);
  if (!d) return 0;
  const hariIni = jamNol(new Date());
  let usia = hariIni.getFullYear() - d.getFullYear();
  const belumUlangTahun = hariIni.getMonth() < d.getMonth() ||
    (hariIni.getMonth() === d.getMonth() && hariIni.getDate() < d.getDate());
  if (belumUlangTahun) usia--;
  return usia >= 0 ? usia : 0;
}

function sapaanWaktu(jam) {
  if (jam < 11) return "Selamat pagi";
  else if (jam < 15) return "Selamat siang";
  else if (jam < 18) return "Selamat sore";
  else return "Selamat malam";
}

function buatNomorAntrean(poli) {
  antreanTerakhir[poli] = (antreanTerakhir[poli] || 0) + 1;
  return kodePoli[poli] + "-" + String(antreanTerakhir[poli]).padStart(3, "0");
}

function ambilDokterByPoli(poli) {
  return dokter.filter(function (d) { return d.poliklinik === poli; });
}

/* ===== SIMULASI PENYIMPANAN DATABASE (LocalStorage) ===== */
const DB_PENDAFTARAN_KEY = "sehat_nusantara_db_pendaftaran";

function simpanPendaftaranKeDB(data) {
  try {
    const list = ambilSemuaPendaftaranDariDB();
    list.unshift(data); // Simpan yang terbaru di urutan pertama
    localStorage.setItem(DB_PENDAFTARAN_KEY, JSON.stringify(list));
    return true;
  } catch (err) {
    console.warn("Gagal menyimpan ke database lokal:", err);
    return false;
  }
}

function ambilSemuaPendaftaranDariDB() {
  try {
    const raw = localStorage.getItem(DB_PENDAFTARAN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function ambilPendaftaranTerakhir() {
  const list = ambilSemuaPendaftaranDariDB();
  return list.length > 0 ? list[0] : null;
}

// Ekspos ke global window untuk debugging & verifikasi sistem
window.dbKlinik = {
  simpan: simpanPendaftaranKeDB,
  ambilSemua: ambilSemuaPendaftaranDariDB,
  ambilTerakhir: ambilPendaftaranTerakhir
};

/* ===== MODE GELAP ===== */
function terapkanTema(tema) {
  document.documentElement.setAttribute("data-bs-theme", tema);
  localStorage.setItem("tema", tema);
  const tombol = el("btn-tema");
  if (tombol) {
    tombol.textContent = tema === "dark" ? "☀️ Terang" : "🌙 Gelap";
    tombol.setAttribute("aria-pressed", tema === "dark");
  }
}

// Inisialisasi tema
const temaTersimpan = localStorage.getItem("tema");
const perangkatGelap = window.matchMedia("(prefers-color-scheme: dark)").matches;
terapkanTema(temaTersimpan || (perangkatGelap ? "dark" : "light"));

// Event listener ganti tema
if (el("btn-tema")) {
  el("btn-tema").addEventListener("click", function () {
    const sekarang = document.documentElement.getAttribute("data-bs-theme");
    terapkanTema(sekarang === "dark" ? "light" : "dark");
  });
}

/* ===== BERANDA: sapaan otomatis ===== */
if (el("sapaan")) {
  el("sapaan").textContent = sapaanWaktu(new Date().getHours()) + ", selamat datang di Sehat Nusantara";
}

/* ===== JADWAL DOKTER ===== */
if (el("daftar-dokter")) {
  function tampilkanDokter(poli) {
    const daftar = poli === "Semua" ? dokter : ambilDokterByPoli(poli);
    el("daftar-dokter").innerHTML = "";
    daftar.forEach(function (d) {
      const huruf = d.nama.replace(/^(dr\.|drg\.)\s*/i, "").charAt(0).toUpperCase();
      const kolom = document.createElement("div");
      kolom.className = "col-12 col-md-6 col-lg-4";
      kolom.innerHTML = '<div class="kartu-dokter"><div class="avatar" aria-hidden="true">' + huruf + '</div><div>' +
        '<h2 class="h6 mb-1">' + d.nama + '</h2><span class="badge-poli badge-poli-' + d.poliklinik.toLowerCase() + '" data-poli="' + d.poliklinik + '">Poliklinik ' + d.poliklinik + '</span>' +
        '<p class="mb-0 mt-1 small text-muted">' + d.hari + ", " + d.jam + '<br>' + d.info + '</p></div></div>';
      el("daftar-dokter").appendChild(kolom);
    });
    el("jumlah-dokter").textContent = "Menampilkan " + daftar.length + " dokter.";
  }
  tampilkanDokter("Semua");
  if (el("filter-poli")) {
    el("filter-poli").addEventListener("change", function () { tampilkanDokter(this.value); });
  }

}

/* ===== FORMULIR PENDAFTARAN ===== */
if (el("form-daftar")) {
  const nilai = function (id) {
    const elem = el(id);
    return elem ? elem.value.trim() : "";
  };

  const hariIni = jamNol(new Date());
  const batasAkhir = jamNol(new Date());
  batasAkhir.setDate(batasAkhir.getDate() + 14);

  // Set batasan tanggal input
  if (el("tglKunjungan")) {
    el("tglKunjungan").min = ubahKeTeks(hariIni);
    el("tglKunjungan").max = ubahKeTeks(batasAkhir);
    el("tglKunjungan").disabled = false; // Pastikan input selalu aktif
  }
  if (el("tglLahir")) {
    el("tglLahir").max = ubahKeTeks(hariIni);
  }

  // Tampilkan petunjuk operasional di bawah tanggal kunjungan
  const wadahTglKunjungan = el("tglKunjungan");
  if (wadahTglKunjungan && !document.querySelector(".info-jadwal-kunjungan")) {
    const infoJadwal = document.createElement("small");
    infoJadwal.className = "info-jadwal-kunjungan text-muted d-block mt-1";
    infoJadwal.textContent = "Klinik buka Senin – Sabtu (Minggu & hari libur nasional tutup). Maksimal 14 hari ke depan.";
    wadahTglKunjungan.parentNode.appendChild(infoJadwal);
  }

  // Validator per field
  const validator = {
    nama: function () {
      const v = nilai("nama");
      if (!v) return "Nama lengkap wajib diisi.";
      if (!/^[A-Za-z\s'.,-]+$/.test(v)) return "Nama hanya boleh berisi huruf dan karakter umum nama.";
      if (v.length < 3) return "Nama minimal 3 karakter.";
      return "";
    },
    nik: function () {
      const v = nilai("nik");
      if (!v) return "NIK wajib diisi.";
      if (!/^\d+$/.test(v)) return "NIK hanya boleh berisi angka.";
      if (v.length !== 16) return "NIK harus tepat 16 digit (saat ini " + v.length + " digit).";
      return "";
    },
    tglLahir: function () {
      const v = nilai("tglLahir");
      if (!v) return "Tanggal lahir wajib diisi.";
      const tgl = parseTanggal(v);
      if (!tgl) return "Format tanggal lahir tidak valid (gunakan format YYYY-MM-DD).";
      if (tgl > hariIni) return "Tanggal lahir tidak boleh di masa depan.";
      if (hitungUsia(tgl) > 130) return "Tahun kelahiran tidak wajar.";
      return "";
    },
    jk: function () {
      return document.querySelector('input[name="jk"]:checked') ? "" : "Pilih salah satu jenis kelamin.";
    },
    hp: function () {
      const v = nilai("hp");
      if (!v) return "Nomor HP wajib diisi.";
      if (!/^\d+$/.test(v)) return "Nomor HP hanya boleh berisi angka.";
      if (!(v.startsWith("08") || v.startsWith("62"))) return "Nomor HP harus diawali 08 atau 62.";
      if (v.length < 10 || v.length > 14) return "Nomor HP harus 10 sampai 14 digit.";
      return "";
    },
    email: function () {
      const v = nilai("email");
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Format email belum benar, contoh: nama@email.com.";
      return "";
    },
    poli: function () {
      return nilai("poli") ? "" : "Pilih salah satu poliklinik.";
    },
    dokter: function () {
      const v = nilai("dokter");
      if (!v) return "Pilih dokter yang bertugas.";
      const cocok = dokter.find(function (d) { return d.nama === v && d.poliklinik === nilai("poli"); });
      return cocok ? "" : "Dokter yang dipilih tidak sesuai dengan poliklinik.";
    },
    tglKunjungan: function () {
      const v = nilai("tglKunjungan");
      if (!v) return "Tanggal kunjungan wajib diisi.";
      const tgl = parseTanggal(v);
      if (!tgl) return "Format tanggal kunjungan tidak valid.";
      if (tgl < hariIni) return "Tanggal kunjungan tidak boleh sebelum hari ini.";
      if (tgl > batasAkhir) return "Tanggal kunjungan maksimal 14 hari dari hari ini.";
      if (tgl.getDay() === 0) return "Klinik tutup pada hari Minggu. Silakan pilih hari Senin s.d. Sabtu.";

      // Pengecekan hari libur nasional
      const bulanTgl = String(tgl.getMonth() + 1).padStart(2, "0") + "-" + String(tgl.getDate()).padStart(2, "0");
      if (daftarLiburNasional[bulanTgl]) {
        return "Klinik libur pada tanggal ini (" + daftarLiburNasional[bulanTgl] + ").";
      }
      return "";
    },
    keluhan: function () {
      const panjang = nilai("keluhan").length;
      if (!panjang) return "Keluhan wajib diisi.";
      if (panjang < 10) return "Keluhan terlalu singkat (minimal 10 karakter).";
      if (panjang > 200) return "Keluhan maksimal 200 karakter.";
      return "";
    },
    setuju: function () {
      return el("setuju") && el("setuju").checked ? "" : "Anda harus menyetujui penggunaan data.";
    }
  };

  function tampilError(nama, pesan) {
    const errBox = el("err-" + nama);
    if (errBox) errBox.textContent = pesan;
    document.querySelectorAll('[data-field="' + nama + '"]').forEach(function (k) {
      k.classList.toggle("is-invalid", pesan !== "");
    });
  }

  function periksa(nama) {
    if (!validator[nama]) return true;
    const p = validator[nama]();
    tampilError(nama, p);
    return p === "";
  }

  // Validasi saat input kehilangan fokus
  Object.keys(validator).forEach(function (nama) {
    document.querySelectorAll('[data-field="' + nama + '"]').forEach(function (k) {
      k.addEventListener("blur", function () { periksa(nama); });
    });
  });

  // Otomatis hitung usia saat tanggal lahir dipilih/diubah
  if (el("tglLahir")) {
    const updateUsia = function () {
      const v = nilai("tglLahir");
      const dt = parseTanggal(v);
      if (dt && dt <= hariIni) {
        const u = hitungUsia(dt);
        el("usia").value = u + " tahun";
      } else {
        el("usia").value = "-";
      }
      periksa("tglLahir");
    };
    el("tglLahir").addEventListener("change", updateUsia);
    el("tglLahir").addEventListener("input", updateUsia);
  }

  // Update pilihan dokter saat poliklinik dipilih
  if (el("poli")) {
    el("poli").addEventListener("change", function () {
      const pilihanDokter = el("dokter");
      if (!pilihanDokter) return;
      pilihanDokter.innerHTML = "";
      const poli = nilai("poli");
      if (!poli) {
        pilihanDokter.innerHTML = '<option value="">Pilih poliklinik dulu</option>';
        pilihanDokter.disabled = true;
      } else {
        pilihanDokter.disabled = false;
        pilihanDokter.innerHTML = '<option value="">-- Pilih dokter --</option>';
        ambilDokterByPoli(poli).forEach(function (d) {
          const opsi = document.createElement("option");
          opsi.value = d.nama;
          opsi.textContent = d.nama + " (" + d.hari + ", " + d.jam + ")";
          pilihanDokter.appendChild(opsi);
        });
      }
      periksa("poli");
      tampilError("dokter", "");
    });
  }

  if (el("dokter")) {
    el("dokter").addEventListener("change", function () { periksa("dokter"); });
  }

  if (el("tglKunjungan")) {
    el("tglKunjungan").addEventListener("change", function () { periksa("tglKunjungan"); });
    el("tglKunjungan").addEventListener("input", function () { periksa("tglKunjungan"); });
  }

  // Penghitung karakter keluhan
  if (el("keluhan")) {
    el("keluhan").addEventListener("input", function () {
      const n = this.value.length;
      if (el("hitung-keluhan")) {
        el("hitung-keluhan").textContent = n + " / 200";
        el("hitung-keluhan").style.color = n > 200 ? "var(--merah)" : "";
      }
    });
  }

  /* ===== AUTO CAPITALIZATION: NAMA (Title Case) ===== */
  /**
   * Mengubah setiap awal kata menjadi huruf kapital dan huruf selanjutnya menjadi kecil.
   * Dijalankan real-time saat pengguna mengetik (event: input) dan saat keluar field (event: blur).
   * Kursor dipertahankan agar tidak melompat ke ujung input saat mengetik.
   *
   * Contoh:
   *   "budi santoso"  → "Budi Santoso"
   *   "SITI AMINAH"   → "Siti Aminah"
   *   "andi saputra"  → "Andi Saputra"
   */
  function terapkanTitleCase(input) {
    if (!input) return;
    input.addEventListener("input", function () {
      var cursorPos = this.selectionStart;
      var nilai = this.value;
      var hasil = nilai.replace(/\S+/g, function (kata) {
        return kata.charAt(0).toUpperCase() + kata.slice(1).toLowerCase();
      });
      if (this.value !== hasil) {
        this.value = hasil;
        // Pulihkan posisi kursor agar tidak melompat ke ujung
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
    // Pastikan format benar saat keluar dari field
    input.addEventListener("blur", function () {
      this.value = this.value.replace(/\S+/g, function (kata) {
        return kata.charAt(0).toUpperCase() + kata.slice(1).toLowerCase();
      });
    });
  }

  if (el("nama")) {
    terapkanTitleCase(el("nama"));
  }

  /* ===== AUTO CAPITALIZATION: KELUHAN (Sentence Case) ===== */
  /**
   * Mengubah huruf pertama teks dan huruf pertama setelah tanda titik (.) menjadi kapital.
   * Tidak mengubah huruf lain — hanya awal kalimat yang terpengaruh.
   * Kursor dipertahankan agar pengguna tetap bisa mengedit di tengah teks.
   *
   * Contoh:
   *   "sakit gigi geraham"             → "Sakit gigi geraham"
   *   "demam dan batuk. sakit kepala." → "Demam dan batuk. Sakit kepala."
   */
  function terapkanSentenceCase(textarea) {
    if (!textarea) return;
    textarea.addEventListener("input", function () {
      var cursorPos = this.selectionStart;
      var nilai = this.value;
      // Kapitalkan: (1) karakter pertama non-spasi di awal teks,
      // (2) karakter pertama non-spasi setelah ". " atau ".\n"
      var hasil = nilai.replace(/(^|[.!?]\s+)([a-zA-Z])/g, function (_, pembuka, huruf) {
        return pembuka + huruf.toUpperCase();
      });
      if (this.value !== hasil) {
        this.value = hasil;
        this.setSelectionRange(cursorPos, cursorPos);
      }
    });
    textarea.addEventListener("blur", function () {
      this.value = this.value.replace(/(^|[.!?]\s+)([a-zA-Z])/g, function (_, pembuka, huruf) {
        return pembuka + huruf.toUpperCase();
      });
    });
  }

  if (el("keluhan")) {
    terapkanSentenceCase(el("keluhan"));
  }

  // Event submit formulir
  el("form-daftar").addEventListener("submit", function (e) {
    e.preventDefault();
    let semuaValid = true;
    let kolomPertama = null;

    Object.keys(validator).forEach(function (nama) {
      if (!periksa(nama)) {
        semuaValid = false;
        if (!kolomPertama) kolomPertama = document.querySelector('[data-field="' + nama + '"]');
      }
    });

    if (!semuaValid) {
      if (kolomPertama) kolomPertama.focus();
      return;
    }

    tampilkanRingkasan();
  });

  function tampilkanRingkasan() {
    const poli = nilai("poli");
    const elemJk = document.querySelector('input[name="jk"]:checked');
    const jk = elemJk ? elemJk.value : "-";
    const noAntrean = buatNomorAntrean(poli);

    const dataTersimpan = {
      nomorAntrean: noAntrean,
      waktuPendaftaran: new Date().toISOString(),
      nama: nilai("nama"),
      nik: nilai("nik"),
      tglLahir: ubahKeTeks(nilai("tglLahir")),
      tglLahirFormatted: formatTanggal(nilai("tglLahir")),
      usia: el("usia").value,
      jk: jk,
      hp: nilai("hp"),
      email: nilai("email") || "-",
      poli: poli,
      dokter: nilai("dokter"),
      tglKunjungan: ubahKeTeks(nilai("tglKunjungan")),
      tglKunjunganFormatted: formatTanggal(nilai("tglKunjungan")),
      keluhan: nilai("keluhan")
    };

    // Simpan ke database simulasi
    simpanPendaftaranKeDB(dataTersimpan);

    // Tampilkan di modal
    el("nomor-antrean").textContent = noAntrean;
    el("isi-ringkasan").innerHTML = "";

    const baris = [
      ["Nama Lengkap", dataTersimpan.nama],
      ["NIK", dataTersimpan.nik],
      ["Tanggal Lahir", dataTersimpan.tglLahirFormatted],
      ["Usia", dataTersimpan.usia],
      ["Jenis Kelamin", dataTersimpan.jk],
      ["Nomor HP", dataTersimpan.hp]
    ];
    if (dataTersimpan.email && dataTersimpan.email !== "-") {
      baris.push(["Email", dataTersimpan.email]);
    }
    baris.push(
      ["Poliklinik", dataTersimpan.poli],
      ["Dokter", dataTersimpan.dokter],
      ["Tanggal Kunjungan", dataTersimpan.tglKunjunganFormatted],
      ["Keluhan", dataTersimpan.keluhan]
    );

    baris.forEach(function (b) {
      const dt = document.createElement("dt");
      dt.className = "col-sm-4";
      dt.textContent = b[0];
      const dd = document.createElement("dd");
      dd.className = "col-sm-8";
      dd.textContent = b[1];
      el("isi-ringkasan").append(dt, dd);
    });

    new bootstrap.Modal(el("modal-ringkasan")).show();
  }

  // Reset form saat modal ditutup
  el("modal-ringkasan").addEventListener("hidden.bs.modal", function () {
    el("form-daftar").reset();
    el("usia").value = "-";
    if (el("hitung-keluhan")) el("hitung-keluhan").textContent = "0 / 200";
    if (el("dokter")) {
      el("dokter").innerHTML = '<option value="">Pilih poliklinik dulu</option>';
      el("dokter").disabled = true;
    }
  });

  if (el("btn-cetak")) {
    el("btn-cetak").addEventListener("click", function () { window.print(); });
  }
}
