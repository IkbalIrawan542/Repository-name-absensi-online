ABSENSI ONLINE FIREBASE
Project: inhouse-35f83

Aktifkan Authentication > Email/Password dan buat Firestore Database.
Buat dokumen users/{UID}:
Admin: {"role":"admin","name":"Administrator"}
Karyawan: {"role":"employee","employeeId":"001","name":"Karyawan 001"}
Buat 100 akun karyawan di Authentication dan dokumen users masing-masing.
Publish firestore.rules.
Jalankan lewat web server/Firebase Hosting, bukan file://.
