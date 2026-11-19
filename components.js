const COLORS = ['#ffb020', '#ff3d7f', '#ff7a1a', '#2ee6d6', '#8cff4a', '#b04dff', '#ffe14d']; // bulb colours

// people: dx = left/right of rangoli centre, dy = back/front, h = height (x U)
const PEOPLE = [
    { dx: -1.9, dy: 0.1, h: .38, kind: 'saree', c1: '#d81b3c', c2: '#ffd24a' },
    { dx: 1.9, dy: 0.0, h: .40, kind: 'kurta', c1: '#1f6fd1', c2: '#f4ead2', topi: '#b3202a', stache: true },
    { dx: -1.2, dy: 1.0, h: .30, kind: 'saree', c1: '#1b9c5a', c2: '#ffd24a', sit: true },
    { dx: 1.15, dy: 1.0, h: .30, kind: 'kurta', c1: '#f08a1c', c2: '#f4ead2', sit: true },
    { dx: -2.6, dy: 0.9, h: .25, kind: 'saree', c1: '#8e3bd1', c2: '#ffe14d' }
];
const DOG = { dx: 1, dy: -1.2, size: .13 };
const COW = {dx:-0.7, dy:-1.5, size:.22}; 

// scroll timeline (0 = top of page, 1 = end of story)
const T = { descend: .36, zoomIn: [.40, .62], fade: [.56, .64], zoomOut: [.64, 1], maxZoom: 26 };
const GROUND = 1.45;   // street level, in screen heights below the top
const CAM = 1.13      // how far the camera travels down, in screen heights


// working of the canvas
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let W = 0, H = 0, U = 0, DPR = 1;

// It measures the window, ignores small phone address-bar height changes, and resizes the canvas (sharper on high-resolution screens, capped at 2×) while setting the sizing unit U that keeps the scene responsive.
function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    if (W === w && Math.abs(H - h) < 120) return;        // ignore phone address-bar wobble
    W = w; H = h; U = Math.min(H, W * 0.7);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
}
window.addEventListener('resize', resize); resize();

//Done: When the switch is turned on, it adds the class on to fade the scene in, then removes the locked class 1.5 seconds later so scrolling is allowed.
document.getElementById('sw').addEventListener('change', function (e) {
    if (e.target.checked) {
    document.body.classList.add('on');
    setTimeout(function () { document.body.classList.remove('locked'); }, 1500);
    }
});

/* hide the SCROLL hint once the footer comes into view */
(function () {
    var footer = document.querySelector('#final footer');
    function updateHint() {        // true when the top of the footer has entered the screen
        var reached = footer.getBoundingClientRect().top < window.innerHeight;
        document.body.classList.toggle('hide-hint', reached);   // adds or removes the class on <body>
    }
    window.addEventListener('scroll', updateHint);
    window.addEventListener('resize', updateHint);
    updateHint();   // run once on load
})();


function clamp(x, min, max) { min = (min === undefined) ? 0 : min; max = (max === undefined) ? 1 : max; return x < min ? min : (x > max ? max : x); }
function ease(x) { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x); }          // smooth start and stop
function between(p, r) { return clamp((p - r[0]) / (r[1] - r[0])); }                   // progress inside a range
let seed = 11;
function rand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }      // same "random" every load

// Where they are used in the project
// 1. ell draws the moon, the sun, shadows under people, heads, the dog’s body, fruits and diya rims.
// 2. poly draws the building’s side wall, saree and kurta shapes, windows on the angled side wall, and the dog’s ear.

function ell(x, y, rx, ry, c) {// filled oval/circle
  ctx.fillStyle = c;                          // pick the colour
  ctx.beginPath();                            // start a new shape
  ctx.ellipse(x, y, rx, ry, 0, 0, 7);         // describe an oval
  ctx.fill();                                 // paint it
}

function poly(pts, c) {// filled polygon
  ctx.fillStyle = c;                               // pick the colour
  ctx.beginPath();                                 // start a new shape
  ctx.moveTo(pts[0][0], pts[0][1]);                // go to the first corner
  for (let i = 1; i < pts.length; i++)
    ctx.lineTo(pts[i][0], pts[i][1]);              // draw a line to each next corner
  ctx.fill();                                      // fill the closed shape
}

/* where the rangoli centre is (world coordinates and on-screen after camera moved) */
function layout() { 
    const wy = (GROUND + .25) * H; 
    return { rr: Math.min(W * .2, U * .34), cx: W / 2, worldY: wy, screenY: wy - CAM * H };
}

const stars = [], blocks = [], cityLights = [], pondDiyas = [];
for (let i = 0; i < 160; i++) stars.push({ x: rand(), y: rand() * .6, r: rand() * 1.3 + .3, p: rand() * 6 });
for (let l = 0; l < 3; l++) { for (let x = 0; x < 1;) { const w = .02 + rand() * .03; blocks.push({ x: x, w: w, h: .04 + rand() * .1, l: l }); x += w * .9; } }
for (let i = 0; i < 380; i++) cityLights.push({ x: rand(), y: rand(), c: COLORS[Math.floor(rand() * 7)], p: rand() * 6 });
for (let i = 0; i < 46; i++) pondDiyas.push({ x: rand(), d: rand(), p: rand() * 6 });

for (let i=0;i<500;i++) cityLights.push({x:rand(), y:rand(), c:COLORS[Math.floor(rand()*7)], p:rand()*6});

// bulb draws a glowing light by painting a large faint circle with a smaller brighter circle on top, using the brightness a to make it twinkle.
function bulb(x, y, r, c, a) {// glowing bulb
    ctx.fillStyle = c;
    ctx.globalAlpha = a * .28; // how bright or dim
    ctx.beginPath(); 
    // the glow
    ctx.arc(x, y, r * 3, 0, 7); 
    ctx.fill();
    ctx.globalAlpha = Math.min(1, a + .2);  // core ko brightness
    ctx.beginPath(); 
    // core ko circle
    ctx.arc(x, y, r, 0, 7); 
    ctx.fill();
}

// lightString draws a drooping wire between two points and places evenly spaced, rotating-colour bulbs along it that twinkle out of step with each other.
function lightString(x1, y1, x2, y2, sag, n, t, sd) {              // drooping wire with twinkling bulbs
    ctx.globalAlpha = .7; 
    ctx.strokeStyle = '#000'; 
    ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(x1, y1); 
    ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2, x2, y2); 
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= n; i++) { 
        const f = i / n; 
        bulb(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f + sag * 4 * f * (1 - f), U * .005 + 1.5, COLORS[(i + sd) % 7], .6 + .4 * Math.sin(t * 3 + i * 1.7 + sd)); } //  bulb( ...position..., ...size..., ...colour..., ...brightness... );
    ctx.globalCompositeOperation = 'source-over'; 
    ctx.globalAlpha = 1;
}

function diya(x, y, u, t, ph) { // clay diyo + flickering flame. (x,y)=rim, u=half width
    // bowl
    ctx.fillStyle = '#8a3a14'; 
    ctx.beginPath(); 
    ctx.ellipse(x, y, u, u * .9, 0, 0, Math.PI); 
    ctx.fill();   
     // rim + oil
    ell(x, y, u, u * .28, '#c4622a'); 
    ell(x, y + u * .02, u * .8, u * .18, '#3a1405');
    const f = 1 + .08 * Math.sin(t * 9 + ph) + .05 * Math.sin(t * 14 + ph * 2), s = u * .55, h = s * 1.5 * f;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 5); 
    g.addColorStop(0, 'rgba(255,170,40,.5)'); 
    g.addColorStop(1, 'rgba(255,120,0,0)');
    // glow
    ctx.fillStyle = g; 
    ctx.fillRect(x - s * 5, y - s * 5, s * 10, s * 10);                                          // glow
    ctx.globalCompositeOperation = 'source-over';
    const fg = ctx.createLinearGradient(0, y - h, 0, y + s * .3); 
    fg.addColorStop(0, '#ffe9a0'); 
    fg.addColorStop(.5, '#ffa31a'); 
    fg.addColorStop(1, '#d93b00');
    ctx.fillStyle = fg; 
    ctx.beginPath(); 
    ctx.moveTo(x, y - h);
    // flame
    ctx.quadraticCurveTo(x + s * .7, y - h * .2, x, y + s * .25); 
    ctx.quadraticCurveTo(x - s * .7, y - h * .2, x, y - h); 
    ctx.fill();   
    // hot core
    ell(x, y - s * .1, s * .15, s * .4, '#fff6d0');                                                                      // hot core
}

function building(t, gy) {
    const fw = W * .2, sw = W * .32, top = H * .212, fh = H * .17, drop = H * .12, rise = H * .2, rows = Math.floor((gy - top) / fh), cols = 3;
    // top=H*.16  changes the distance from top and start of building
    // fw=W*.2 = incharge of left side of the bulding
    //sw=W*.32  = incharge of right side of the bulding
    //fh=H*.17  = incharge of height of the building
    //drop=H*.12 = angle of the right side of building
    const sp = function (s, v) { 
        return [fw + (sw - fw) * s, (top + drop * s) + ((gy - rise * s) - (top + drop * s)) * v]; };   // point on side wall (s across, v down)
    const g = ctx.createLinearGradient(0, top, 0, gy); 
    g.addColorStop(0, '#1d1530'); // color of the left face of the building
    g.addColorStop(1, '#0b0814'); // color for gradient of the left face of the building
    ctx.fillStyle = g;  // the purple, gives bright yellow orange without it
    ctx.fillRect(0, top, fw, gy - top);  // the purple too                                                 // front wall
    poly([[fw, top], [sw, top + drop], [sw, gy - rise], [fw, gy]], '#120c20');     // face of right side                                // side wall
    ctx.fillStyle = '#2a1d42'; 
    ctx.fillRect(0, top - H * .025, fw, H * .025);                                    // roof ledge
    poly([[0, top - H * .025], [fw, top - H * .025], [sw, top + drop - H * .02], [sw, top + drop], [fw, top]], '#2a1d42');
    for (let r = 0; r < rows; r++) {
        const y0 = top + r * fh;
        for (let c = 0; c < cols; c++) { // gives windows and all
            let lit = ((r * 7 + c * 13) % 5) > 1;   // front window
            ctx.globalAlpha = lit ? .55 + .1 * Math.sin(t + r + c) : 1; 
            ctx.fillStyle = lit ? '#ffcf70' : '#0a0712';
            ctx.fillRect(fw * (.1 + c * .3), y0 + fh * .25, fw * .2, fh * .45); 
            ctx.globalAlpha = 1;
            lit = ((r * 5 + c * 11) % 4) > 0;   // side window
            const s0 = .1 + c * .3, s1 = s0 + .2, v0 = (r + .25) / rows, v1 = (r + .7) / rows;
            //const s0=.1(placement of right face windows) +c*.3 (gapping between the windows), s1=s0+.2 (lenght of the window), v0=(r+.25)/rows, v1=(r+.7)/rows;
            ctx.globalAlpha = lit ? .5 : 1; // adjusting color of windows on right face
            poly([sp(s0, v0), sp(s1, v0), sp(s1, v1), sp(s0, v1)], lit ? '#ffb54a' : '#0a0712'); 
            ctx.globalAlpha = 1;
    }
    const yF = y0 + fh * .88, yS = sp(1, (r + .88) / rows)[1];       // light strings per floor
    lightString(0, yF, fw * .5, yF + H * .012, H * .014, 9, t, r);
    lightString(fw * .5, yF + H * .012, fw, yF, H * .014, 9, t, r + 3);
    lightString(fw, yF, sw, yS, H * .01, 10, t, r + 5);
    }
    lightString(0, top - H * .03, fw, top - H * .03, H * .02, 16, t, 2);                                                 // roofline lights
    lightString(fw, top - H * .03, sw, top + drop - H * .025, H * .015, 10, t, 4);
}

const FIREWORKS = [
    { fx: .15, fy: .20, c: 0, p: 4.0 }, { fx: .30, fy: .10, c: 1, p: 5.0 }, { fx: .70, fy: .25, c: 3, p: 4.5 },
    { fx: .86, fy: .14, c: 5, p: 5.5 }, { fx: .55, fy: .38, c: 2, p: 6.0 }
];
function fireworks(t, hz) {
    ctx.globalCompositeOperation = 'lighter';                                   // sparks add light, like real fireworks
    FIREWORKS.forEach(function (f, i) {
    const lt = (t + i * 1.7) % f.p, rise = .7, life = 2.2;                      // lt = seconds into this burst's cycle
    const bx = f.fx * W, by = f.fy * H, R = U * .17, c1 = COLORS[f.c], c2 = COLORS[(f.c + 3) % 7];
    if (lt < rise) {                                                           // 1) rocket rises from the skyline
        const q = lt / rise, ry = hz - (hz - by) * q * (2 - q);
        for (let j = 0; j < 5; j++) { ctx.globalAlpha = (1 - j / 5) * .8; ell(bx, ry + j * U * .012, 2, 4, '#ffe9a0'); }   // glowing tail
    } else if (lt < rise + life) {                                             // 2) explosion
        const q = (lt - rise) / life;
        ctx.globalAlpha = Math.max(0, 1 - q * 6) * .5; ell(bx, by, R * .6, R * .6, '#fff0c0');                   // flash
        for (let k = 0; k < 32; k++) {
        const a = k / 32 * Math.PI * 2, ring = (k % 2) ? 1 : .65;                     // two rings of sparks
        for (let j = 0; j < 3; j++) {                                                // each spark leaves a short trail
            const qq = q - j * .04; if (qq < 0) continue;
            const e = 1 - (1 - qq) * (1 - qq);                                        // fast at first, then slows
            ctx.globalAlpha = (1 - q) * (1 - j * .3) * (.7 + .3 * Math.sin(t * 30 + k));          // fades out, twinkles
            ctx.fillStyle = (k % 2) ? c1 : c2;
            ctx.beginPath(); ctx.arc(bx + Math.cos(a) * R * e * ring, by + Math.sin(a) * R * e * ring + qq * qq * R * .4, (2 - j * .4) * (1 + (1 - q)), 0, 7); ctx.fill();   // qq*qq*R*.4 = gravity
        }
        }
    }
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function scenery(t, gy) {
    const hz = H * .72;
    const sk = ctx.createLinearGradient(0, 0, 0, hz); 
    sk.addColorStop(0, '#04021a'); 
    sk.addColorStop(.6, '#1a0b3a'); 
    sk.addColorStop(1, '#5a1a55');
    ctx.fillStyle = sk; 
    ctx.fillRect(0, 0, W, gy);                                                         // sky
    ctx.fillStyle = '#fff';
    stars.forEach(function (s) { 
        ctx.globalAlpha = .5 + .5 * Math.sin(t * 2 + s.p); 
        ctx.fillRect(s.x * W, s.y * H, s.r, s.r); });
    // moon
    ctx.globalAlpha = 1; 
    ell(W / 2, H * .2, U * .04, U * .04, '#fff3d0'); 
    ctx.globalAlpha = .15; ell(W / 2, H * .2, U * .1, U * .1, '#fff3d0');
    ctx.globalAlpha = 1; 
    // fireworks drawn after the moon and before the skyline, so the city sits in front of them 
    fireworks(t, hz); 
    // skyline
    blocks.forEach(function (b) { 
        const h = b.h * H * (1 + b.l * .3)*1.35; 
        ctx.fillStyle = ['#170f2b', '#110a22', '#0b0618'][b.l]; 
        ctx.fillRect(b.x * W, hz - h, b.w * W,gy-(hz-h)); });   
    ctx.globalCompositeOperation = 'lighter';
    // lights in background
    cityLights.forEach(function (l) { 
        ctx.fillStyle = l.c; 
        ctx.globalAlpha = .25 + .4 * (.5 + .5 * Math.sin(t * 2.5 + l.p)); 
        ctx.beginPath(); 
        ctx.arc(l.x*W, hz-H*.115+l.y*(gy-hz*1.5+H*.215),1.6+l.p%1.25,0,7);
        ctx.fill(); });
    
    ctx.globalAlpha = 1; 
    ctx.globalCompositeOperation = 'source-over';
    const st = ctx.createLinearGradient(0, hz, 0, gy); 
    st.addColorStop(0, '#2a1136'); 
    st.addColorStop(1, '#0a0612');
    ctx.fillStyle = st; 
    ctx.fillRect(0, hz *1.25, W, (gy - hz)*1.5);                                                     // far street
}

function rangoli(cx, cy, rr) {
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.8); 
    gl.addColorStop(0, 'rgba(255,140,40,.4)'); 
    gl.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = gl; 
    ctx.fillRect(cx - rr * 2, cy - rr * 1.4, rr * 4, rr * 2.8); 
    ctx.globalCompositeOperation = 'source-over';   // ground glow
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .42);                                                 // flatten onto the ground
    for (let k = 5; k >= 0; k--) {
        const n = 8 + k * 4, rad = rr * (k + 1) / 6;
    for (let i = 0; i < n; i++) { // petals
        ctx.save(); ctx.rotate(i / n * Math.PI * 2 + k * .2); 
        ctx.translate(rad * .8, 0); 
        ell(0, 0, rad * .22, rad * .09, COLORS[(i + k) % 7]); 
        ctx.restore(); }   
    // ring
    ctx.strokeStyle = COLORS[(k + 3) % 7]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 7); ctx.stroke();                                       
    }
    ctx.restore();
}

function person(P, x, y) {
    const h = P.h * U, f = P.dx < 0 ? 1 : -1, sit = !!P.sit, bw = h * .17, r = h * .08, skin = '#c98a5e', saree = (P.kind === 'saree');
    const hy = y - h * (sit ? .66 : .9), sy = y - h * (sit ? .52 : .78), hip = y - h * (sit ? .2 : .5);
    ell(x, y, h * (sit ? .3 : .2), h * .04, 'rgba(0,0,0,.4)');                                                      // shadow
    if (!saree) {                                                                                        // kurta + pajama
    if (sit) ell(x, y - h * .08, h * .3, h * .1, P.c2); else { ctx.fillStyle = P.c2; ctx.fillRect(x - h * .13, hip, h * .1, y - hip); ctx.fillRect(x + h * .03, hip, h * .1, y - hip); }
    const end = sit ? y - h * .1 : y - h * .3;
    poly([[x - bw, sy], [x + bw, sy], [x + bw * 1.25, end], [x - bw * 1.25, end]], P.c1);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(x - h * .015, sy, h * .03, (end - sy) * .35);
    } else {                                                                                            // saree: skirt, hem, blouse, pallu
    if (sit) { ell(x, y - h * .1, h * .32, h * .12, P.c1); poly([[x - bw, sy], [x + bw, sy], [x + bw * 1.3, y - h * .1], [x - bw * 1.3, y - h * .1]], P.c1); }
    else { poly([[x - bw * .9, sy + h * .1], [x + bw * .9, sy + h * .1], [x + h * .22, y], [x - h * .22, y]], P.c1); ctx.fillStyle = P.c2; ctx.fillRect(x - h * .22, y - h * .04, h * .44, h * .04); }
    ctx.fillStyle = P.c2; ctx.fillRect(x - bw, sy, bw * 2, h * .1);
    ctx.globalAlpha = .9; poly([[x - bw, sy], [x - bw + h * .07, sy], [x + bw, hip + h * .12], [x + bw - h * .09, hip + h * .12]], P.c2); ctx.globalAlpha = 1;
    }
    ctx.lineCap = 'round'; ctx.lineWidth = h * .06;                                                           // arms (sitting ones reach to the rangoli)
    [-1, 1].forEach(function (s) {
    const sx = x + s * bw, sy2 = sy + h * .03, ex = sit ? x + f * h * .22 + s * h * .03 : x + s * bw * 1.2, ey = sit ? hip - h * .02 : sy + h * .28, mx = (sx + ex) / 2, my = (sy2 + ey) / 2;
    ctx.strokeStyle = saree ? P.c2 : P.c1; ctx.beginPath(); ctx.moveTo(sx, sy2); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = skin; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke();
    });
    ctx.fillStyle = skin; ctx.fillRect(x - r * .4, hy, r * .8, sy - hy); ell(x, hy, r, r, skin);                          // neck + head
    ctx.fillStyle = '#120804';
    if (saree) { ctx.beginPath(); ctx.arc(x, hy - r * .15, r * 1.05, Math.PI, 0); ctx.fill(); ell(x - f * r * .9, hy - r * .5, r * .5, r * .5, '#120804'); }   // hair + bun
    else {
    ctx.beginPath(); ctx.arc(x, hy - r * .1, r * 1.02, Math.PI, 0); ctx.fill();
    if (P.topi) { ctx.fillStyle = P.topi; ctx.fillRect(x - r, hy - r * 1.5, r * 2, r * .75); }                         // dhaka topi
    if (P.stache) { ctx.fillStyle = '#120804'; ctx.fillRect(x - r * .5, hy + r * .35, r, r * .18); }
    }
    ctx.fillStyle = '#120804'; ctx.fillRect(x - r * .45, hy - r * .05, r * .2, r * .2); ctx.fillRect(x + r * .25, hy - r * .05, r * .2, r * .2);   // eyes
    ell(x, hy - r * .5, r * .14, r * .14, '#d4141f');                                                               // tika / bindi
    ell(x - r, hy + r * .4, r * .18, r * .18, '#ffd24a'); ell(x + r, hy + r * .4, r * .18, r * .18, '#ffd24a');                     // earrings
}

function dog(x, y, t) {
    const s = DOG.size * U, d = DOG.dx < 0 ? 1 : -1;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);                                                     // flip to face the centre
    ell(0, 0, s * .55, s * .08, 'rgba(0,0,0,.4)');
    ctx.strokeStyle = '#a56a35'; ctx.lineWidth = s * .07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * .4, -s * .4); ctx.lineTo(-s * .62, -s * (.62 + .08 * Math.sin(t * 9))); ctx.stroke();   // wagging tail
    ell(0, -s * .32, s * .42, s * .2, '#b97a3e');                                                                  // body
    ctx.fillStyle = '#8f5a2a';[-.28, -.1, .18, .34].forEach(function (lx) { ctx.fillRect(s * lx - s * .04, -s * .2, s * .08, s * .2); });   // legs
    ell(s * .42, -s * .52, s * .2, s * .2, '#b97a3e');                                                               // head
    poly([[s * .3, -s * .66], [s * .26, -s * .42], [s * .42, -s * .58]], '#6e3f1b');                                       // ear
    ell(s * .6, -s * .46, s * .12, s * .08, '#e2b27a'); ell(s * .69, -s * .48, s * .03, s * .03, '#111'); ell(s * .5, -s * .56, s * .025, s * .025, '#111');   // snout, nose, eye
    ctx.fillStyle = '#e3141f'; ctx.fillRect(s * .44, -s * .72, s * .035, s * .1);                                     // red tika
    ell(s * .4, -s * .69, s * .012, s * .012, '#fff'); ell(s * .48, -s * .69, s * .012, s * .012, '#fff');                       // rice dots
    for (let i = 0; i < 5; i++) ell(s * (.22 + i * .04), -s * (.36 + Math.sin(i) * .03), s * .04, s * .04, '#ff9d1c');             // marigold garland
    ctx.restore();
}

function cow(x,y,t){
  const s=COW.size*U, d=COW.dx<0?1:-1;
  ctx.save(); ctx.translate(x,y); ctx.scale(d,1);
  ell(0,0,s*.6,s*.08,'rgba(0,0,0,.4)');                                                          // shadow
  ctx.fillStyle='#efe6d6'; [-.38,-.24,.2,.34].forEach(function(lx){ ctx.fillRect(s*lx-s*.04,-s*.34,s*.08,s*.34); });   // legs
  ctx.fillStyle='#3a2a1a'; [-.38,-.24,.2,.34].forEach(function(lx){ ctx.fillRect(s*lx-s*.04,-s*.05,s*.08,s*.05); });   // hooves
  ctx.strokeStyle='#d8cbb5'; ctx.lineWidth=s*.04; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-s*.5,-s*.58); ctx.lineTo(-s*.58,-s*(.3+.04*Math.sin(t*3))); ctx.stroke();   // swishing tail
  ell(0,-s*.52,s*.5,s*.24,'#f3ebdd');                                                            // body
  ell(-s*.15,-s*.58,s*.14,s*.09,'#6b4a2a'); ell(s*.15,-s*.46,s*.1,s*.07,'#6b4a2a');              // brown patches
  ell(s*.45,-s*.6,s*.14,s*.15,'#f3ebdd');                                                        // neck
  ell(s*.62,-s*.62,s*.14,s*.12,'#f3ebdd');                                                       // head
  poly([[s*.55,-s*.7],[s*.45,-s*.64],[s*.55,-s*.6]],'#d9cbb3');                                  // ear
  ell(s*.74,-s*.57,s*.08,s*.06,'#e8a9a0'); ell(s*.77,-s*.58,s*.012,s*.012,'#6a2a2a');            // snout + nostril
  ell(s*.66,-s*.66,s*.016,s*.016,'#111');                                                        // eye
  poly([[s*.58,-s*.72],[s*.56,-s*.84],[s*.62,-s*.73]],'#ffd24a');                                // gold-tipped horn
  ctx.fillStyle='#e3141f'; ctx.fillRect(s*.62,-s*.71,s*.03,s*.06);                               // red tika
  for (let i=0;i<7;i++) ell(s*(.38+i*.035), -s*(.6-Math.sin(i/6*Math.PI)*.12), s*.035, s*.035, i%2?'#ff9d1c':'#ffd24a');   // marigold garland
  ell(s*1.0,-s*.03,s*.14,s*.035,'#d9a63a');                                                     // aarti plate
  diya(s*1.0,-s*.06,s*.05,t,5);                                                                  // lit diyo offered to the cow
  ctx.restore();
}


    /* Chhath devotee in the river. (x,yW) = body centre at the water line, h = height. Faces left (the sun). */
function devotee(x, yW, h, t) {
    const r = h * .085, bw = h * .17, hy = yW - h * .9, sy = yW - h * .76, RED = '#d81b2c', GOLD = '#ffd24a', skin = '#b9784f';
    poly([[x - bw, sy], [x + bw * .9, sy], [x + bw * 1.5, yW], [x - bw * 1.5, yW]], RED);                                     // saree body
    ctx.fillStyle = GOLD;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { 
        const px = x - bw * .8 + j * bw * .8 + (i % 2) * bw * .4, py = sy + h * .08 + i * h * .1, d = h * .018; poly([[px, py - d], [px + d, py], [px, py + d], [px - d, py]], GOLD); }
    // neck + head
    ctx.fillStyle = skin; ctx.fillRect(x - r * .5, hy, r * .8, sy - hy); ell(x - r * .15, hy, r, r, skin);
    // red pallu over the head
    ctx.fillStyle = '#c4141f'; ctx.beginPath(); ctx.moveTo(x - r * 0.98, hy - r * .53); //0.8

    ctx.quadraticCurveTo(x - r * .2, hy - r * 1.7, x + r * 1.3, hy - r * .4); 
    ctx.quadraticCurveTo(x + r * 2, hy + r * 1.5, x + bw * 1.6, sy + h * .3);

    ctx.lineTo(x + bw * 1.4, yW - h * .05); ctx.lineTo(x + bw * .5, sy + h * .1); 
    ctx.quadraticCurveTo(x + r * .3, hy + r * 1.2, x + r * .1, hy + r * .5); ctx.fill();
    // gold border 
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r * 1.02, hy - r * .53); ctx.quadraticCurveTo(x - r * .2, hy - r * 1.7, x + r * 1.3, hy - r * .4); ctx.stroke();  
    // sindoor 
    ctx.strokeStyle = '#ff4a00'; ctx.lineWidth = r * .16; ctx.beginPath(); ctx.moveTo(x - r * .78, hy - r * .3); ctx.lineTo(x - r * .55, hy - r * .62); ctx.stroke();        
    // eye, nose ring  
    // ctx.strokeStyle = skin; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - r * 1.3, hy - r * -.25); ctx.quadraticCurveTo(x - r * 0.0001, hy - r * 1, x + r * 0.001, hy - r * .001); ctx.stroke();   
    ctx.fillStyle = '#120804'; ctx.fillRect(x - r * .65, hy - r * .05, r * .2, r * .15); ell(x - r * 1.1, hy + r * .3, r * .12, r * .12, GOLD);                                    
    const sx = x - h * .22, sy2 = sy + h * .02;                                                                      // soop (basket) position
    ctx.lineCap = 'round'; ctx.lineWidth = h * .055;
    ctx.strokeStyle = RED; ctx.beginPath(); ctx.moveTo(x - bw * .4, sy + h * .04); ctx.lineTo(x - h * .12, sy + h * .16); ctx.stroke();
    ctx.strokeStyle = skin; ctx.beginPath(); ctx.moveTo(x - h * .12, sy + h * .16); ctx.lineTo(sx + h * .06, sy2 + h * .05); ctx.stroke();
    ctx.save(); ctx.translate(sx, sy2); ctx.rotate(-.35); ell(0, 0, h * .17, h * .045, '#d9b074');                 // tilted bamboo soop
    ctx.strokeStyle = '#a87b3f'; ctx.lineWidth = 1; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * h * .035, -h * .04); ctx.lineTo(i * h * .035, h * .04); ctx.stroke(); }
    ctx.restore();
    const top = function (o) { return sy2 - h * .045 - o * .36; };                                                 // basket surface height at offset o
    // coconut
    ell(sx - h * .08, top(-h * .08) - h * .03, h * .05, h * .05, '#7a4a24');
    //fruits
    ell(sx, top(0) - h * .01, h * .035, h * .035, '#ff8a1c'); ell(sx + h * .06, top(h * .06) - h * .01, h * .032, h * .032, '#e0455a'); 
    // thekua
    ell(sx + h * .12, top(h * .012) - h * .008, h * .04, h * .018, '#a95030');
    // sugarcane
    ctx.strokeStyle = '#6f7d2a'; ctx.lineWidth = h * .016; ctx.beginPath(); ctx.moveTo(sx - h * .12, sy2 - h * .02); ctx.lineTo(sx - h * .2, sy2 - h * .34); ctx.moveTo(sx - h * .09, sy2 - h * .02); ctx.lineTo(sx - h * .15, sy2 - h * .32); ctx.stroke();

    diya(sx + h * .04, top(h * -.3004) - h * .075, h * .022, t, 7);                                                         // small lit diyo
    ell(x, yW, bw * 1.9, h * .035, 'rgba(47,60,95,.8)');                                                         // water cuts the body
    for (let k = 1; k <= 3; k++) { 
        ctx.strokeStyle = 'rgba(255,220,160,' + (.35 / k) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, yW, bw * (1.6 + k * .5) + (t * 6 % 10), h * (.03 + k * .012), 0, 0, 7); ctx.stroke(); }
}


// affects the fade in out canvas
function drawNight(t, camP) {
    const gy = GROUND * H, cam = ease(camP) * CAM * H, L = layout();
    ctx.save(); ctx.translate(0, -cam);                                                                  // camera moves down
    
    scenery(t, gy);
    building(t, gy);                                                                                     // left building
    // right building (mirror)
    ctx.save(); 
    ctx.translate(W, 0); 
    ctx.scale(-1, 1); 
    building(t + 1, gy); 
    ctx.restore();             

    const gg = ctx.createLinearGradient(0, gy, 0, gy + H * .9); 
    gg.addColorStop(0, '#150b1c'); 
    gg.addColorStop(1, '#2b1208');
    // ground
    ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H * 1.2); 

    const fog = ctx.createLinearGradient(0, gy - H * .15, 0, gy + H * .05); 
    fog.addColorStop(0, 'rgba(60,20,70,0)'); 
    fog.addColorStop(.6, 'rgba(90,35,60,.35)'); 
    fog.addColorStop(1, 'rgba(21,11,28,0)');
    // fog where buildings meet ground 
    ctx.fillStyle = fog; ctx.fillRect(0, gy - H * .15, W, H * .2);
    
    rangoli(L.cx, L.worldY, L.rr);
    for (let i = 0; i < 20; i++) { // ring of diyos
        const a = i / 20 * Math.PI * 2; 
        diya(L.cx + Math.cos(a) * L.rr * 1.1, L.worldY + Math.sin(a) * L.rr * 1.1 * .42, U * .011, t, i); }   
    // centre diyo (the zoom target)
    diya(L.cx, L.worldY, U * .03, t, 0);                                                                      
    const things = PEOPLE.map(function (p) { 
        return { y: L.worldY + p.dy * L.rr * .42, draw: function (y) { 
            person(p, L.cx + p.dx * L.rr, y); } }; });
    things.push({ y: L.worldY + DOG.dy * L.rr * .42, draw: function (y) { dog(L.cx + DOG.dx * L.rr, y, t); } });
    things.push({y:L.worldY+COW.dy*L.rr*.42, draw:function(y){ cow(L.cx+COW.dx*L.rr,y,t); }});   //cow joins the back-to-front drawing
    things.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(o.y); });                 // back-to-front
    ctx.restore();
}

function drawPond(t, p) {
    const L = layout(), hz = H * .45, rise = ease(between(p, T.zoomOut));                                        // rise: 0 -> 1 as the sun climbs
    const sk = ctx.createLinearGradient(0, 0, 0, hz);
    sk.addColorStop(0, 'rgb(' + Math.round(40 + rise * 90) + ',' + Math.round(50 + rise * 100) + ',' + Math.round(110 + rise * 60) + ')');
    sk.addColorStop(.6, 'rgb(' + Math.round(200 + rise * 50) + ',' + Math.round(90 + rise * 80) + ',' + Math.round(80 + rise * 40) + ')'); 
    sk.addColorStop(1, '#ffcf7a');
    ctx.fillStyle = sk; ctx.fillRect(-W * 3, -H * 3, W * 7, H * 3 + hz);                                               // sky
    const sy = hz + (1 - rise) * H * .1, sr = U * .07;
    ctx.globalCompositeOperation = 'lighter';
    const sg = ctx.createRadialGradient(W / 2, sy, 0, W / 2, sy, H * .5); sg.addColorStop(0, 'rgba(255,200,100,.7)'); sg.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, hz); ctx.globalCompositeOperation = 'source-over';
    ell(W / 2, sy, sr, sr, '#fff1b8');                                                                        // sun
    ctx.fillStyle = '#3a2a45'; ctx.beginPath(); ctx.moveTo(-W * 3, hz + 2);                                     // hills
    for (let x = -W; x <= W * 2; x += W / 12) ctx.lineTo(x, hz - H * .04 - Math.abs(Math.sin(x * .013)) * H * .07);
    ctx.lineTo(W * 4, hz + 2); ctx.fill();
    const pg = ctx.createLinearGradient(0, hz, 0, H * 1.2); pg.addColorStop(0, '#e9a263'); pg.addColorStop(.4, '#3f4a6b'); pg.addColorStop(1, '#10182c');
    ctx.fillStyle = pg; ctx.fillRect(-W * 3, hz, W * 7, H * 3);                                                    // water
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,210,120,.5)';
    for (let i = 0; i < 14; i++) { 
        const f = i / 14, w = sr * (1.2 - f * .7) * (1 + .3 * Math.sin(t * 2 + i)); ctx.fillRect(W / 2 - w, hz + H * .01 + f * f * H * .3, w * 2, 2 + f * 3); }   // sun reflection
    ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(L.cx, L.screenY); ctx.scale(1, .3);                                         // ripples around the hero diyo
    for (let k = 1; k <= 3; k++) { ctx.strokeStyle = 'rgba(255,220,150,' + (.35 / k) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, U * (.04 + k * .03) + (t * 8 % 12), 0, 7); ctx.stroke(); }
    ctx.restore();
    pondDiyas.slice().sort(function (a, b) { return a.d - b.d; }).forEach(function (o) {                       // floating diyos (far = small)
    const d = (o.d + rise * .9 + t * .012) % 1, y = hz + H * .03 + Math.pow(d, 1.6) * H * .58, s = .25 + d * 1.1, u = U * .02 * s;
    const x = W / 2 + (o.x - .5) * W * (.25 + d * 1.1) + Math.sin(t * .6 + o.p) * 6 * s;
    ctx.globalCompositeOperation = 'lighter'; ell(x, y + u * 1.1, u * 2.2, u * .5, 'rgba(255,160,50,.25)'); ctx.globalCompositeOperation = 'source-over';
    diya(x, y, u, t, o.p);
    });
    diya(L.cx, L.screenY, U * .03, t, 0);                                                                     // hero diyo: same spot as the rangoli centre
    devotee(W * .84, H * .95, U * .42, t);                                                                       // Chhath devotee, bottom-right
}


const spacer = document.getElementById('scroll');
const captions = [['cap1', .02, .05, .2, .28], ['cap2', .28, .32, .36, .4], ['cap3', .5, .54, .6, .64], ['cap4', .78, .85, 1.1, 1.2]]   // id, fadeIn start/end, fadeOut start/end
    .map(function (c) { return { el: document.getElementById(c[0]), a: c[1], b: c[2], c: c[3], d: c[4] }; });

function frame() {
      const max = spacer.offsetHeight - window.innerHeight, y = window.pageYOffset || document.documentElement.scrollTop || 0;
      const p = max > 0 ? clamp(y / max) : 0, t = Date.now() / 1000, L = layout();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      let z = 1;                                                                                          // zoom in on the diyo, then out over the pond
      if (p >= T.zoomIn[0] && p < T.zoomOut[0]) z = 1 + ease(between(p, T.zoomIn)) * (T.maxZoom - 1);
      else if (p >= T.zoomOut[0]) z = 1 + (T.maxZoom - 1) * (1 - ease(between(p, T.zoomOut)));
      const mix = between(p, T.fade);                                                                      // 0 = night, 1 = morning
      ctx.save(); ctx.translate(L.cx, L.screenY); 
      ctx.scale(z, z); ctx.translate(-L.cx, -L.screenY);
      if (mix < 1) drawNight(t, p / T.descend);
      if (mix > 0) { ctx.globalAlpha = mix; 
        drawPond(t, p); ctx.globalAlpha = 1; }
      ctx.restore();
      if (mix > 0 && mix < 1) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,200,110,' + (Math.sin(mix * Math.PI) * .5) + ')'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }   // golden flash hides the swap
      captions.forEach(function (c) { c.el.style.opacity = clamp(Math.min((p - c.a) / (c.b - c.a), (c.d - p) / (c.d - c.c))); });
      window.requestAnimationFrame(frame);
    }
    frame();