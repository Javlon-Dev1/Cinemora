(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const api = (path) => `/api/${path}`;
  const getVisitorKey = () => { let key=localStorage.getItem('cinemora-visitor-key'); if(!key){key=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem('cinemora-visitor-key',key);} return key; };
  async function postJson(url, body) { const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json(); }
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const posterUrl = (value) => { if (!value) return ''; if (/^https?:\/\//i.test(value)) return value; return `${location.origin}${value.startsWith('/') ? '' : '/'}${value}`; };
  const minutes = (n) => { if(n===null||n===undefined||n==='')return 'Davomiyligi noma’lum'; const h=Math.floor((Number(n)||0)/60), m=(Number(n)||0)%60; return h ? `${h} soat ${m} daq.` : `${m} daq.`; };
  const rating = (value) => value ? Number(value).toFixed(1) : '—';
  const movieLink = (movie) => `/watch/${encodeURIComponent(movie.slug)}/`;
  const genres = (movie) => Array.isArray(movie.genres) ? movie.genres.map((g) => typeof g === 'object' ? g.name : g) : [];
  const imageMarkup = (movie, cls='poster-image') => movie.poster ? `<img class="${cls}" src="${esc(posterUrl(movie.poster))}" alt="${esc(movie.title)} afishasi" loading="lazy" onerror="this.remove()">` : '';
  const card = (movie) => `<a class="movie-card" href="${movieLink(movie)}"><div class="poster-wrap"><div class="poster-placeholder">C</div>${imageMarkup(movie)}<div class="card-top"><span class="card-badge">${esc(movie.release_year || 'Kino')}</span><span class="card-rating">★ ${rating(movie.average_rating)}</span></div><span class="card-play"><svg viewBox="0 0 24 24"><path d="m8 5 12 7-12 7z"></path></svg></span></div><div class="card-info"><h3 class="card-title">${esc(movie.title)}</h3><p class="card-subtitle">${esc(genres(movie).slice(0,2).join(' · ') || movie.category?.name || 'Kino')} · ${minutes(movie.duration)} · ${Number(movie.views_count||0).toLocaleString()} ko‘rish</p></div></a>`;
  async function getJson(url) { const response = await fetch(url, {headers:{Accept:'application/json'}}); if(!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }
  function setHero(movie) {
    const title=$('#hero-title'), desc=$('#hero-description'), bg=$('#hero-backdrop'), genresBox=$('#hero-genres'); if(!title)return;
    if(!movie){title.innerHTML='Kino olamiga<br><span>sayohat qiling.</span>';return;}
    title.textContent=movie.title; desc.textContent=movie.description || 'Bu ajoyib hikoyani hoziroq tomosha qiling.';
    $('#hero-category').textContent=movie.category?.name || 'TANLOV'; $('#hero-meta').innerHTML=`<span class="rating"><span>★</span> <b>${rating(movie.average_rating)}</b></span><span class="meta-divider"></span><span>${movie.release_year || 'HD'}</span><span class="meta-divider"></span><span>${minutes(movie.duration)}</span>`;
    genresBox.innerHTML=genres(movie).slice(0,3).map(g=>`<span class="hero-tag">${esc(g)}</span>`).join('');
    if(movie.poster){bg.style.backgroundImage=`linear-gradient(90deg,#0b0d10 1%,rgba(11,13,16,.92) 24%,rgba(11,13,16,.58) 53%,rgba(11,13,16,.12) 100%),linear-gradient(0deg,#0b0d10,transparent 33%),url("${posterUrl(movie.poster).replaceAll('"','%22')}")`;bg.classList.add('has-image');}
    $('#hero-play').href=movieLink(movie); $('#hero-more').href=movieLink(movie);
  }
  async function initHome() {
    const grid=$('#movie-grid'), note=$('#results-note'), empty=$('#empty-state'); let allMovies=[], category='', query='';
    try {
      const [movies,categories]=await Promise.all([getJson(api('home/')),getJson(api('category/'))]); allMovies=Array.isArray(movies)?movies:(movies.results||[]);
      $('#all-count').textContent=allMovies.length; setHero(allMovies[0]);
      $('#category-list').innerHTML=categories.map(c=>`<button class="chip" data-category="${esc(c.id)}">${esc(c.name)} <span class="chip-count">${allMovies.filter(m=>String(m.category?.id??m.category)===String(c.id)).length}</span></button>`).join('');
      render();
    } catch(error){note.textContent='Kinolarni yuklab bo‘lmadi. API server ishlayotganini tekshiring.';note.classList.add('page-error');}
    function render(){const filtered=allMovies.filter(m=>(!category||String(m.category?.id??m.category)===category)&&(!query||`${m.title} ${m.description} ${genres(m).join(' ')}`.toLowerCase().includes(query.toLowerCase())));grid.innerHTML=filtered.map(card).join('');note.textContent=query?`“${query}” bo‘yicha ${filtered.length} ta natija`:`${filtered.length} ta film`;empty.hidden=filtered.length>0;grid.classList.toggle('is-hidden',filtered.length===0);}
    $('#categories').addEventListener('click',e=>{const btn=e.target.closest('[data-category]');if(!btn)return;category=btn.dataset.category;$('#categories').querySelectorAll('.chip').forEach(el=>el.classList.toggle('selected',el===btn));render();});
    $('#site-search').addEventListener('input',e=>{query=e.target.value.trim();render();}); $('#reset-search').addEventListener('click',()=>{$('#site-search').value='';query='';category='';$('#categories').querySelectorAll('.chip').forEach((el,i)=>el.classList.toggle('selected',i===0));render();});
  }
  async function initResults(){
    const params=new URLSearchParams(location.search);let query=params.get('q')||'',category='';const input=$('#site-search');input.value=query;
    $('#search-summary').textContent=query?`“${query}” bo‘yicha kinolar`:'Barcha kinolar';
    const list=$('#category-list'),grid=$('#movie-grid'),note=$('#results-note'),empty=$('#empty-state');
    try{const categories=await getJson(api('category/'));list.innerHTML=categories.map(c=>`<button class="chip" data-category="${esc(c.id)}">${esc(c.name)}</button>`).join('');await render();}
    catch{note.textContent='Natijalarni yuklab bo‘lmadi. API serverini tekshiring.';note.classList.add('page-error');}
    async function render(){note.textContent='Yuklanmoqda...';try{const qs=new URLSearchParams();if(query)qs.set('search',query);if(category)qs.set('category',category);const data=await getJson(api(`home/?${qs}`)),movies=Array.isArray(data)?data:(data.results||[]);grid.innerHTML=movies.map(card).join('');note.textContent=`${movies.length} ta kino topildi`;empty.hidden=movies.length>0;grid.classList.toggle('is-hidden',movies.length===0);}catch{note.textContent='Natijalarni yuklab bo‘lmadi.';note.classList.add('page-error');}}
    $('#search-categories').addEventListener('click',async e=>{const btn=e.target.closest('[data-category]');if(!btn)return;category=btn.dataset.category;$('#search-categories').querySelectorAll('.chip').forEach(el=>el.classList.toggle('selected',el===btn));await render();});
  }
  function formatTime(time){if(!Number.isFinite(time))return '00:00';const h=Math.floor(time/3600),m=Math.floor(time%3600/60),s=Math.floor(time%60);return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  async function initWatch(){
    const slug=document.body.dataset.movieSlug, player=$('#movie-player'), shell=$('#player-shell');
    try{
      const movie=await getJson(api(`movie/${encodeURIComponent(slug)}/`)); document.title=`${movie.title} — CINEMORA`;
      $('#watch-title').textContent=movie.title;$('#watch-description').textContent=movie.description||'Ushbu film uchun tavsif mavjud emas.';$('#watch-category').textContent=movie.category?.name||'Kino';
      $('#watch-meta').innerHTML=`<span>${movie.release_year||'—'}</span><span class="meta-divider"></span><span>${minutes(movie.duration)}</span><span class="meta-divider"></span><span>${Number(movie.views_count||0).toLocaleString()} ko‘rish</span><span class="meta-divider"></span><span>${esc(genres(movie).join(', ')||'Film')}</span>`;
      setupRating(movie);
      postJson(api(`movie/${encodeURIComponent(slug)}/view/`),{}).then(({views_count})=>{$('#watch-meta').innerHTML=$('#watch-meta').innerHTML.replace(/\d[\d,]* ko‘rish/,`${Number(views_count).toLocaleString()} ko‘rish`);}).catch(()=>{});
      if(movie.poster) player.poster=posterUrl(movie.poster);
      const source=$('#movie-source'), message=$('#player-message'); if(movie.video_url){source.src=movie.video_url;player.load();}else{message.textContent='Bu film uchun video mavjud emas';$('#big-play').disabled=true;}
      const countries=Array.isArray(movie.country)?movie.country.map(v=>typeof v==='object'?v.name:v).join(', '):'';
      $('#detail-grid').innerHTML=[["Janr",genres(movie).join(', ')||'—'],["Mamlakat",countries||'—'],["Chiqqan yil",movie.release_year||'—'],["Davomiyligi",minutes(movie.duration)]].map(([label,value])=>`<div class="detail-item"><span class="detail-label">${label}</span><span class="detail-value">${esc(value)}</span></div>`).join('');
      const favorite=$('.favorite-button'), key='cinemora-favorites', saved=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}};const syncFav=()=>{const on=saved().includes(movie.slug);favorite.classList.toggle('saved',on);favorite.textContent=on?'♥':'♡';};syncFav();favorite.addEventListener('click',()=>{const items=saved(),index=items.indexOf(movie.slug);if(index>=0)items.splice(index,1);else items.push(movie.slug);localStorage.setItem(key,JSON.stringify(items));syncFav();});
      setupPlayer(player,shell,message);
      const moviesData=await getJson(api(`home/?category=${encodeURIComponent(movie.category?.id??movie.category??'')}`));const pool=Array.isArray(moviesData)?moviesData:(moviesData.results||[]);const related=pool.filter(m=>m.slug!==movie.slug).sort((a,b)=>{const ag=new Set(genres(a)),bg=new Set(genres(b));const as=[...ag].filter(g=>genres(movie).includes(g)).length,bs=[...bg].filter(g=>genres(movie).includes(g)).length;return bs-as;}).slice(0,5);
      $('#related-grid').innerHTML=related.map(card).join('')||'<p class="results-note">Hozircha o‘xshash filmlar topilmadi.</p>';
    }catch(error){$('#watch-title').textContent='Kino topilmadi';$('#watch-description').textContent='Film ma’lumotlarini yuklab bo‘lmadi. Bosh sahifaga qaytib, boshqa kino tanlang.';$('#player-message').textContent='Filmni ochib bo‘lmadi';$('#related-grid').innerHTML='';}
  }
  async function setupRating(movie){
    const visitor_key=getVisitorKey(),url=api(`movie/${encodeURIComponent(movie.slug)}/rating/`),buttons=[...document.querySelectorAll('.rate-star')];
    const update=({average_rating,rating_count,user_rating})=>{
      $('#rating-average').textContent=average_rating==null?'—':Number(average_rating).toFixed(1);
      $('#rating-stars-display').textContent=average_rating==null?'☆☆☆☆☆':'★★★★★'.split('').map((star,index)=>index<Math.round(average_rating)?'★':'☆').join('');
      $('#rating-count').textContent=rating_count?`${rating_count} ta foydalanuvchi bahosi`:'Hali baho berilmagan';
      $('#rating-prompt').textContent=user_rating?`Sizning bahoyingiz: ${user_rating}/5 · o‘zgartirish uchun tanlang`:'Sizga bu kino yoqdimi? Baholang';
      buttons.forEach(button=>{const active=Number(button.dataset.score)<=Number(user_rating||0);button.classList.toggle('chosen',active);button.setAttribute('aria-pressed',String(Number(button.dataset.score)===Number(user_rating||0)));});
    };
    try{update(await getJson(`${url}?visitor_key=${encodeURIComponent(visitor_key)}`));}catch{}
    buttons.forEach(button=>button.addEventListener('click',async()=>{buttons.forEach(b=>b.disabled=true);try{update(await postJson(url,{visitor_key,score:Number(button.dataset.score)}));}catch{$('#rating-prompt').textContent='Bahoni saqlab bo‘lmadi. Qayta urinib ko‘ring.';}finally{buttons.forEach(b=>b.disabled=false);}}));
  }
  function setupPlayer(video,shell,message){const toggle=$('#play-toggle'),seek=$('#seekbar'),time=$('#time-readout'),volume=$('#volume-slider'),controls=$('#player-controls');let hideTimer;
    const play=async()=>{try{shell.classList.add('loading');await video.play();}catch{message.textContent='Videoni ijro etib bo‘lmadi. Video manzilini tekshiring.';shell.classList.remove('playing');}};
    $('#big-play').addEventListener('click',play);toggle.addEventListener('click',()=>video.paused?play():video.pause());
    video.addEventListener('playing',()=>shell.classList.remove('loading'));video.addEventListener('waiting',()=>{if(!video.paused)shell.classList.add('loading');});video.addEventListener('seeking',()=>shell.classList.add('loading'));video.addEventListener('seeked',()=>shell.classList.remove('loading'));video.addEventListener('canplay',()=>shell.classList.remove('loading'));video.addEventListener('play',()=>{shell.classList.add('playing');shell.classList.remove('paused');toggle.textContent='Ⅱ';message.textContent='';});video.addEventListener('pause',()=>{shell.classList.remove('playing');shell.classList.add('paused');toggle.textContent='▶';});video.addEventListener('ended',()=>{shell.classList.remove('playing');shell.classList.add('paused');});video.addEventListener('loadedmetadata',()=>{time.textContent=`${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;});
    let draggingSeek=false;
    const updateSeek=()=>{const pct=video.duration?video.currentTime/video.duration*100:0;seek.value=pct;seek.style.setProperty('--progress',`${pct}%`);};
    video.addEventListener('timeupdate',()=>{if(!draggingSeek)updateSeek();time.textContent=`${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;});
    seek.addEventListener('pointerdown',()=>{draggingSeek=true;});
    seek.addEventListener('input',()=>{const pct=Number(seek.value);seek.style.setProperty('--progress',`${pct}%`);if(video.duration)time.textContent=`${formatTime(pct/100*video.duration)} / ${formatTime(video.duration)}`;});
    seek.addEventListener('change',()=>{if(Number.isFinite(video.duration)&&video.duration>0)video.currentTime=Number(seek.value)/100*video.duration;draggingSeek=false;});
    seek.addEventListener('pointerup',()=>{draggingSeek=false;});seek.addEventListener('pointercancel',()=>{draggingSeek=false;updateSeek();});
    volume.addEventListener('input',()=>{video.volume=Number(volume.value);video.muted=video.volume===0;$('#volume-toggle').textContent=video.muted?'◌':'◖';});$('#volume-toggle').addEventListener('click',()=>{video.muted=!video.muted;$('#volume-toggle').textContent=video.muted?'◌':'◖';});
    const fullscreen=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else shell.requestFullscreen?.();};$('#fullscreen-button').addEventListener('click',fullscreen);$('#fullscreen-top').addEventListener('click',fullscreen);
    $('#quality-toggle').addEventListener('click',()=>{message.textContent='Video sifati manba videoga bog‘liq';shell.classList.add('controls-visible');setTimeout(()=>shell.classList.remove('controls-visible'),1800);});
    shell.addEventListener('mousemove',()=>{shell.classList.add('controls-visible');clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!video.paused)shell.classList.remove('controls-visible');},2200);});shell.addEventListener('mouseleave',()=>{if(!video.paused)shell.classList.remove('controls-visible');});shell.addEventListener('click',e=>{if(e.target===video&&video.paused)play();});video.addEventListener('error',()=>{shell.classList.remove('loading');message.textContent='Video manzili ochilmadi. API’dagi video_url qiymatini tekshiring.';shell.classList.remove('playing');});
  }
  async function initSearch(){const input=$('#site-search'),box=input?.closest('.search-box');if(!input||!box)return;const panel=document.createElement('div');panel.className='search-results';panel.hidden=true;box.append(panel);let timer;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const q=input.value.trim();location.href=`/search/?q=${encodeURIComponent(q)}`;}});input.addEventListener('input',()=>{clearTimeout(timer);const q=input.value.trim();if(q.length<2){panel.hidden=true;return;}timer=setTimeout(async()=>{try{const data=await getJson(api(`home/?search=${encodeURIComponent(q)}`));const movies=Array.isArray(data)?data:(data.results||[]);panel.innerHTML=movies.slice(0,6).map(m=>`<a class="search-result" href="${movieLink(m)}">${m.poster?`<img src="${esc(posterUrl(m.poster))}" alt="">`:'<span class="search-result-placeholder">C</span>'}<span><b>${esc(m.title)}</b><small>${esc(m.release_year||'')} · ${esc(genres(m).slice(0,2).join(', ')||m.category?.name||'Kino')}</small></span></a>`).join('')+`<a class="search-result search-all" href="/search/?q=${encodeURIComponent(q)}">Barcha natijalarni ko‘rish ↗</a>`;panel.hidden=false;}catch{panel.innerHTML='<div class="search-no-results">Qidiruv vaqtincha ishlamadi.</div>';panel.hidden=false;}},220);});document.addEventListener('click',e=>{if(!box.contains(e.target))panel.hidden=true;});input.addEventListener('focus',()=>{if(input.value.trim().length>1)panel.hidden=false;});document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();input.focus();}if(e.key==='Escape'){panel.hidden=true;input.blur();}});}
  if(document.body.dataset.page==='home')initHome();if(document.body.dataset.page==='watch')initWatch();if(document.body.dataset.page==='search')initResults();initSearch();
})();
