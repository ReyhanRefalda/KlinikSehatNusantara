/* ===== DATA SIMULASI (bukan data asli) ===== */
const dokter = [
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
const kodePoli = { Umum: "UMUM", Gigi: "GIGI", KIA: "KIA", Gizi: "GIZI" };
// Nomor antrean terakhir (simulasi), akan bertambah setiap ada pendaftaran
const antreanTerakhir = { Umum: 6, Gigi: 2, KIA: 4, Gizi: 1 };

/* ===== FUNGSI UMUM ===== */
function sapaanWaktu(jam) {
  if (jam < 11) return "Selamat pagi";
  else if (jam < 15) return "Selamat siang";
  else if (jam < 18) return "Selamat sore";
  else return "Selamat malam";
}
function hitungUsia(tglLahir) {
  const hariIni = new Date();
  let usia = hariIni.getFullYear() - tglLahir.getFullYear();
  const belumUlangTahun = hariIni.getMonth() < tglLahir.getMonth() ||
    (hariIni.getMonth() === tglLahir.getMonth() && hariIni.getDate() < tglLahir.getDate());
  if (belumUlangTahun) usia--;
  return usia;
}
function buatNomorAntrean(poli) {
  antreanTerakhir[poli]++;
  return kodePoli[poli] + "-" + String(antreanTerakhir[poli]).padStart(3, "0");
}
function ambilDokterByPoli(poli) {
  return dokter.filter(function (d) { return d.poliklinik === poli; });
}
function jamNol(tanggal) { tanggal.setHours(0, 0, 0, 0); return tanggal; } // tanggal tanpa jam
function bacaTanggal(teks) { return new Date(teks + "T00:00:00"); }
function formatTanggal(teks) {
  return bacaTanggal(teks).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function ubahKeTeks(tgl) { // Date -> "yyyy-mm-dd" (waktu lokal)
  return tgl.getFullYear() + "-" + String(tgl.getMonth() + 1).padStart(2, "0") + "-" + String(tgl.getDate()).padStart(2, "0");
}
function el(id) { return document.getElementById(id); }

/* ===== MODE GELAP ===== */
// Tema disimpan di localStorage agar tetap sama saat pindah halaman
function terapkanTema(tema) {
  document.documentElement.setAttribute("data-bs-theme", tema); // Bootstrap 5.3 membaca atribut ini
  localStorage.setItem("tema", tema);
  const tombol = el("btn-tema");
  tombol.textContent = tema === "dark" ? "☀️ Terang" : "🌙 Gelap";
  tombol.setAttribute("aria-pressed", tema === "dark");
}
// Tema awal: pilihan tersimpan, jika belum ada ikuti pengaturan perangkat
const temaTersimpan = localStorage.getItem("tema");
const perangkatGelap = window.matchMedia("(prefers-color-scheme: dark)").matches;
terapkanTema(temaTersimpan || (perangkatGelap ? "dark" : "light"));
// event click: ganti tema
el("btn-tema").addEventListener("click", function () {
  const sekarang = document.documentElement.getAttribute("data-bs-theme");
  terapkanTema(sekarang === "dark" ? "light" : "dark");
});

/* ===== BERANDA: sapaan otomatis ===== */
if (el("sapaan")) {
  el("sapaan").textContent = sapaanWaktu(new Date().getHours()) + ", selamat datang di Sehat Nusantara";
}

/* ===== JADWAL DOKTER: tampil dinamis + filter ===== */
if (el("daftar-dokter")) {
  function tampilkanDokter(poli) {
    const daftar = poli === "Semua" ? dokter : ambilDokterByPoli(poli);
    el("daftar-dokter").innerHTML = "";
    el("isi-tabel").innerHTML = "";
    daftar.forEach(function (d) {
      const huruf = d.nama.replace(/^(dr\.|drg\.)\s*/i, "").charAt(0).toUpperCase();
      const kolom = document.createElement("div");
      kolom.className = "col-12 col-md-6 col-lg-4";
      kolom.innerHTML = '<div class="kartu-dokter"><div class="avatar" aria-hidden="true">' + huruf + '</div><div>' +
        '<h2 class="h6 mb-1">' + d.nama + '</h2><span class="badge-poli">Poliklinik ' + d.poliklinik + '</span>' +
        '<p class="mb-0 mt-1 small">' + d.hari + ", " + d.jam + '<br>' + d.info + '</p></div></div>';
      el("daftar-dokter").appendChild(kolom);
      const baris = document.createElement("tr");
      baris.innerHTML = "<td>" + d.nama + "</td><td>" + d.poliklinik + "</td><td>" + d.hari + "</td><td>" + d.jam + "</td>";
      el("isi-tabel").appendChild(baris);
    });
    el("jumlah-dokter").textContent = "Menampilkan " + daftar.length + " dokter.";
  }
  tampilkanDokter("Semua");
  // event change: filter berdasarkan poliklinik
  el("filter-poli").addEventListener("change", function () { tampilkanDokter(this.value); });
  // event click: tampilkan / sembunyikan tabel jadwal
  el("btn-tabel").addEventListener("click", function () {
    const tersembunyi = el("wadah-tabel").classList.toggle("d-none");
    this.textContent = tersembunyi ? "Tampilkan tabel jadwal" : "Sembunyikan tabel jadwal";
  });
}

/* ===== PENDAFTARAN ===== */
if (el("form-daftar")) {
  const nilai = function (id) { return el(id).value.trim(); };
  // Rentang tanggal untuk input (validasi tetap dilakukan di JavaScript)
  const hariIni = jamNol(new Date());
  const batasAkhir = jamNol(new Date()); batasAkhir.setDate(batasAkhir.getDate() + 14);
  el("tglKunjungan").min = ubahKeTeks(hariIni);
  el("tglKunjungan").max = ubahKeTeks(batasAkhir);
  el("tglLahir").max = ubahKeTeks(hariIni);

  // Setiap fungsi mengembalikan pesan error, atau "" jika valid
  const validator = {
    nama: function () {
      const v = nilai("nama");
      if (!v) return "Nama lengkap wajib diisi.";
      if (!/^[A-Za-z\s]+$/.test(v)) return "Nama hanya boleh berisi huruf dan spasi.";
      if (v.length < 3) return "Nama minimal 3 karakter.";
      return "";
    },
    nik: function () {
      const v = nilai("nik");
      if (!v) return "NIK wajib diisi.";
      if (!/^\d+$/.test(v)) return "NIK hanya boleh berisi angka.";
      if (v.length !== 16) return "NIK harus 16 digit. Yang Anda isi baru " + v.length + " digit.";
      return "";
    },
    tglLahir: function () {
      const v = nilai("tglLahir");
      if (!v) return "Tanggal lahir wajib diisi.";
      if (bacaTanggal(v) > hariIni) return "Tanggal lahir tidak boleh di masa depan.";
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
    poli: function () { return nilai("poli") ? "" : "Pilih poliklinik."; },
    dokter: function () {
      const v = nilai("dokter");
      if (!v) return "Pilih dokter.";
      const cocok = dokter.find(function (d) { return d.nama === v && d.poliklinik === nilai("poli"); });
      return cocok ? "" : "Dokter tidak sesuai dengan poliklinik yang dipilih.";
    },
    tglKunjungan: function () {
      const v = nilai("tglKunjungan");
      if (!v) return "Tanggal kunjungan wajib diisi.";
      const tgl = bacaTanggal(v);
      if (tgl < hariIni) return "Tanggal kunjungan tidak boleh sebelum hari ini.";
      if (tgl > batasAkhir) return "Tanggal kunjungan maksimal 14 hari dari hari ini.";
      return "";
    },
    keluhan: function () {
      const panjang = nilai("keluhan").length;
      if (!panjang) return "Keluhan wajib diisi.";
      if (panjang < 10) return "Keluhan minimal 10 karakter.";
      if (panjang > 200) return "Keluhan maksimal 200 karakter.";
      return "";
    },
    setuju: function () { return el("setuju").checked ? "" : "Anda harus menyetujui penggunaan data."; }
  };

  // Tampilkan pesan di bawah kolom + tandai kolom yang tidak valid
  function tampilError(nama, pesan) {
    el("err-" + nama).textContent = pesan;
    document.querySelectorAll('[data-field="' + nama + '"]').forEach(function (k) {
      k.classList.toggle("is-invalid", pesan !== "");
    });
  }
  function periksa(nama) { const p = validator[nama](); tampilError(nama, p); return p === ""; }

  // Validasi saat kolom ditinggalkan
  Object.keys(validator).forEach(function (nama) {
    document.querySelectorAll('[data-field="' + nama + '"]').forEach(function (k) {
      k.addEventListener("blur", function () { periksa(nama); });
    });
  });

  // event change: tanggal lahir -> usia otomatis
  el("tglLahir").addEventListener("change", function () {
    const v = nilai("tglLahir");
    el("usia").value = (v && bacaTanggal(v) <= hariIni) ? hitungUsia(bacaTanggal(v)) + " tahun" : "-";
    periksa("tglLahir");
  });

  // event change: poliklinik -> pilihan dokter berubah (DOM)
  el("poli").addEventListener("change", function () {
    const pilihanDokter = el("dokter");
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
  el("dokter").addEventListener("change", function () { periksa("dokter"); });

  // event input: penghitung karakter keluhan
  el("keluhan").addEventListener("input", function () {
    const n = this.value.length;
    el("hitung-keluhan").textContent = n + " / 200";
    el("hitung-keluhan").style.color = n > 200 ? "#B3261E" : "";
  });

  // event submit: validasi semua kolom, proses hanya jika semua valid
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
    if (!semuaValid) { kolomPertama.focus(); return; }
    tampilkanRingkasan();
  });

  function tampilkanRingkasan() {
    const poli = nilai("poli");
    const jk = document.querySelector('input[name="jk"]:checked').value;
    const baris = [
      ["Nama lengkap", nilai("nama")], ["NIK", nilai("nik")],
      ["Tanggal lahir", formatTanggal(nilai("tglLahir"))], ["Usia", el("usia").value],
      ["Jenis kelamin", jk], ["Nomor HP", nilai("hp")]
    ];
    if (nilai("email")) baris.push(["Email", nilai("email")]);
    baris.push(["Poliklinik", poli], ["Dokter", nilai("dokter")],
      ["Tanggal kunjungan", formatTanggal(nilai("tglKunjungan"))], ["Keluhan", nilai("keluhan")]);

    el("nomor-antrean").textContent = buatNomorAntrean(poli);
    el("isi-ringkasan").innerHTML = "";
    baris.forEach(function (b) {
      const dt = document.createElement("dt"); dt.className = "col-sm-4"; dt.textContent = b[0];
      const dd = document.createElement("dd"); dd.className = "col-sm-8"; dd.textContent = b[1]; // textContent: aman dari HTML
      el("isi-ringkasan").append(dt, dd);
    });
    new bootstrap.Modal(el("modal-ringkasan")).show();
  }

  // Setelah modal ditutup, form dikosongkan untuk pendaftaran berikutnya
  el("modal-ringkasan").addEventListener("hidden.bs.modal", function () {
    el("form-daftar").reset();
    el("usia").value = "-";
    el("hitung-keluhan").textContent = "0 / 200";
    el("dokter").innerHTML = '<option value="">Pilih poliklinik dulu</option>';
    el("dokter").disabled = true;
  });
  el("btn-cetak").addEventListener("click", function () { window.print(); });
}
