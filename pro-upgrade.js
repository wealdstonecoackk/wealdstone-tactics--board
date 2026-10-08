/* Wealdstone Coach Hub — professional UI upgrade layer */
(function(){
  "use strict";
  function boot(){
    if(!document.body||!document.getElementById("pitch")||document.getElementById("proUpgrade"))return;

    const style=document.createElement("style"); style.id="proUpgrade";
    style.textContent=`
      .pro-shell{margin:8px 0 10px;padding:10px;border:1px solid #303943;border-radius:14px;background:linear-gradient(180deg,#171d25,#11161c);box-shadow:0 8px 24px #0004}
      .pro-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      .pro-title strong{font-size:13px;letter-spacing:.4px}.pro-title span{font-size:9px;color:#9da7b3}
      .pro-nav{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pro-nav button{min-height:44px;background:#202730;border-color:#394452;font-size:10px;font-weight:800}
      .pro-sub{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}.pro-sub button{min-height:38px;font-size:9px}
      .pro-progress{display:flex;gap:5px;margin-top:7px;overflow:auto}.pro-progress span{flex:1;min-width:62px;padding:6px;border-radius:8px;background:#151a20;border:1px solid #2c333c;text-align:center;font-size:8px;font-weight:800;color:#c8d0d9}.pro-progress span.on{border-color:#69d391;color:#fff}
      .pro-ai{margin-top:7px;padding:9px;border-radius:10px;background:#0e141a;border:1px solid #33404c}.pro-ai-head{display:flex;justify-content:space-between;gap:8px;font-size:10px;margin-bottom:6px}.pro-ai-head span{font-size:9px;color:#69d391}.pro-ai-note{padding:7px 8px;margin-top:5px;border-radius:8px;background:#171f27;font-size:10px;line-height:1.35}.pro-ai-note b{color:#fff}
      .legacy-controls{display:none!important}
      @media(max-width:600px){.pro-nav{grid-template-columns:repeat(2,1fr)}.pro-sub{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:380px){.pro-title span{display:none}.pro-nav button{min-height:42px}.pro-sub button{min-height:36px}}
    `;
    document.head.appendChild(style);

    const wrap=document.querySelector("main.wrap"), anchor=document.querySelector(".menu-label");
    if(!wrap||!anchor)return;
    const shell=document.createElement("section"); shell.className="pro-shell";
    shell.innerHTML=`
      <div class="pro-title"><strong>🧠 COACH HUB</strong><span>WEALDSTONE • PROFESSIONAL WORKFLOW</span></div>
      <div class="pro-nav">
        <button data-pro="plan">🗺️ PLAN</button><button data-pro="build">✏️ BUILD</button>
        <button data-pro="rehearse">▶ REHEARSE</button><button data-pro="organise">💾 SAVE</button>
      </div>
      <div class="pro-sub">
        <button data-pro="library">📚 LIBRARY</button><button data-pro="training">🏋️ TRAINING</button>
        <button data-pro="press">🔴 OPPOSITION</button><button data-pro="ai">🧠 AI COACH</button>
      </div>
      <div class="pro-ai" id="proAiPanel" hidden><div class="pro-ai-head"><strong>🧠 COACH INTELLIGENCE</strong><span id="proAiScore">SCAN</span></div><div id="proAiAdvice"></div></div>
      <div class="pro-progress"><span class="on">✓ SETUP</span><span class="on">✓ MOVEMENT</span><span>● REHEARSE</span><span>● SAVE</span><span>● SHARE</span></div>`;
    wrap.insertBefore(shell,anchor);

    const click=id=>{const el=document.getElementById(id);if(el)el.click();};
    shell.querySelectorAll("[data-pro]").forEach(b=>b.addEventListener("click",()=>{
      const a=b.dataset.pro;
      if(a==="plan"){click("newSession");window.scrollTo({top:0,behavior:"smooth"});}
      if(a==="build")document.getElementById("pitch")?.scrollIntoView({behavior:"smooth",block:"center"});
      if(a==="rehearse")click("play");
      if(a==="organise")click("save");
      if(a==="library")click("library");
      if(a==="training")click("training");
      if(a==="press")click("pressMenu");
      if(a==="ai"){runCoachIntelligence();runOppositionIntelligence();}
    }));

    function runCoachIntelligence(){
      const pitch=document.getElementById("pitch"),panel=document.getElementById("proAiPanel"),advice=document.getElementById("proAiAdvice"),score=document.getElementById("proAiScore");if(!pitch||!panel)return;
      const pr=pitch.getBoundingClientRect(), own=[...pitch.querySelectorAll(".player:not(.opp)")].map(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};}), opp=[...pitch.querySelectorAll(".player.opp")].map(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
      const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0,w=pr.width||1,h=pr.height||1;
      const spread=own.length>1?Math.sqrt(avg(own.map(p=>(p.x-avg(own.map(q=>q.x)))**2+(p.y-avg(own.map(q=>q.y)))**2))):0;
      const nearest=own.length&&opp.length?Math.min(...own.map(p=>Math.min(...opp.map(o=>Math.hypot(p.x-o.x,p.y-o.y))))):99;
      const central=own.filter(p=>Math.abs((p.x-pr.left)/w-.5)<.18).length, notes=[];
      if(!opp.length)notes.push("<b>Opposition:</b> Add the press shape first so the engine can coach the escape route.");
      else if(nearest<w*.12)notes.push("<b>Pressure:</b> Tight press. Scan early, open the body and use the safe-side outlet.");
      else if(nearest<w*.22)notes.push("<b>Pressure:</b> Medium press. Build a support angle and third-man option.");
      else notes.push("<b>Space:</b> Low immediate pressure. The first receiver can turn or carry.");
      if(spread<h*.18)notes.push("<b>Structure:</b> Compact. Add width or depth so the block cannot defend one channel.");
      else if(spread>h*.34)notes.push("<b>Structure:</b> Stretched. Add nearer support to keep combinations connected.");
      else notes.push("<b>Structure:</b> Good spacing. Look for third-man or opposite-side rotation.");
      notes.push(central<2?"<b>Progression:</b> Central support is light — create a bounce option.":"<b>Progression:</b> Central support available — bounce → third-man → forward action.");
      score.textContent=Math.max(0,Math.min(100,Math.round(100-(nearest<w*.12?28:nearest<w*.22?12:0)-(spread<h*.18?15:0))))+"% READINESS";
      advice.innerHTML=notes.map(x=>'<div class="pro-ai-note">'+x+"</div>").join("");panel.hidden=false;
    }
    function runOppositionIntelligence(){
      const pitch=document.getElementById("pitch"),panel=document.getElementById("proAiPanel"),advice=document.getElementById("proAiAdvice"),score=document.getElementById("proAiScore");if(!pitch||!panel)return;
      const own=[...pitch.querySelectorAll(".player:not(.opp)")],opp=[...pitch.querySelectorAll(".player.opp")];
      if(!opp.length){panel.hidden=false;score.textContent="PRESS SHAPE";advice.innerHTML='<div class="pro-ai-note"><b>AI Press:</b> Add opposition players to identify presser, cover and line shift.</div>';return;}
      const c=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}},O=own.map(c),D=opp.map(c),nearest=p=>D.map((d,i)=>({i,d:Math.hypot(p.x-d.x,p.y-d.y)})).sort((a,b)=>a.d-b.d)[0];
      const t=O.map((p,i)=>({i,p,n:nearest(p)})).sort((a,b)=>a.n.d-b.n.d),notes=[];
      if(t[0])notes.push("<b>1st Presser:</b> Defender "+(t[0].n.i+1)+" attacks the ball-side player.");
      if(t[1])notes.push("<b>Cover:</b> Defender "+(t[1].n.i+1)+" protects the next pass.");
      if(t[2])notes.push("<b>Shift:</b> Defender "+(t[2].n.i+1)+" squeezes across.");
      notes.push("<b>Press trigger:</b> Keep distances connected and force play toward the least dangerous lane.");
      score.textContent=t[0]&&t[0].n.d<(pitch.clientWidth||400)*.18?"HIGH PRESS":"MID BLOCK";advice.innerHTML=notes.map(x=>'<div class="pro-ai-note">'+x+"</div>").join("");panel.hidden=false;
    }

    document.querySelectorAll(".menu-label").forEach(label=>{label.classList.add("legacy-controls");if(label.nextElementSibling)label.nextElementSibling.classList.add("legacy-controls");});
    const status=document.getElementById("status");if(status){const obs=new MutationObserver(()=>{if(status.textContent&&!status.textContent.includes("• ENGINE"))status.textContent+=" • ENGINE READY";});obs.observe(status,{childList:true});}
    const toolLabels={select:"👆 Select",pass:"➜ Pass",run:"↗ Run",ball:"⚽ Ball",opp:"🔴 Opp",smart:"⚡ Smart Play"};
    document.querySelectorAll("[data-tool]").forEach(b=>{if(toolLabels[b.dataset.tool])b.textContent=toolLabels[b.dataset.tool];});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();