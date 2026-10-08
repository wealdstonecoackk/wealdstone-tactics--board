/* Wealdstone Coach Hub — professional UI upgrade layer
   Loaded by GitHub Pages at deploy time so the proven board engine stays intact. */
(function(){
  "use strict";
  function boot(){
    if(!document.body || !document.getElementById("pitch")) return;
    if(document.getElementById("proUpgrade")) return;

    const style=document.createElement("style");
    style.id="proUpgrade";
    style.textContent=`
      .pro-shell{margin:8px 0 10px;padding:10px;border:1px solid #303943;border-radius:14px;background:linear-gradient(180deg,#171d25,#11161c);box-shadow:0 8px 24px #0004}
      .pro-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      .pro-title strong{font-size:13px;letter-spacing:.4px}.pro-title span{font-size:9px;color:#9da7b3}
      .pro-nav{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      .pro-nav button{min-height:48px;background:#202730;border-color:#394452;font-size:10px}
      .pro-nav button:nth-child(1){border-color:#5d8fe8}.pro-nav button:nth-child(2){border-color:#4aa3ff}.pro-nav button:nth-child(3){border-color:#69d391}
      .pro-sub{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:6px}
      .pro-sub button{min-height:42px;font-size:10px}
      .pro-progress{display:flex;gap:5px;margin-top:7px;overflow:auto}
      .pro-progress span{flex:1;min-width:72px;padding:6px 7px;border-radius:8px;background:#151a20;border:1px solid #2c333c;text-align:center;font-size:9px;font-weight:800;color:#c8d0d9}
      .pro-progress span.on{border-color:#69d391;color:#fff}
      .pro-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;background:#1c2630;border:1px solid #34414d;font-size:9px;font-weight:800}
      .pro-ai{margin-top:7px;padding:9px;border-radius:10px;background:#0e141a;border:1px solid #33404c}
      .pro-ai-head{display:flex;justify-content:space-between;gap:8px;font-size:10px;margin-bottom:6px}
      .pro-ai-head span{font-size:9px;color:#69d391}
      .pro-ai-note{padding:7px 8px;margin-top:5px;border-radius:8px;background:#171f27;font-size:10px;line-height:1.35}
      .pro-ai-note b{color:#fff}
      @media(max-width:600px){.pro-nav{grid-template-columns:repeat(2,1fr)}.pro-progress span{min-width:66px}}
    `;
    document.head.appendChild(style);

    const wrap=document.querySelector("main.wrap");
    const anchor=document.querySelector(".menu-label");
    if(!wrap || !anchor) return;

    const shell=document.createElement("section");
    shell.className="pro-shell";
    shell.innerHTML=`
      <div class="pro-title"><strong>🧠 COACH HUB</strong><span>WEALDSTONE • PROFESSIONAL WORKFLOW</span></div>
      <div class="pro-nav">
        <button data-pro="hub">🏠 Home</button>
        <button data-pro="library">📚 Play Library</button>
        <button data-pro="training">🏋️ Training</button>
        <button data-pro="tactics">⚽ Tactics</button>
        <button data-pro="press">🔴 Opposition</button>
        <button data-pro="session">🎬 Session</button>
      </div>
      <div class="pro-sub">
        <button data-pro="new">🆕 New Session</button>
        <button data-pro="save">💾 Save Play</button>
        <button data-pro="ai">🧠 AI Coach</button>
        <button data-pro="share">📲 Share Plan</button>
      </div>
      <div class="pro-ai" id="proAiPanel" hidden>
        <div class="pro-ai-head"><strong>🧠 COACH INTELLIGENCE</strong><span id="proAiScore">SCAN</span></div>
        <div id="proAiAdvice"></div>
      </div>
      <div class="pro-progress">
        <span class="on">✓ Setup</span><span class="on">✓ Movement</span><span>● Rehearse</span><span>● Save</span><span>● Share</span>
      </div>`;
    wrap.insertBefore(shell,anchor);

    const click=(id)=>{
      const el=document.getElementById(id);
      if(el) el.click();
    };
    shell.querySelectorAll("[data-pro]").forEach(b=>b.addEventListener("click",()=>{
      const a=b.dataset.pro;
      if(a==="hub") click("more");
      if(a==="library") click("library");
      if(a==="training") click("training");
      if(a==="press") click("pressMenu");
      if(a==="new") click("newSession");
      if(a==="save") click("save");
      if(a==="session") click("play");
      if(a==="tactics") document.getElementById("pitch")?.scrollIntoView({behavior:"smooth",block:"center"});
      if(a==="ai") runCoachIntelligence();
      if(a==="share") {
        if(navigator.share) navigator.share({title:"Wealdstone Coach Plan",text:"Wealdstone coaching plan"}).catch(()=>{});
        else if(navigator.clipboard) navigator.clipboard.writeText("Wealdstone coaching plan").then(()=>alert("Plan link/text ready to share"));
      }
    }));

    function runCoachIntelligence(){
      const pitch=document.getElementById("pitch"), panel=document.getElementById("proAiPanel"), advice=document.getElementById("proAiAdvice"), score=document.getElementById("proAiScore");
      if(!pitch||!panel||!advice)return;
      const pr=pitch.getBoundingClientRect();
      const own=[...pitch.querySelectorAll(".player:not(.opp)")].map(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
      const opp=[...pitch.querySelectorAll(".player.opp")].map(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
      const avg=(a)=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
      const width=pr.width||1,height=pr.height||1;
      const spread=own.length>1?Math.sqrt(avg(own.map(p=>(p.x-avg(own.map(q=>q.x)))**2+(p.y-avg(own.map(q=>q.y)))**2))):0;
      const nearest=own.length&&opp.length?Math.min(...own.map(p=>Math.min(...opp.map(o=>Math.hypot(p.x-o.x,p.y-o.y))))):99;
      const central=own.filter(p=>Math.abs((p.x-pr.left)/width-.5)<.18).length;
      const adviceList=[];
      if(!opp.length) adviceList.push("<b>Opposition:</b> Add the press shape first — the engine can then coach the correct press, cover and escape route.");
      else if(nearest<width*.12) adviceList.push("<b>Pressure:</b> Tight press detected. Coach the receiver to scan early, open the body and use the safe-side outlet.");
      else if(nearest<width*.22) adviceList.push("<b>Pressure:</b> Medium pressure. Create a support angle and third-man option before forcing the forward pass.");
      else adviceList.push("<b>Space:</b> Low immediate pressure. Encourage the first receiver to turn or carry before releasing the next pass.");
      if(spread<height*.18) adviceList.push("<b>Structure:</b> Shape is compact. Add width or a depth option so the opposition cannot defend one channel.");
      else if(spread>height*.34) adviceList.push("<b>Structure:</b> Shape is stretched. Add a nearer support player to keep combinations connected.");
      else adviceList.push("<b>Structure:</b> Good spacing. Look for a third-man run or opposite-side rotation to move the block.");
      if(central<2) adviceList.push("<b>Progression:</b> Central support is light. Consider a pivot/10 underneath the ball for a bounce pass.");
      else adviceList.push("<b>Progression:</b> Central support available. Look for bounce → third-man → forward action.");
      const raw=Math.max(0,Math.min(100,Math.round(100-(nearest<width*.12?28:nearest<width*.22?12:0)-(spread<height*.18?15:0))));
      score.textContent=raw+"% READINESS";
      advice.innerHTML=adviceList.map(x=>'<div class="pro-ai-note">'+x+'</div>').join("");
      panel.hidden=false;
    }

    // Retitle the existing sections without deleting proven controls.
    document.querySelectorAll(".menu-label").forEach((x,i)=>{
      const labels=["1 • PLAN & ORGANISE","2 • CREATE & REHEARSE","3 • EDIT & SAVE"];
      if(labels[i]) x.textContent=labels[i];
    });

    // Add a compact play-engine status indicator beside the existing status.
    const status=document.getElementById("status");
    if(status){
      status.dataset.base=status.textContent;
      const obs=new MutationObserver(()=>{
        if(status.textContent && !status.textContent.includes("• ENGINE")) status.textContent += " • ENGINE READY";
      });
      obs.observe(status,{childList:true});
      setTimeout(()=>{ if(status.textContent && !status.textContent.includes("• ENGINE")) status.textContent += " • ENGINE READY"; },50);
    }

    // Make the existing board tools read like a professional coaching workflow.
    const toolLabels={
      select:"👆 Select",
      pass:"➜ Pass",
      run:"↗ Run",
      ball:"⚽ Ball",
      opp:"🔴 Opp",
      smart:"⚡ Smart Play"
    };
    document.querySelectorAll("[data-tool]").forEach(b=>{
      const k=b.dataset.tool;
      if(toolLabels[k]) b.textContent=toolLabels[k];
    });

    // Keep the Coach Hub shell compact when the keyboard/browser viewport changes.
    window.addEventListener("resize",()=>document.body.classList.toggle("compact-pro",window.innerWidth<380),{passive:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();