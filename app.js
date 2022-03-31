const exp = require('constants');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const port = 3000;
const {loadContact,findContact,addContact,cekDuplikat, deleteContact, updateContacts} = require('./utils/contacts');

// express-validator module
const {body,validationResult,check} = require('express-validator');

// module untuk flash-data, session dan cookie
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

// gunakan ejs
app.set('view engine', 'ejs');


// Third-party middleware
app.use(expressLayouts); // gunakan express-ejs-layouts (untuk layouting)

// Bulit-In middleware
app.use(express.static('public')); // agar bisa baca isi folder

// middleware untuk menerima data dari form isian
app.use(express.urlencoded({extended: true})); 

// Konfigurasi flash
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: {maxAge:6000},
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// get : menangkap route request urlnya
app.get('/', (req, res) => {
    //   res.send('Hello World!') // tampilkan text 

    // sendFile untuk kirim file, parameter kedua diisi agar tahu folder rootnya
    // res.sendFile('./index.html', {root: __dirname}); 

    const mahasiswa = [
      {
        nama: 'Aqil Emeraldi',
        email: 'aqil@gmail.com'
      },
      {
        nama: 'Erik',
        email: 'erk@gmail.com'
      },
      {
        nama: 'Doddy',
        email: 'doddy@gmail.com'
      }
    ]

    res.render('index', {layout: 'layouts/main-layout', nama: 'Aqil Emeraldi', title: 'Halaman Home', mahasiswa}); // mengirimkan file ke browser via view engine EJS, pada folder views(default)
    // parameter kedua pada fungsi render untuk mengirim data
    // layout: 'layouts/main-layout' : kalau mau pakai layouting dari express-ejs-layouts
})
app.get('/json', (req, res) => {
  res.json({ // tampilkan dalam format json
    nama: 'Aqil',
    email: 'aqil@gmail.com',
    noHp: '0988898912'
  }) 
})
app.get('/about', (req, res) => {
  res.render('about', {layout: 'layouts/main-layout', title: 'Halaman About'});
})

app.get('/contact', (req, res) => {
  const contacts = loadContact(); // ambil dari file contacts.js di folder utils
  res.render('contact', {
    layout: 'layouts/main-layout', 
    title: 'Halaman Contact',
    contacts,
    msg: req.flash('msg'), // diambil dari proses tambah data (jika ada)
  });
})


// route tambah data (pastikan ditaruh sebelum route yang mengirimkan data, cth : route detail, seperti dibawah)
app.get('/contact/add', (req, res) => {
  res.render('add-contact', {
    title: 'Form Tambah Data Kontak',
    layout: 'layouts/main-layout',
  })
});


// route proses tambah data kontak
app.post('/contact', [

  // untuk express-validatornya

  body('nama').custom((value) => { // membuat validator baru
    const duplikat = cekDuplikat(value); // cek apakah ada duplikat
    if(duplikat) { // kalo ada duplikat
      throw new Error('Nama kontak sudah digunakan!');
    }
    return true; // hasil jika tidak ada duplikat
  }),
  check('email', 'Email tidak valid').isEmail(), // parameter pertama dari name pada form, parameter kedua untuk custom pesan error
  check('noHp', 'No. HP tidak valid').isMobilePhone('id-ID')
], (req, res) => {

  const errors = validationResult(req); // variabel untuk menampung errornya

  if(!errors.isEmpty()) { // cek apakah errornya tidak kosong
    // return res.status(400).json({ errors: errors.array() });

    res.render('add-contact', {
      title: 'Form Tambah Data Kontak',
      layout: 'layouts/main-layout',
      errors: errors.array(), // p: jika tidak ada errors maka hasilnya akan undefined
    });

  } else { // jika errorsnya kosong
    addContact(req.body);

    // kirimkan flash message
    req.flash('msg', 'Data kontak berhasil ditambahkan!');

    res.redirect('/contact');
  };

});


// proses delete data (taruh sebelum fungsi detail)
app.get('/contact/delete/:nama', (req, res) => {
  const contact = findContact(req.params.nama);
  if(!contact){
    res.status(404);
    res.send('<h1>404</h1>');
  } else {
    deleteContact(req.params.nama);
    // kirimkan flash message
    req.flash('msg', 'Data kontak berhasil dihapus!');
    res.redirect('/contact');
  }
});


// route ke halaman form ubah data
app.get('/contact/edit/:nama', (req, res) => {
  const contact = findContact(req.params.nama);

  res.render('edit-contact', {
    title: 'Form Ubah Data Kontak',
    layout: 'layouts/main-layout',
    contact,
  })
});


// proses update data
app.post('/contact/update', [

  // untuk express-validatornya

  body('nama').custom((value, {req}) => { // membuat validator baru
    const duplikat = cekDuplikat(value); // cek apakah ada duplikat
    if(value !== req.body.oldNama && duplikat) { // cek apakah nama tidak sama dengan nama lama dan cek apakah ada duplikat
      throw new Error('Nama kontak sudah digunakan!');
    }
    return true; // hasil jika tidak ada duplikat
  }),
  check('email', 'Email tidak valid').isEmail(), // parameter pertama dari name pada form, parameter kedua untuk custom pesan error
  check('noHp', 'No. HP tidak valid').isMobilePhone('id-ID')
], (req, res) => {

  const errors = validationResult(req); // variabel untuk menampung errornya

  if(!errors.isEmpty()) { // cek apakah errornya tidak kosong
    // return res.status(400).json({ errors: errors.array() });

    res.render('edit-contact', {
      title: 'Form Ubah Data Kontak',
      layout: 'layouts/main-layout',
      errors: errors.array(), // p: jika tidak ada errors maka hasilnya akan undefined
      contact: req.body,
    });

  } else { // jika errorsnya kosong
    updateContacts(req.body);

    // kirimkan flash message
    req.flash('msg', 'Data kontak berhasil diubah!');

    res.redirect('/contact');
  };

});


// route detail
app.get('/contact/:nama', (req, res) => {
  const contact = findContact(req.params.nama); // kirim uri nama ke fungsi findContact

  res.render('detail', {
    layout: 'layouts/main-layout', 
    title: 'Halaman Detail Kontak',
    contact
  });
})


// use : kalau req urlnya tidak ada tampilkan ini, harus ditaruh paling bawah (dibawah app.get)
app.use('/', (req, res) => {
    res.status(404) // memberi status 404 di network inspect
    res.send('<h1>404</h1>')
})

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})