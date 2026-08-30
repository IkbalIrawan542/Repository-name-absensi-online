ABSENSI ONLINE FIREBASE - AUTO EMPLOYEE ID
Project: inhouse-35f83 / JADWAL INTERNAL

Perbaikan:
- Tombol Kirim request memakai getElementById.
- Request menampilkan status Mengirim... dan error Firestore.
- Mendukung collection users maupun pengguna.
- Saat pertama login, jika profil Firebase Auth belum memiliki dokumen Firestore, aplikasi otomatis membuat users/{UID} sebagai employee.
- Jika dokumen pengguna sudah ada tetapi employeeId/NIK kosong, aplikasi otomatis membuat Employee ID stabil dari UID: EMP-XXXXXX.
- Employee ID tidak berubah saat login berikutnya.
- Nama awal diambil dari displayName akun Google/Auth atau bagian sebelum @ pada email.

PENTING:
1. Publish ulang index.html, app.js, firebase.js, dan firestore.rules ke GitHub Pages/Firebase Hosting.
2. Publish firestore.rules ke Firestore Rules.
3. Setelah rules diperbarui, login ulang. Akun yang belum punya Employee ID akan otomatis dilengkapi.
4. Format ID otomatis: EMP-6KARAKTER_TERAKHIR_UID.

Contoh:
users/{UID}
{
  role: "employee",
  employeeId: "EMP-A1B2C3",
  name: "Nama Karyawan",
  email: "nama@email.com"
}
