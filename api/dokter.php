<?php
/**
 * API Endpoint: Membaca data dokter dari file data_dokter.txt
 * Klinik Pratama Sehat Nusantara
 *
 * Format baris dalam TXT: id|nama|poliklinik|hari|jam|info
 * Baris yang diawali '#' dianggap komentar dan diabaikan.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// Path ke file data dokter (satu level di atas folder api/)
$filePath = __DIR__ . '/../data_dokter.txt';

// Validasi keberadaan file
if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        'status'  => 'error',
        'pesan'   => 'File data_dokter.txt tidak ditemukan.',
        'dokter'  => []
    ]);
    exit;
}

// Baca isi file dengan encoding UTF-8
$isi = file_get_contents($filePath);
if ($isi === false) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'pesan'   => 'Gagal membaca file data_dokter.txt.',
        'dokter'  => []
    ]);
    exit;
}

// Normalisasi line ending (Windows \r\n → \n)
$isi   = str_replace("\r\n", "\n", $isi);
$isi   = str_replace("\r", "\n", $isi);
$baris = explode("\n", trim($isi));

$daftarDokter = [];
$barisError   = [];

foreach ($baris as $no => $baris_item) {
    $baris_item = trim($baris_item);

    // Lewati baris kosong dan komentar
    if ($baris_item === '' || str_starts_with($baris_item, '#')) {
        continue;
    }

    // Pecah berdasarkan delimiter '|'
    $bagian = explode('|', $baris_item);

    // Validasi jumlah kolom (harus tepat 6)
    if (count($bagian) !== 6) {
        $barisError[] = 'Baris ' . ($no + 1) . ' tidak valid: "' . htmlspecialchars($baris_item) . '"';
        continue;
    }

    $id        = trim($bagian[0]);
    $nama      = trim($bagian[1]);
    $poliklinik = trim($bagian[2]);
    $hari      = trim($bagian[3]);
    $jam       = trim($bagian[4]);
    $info      = trim($bagian[5]);

    // Validasi field wajib tidak boleh kosong
    if ($id === '' || $nama === '' || $poliklinik === '') {
        $barisError[] = 'Baris ' . ($no + 1) . ' memiliki field wajib yang kosong.';
        continue;
    }

    // Validasi poliklinik harus salah satu dari yang dikenal
    $poliklinikValid = ['Umum', 'Gigi', 'KIA', 'Gizi'];
    if (!in_array($poliklinik, $poliklinikValid, true)) {
        $barisError[] = 'Baris ' . ($no + 1) . ': poliklinik "' . htmlspecialchars($poliklinik) . '" tidak dikenal.';
        continue;
    }

    $daftarDokter[] = [
        'id'         => $id,
        'nama'       => $nama,
        'poliklinik' => $poliklinik,
        'hari'       => $hari,
        'jam'        => $jam,
        'info'       => $info
    ];
}

$respons = [
    'status' => 'ok',
    'total'  => count($daftarDokter),
    'dokter' => $daftarDokter
];

// Sertakan pesan error parsing hanya jika ada (opsional untuk debugging)
if (!empty($barisError)) {
    $respons['peringatan'] = $barisError;
}

echo json_encode($respons, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
