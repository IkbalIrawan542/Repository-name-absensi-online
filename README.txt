ABSENSI ONLINE FIREBASE - VERSI DIPERBAIKI
Project: inhouse-35f83
Firebase Web App: JADWAL INTERNAL

1. Firebase Console > Authentication > Sign-in method > Email/Kata Sandi = Aktif.
2. Buat akun di Authentication > Users.
3. Firebase Console > Firestore Database > Data > buat collection users.
4. Dokumen ID HARUS sama persis dengan UID akun Authentication.
   Admin: {"role":"admin","name":"Administrator"}
   Karyawan: {"role":"employee","employeeId":"001","name":"Karyawan 001"}
5. Publish firestore.rules.
6. Jalankan melalui Firebase Hosting/GitHub Pages, bukan file://.

Catatan: versi ini memakai konfigurasi aplikasi web JADWAL INTERNAL yang terlihat pada Firebase Console.
Untuk karyawan, aplikasi hanya mengambil dokumen users miliknya sehingga tidak gagal permission saat membaca daftar users.
