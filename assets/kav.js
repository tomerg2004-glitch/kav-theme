(function(){
  var hdr=document.querySelector('.k-header');
  if(hdr){var onS=function(){hdr.classList.toggle('is-scrolled',window.scrollY>8)};onS();window.addEventListener('scroll',onS,{passive:true});}
  var toast=document.createElement('div');toast.className='k-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);
  var toastT=0;
  window.kavToast=function(html){toast.innerHTML=html;toast.classList.add('is-on');clearTimeout(toastT);toastT=setTimeout(function(){toast.classList.remove('is-on')},4200);};
  // mobile menu
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-menu-toggle]');
    if(t){var h=t.closest('.k-header');var open=h.classList.toggle('is-open');t.setAttribute('aria-expanded',open?'true':'false');}
  });
  // hero colorway switch
  document.querySelectorAll('[data-hero]').forEach(function(root){
    var imgs=root.querySelectorAll('[data-hero-img]'),btns=root.querySelectorAll('[data-hero-sw]'),label=root.querySelector('[data-hero-label]');
    btns.forEach(function(b,i){b.addEventListener('click',function(){
      imgs.forEach(function(im,j){im.classList.toggle('is-on',i===j)});
      btns.forEach(function(x,j){x.setAttribute('aria-checked',i===j?'true':'false')});
      if(label)label.textContent=b.getAttribute('aria-label');
    })});
  });
  // product form
  document.querySelectorAll('[data-product]').forEach(function(root){
    var data=JSON.parse(root.querySelector('[data-product-json]').textContent);
    var form=root.querySelector('form[action*="/cart/add"]');
    var idInput=form.querySelector('[name="id"]');
    var btn=form.querySelector('[data-add]');
    var priceEl=root.querySelector('[data-price]');
    var stage=root.querySelectorAll('[data-media-id]');
    var thumbs=root.querySelectorAll('[data-thumb]');
    var err=root.querySelector('[data-error]');
    var selected=data.options.map(function(o,i){var c=root.querySelector('[data-opt="'+i+'"][aria-checked="true"]');return c?c.getAttribute('data-value'):null;});
    function showMedia(id){
      if(!id)return;
      stage.forEach(function(im){im.classList.toggle('is-on',im.getAttribute('data-media-id')==String(id))});
      thumbs.forEach(function(t){t.classList.toggle('is-on',t.getAttribute('data-thumb')==String(id));t.setAttribute('aria-pressed',t.getAttribute('data-thumb')==String(id)?'true':'false')});
    }
    function money(c){return '₪'+(c/100).toLocaleString('he-IL',{minimumFractionDigits:c%100?2:0,maximumFractionDigits:2});}
    function current(){return data.variants.find(function(v){return v.options.every(function(o,i){return selected[i]===o})})}
    function update(){
      var v=current();
      // availability per size
      root.querySelectorAll('[data-opt]').forEach(function(b){
        var i=+b.getAttribute('data-opt'),val=b.getAttribute('data-value');
        var ok=data.variants.some(function(x){return x.available&&x.options[i]===val&&x.options.every(function(o,k){return k===i||selected[k]==null||o===selected[k]})});
        b.classList.toggle('is-out',!ok);
      });
      var complete=selected.every(function(s){return s!=null});
      if(!complete){var partial=data.variants.find(function(x){return x.featured_media&&x.options.every(function(o,k){return selected[k]==null||o===selected[k]})});if(partial)showMedia(partial.featured_media.id);}
      if(v&&complete){
        idInput.value=v.id;
        if(priceEl)priceEl.textContent=money(v.price);
        btn.disabled=!v.available;
        btn.textContent=v.available?btn.getAttribute('data-label-add'):btn.getAttribute('data-label-sold');
        if(v.featured_media)showMedia(v.featured_media.id);
        var u=new URL(location.href);u.searchParams.set('variant',v.id);history.replaceState({},'',u);
      }
    }
    root.querySelectorAll('[data-opt]').forEach(function(b){b.addEventListener('click',function(){
      var i=+b.getAttribute('data-opt');selected[i]=b.getAttribute('data-value');
      root.querySelectorAll('[data-opt="'+i+'"]').forEach(function(x){x.setAttribute('aria-checked',x===b?'true':'false')});
      var lbl=root.querySelector('[data-opt-label="'+i+'"]');if(lbl)lbl.textContent=selected[i];
      if(err)err.hidden=true;
      // color option without variant image: try media by alt
      update();
    })});
    thumbs.forEach(function(t){t.addEventListener('click',function(){showMedia(t.getAttribute('data-thumb'))})});
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!selected.every(function(s){return s!=null})){if(err){err.hidden=false;}return;}
      var v=current();if(!v||!v.available)return;
      btn.disabled=true;
      fetch(window.Shopify&&Shopify.routes?Shopify.routes.root+'cart/add.js':'/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items:[{id:v.id,quantity:1}]})})
      .then(function(r){if(!r.ok)throw r;return r.json()})
      .then(function(){
        btn.textContent=btn.getAttribute('data-label-added');
        var img=root.querySelector('.k-gallery img');
        window.kavToast((img?'<img src="'+img.currentSrc+'" alt="">':'')+'<span class="k-toast__txt"><strong>'+root.getAttribute('data-added-msg')+'</strong><span>'+data.title+' · '+v.title+'</span></span><a href="'+(root.getAttribute('data-cart-url')||'/cart')+'">'+root.getAttribute('data-cart-label')+'</a>');
        return fetch('/cart.js').then(function(r){return r.json()}).then(function(c){document.querySelectorAll('[data-cart-count]').forEach(function(el){el.textContent=c.item_count})});
      })
      .catch(function(){btn.textContent=btn.getAttribute('data-label-error')})
      .finally(function(){setTimeout(function(){btn.disabled=false;btn.textContent=btn.getAttribute('data-label-add')},2000)});
    });
    var bar=root.querySelector('[data-buybar]');
    if(bar&&'IntersectionObserver' in window){
      new IntersectionObserver(function(es){bar.classList.toggle('is-on',!es[0].isIntersecting)},{rootMargin:'0px 0px -40px 0px'}).observe(btn);
      bar.querySelector('button').addEventListener('click',function(){btn.scrollIntoView({behavior:'smooth',block:'center'});var first=root.querySelector('[data-opt][aria-checked="false"]');});
    }
    update();
  });
  // cart qty
  document.querySelectorAll('[data-qty]').forEach(function(q){
    var input=q.querySelector('input');
    q.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){
      var n=Math.max(0,(+input.value||0)+(+b.getAttribute('data-step')));input.value=n;input.form.requestSubmit?input.form.requestSubmit():input.form.submit();
    })});
  });
})();

// cookie preferences (Shopify privacy banner)
(function(){
  document.querySelectorAll('[data-cookie-prefs]').forEach(function(b){
    b.addEventListener('click',function(){
      if(window.privacyBanner&&typeof window.privacyBanner.showPreferences==='function'){window.privacyBanner.showPreferences();}
      else if(window.Shopify&&Shopify.loadFeatures){Shopify.loadFeatures([{name:'consent-tracking-api',version:'0.1'}],function(){if(window.privacyBanner)window.privacyBanner.showPreferences();});}
    });
  });
})();
// statement: words turn to ink as the line crosses the screen (runs back on scroll up)
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-highlight]').forEach(function(text){
    if(reduce)return;
    var sec=text.closest('.k-statement');
    var walker=document.createTreeWalker(text,NodeFilter.SHOW_TEXT),nodes=[],n;
    while(n=walker.nextNode())nodes.push(n);
    var words=[];
    nodes.forEach(function(t){
      var frag=document.createDocumentFragment();
      t.textContent.split(/(\s+)/).forEach(function(part){
        if(!part)return;
        if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
        var s=document.createElement('span');s.className='k-w';s.textContent=part;frag.appendChild(s);words.push(s);
      });
      t.parentNode.replaceChild(frag,t);
    });
    sec.classList.add('is-live');
    var last=-1,ticking=false;
    function draw(){
      ticking=false;
      var r=text.getBoundingClientRect(),vh=innerHeight,start=vh*.85,end=vh*.45;
      var t=Math.min(1,Math.max(0,(start-r.top)/Math.max(1,(start-end)+r.height)));
      var k=Math.round(t*words.length);
      if(k===last)return;last=k;
      words.forEach(function(w,i){w.classList.toggle('is-on',i<k)});
    }
    function req(){if(!ticking){ticking=true;requestAnimationFrame(draw)}}
    addEventListener('scroll',req,{passive:true});addEventListener('resize',req);draw();
  });
})();
// photo chapters: the section holds; each photograph wipes up over the last, the panel follows
(function(){
  var mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-chapters]').forEach(function(root){
    var box=root.querySelector('.k-ch__box'),list=root.querySelector('.k-ch__list');
    var items=[].slice.call(root.querySelectorAll('.k-ch__item'));
    var pics=items.map(function(i){return i.querySelector('.k-ch__pic')});
    var n=items.length;if(n<2)return;
    var hold=n<=3?2:3,live=false,on=-1;
    var stage=document.createElement('div');stage.className='k-ch__stage';
    var panel=document.createElement('div');panel.className='k-ch__panel';
    var count=document.createElement('p');count.className='k-ch__count';count.setAttribute('aria-hidden','true');panel.appendChild(count);
    var pad=function(v){return (v<10?'0':'')+v};
    var ease=function(u){return 1-Math.pow(1-u,3)};
    function show(k){if(k===on)return;on=k;items.forEach(function(it,i){it.classList.toggle('is-on',i===k)});count.textContent=pad(k+1)+' / '+pad(n);}
    function draw(){
      if(!live)return;
      var r=root.getBoundingClientRect(),total=r.height-innerHeight;
      var p=Math.min(1,Math.max(0,-r.top/Math.max(1,total))),seg=1/n,k=0;
      pics.forEach(function(pic,i){
        var u=i===0?1:Math.min(1,Math.max(0,(p-(i-.25)*seg)/(.45*seg))),e=ease(u);
        pic.style.setProperty('--c',((1-e)*100).toFixed(2)+'%');
        pic.style.setProperty('--z',(1.06-.06*e).toFixed(4));
        if(u>=.5)k=i;
      });
      show(k);
    }
    function go(){
      if(live)return;live=true;
      var hdr=document.querySelector('.k-header');if(hdr)root.style.setProperty('--hdr',hdr.offsetHeight+'px');
      root.style.setProperty('--hold',hold);
      pics.forEach(function(p){stage.appendChild(p)});
      panel.appendChild(list);box.appendChild(stage);box.appendChild(panel);
      root.classList.add('is-live');draw();
    }
    function rest(){
      if(!live)return;live=false;
      root.classList.remove('is-live');
      box.appendChild(list);
      pics.forEach(function(p,i){items[i].insertBefore(p,items[i].firstChild);p.style.removeProperty('--c');p.style.removeProperty('--z')});
      items.forEach(function(it){it.classList.remove('is-on')});stage.remove();panel.remove();on=-1;
    }
    function sync(){(!mq.matches&&innerHeight>=600)?go():rest()}
    var ticking=false;
    addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;draw()})}},{passive:true});
    addEventListener('resize',sync);sync();
  });
})();
