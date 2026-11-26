// ── 설정: 카카오톡 채널 ID(_로 시작), 구글 시트 Apps Script 웹앱 주소 ──
// 비밀값 아님(공개 주소). 비워 두면 해당 단계는 건너뜀.
const KAKAO_CHANNEL = ''          // 예: '_AbCdE'
const SHEET_URL = ''              // 예: 'https://script.google.com/macros/s/.../exec'

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = v => Math.min(1, Math.max(0, v))

// 한 번 화면에 들어오면 실행
const once = (els, fn, margin = '0px 0px -15% 0px') => {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { fn(e.target); io.unobserve(e.target) }
  }), { rootMargin: margin })
  els.forEach(el => io.observe(el))
}

// 사진 열림
once($$('.reveal'), el => el.classList.add('in'))

// 프로모션 0 → 1,500
once($$('.count'), el => {
  const to = +el.dataset.to
  if (calm) return
  const t0 = performance.now()
  const tick = t => {
    const p = clamp((t - t0) / 1600)
    el.textContent = Math.round(to * (1 - (1 - p) ** 3)).toLocaleString('ko-KR')
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

// 매출 숫자 굴림: 자리마다 0~n 세로 띠
$$('.odo').forEach(el => {
  el.innerHTML = [...el.dataset.value].map(c => /\d/.test(c)
    ? `<span class="d" data-n="${c}">${Array.from({ length: +c + 1 }, (_, i) => `<span>${i}</span>`).join('')}</span>`
    : `<span>${c}</span>`).join('') + '<span class="unit">원</span>'
  if (calm) $$('.d', el).forEach(d => d.style.transform = `translateY(-${d.dataset.n * 1.2}em)`)
})
once($$('.odo'), el => $$('.d', el).forEach((d, i) => {
  d.style.transitionDelay = i * 60 + 'ms'
  d.style.transform = `translateY(-${d.dataset.n * 1.2}em)`
}))

// 재료: 제자리에서 하나씩 tada
$$('.tada').forEach((el, i) => el.style.setProperty('--i', i))
once($$('.ing-grid'), g => $$('.tada', g).forEach(el => el.classList.add('in')))

// 카카오톡 상담하기: 채널 ID가 있으면 채팅방으로
const kakaoUrl = KAKAO_CHANNEL && `https://pf.kakao.com/${KAKAO_CHANNEL}/chat`
$$('.js-kakao').forEach(a => {
  if (kakaoUrl) Object.assign(a, { href: kakaoUrl, target: '_blank', rel: 'noopener noreferrer' })
  else if (a.id === 'kakao-cta') a.addEventListener('click', e => {
    e.preventDefault()
    $('.consult-note').textContent = '카카오톡 채널 연결 준비 중입니다. 02-900-8805로 전화 주시면 바로 상담해 드립니다.'
  })
})

// 점주 인터뷰: 누를 때만 유튜브를 불러옴
$$('.yt').forEach(b => b.addEventListener('click', () => {
  b.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.id}?autoplay=1" title="점주 인터뷰 영상" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
}, { once: true }))

// 면발 한 가닥: 그릇 아래에서 짧게 휘어 오른쪽 가장자리로 간 뒤 곧게 내려가며,
// 화면 1.3개 높이마다 한 번씩 꼬였다가(고리/두 번 꼬임 번갈아) 카카오톡 상담 버튼에 닿음
const main = $('main'), nsvg = $('.noodle'), npath = $('path', nsvg)
let nTotal = 0, nSamples = []
const loop = (X, y, r, d, turns) => { // 세로로 내려가며 안쪽(왼쪽)으로 고리를 그림
  let s = ''
  const n = 36 * turns
  for (let k = 1; k <= n; k++) {
    const t = k / n * Math.PI * 2 * turns
    s += ` L${(X - d * (1 - Math.cos(t))).toFixed(1)} ${(y + r * t - d * Math.sin(t)).toFixed(1)}`
  }
  return { s, h: r * Math.PI * 2 * turns }
}
const buildNoodle = () => {
  const W = main.clientWidth, mTop = main.getBoundingClientRect().top
  const rel = el => { const r = el.getBoundingClientRect(); return { t: r.top - mTop, b: r.bottom - mTop, l: r.left, r: r.right } }
  const bowl = rel($('.bowl img')), cta = rel($('#kakao-cta'))
  const mob = W < 768
  const X = W - (mob ? 12 : Math.max(24, (W - 1120) / 2 - 8))
  const x = (bowl.l + bowl.r) / 2, y0 = bowl.b - 24
  const y1 = Math.min(y0 + 160, rel($('.marquee')).t - 4), h = y1 - y0
  const ey = (cta.t + cta.b) / 2, turnY = ey - 90
  let d = `M${x} ${y0} C${x - 40} ${y0 + h * .5} ${X} ${y0 + h * .3} ${X} ${y1}`
  // 불투명 구간(재료·비용) 안에서는 꼬임이 가려지므로 그 아래로 미룸
  const solid = $$('.ing-sec, .cost-sec').map(rel)
  const gap = innerHeight * 1.3, R = mob ? 4.5 : 6, D = mob ? 13 : 18
  let y = y1 + gap * .6, n = 0
  while (y < turnY - 200) {
    const hit = solid.find(s => y > s.t - 80 && y < s.b)
    if (hit) { y = hit.b + 60; continue }
    const L = loop(X, y, R, D, n % 2 ? 2 : 1)
    if (y + L.h > turnY - 40) break
    d += ` L${X} ${y}${L.s}`
    y += L.h + gap; n++
  }
  d += ` L${X} ${turnY} C${X} ${ey - 30} ${X - 10} ${ey} ${cta.r - 4} ${ey}`
  nsvg.setAttribute('viewBox', `0 0 ${W} ${main.offsetHeight}`)
  nsvg.style.height = main.offsetHeight + 'px'
  npath.setAttribute('d', d)
  nTotal = npath.getTotalLength()
  nSamples = Array.from({ length: 801 }, (_, i) => { const len = nTotal * i / 800; return { len, y: npath.getPointAtLength(len).y } })
  npath.style.strokeDasharray = nTotal
}

// 스크롤에 따라 움직이는 것들
const hero = $('.hero'), steps = $('.steps'), stepItems = $$('.steps li')
const hd = $('.hd'), dock = $('.dock'), consult = $('#consult')
const onScroll = () => {
  const vh = innerHeight
  hd.classList.toggle('on', scrollY > 10)

  // 면발 선: 화면 아래쪽 90% 지점까지 그려짐 (꼬임 구간은 y가 되돌아가므로 처음 넘는 지점 기준)
  if (nTotal) {
    const target = scrollY + vh * .9 - (main.getBoundingClientRect().top + scrollY)
    const i = nSamples.findIndex(p => p.y > target)
    const len = calm || i < 0 ? nTotal : nSamples[Math.max(0, i - 1)].len
    npath.style.strokeDashoffset = nTotal - len
  }

  // 하단 버튼: 첫 화면 지나면 올라오고, 마지막 상담 구간에서는 내려감
  dock.classList.toggle('on', hero.getBoundingClientRect().bottom < 0 && consult.getBoundingClientRect().top > vh * .6)

  // 8단계 선 채우기
  const sr = steps.getBoundingClientRect()
  const p = clamp((vh * .7 - sr.top) / sr.height)
  steps.style.setProperty('--fill', p)
  stepItems.forEach((li, i) => li.classList.toggle('on', p >= i / stepItems.length))
}
let ticking = false
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false }) }
}, { passive: true })
const layout = () => { buildNoodle(); onScroll() }
addEventListener('resize', layout)
addEventListener('load', layout)
document.fonts.ready.then(layout)
layout()

// ── 상담 폼(지금은 숨김): 검사 → (시트 저장) → 내용 복사 → 카카오톡 채널 채팅 열기 ──
const f = $('#inquiry'), msg = $('.form-msg', f)
const say = (t, ok) => { msg.textContent = t; msg.className = 'form-msg full ' + (ok ? 'ok' : 'err') }
f.addEventListener('submit', async e => {
  e.preventDefault()
  const d = Object.fromEntries(new FormData(f))
  const bad = [['name', '성함'], ['phone', '연락처'], ['area', '창업 희망 지역'], ['budget', '투자 가능 금액']]
    .filter(([k]) => !String(d[k] || '').trim())
  $$('input,select', f).forEach(el => el.removeAttribute('aria-invalid'))
  bad.forEach(([k]) => f.elements[k].setAttribute('aria-invalid', 'true'))
  if (bad.length) { f.elements[bad[0][0]].focus(); return say(bad.map(b => b[1]).join(', ') + '을(를) 적어 주세요.') }
  if (!/^[0-9\-\s]{9,14}$/.test(d.phone)) { f.elements.phone.focus(); return say('연락처를 숫자로 적어 주세요. 예: 010-1234-5678') }
  if (!d.agree) { f.elements.agree.focus(); return say('개인정보 수집·이용에 동의해 주세요.') }

  const text = `[수유리우동집 창업 상담 신청]
성함: ${d.name}
연락처: ${d.phone}
희망 지역: ${d.area}
점포 보유: ${d.store}
투자 가능 금액: ${d.budget}
궁금한 점: ${d.memo || '-'}`

  // 카카오톡 창은 사용자가 누른 직후에 열어야 막히지 않음 → 먼저 엶
  const chat = KAKAO_CHANNEL ? window.open(`https://pf.kakao.com/${KAKAO_CHANNEL}/chat`, '_blank') : null
  try { await navigator.clipboard.writeText(text) } catch { }
  if (SHEET_URL) fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ ...d, page: location.href }) }).catch(() => { })

  if (!KAKAO_CHANNEL) return say('접수 내용을 복사했어요. 카카오톡 채널 연결 전이라 02-900-8805로 전화 주세요.')
  if (!chat) location.href = `https://pf.kakao.com/${KAKAO_CHANNEL}/chat`
  say('신청 내용을 복사했어요. 열린 카카오톡 채팅방에 붙여넣고 보내 주세요.', true)
  f.reset()
})
