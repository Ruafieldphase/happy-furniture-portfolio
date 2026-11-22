"use strict";

const works = [
  { key: "01-soopgyeol", name: "숲결", tab: "숲결", alt: "편백나무 칩을 담은 분홍빛 향기 주머니와 숲결 패키지", size: "사과형 몸통 지름 약 7~9 cm (시안 기준)", description: "편백나무 칩을 담아 옷장이나 서랍에 은은한 나무 향을 더해요." },
  { key: "06-zodiac-coaster", name: "별자리 팬던트 컵받침대", tab: "별자리 컵받침대", alt: "월넛 위에 사수자리의 선을 새기고 황동 별점 13개를 더한 컵받침 시안", size: "지름 88 mm · 두께 약 8 mm", description: "나무에 별자리를 새기고 별이 놓인 자리에 황동을 더했어요." },
  { key: "02-wood-christmas-tree", name: "원목 크리스마스트리", tab: "원목 트리", alt: "나무 가지와 작은 오너먼트가 달린 원목 크리스마스트리", size: "높이 1 m", description: "원목을 손으로 다듬고 한 단씩 쌓아 만든, 세상에 하나뿐인 트리예요." },
  { key: "03-wifi-sign", name: "와이파이 안내판", tab: "와이파이 안내판", alt: "성북구청 휘장과 예시 와이파이 QR 코드를 새긴 두 가지 월넛 안내판", size: "가로 150 × 세로 200 mm", description: "월넛에 성북구청 휘장과 와이파이 QR 코드를 새겼어요." },
  { key: "04-dog-pendant", name: "반려견 펜던트", tab: "반려견 펜던트", alt: "강아지 캐릭터를 새긴 앞면과 예시 QR 코드 및 동물등록번호를 새긴 뒷면", size: "시안 지름 40 mm · 시판 예시 25 / 30 / 40 mm", description: "앞면에는 강아지 캐릭터, 뒷면에는 보호자 연락처 QR과 동물등록번호를 새겨요." },
  { key: "05-sheep-pencil-holder", name: "양 모양 나무 연필꽂이", tab: "양 연필꽂이", alt: "나무판을 끼워 조립한 양 모양 연필꽂이와 분리한 양털판 두 장", size: "설계 기준 · 길이 186.5 × 폭 149.3 × 높이 124.6 mm", description: "양털 모양의 나무판을 끼워 조립하고, 칸막이를 옮겨 문구 수납 공간을 바꿀 수 있어요." },
];

const id = (name) => document.getElementById(name);
// Crop rectangles in source-image pixels. The slideshow still uses the whole image.
const thumbnailCrops = {
  "03-wifi-sign": { x: 562, y: 69, width: 508, height: 666 },
  "04-dog-pendant": { x: 63, y: 146, width: 508, height: 508 },
  "05-sheep-pencil-holder": { x: 362, y: 24, width: 492, height: 573 },
};
const showcase = id("showcase");
const title = id("title");
const photo = id("photo");
const description = id("description");
const announcement = id("announcement");
const motion = id("motion");
const autoplay = id("autoplay");
const holdDuration = id("hold-duration");
const fullscreen = id("fullscreen");
const canvas = id("particles");
const drawing = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 47rem)");
const assemblyTime = 4200;
const holdPreference = "workshop-product-hold";
const tileColors = new Map();
let selected = 0;
let displayed = 0;
let revision = 0;
let animationFrame = null;
let motionRequested = motion.checked;
let playing = !reducedMotion.matches;
let advanceTimer;
let imageReady = 0;

const imagePath = (work) => `assets/${work.key}.webp`;

try {
  const savedDuration = localStorage.getItem(holdPreference);
  if ([...holdDuration.options].some(option => option.value === savedDuration)) {
    holdDuration.value = savedDuration;
  }
} catch {
  // The duration can still be changed for this visit when storage is unavailable.
}

function scheduleAdvance() {
  clearTimeout(advanceTimer);
  if (!playing || document.hidden || !photo.complete || !photo.naturalWidth ||
      displayed !== selected || showcase.hasAttribute("data-transitioning")) return;
  advanceTimer = setTimeout(() => show(selected + 1), Number(holdDuration.value) * 1000);
}

function syncPlayback() {
  autoplay.textContent = playing ? "일시 정지" : "자동 재생";
  announcement.setAttribute("aria-live", playing ? "off" : "polite");
  scheduleAdvance();
}

// The photo colors are bundled with the approved artwork and also work in a local file preview.
const buttons = works.map((work, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", work.name);
  const preview = new Image();
  preview.src = imagePath(work);
  preview.loading = index === 0 ? "eager" : "lazy";
  preview.alt = "";
  const thumbnail = document.createElement("span");
  thumbnail.className = "project-thumbnail";
  const crop = thumbnailCrops[work.key];
  const source = window.portfolioSamples?.[work.key];
  if (crop && source) {
    const frame = document.createElement("span");
    frame.className = "thumbnail-crop";
    frame.style.width = `${100 * Math.min(1, crop.width / crop.height)}%`;
    frame.style.height = `${100 * Math.min(1, crop.height / crop.width)}%`;
    preview.style.width = `${100 * source.width / crop.width}%`;
    preview.style.height = `${100 * source.height / crop.height}%`;
    preview.style.left = `${-100 * crop.x / crop.width}%`;
    preview.style.top = `${-100 * crop.y / crop.height}%`;
    frame.append(preview);
    thumbnail.append(frame);
  } else {
    thumbnail.append(preview);
  }
  const text = document.createElement("span");
  text.className = "project-label";
  text.textContent = work.tab;
  button.append(thumbnail, text);
  button.addEventListener("click", () => show(index));
  const row = document.createElement("li");
  row.append(button);
  id("works").append(row);
  return button;
});

function renderDetails(index) {
  const work = works[index];
  const message = work.name;
  if (announcement.textContent === message) return;
  description.textContent = work.description;
  id("size").textContent = work.size;
  announcement.textContent = message;
}

function renderWork(index) {
  displayed = index;
  const work = works[index];
  const samples = window.portfolioSamples?.[work.key];
  title.textContent = work.name;
  photo.alt = work.alt;
  if (samples) {
    photo.width = samples.width;
    photo.height = samples.height;
  }
  photo.src = imagePath(work);
  for (const [number, button] of buttons.entries()) {
    if (number === index) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
  renderDetails(index);
  const ticket = ++imageReady;
  photo.decode().catch(() => {}).then(() => {
    if (ticket === imageReady) scheduleAdvance();
  });
}

function finishAnimation() {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  canvas.hidden = true;
  title.style.removeProperty("clip-path");
  description.style.removeProperty("clip-path");
  canvas.style.removeProperty("height");
  if (showcase.hasAttribute("data-transitioning")) renderDetails(displayed);
  showcase.removeAttribute("data-transitioning");
}

function localBox(element) {
  const box = element.getBoundingClientRect();
  const stage = showcase.getBoundingClientRect();
  return { x: box.left - stage.left, y: box.top - stage.top, width: box.width, height: box.height };
}

function photoTiles(index) {
  const { key } = works[index];
  if (tileColors.has(key)) return tileColors.get(key);
  const data = window.portfolioSamples?.[key];
  if (!data) return null;
  const colors = atob(data.rgb);
  const tiles = [];
  for (let i = 0; i < colors.length; i += 3) {
    const r = colors.charCodeAt(i);
    const g = colors.charCodeAt(i + 1);
    const b = colors.charCodeAt(i + 2);
    tiles.push({ r, g, b });
  }
  // Offline-friendly brightness data, sampled from the same photograph as the RGB layer.
  const map=window.portfolioLightness?.[key];
  if (!map) return null;
  const luma=Uint8Array.from(atob(map.luma),ch=>ch.charCodeAt(0));
  const histogram=new Uint32Array(256);
  for (const value of luma) histogram[value]++;
  const rank=new Float32Array(256);
  let cumulative=0;
  for (let value=0;value<256;value++) {
    rank[value]=(cumulative+histogram[value]*.5)/luma.length;
    cumulative+=histogram[value];
  }
  const samples = { ...data, tiles, luma, rank, mapWidth:map.w, mapHeight:map.h };
  tileColors.set(key, samples);
  return samples;
}

function fittedPhoto(data) {
  const box = localBox(photo);
  const fit = Math.min(box.width / data.width, box.height / data.height);
  const width = data.width * fit;
  const height = data.height * fit;
  return { width, height, x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2 };
}

const photoSources = buttons.map((button) => button.querySelector("img"));
const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

function smooth(start, end, value) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function surface(source, box, seed, releaseMap = true) {
  // A nonrepeating two-dimensional map makes small islands release at different times.
  const w = Math.max(1, Math.ceil(box.width / 2));
  const h = Math.max(1, Math.ceil(box.height / 2));
  const noise = new Uint8Array(w * h);
  const edgeShade = new Float32Array(w * h);
  const falloff = Math.max(1, Math.min(16, Math.min(w, h) * .08));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const distance = Math.min(x, y, w - 1 - x, h - 1 - y);
    edgeShade[y * w + x] = 1 - smooth(0, falloff, distance);
  }
  const rand = seeded(seed);
  const layers = [5, 13, 31].map(n => {
    const values = Float32Array.from({length: (n + 1) ** 2}, rand);
    return (u, v) => {
      const x = u * n, y = v * n, ix = Math.floor(x), iy = Math.floor(y);
      const fx = smooth(0, 1, x - ix), fy = smooth(0, 1, y - iy);
      const k = iy * (n + 1) + ix;
      const top = values[k] + (values[k + 1] - values[k]) * fx;
      const low = values[k + n + 1] + (values[k + n + 2] - values[k + n + 1]) * fx;
      return top + (low - top) * fy;
    };
  });
  for (let y = 0; releaseMap && y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    noise[y * w + x] = 255 * (.31 * layers[0](u,v) + .27 * layers[1](u,v) +
      .10 * layers[2](u,v) + .32 * rand());
  }
  // Equalize release times so material continues to leave throughout the interval.
  if (releaseMap) {
    const ranks = new Uint32Array(256);
    for (const value of noise) ranks[value]++;
    for (let i=1;i<256;i++) ranks[i]+=ranks[i-1];
    for (let i=0;i<noise.length;i++) noise[i]=255*ranks[noise[i]]/noise.length;
  }
  const mask = document.createElement("canvas");
  mask.width = w; mask.height = h;
  const ctx = mask.getContext("2d");
  const pixels = ctx.createImageData(w,h);
  const composite = document.createElement("canvas");
  composite.width = Math.ceil(box.width * pixelRatio());
  composite.height = Math.ceil(box.height * pixelRatio());
  return {source,box,w,h,noise,edgeShade,mask,ctx,pixels,composite,paint:composite.getContext("2d")};
}

function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function threshold(layer,u,v) {
  return layer.noise[Math.floor(v * layer.h) * layer.w + Math.floor(u * layer.w)] / 255;
}

function remainingPhoto(layer, level) {
  const {source,box,noise,edgeShade,pixels,mask,ctx,composite,paint} = layer;
  if (level >= 1) return;
  if (level <= 0) {
    drawing.drawImage(source,box.x,box.y,box.width,box.height);
    return;
  }
  const cut = level * 285 - 15;
  const soften = smooth(0,.26,level);
  for (let i = 0; i < noise.length; i++) {
    const density = Math.max(0, Math.min(255,(cut - noise[i]) * 12 + 128));
    pixels.data[4*i + 3] = Math.round((255 - density) * (1 - edgeShade[i] * soften));
  }
  ctx.putImageData(pixels,0,0);
  paint.globalCompositeOperation = "source-over";
  paint.clearRect(0,0,composite.width,composite.height);
  paint.drawImage(source,0,0,composite.width,composite.height);
  paint.globalCompositeOperation = "destination-in";
  paint.drawImage(mask,0,0,composite.width,composite.height);
  drawing.drawImage(composite,box.x,box.y,box.width,box.height);
}

function colorAt(data,u,v) {
  return data.tiles[Math.floor(v*data.rows)*data.columns + Math.floor(u*data.columns)];
}

function lightnessAt(data,u,v) {
  const col=Math.min(data.mapWidth-1,Math.max(0,Math.floor(u*data.mapWidth)));
  const row=Math.min(data.mapHeight-1,Math.max(0,Math.floor(v*data.mapHeight)));
  return data.rank[data.luma[row*data.mapWidth+col]];
}

function photoCloud(old, next, a, b, rand) {
  const grains = [];
  const count = mobile.matches ? 5400 : 8800;
  const cols=Math.max(1,Math.round(Math.sqrt(.52*count*next.box.width/next.box.height)));
  const rows=Math.ceil(.52*count/cols);
  const baseCount=rows*cols;
  // Separate landing sites let small, recognizable fragments emerge across the product.
  const sites = Array.from({length: 9}, (_,i) => ({
    x:(i%3+.15+.7*rand())/3, y:(Math.floor(i/3)+.15+.7*rand())/3,
  }));
  function edgeAt(u,v) {
    const mid=colorAt(b,u,v);
    const right=colorAt(b,Math.min(.99999,u+1/b.columns),v);
    const down=colorAt(b,u,Math.min(.99999,v+1/b.rows));
    return Math.min(1, (Math.abs(mid.r-right.r)+Math.abs(mid.g-right.g)+
      Math.abs(mid.r-down.r)+Math.abs(mid.g-down.g))/200);
  }
  for (let i=0; i<count; i++) {
    const u=rand(), v=rand();
    let endU=rand(), endV=rand();
    let brass=false;
    // A stratified base guarantees coverage of highlights. Extra grains favour dark material.
    if (i<baseCount) {
      endU=(i%cols+rand())/cols;
      endV=(Math.floor(i/cols)+rand())/rows;
    } else {
      for (let n=0;n<3;n++) {
        const x=rand(), y=rand();
        if (lightnessAt(b,x,y)<lightnessAt(b,endU,endV)) {endU=x;endV=y;}
      }
    }
    if (b.brass && i>=count-b.brass.length*6) {
      const [x,y,r]=b.brass[i % b.brass.length];
      endU=x+(rand()-.5)*r; endV=y+(rand()-.5)*r; brass=true;
    }
    const edge = edgeAt(endU,endV);
    const distance = Math.min(...sites.map(site=>Math.hypot(endU-site.x,endV-site.y)));
    const tone=lightnessAt(b,endU,endV);
    const priority=.62*tone+.66*rand()+.22*distance-.11*edge-(brass ? .13 : 0);
    const start=colorAt(a,u,v), end=brass ? {r:224,g:190,b:118} : colorAt(b,endU,endV);
    const colors=Array.from({length:5},(_,j)=>{
      const t=j/4;
      const shade=.69+.27*t;
      return "rgb("+["r","g","b"].map(k=>Math.round((start[k]+(end[k]-start[k])*t)*shade)).join(",")+")";
    });
    grains.push({x:old.box.x+u*old.box.width, y:old.box.y+v*old.box.height,
      ex:next.box.x+endU*next.box.width, ey:next.box.y+endV*next.box.height,
      release:threshold(old,u,v), priority,
      bend:(rand()-.5)*old.box.width*.53, lift:(rand()-.58)*old.box.height*.58,
      angle:rand()*6.283, spin:(rand()<.5?-1:1)*(5+rand()*7), size:.85+rand()**2*2.05, colors});
  }
  grains.sort((p,q)=>p.priority-q.priority);
  grains.forEach((p,i)=>{
    p.settle=.09+.82*i/count;
    p.depart=Math.max(0, p.settle-.27-.18*rand());
  });
  return grains;
}

// Each grain contributes optical coverage around its endpoint. Normalizing by the
// total local mass keeps highlights continuous all the way to the final photograph.
function deposition(layer, grains, data) {
  const {source,box,edgeShade,mask,ctx,composite,paint,pixels,w,h}=layer;
  const total=new Float32Array(w*h), arrived=new Float32Array(w*h);
  const response=new Float32Array(w*h), grit=new Float32Array(w*h);
  const random=seeded(9801);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const k=y*w+x, tone=lightnessAt(data,(x+.5)/w,(y+.5)/h);
    response[k]=.85+1.55*tone;
    grit[k]=random()*.19;
  }
  const spacing=Math.sqrt(w*h/grains.length);
  function addMass(p,field) {
    const cx=(p.ex-box.x)*w/box.width, cy=(p.ey-box.y)*h/box.height;
    const radius=Math.max(2.5,spacing*(2.8+.43*p.size));
    const r2=radius*radius;
    const left=Math.max(0,Math.floor(cx-radius)),right=Math.min(w-1,Math.ceil(cx+radius));
    const top=Math.max(0,Math.floor(cy-radius)),bottom=Math.min(h-1,Math.ceil(cy+radius));
    for(let y=top;y<=bottom;y++) for(let x=left;x<=right;x++) {
      const dx=x+.5-cx,dy=y+.5-cy;
      const weight=1-(dx*dx+dy*dy)/r2;
      if (weight>0) field[y*w+x]+=weight*weight;
    }
  }
  for (const p of grains) addMass(p,total);
  let landed=0,previous=0;
  return t=>{
    while (landed<grains.length && grains[landed].settle<=t) {
      addMass(grains[landed++],arrived);
    }
    const dt=Math.max(0,t-previous);
    previous=t;
    if (!landed) return;
    const step=Math.max(1,Math.ceil(255*dt/.075));
    const soften = 1 - smooth(.88,.995,t);
    for(let k=0;k<total.length;k++) {
      const density=total[k]>0 ? Math.min(1,arrived[k]/total[k]) : 0;
      const opacity=Math.pow(Math.max(0,(density-grit[k])/(1-grit[k])),response[k]) *
        (1 - edgeShade[k] * soften);
      const i=4*k+3;
      pixels.data[i]=Math.min(Math.round(opacity*255),pixels.data[i]+step);
    }
    ctx.putImageData(pixels,0,0);
    paint.globalCompositeOperation="source-over";
    paint.clearRect(0,0,composite.width,composite.height);
    paint.drawImage(source,0,0,composite.width,composite.height);
    paint.globalCompositeOperation="destination-in";
    paint.drawImage(mask,0,0,composite.width,composite.height);
    drawing.drawImage(composite,box.x,box.y,box.width,box.height);
  };
}

// Both ink and image grains keep their origin and destination for the entire transition.
function paintDust(grains,t) {
  for (const p of grains) {
    if (t<p.born || t>p.fade) continue;
    const age=t-p.born, lift=smooth(0,470,age);
    const a=p.angle+age*.00027*p.spin;
    const fx=p.x+lift*(28+p.bend*.58+34*Math.cos(a)+14*Math.sin(a*1.51));
    const fy=p.y+lift*(p.lift*.63+30*Math.sin(a)+12*Math.cos(a*1.39));
    const travel=smooth(p.go,p.land,t), curl=4*travel*(1-travel);
    const x=fx+(p.ex-fx)*travel+curl*(26*Math.sin(a)+p.bend*.26);
    const y=fy+(p.ey-fy)*travel+curl*(28*Math.cos(a)+p.lift*.23);
    drawing.globalAlpha=.94*smooth(0,70,age)*(1-smooth(p.land,p.fade,t));
    drawing.fillStyle=p.colors[Math.round(travel*4)];
    drawing.fillRect(x,y,p.size,p.size*.86);
  }
  drawing.globalAlpha=1;
}

function textGeometry(element,start,pace,random,departing=false) {
  const node=element.firstChild, range=document.createRange();
  const block=element.getBoundingClientRect(), box=localBox(element);
  const style=getComputedStyle(element), fontSize=parseFloat(style.fontSize);
  const lineHeight=parseFloat(style.lineHeight);
  const stamp=document.createElement("canvas");
  stamp.width=stamp.height=Math.ceil(Math.max(fontSize*2,lineHeight*1.5));
  const ctx=stamp.getContext("2d",{willReadFrequently:true});
  ctx.font=[style.fontWeight,style.fontSize,style.fontFamily].join(" ");
  ctx.fillStyle=style.color;
  const letters=[], points=[];
  const duration=departing ? 170 : 290;
  let cursor=start;
  for (let i=0;i<node.length;i++) {
    const ch=node.data[i];
    if (/\s/.test(ch)) { cursor+=pace*.38; continue; }
    range.setStart(node,i); range.setEnd(node,i+1);
    const rect=range.getBoundingClientRect();
    const m=ctx.measureText(ch);
    const ascent=m.fontBoundingBoxAscent ?? fontSize*.82, descent=m.fontBoundingBoxDescent ?? fontSize*.18;
    const y=rect.top-block.top;
    const baseline=(rect.height+ascent-descent)/2;
    ctx.clearRect(0,0,stamp.width,stamp.height);
    ctx.fillText(ch,1,baseline);
    const pixels=ctx.getImageData(0,0,stamp.width,stamp.height).data;

    for (let k=0;k<fontSize*fontSize*.49;k++) {
      const x=random()*rect.width, yy=random()*rect.height;
      if (pixels[4*(Math.floor(yy)*stamp.width+Math.floor(x+1))+3]<100) continue;
      const u=x/Math.max(rect.width,1);
      points.push({x:box.x+rect.left-block.left+x,y:box.y+y+yy,
        at:cursor+duration*(departing ? .06+.78*u+.13*random() : .10+.32*u+.43*random()),
        filled:cursor+duration+80,color:style.color,size:.75+.85*random()});
    }
    const row=Math.max(0,Math.floor((y+rect.height/2)/lineHeight));
    letters.push({x:rect.left-block.left,y,row,width:rect.width,start:cursor});
    cursor+=pace*(/[,.。]/.test(ch)?1.8:1);
  }
  const end=(letters.at(-1)?.start ?? start)+duration;
  return {end,points,paint(t) {
    if (!departing && t>=end) {element.style.removeProperty("clip-path"); return;}
    let front=null,fraction=0;
    for (const letter of letters) {
      const age=(t-letter.start)/duration;
      if (age<0) break;
      front=letter;
      fraction=departing ? smooth(0,1,age) : smooth(.72,1,age);
      if (fraction<1) break;
    }
    if (!front) {
      element.style.clipPath=departing ? "" : "inset(0 100% 0 0)";
      return;
    }
    if (departing && t>=end) {
      element.style.clipPath="inset(0 100% 0 0)";
      return;
    }
    const top=front.row*lineHeight,bottom=(front.row+1)*lineHeight;
    const right=front.x+front.width*fraction;
    element.style.clipPath=departing
      ? "polygon("+right+"px "+top+"px,100% "+top+"px,100% 100%,0 100%,0 "+bottom+"px,"+right+"px "+bottom+"px)"
      : "polygon(0 0,100% 0,100% "+top+"px,"+right+"px "+top+"px,"+right+"px "+bottom+"px,0 "+bottom+"px)";
  }};
}

function prepareCanvas() {
  const ratio=pixelRatio(), width=showcase.clientWidth, height=showcase.clientHeight;
  canvas.width=Math.ceil(width*ratio);
  canvas.height=Math.ceil(height*ratio);
  canvas.style.height=height+"px";
  drawing.setTransform(ratio,0,0,ratio,0,0);
  canvas.hidden=false;
  showcase.dataset.transitioning="true";
  return {width,height};
}

function bindInk(origins,targets,photoGrains,regroup,random) {
  // Mix photographic and ink grains: some wood-coloured dust travels into letters,
  // and some of the old lettering continues on to become the new photograph.
  for (let i=origins.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    [origins[i],origins[j]]=[origins[j],origins[i]];
  }
  const takePhoto=p=>({x:p.x,y:p.y,at:p.born,color:p.colors[0],size:p.size});
  function supply(p,origin) {
    p.x=origin.x; p.y=origin.y; p.born=origin.at; p.colors[0]=origin.color;
  }
  const ink=targets.map((target,i)=>{
    const photo=photoGrains[Math.floor(random()*photoGrains.length)];
    let origin=origins[i];
    if (!origin || random()<.24) {
      const old=takePhoto(photo);
      if (origin) supply(photo,origin);
      origin=old;
    }
    return {x:origin.x,y:origin.y,born:origin.at,ex:target.x,ey:target.y,
      go:Math.max(regroup,target.at-410-random()*270),land:target.at,fade:target.filled,
      angle:random()*6.283,spin:(random()-.5)*17,bend:(random()-.4)*110,lift:(random()-.52)*95,
      size:target.size,colors:[origin.color,origin.color,target.color,target.color,target.color]};
  });
  for(let i=targets.length;i<origins.length;i++) {
    supply(photoGrains[(i-targets.length)%photoGrains.length],origins[i]);
  }
  return ink;
}

async function show(index) {
  index = (index + works.length) % works.length;
  if (index === selected) return;
  clearTimeout(advanceTimer);
  const ticket = ++revision;
  selected = index;
  finishAnimation();
  if (displayed === selected) { scheduleAdvance(); return; }
  const samples = window.portfolioSamples;
  if (!motion.checked || !drawing || !samples?.[works[index].key] ||
      !samples[works[displayed].key] || document.hidden) {
    renderWork(index);
    return;
  }

  const destination = photoSources[index];
  if (!destination.complete || !destination.naturalWidth) {
    destination.loading = "eager";
    try {
      await destination.decode();
    } catch {
      if (ticket === revision) renderWork(index);
      return;
    }
  }
  if (ticket !== revision) return;
  if (!photoSources[displayed].naturalWidth) {
    renderWork(index);
    return;
  }
  const before = displayed;
  const a = photoTiles(before), b = photoTiles(index);
  if (!a || !b) { renderWork(index); return; }
  const seed=139 + before*653 + index*499 + revision;
  const rand=seeded(seed), wind=1450;
  const oldPhoto=surface(photoSources[before],fittedPhoto(a),871+before);
  const oldTitle=textGeometry(title,0,Math.min(82,1080/title.textContent.length),rand,true);
  const oldCopy=textGeometry(description,0,Math.min(43,1180/description.textContent.length),rand,true);
  const regroup=Math.max(wind,oldTitle.end,oldCopy.end)+590;

  // Measure the next layout synchronously before paint, including actual mobile line wraps.
  title.textContent=works[index].name;
  description.textContent=works[index].description;
  id("size").textContent=works[index].size;
  const heading=textGeometry(title,regroup+440,91,rand);
  const copy=textGeometry(description,heading.end+230,75,rand);
  const nextPhoto=surface(destination,fittedPhoto(b),871+index,false);
  title.textContent=works[before].name;
  description.textContent=works[before].description;
  id("size").textContent=works[before].size;

  const assemblyStart=copy.end+220, end=assemblyStart+assemblyTime;
  const grains=photoCloud(oldPhoto,nextPhoto,a,b,rand);
  for (const p of grains) {
    p.born=wind*p.release;
    p.go=assemblyStart+assemblyTime*p.depart;
    p.land=assemblyStart+assemblyTime*p.settle;
    p.fade=p.land+assemblyTime*.05;
  }
  const ink=bindInk([...oldTitle.points,...oldCopy.points],[...heading.points,...copy.points],
    grains,regroup,rand);
  const deposit=deposition(nextPhoto,grains,b);
  let stage=prepareCanvas(), changed=false;
  const start=performance.now();
  function frame(now) {
    const elapsed=Math.max(0,now-start);
    if (elapsed>=regroup && !changed) {
      renderWork(index);
      stage=prepareCanvas();
      changed=true;
    }
    if (elapsed>=end) {
      finishAnimation();
      scheduleAdvance();
      return;
    }
    drawing.clearRect(0,0,stage.width,stage.height);
    remainingPhoto(oldPhoto,elapsed/wind);
    if (elapsed>assemblyStart) deposit((elapsed-assemblyStart)/assemblyTime);
    paintDust(grains,elapsed);
    paintDust(ink,elapsed);
    if (changed) {heading.paint(elapsed);copy.paint(elapsed);}
    else {oldTitle.paint(elapsed);oldCopy.paint(elapsed);}
    animationFrame=requestAnimationFrame(frame);
  }
  frame(start);
}

function settleSelection() {
  revision++;
  finishAnimation();
  if (selected !== displayed) renderWork(selected);
  scheduleAdvance();
}

function syncMotion() {
  motion.disabled = reducedMotion.matches || !drawing;
  motion.checked = motionRequested && !motion.disabled;
  if (!motion.checked) settleSelection();
}

id("previous").addEventListener("click", () => show(selected - 1));
id("next").addEventListener("click", () => show(selected + 1));
motion.addEventListener("change", () => {
  motionRequested = motion.checked;
  syncMotion();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) playing = false;
  syncMotion();
  syncPlayback();
});
window.addEventListener("resize", () => {
  if (selected !== displayed || showcase.hasAttribute("data-transitioning")) settleSelection();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) settleSelection();
  else scheduleAdvance();
});
autoplay.addEventListener("click", () => {
  playing = !playing;
  syncPlayback();
});
holdDuration.addEventListener("change", () => {
  try {
    localStorage.setItem(holdPreference, holdDuration.value);
  } catch {
    // Storage is optional for the current visit.
  }
  scheduleAdvance();
});
function syncFullscreen() {
  const active = Boolean(document.fullscreenElement) || document.body.classList.contains("presentation");
  fullscreen.textContent = active ? "화면 닫기" : "전체 화면";
  fullscreen.setAttribute("aria-label", active ? "전체 화면 닫기" : "전체 화면");
  settleSelection();
}
fullscreen.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else if (document.body.classList.contains("presentation")) {
    document.body.classList.remove("presentation");
    syncFullscreen();
  } else {
    try {
      await document.body.requestFullscreen();
    } catch {
      document.body.classList.add("presentation");
      syncFullscreen();
    }
  }
});
document.addEventListener("fullscreenchange", syncFullscreen);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("presentation")) {
    document.body.classList.remove("presentation");
    syncFullscreen();
    return;
  }
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey ||
      event.target === motion || event.target === holdDuration) return;
  const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
  if (!direction) return;
  event.preventDefault();
  show(selected + direction);
});

renderWork(selected);
syncMotion();
syncPlayback();
