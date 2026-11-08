/* ==========================================================
   efek.js — efek interaktif yang dipakai SEMUA halaman frameset.
   Tiap fitur memeriksa dulu apakah elemennya ada di halaman itu,
   jadi satu file ini aman dipanggil dari header, menu, home, dst.
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Alat bantu kecil ---------- */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sentuh = window.matchMedia("(hover: none)").matches;

  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });

  /* ---------- 1. Jam Jakarta (header, menu, footer) ---------- */
  function updateJam() {
  const sekarang = new Date();
  const opsi = { 
    timeZone: 'Asia/Jakarta', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: false 
  };

  const formatWaktu = new Intl.DateTimeFormat('id-ID', opsi).format(sekarang);
  const elemenJam = document.getElementById("jam");

  if (elemenJam) {
    elemenJam.innerText = formatWaktu;
  }
}

setInterval(updateJam, 1000);
updateJam();

  /* ---------- 2. Teks mengetik sendiri (header) ---------- */
  var ketik = $("#ketik");
  if (ketik) {
    var kalimat = ["Programming Web dengan HTML", "Cascading Style Sheet", "Belajar, berlatih, berkarya"];
    var k = 0, h = 0, hapus = false;
    (function langkah() {
      var kini = kalimat[k];
      h += hapus ? -1 : 1;
      ketik.textContent = kini.slice(0, h);
      var tunda = hapus ? 35 : 75;
      if (!hapus && h === kini.length) { hapus = true; tunda = 1700; }
      else if (hapus && h === 0) { hapus = false; k = (k + 1) % kalimat.length; tunda = 400; }
      setTimeout(langkah, tunda);
    })();
  }

  /* ---------- 3. Menu: tandai halaman yang sedang dibuka ---------- */
  var linkMenu = $$(".daftar a");
  linkMenu.forEach(function (a) {
    a.addEventListener("click", function () {
      linkMenu.forEach(function (x) { x.classList.remove("aktif"); });
      a.classList.add("aktif");
    });
  });
  if (linkMenu.length) { linkMenu[0].classList.add("aktif"); }

  /* ---------- 4. Muncul saat di-scroll ---------- */
  var rv = $$(".rv");
  if (rv.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (daftar) {
        daftar.forEach(function (it) {
          if (it.isIntersecting) { it.target.classList.add("in"); io.unobserve(it.target); }
        });
      }, { threshold: 0.12 });
      rv.forEach(function (el, i) {
        el.style.transitionDelay = (i % 4) * 90 + "ms";      // muncul bergantian
        io.observe(el);
      });
    } else {
      rv.forEach(function (el) { el.classList.add("in"); });  // browser lama: langsung tampil
    }
  }

  /* ---------- 5. Angka menghitung naik (home) ---------- */
  $$("[data-hitung]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-hitung")) || 0;
    var akhiran = el.getAttribute("data-akhiran") || "";
    var pengamat = new IntersectionObserver(function (d) {
      if (!d[0].isIntersecting) { return; }
      pengamat.disconnect();
      var mulai = performance.now();
      (function naik(now) {
        var p = clamp((now - mulai) / 1800, 0, 1);
        el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + akhiran;
        if (p < 1) { requestAnimationFrame(naik); }
      })(mulai);
    });
    pengamat.observe(el);
  });

  /* ---------- 6. Foto miring 3D mengikuti kursor (galery) ---------- */
  $$(".tilt").forEach(function (kotak) {
    var img = $("img", kotak);
    kotak.addEventListener("mousemove", function (e) {
      var r = kotak.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      img.style.transform = "rotateY(" + ((x - 0.5) * 16) + "deg) rotateX(" + ((0.5 - y) * 16) + "deg) scale(1.05)";
      kotak.style.setProperty("--gx", (x * 100) + "%");
      kotak.style.setProperty("--gy", (y * 100) + "%");
    });
    kotak.addEventListener("mouseleave", function () { img.style.transform = ""; });
  });

  /* ---------- 7. Lightbox: foto layar penuh (galery) ---------- */
  var lb = $("#lightbox");
  if (lb) {
    var lbImg = $("img", lb);
    $$(".foto-kartu").forEach(function (f) {
      f.addEventListener("click", function () { lbImg.src = $("img", f).src; lb.classList.add("buka"); });
    });
    lb.addEventListener("click", function () { lb.classList.remove("buka"); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") { lb.classList.remove("buka"); } });
  }

  /* ---------- 8. Tombol salin (kontak) ---------- */
  $$("[data-salin]").forEach(function (tombol) {
    tombol.addEventListener("click", function () {
      var isi = tombol.getAttribute("data-salin");
      var selesai = function () {
        var awal = tombol.textContent;
        tombol.textContent = "Tersalin ✓";
        tombol.classList.add("sudah");
        setTimeout(function () { tombol.textContent = awal; tombol.classList.remove("sudah"); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(isi).then(selesai, selesai);
      } else { selesai(); }
    });
  });

  /* ---------- 9. Tombol ke atas (footer) ----------
     Footer berada di frame sendiri. Menggulung frame "kanan" hanya
     diizinkan browser bila halaman dibuka lewat server (bukan file://),
     jadi dibungkus try/catch agar tidak error. */
  var keAtas = $("#keAtas");
  if (keAtas) {
    keAtas.addEventListener("click", function () {
      try { window.parent.frames["kanan"].scrollTo({ top: 0, behavior: "smooth" }); } catch (err) { /* diabaikan */ }
    });
  }

  /* ---------- 12. Akordeon tanya jawab (home) ---------- */
  $$(".faq-item").forEach(function (item) {
    var tombol = $(".faq-tanya", item), jawab = $(".faq-jawab", item);
    tombol.addEventListener("click", function () {
      var buka = item.classList.contains("buka");
      $$(".faq-item.buka").forEach(function (x) {            // tutup yang lain
        x.classList.remove("buka"); $(".faq-jawab", x).style.maxHeight = "0px";
      });
      if (!buka) { item.classList.add("buka"); jawab.style.maxHeight = jawab.scrollHeight + "px"; }
    });
  });

  /* ---------- 13. Bar kemahiran terisi saat terlihat (profil) ---------- */
  $$("[data-nilai]").forEach(function (isi) {
    var angka = parseFloat(isi.getAttribute("data-nilai")) || 0;
    var label = $("b", isi.parentElement.previousElementSibling);
    var pengamat = new IntersectionObserver(function (d) {
      if (!d[0].isIntersecting) { return; }
      pengamat.disconnect();
      isi.style.width = angka + "%";
      var mulai = performance.now();
      (function naik(now) {
        var p = clamp((now - mulai) / 1800, 0, 1);
        label.textContent = Math.round((1 - Math.pow(1 - p, 3)) * angka) + "%";
        if (p < 1) { requestAnimationFrame(naik); }
      })(mulai);
    });
    pengamat.observe(isi);
  });

  /* ---------- 14. Garis progress scroll di halaman yang bisa digulir ---------- */
  if ($(".rv") && !$(".header-halaman")) {
    var bar = document.createElement("div");
    bar.id = "progres";
    document.body.appendChild(bar);
    window.addEventListener("scroll", function () {
      var tinggi = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (tinggi > 0 ? clamp(window.scrollY / tinggi, 0, 1) : 0) + ")";
    }, { passive: true });
  }

  /* ---------- 15. Pintasan keyboard: tekan 1 sampai 5 di menu ---------- */
  if (linkMenu.length) {
    window.addEventListener("keydown", function (e) {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= linkMenu.length) { linkMenu[n - 1].click(); }
    });
  }

  /* ---------- 10. Cahaya mengikuti kursor ---------- */
  var cahaya = $("#cahaya"), cx = mx, cy = my;

  /* ---------- 11. Gelembung warna-warni di kanvas ---------- */
  var cv = $("#debu"), g = cv ? cv.getContext("2d") : null, W = 0, H = 0, P = [];
  var WARNA = ["255,143,171", "255,209,102", "123,220,181", "142,202,230", "185,166,255"];   // pink, kuning, mint, langit, ungu
  function ukur() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var jumlah = clamp(Math.floor(W * H / 30000), 8, 24);
    P = [];
    for (var i = 0; i < jumlah; i++) {
      P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: -0.15 - Math.random() * 0.35, r: 6 + Math.random() * 14, a: 0.3 + Math.random() * 0.3, c: WARNA[i % WARNA.length] });
    }
  }
  function gambarDebu() {
    g.clearRect(0, 0, W, H);
    for (var i = 0; i < P.length; i++) {
      var p = P[i], dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 16000) {                                   // menjauhi kursor
        var f = (1 - d2 / 16000) * 1.8, d = Math.sqrt(d2 + 1);
        p.x += dx / d * f; p.y += dy / d * f;
      }
      p.x += p.vx; p.y += p.vy;
      if (p.y < -30) { p.y = H + 30; p.x = Math.random() * W; }
      if (p.x < -30) { p.x = W + 30; } else if (p.x > W + 30) { p.x = -30; }
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283);      // gelembung berwarna
      g.fillStyle = "rgba(" + p.c + "," + p.a + ")"; g.fill();
      g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,.85)"; g.stroke();
      g.beginPath(); g.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, 6.283);   // kilau kecil
      g.fillStyle = "rgba(255,255,255,.8)"; g.fill();
    }
  }
  if (cv) { ukur(); window.addEventListener("resize", ukur); }

  /* ---------- Loop animasi tunggal untuk kursor dan debu ---------- */
  function frame() {
    if (cahaya && !sentuh) {
      cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
      cahaya.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
    }
    if (g && !kurangGerak) { gambarDebu(); }
    requestAnimationFrame(frame);
  }
  if (cv || cahaya) { requestAnimationFrame(frame); }
})();
