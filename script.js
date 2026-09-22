/* =========================================================
   賃貸の相談室 — 動きの制御
   方針：モーションは「情報の関係」を伝えるためだけに使う。
         OSで「視差効果を減らす」を選んでいる人には動きを出さない。
   ========================================================= */
(function () {
  'use strict';

  var header   = document.getElementById('header');
  var burger   = document.getElementById('burger');
  var scrollCue = document.getElementById('scrollCue');

  // 「動きを減らしたい」設定かどうか（OS側の設定を読む）
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return reduceQuery.matches; }

  /* -------------------------------------------------
     1. ヘッダー：少しスクロールしたら白背景に切り替える
        （目的：写真の上でも文字を読めるようにするため）
     ------------------------------------------------- */
  function onScroll() {
    header.classList.toggle('is-stuck', window.scrollY > 60);
    // スクロール誘導は役目を終えたら消す
    if (scrollCue && window.scrollY > 40) scrollCue.classList.add('is-hidden');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------------
     2. スマホのメニュー開閉
     ------------------------------------------------- */
  if (burger) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    header.querySelectorAll('.header__nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -------------------------------------------------
     3. スクロールで要素を表示する
        遅らせる量はCSS側（役割ごと）で決めている。
        JS は「画面に入ったら is-in を付ける」だけ。
     ------------------------------------------------- */
  var targets = document.querySelectorAll('.reveal');

  function showAll() {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  }

  if (reduced() || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);   // 一度出したら監視をやめる
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------
     4. FAQ：答えの高さをなめらかに開閉する
        （目的：質問と答えのつながりを保ち、画面のガタつきを防ぐ）
        ・ひとつ開くと他は閉じる
        ・動きを減らす設定なら、即座に開閉する
     ------------------------------------------------- */
  var faqs = Array.prototype.slice.call(document.querySelectorAll('.faq details'));

  function animateHeight(box, from, to, done) {
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      box.removeEventListener('transitionend', onEnd);
      box.style.height = '';
      if (done) done();
    }
    function onEnd(ev) { if (ev.target === box && ev.propertyName === 'height') finish(); }

    box.style.height = from + 'px';
    box.getBoundingClientRect();            // いったん描画させてから動かす
    box.addEventListener('transitionend', onEnd);
    window.setTimeout(finish, 500);         // 念のための保険
    requestAnimationFrame(function () { box.style.height = to + 'px'; });
  }

  function closeItem(d, instant) {
    var box = d.querySelector('.faq__body');
    if (instant) { d.open = false; return; }
    if (d.dataset.busy) return;
    d.dataset.busy = '1';
    animateHeight(box, box.scrollHeight, 0, function () {
      d.open = false;
      delete d.dataset.busy;
    });
  }

  function openItem(d) {
    var box = d.querySelector('.faq__body');
    d.open = true;
    d.dataset.busy = '1';
    animateHeight(box, 0, box.scrollHeight, function () { delete d.dataset.busy; });
  }

  faqs.forEach(function (d) {
    var summary = d.querySelector('summary');

    summary.addEventListener('click', function (e) {
      // 動きを減らす設定のときは、ブラウザ標準の開閉にまかせる
      if (reduced()) {
        faqs.forEach(function (o) { if (o !== d) o.open = false; });
        return;
      }
      e.preventDefault();
      if (d.dataset.busy) return;

      if (d.open) {
        closeItem(d, false);
      } else {
        faqs.forEach(function (o) { if (o !== d && o.open) closeItem(o, false); });
        openItem(d);
      }
    });
  });
})();
