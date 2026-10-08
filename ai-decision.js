/* Wealdstone AI Decision Engine — non-destructive tactical intelligence layer */
(function(){
  "use strict";
  function boot(){
    const pitch=document.getElementById("pitch");
    const shell=document.querySelector(".pro-shell");
    if(!pitch||!shell||document.getElementById("aiDecisionCard")) return;

    const style=document.createElement("style");
    style.id="aiDecisionStyle";
    style.textContent=`
      .ai-decision{margin-top:7px;padding:9px;border:1px solid #3b4652;border-radius:10px;background:linear-gradient(135deg,#111922,#0d1319)}
      .ai-decision-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;font-weight:900;letter-spacing:.5px}
      .ai-decision-head span{font-size:9px;color:#69d391}
      .ai-choice{font-size:18px;font-weight:950;margin:5px 0 2px}
      .ai-reason{font-size:10px;line-height:1.4;color:#cbd3dc}
      .ai-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:7px}
      .ai-fact{padding:6px;border-radius:7px;background:#171f27;text-align:center;font-size:8px;color:#aeb8c4}
      .ai-fact b{display:block;color:#fff;font-size:10px;margin-bottom:2px}
      .ai-decision button{width:100%;margin-top:7px;min-height:34px;font-size:9px}
    `;
    document.head.appendChild(style);

    const panel=document.getElementById("proAiPanel");
    if(!panel) return;
    const card=document.createElement("div");
    card.id="aiDecisionCard";
    card.className="ai-decision";
    card.innerHTML='<div class="ai-decision-head"><strong>⚡ NEXT-ACTION INTELLIGENCE</strong><span id="aiConfidence">SCANNING</span></div><div id="aiChoice" class="ai-choice">READING THE PICTURE…</div><div id="aiReason" class="ai-reason">Position the ball and opposition to let the engine identify the best next action.</div><div class="ai-facts"><div class="ai-fact"><b id="aiPressure">—</b>PRESSURE</div><div class="ai-fact"><b id="aiSupport">—</b>SUPPORT</div><div class="ai-fact"><b id="aiFree">—</b>FREE PLAYER</div></div><button id="aiScan">🔄 Scan Tactics</button>';
    panel.appendChild(card);

    const centre=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    function scan(){
      const own=[...pitch.querySelectorAll(".player:not(.opp)")].map((el,i)=>({...centre(el),i,el}));
      const opp=[...pitch.querySelectorAll(".player.opp")].map((el,i)=>({...centre(el),i,el}));
      const ballEl=document.getElementById("ball");
      if(!own.length||!ballEl)return;
      const ball=centre(ballEl);
      const nearestOwn=own.map(p=>({...p,d:Math.hypot(p.x-ball.x,p.y-ball.y)})).sort((a,b)=>a.d-b.d)[0];
      const receiver=nearestOwn;
      const nearestOpp=opp.length?opp.map(o=>({...o,d:Math.hypot(o.x-receiver.x,o.y-receiver.y)})).sort((a,b)=>a.d-b.d)[0]:null;
      const pressure=nearestOpp?nearestOpp.d:999;
      const pitchW=pitch.getBoundingClientRect().width||400;
      const pressurePct=nearestOpp?clamp(Math.round(100-(pressure/(pitchW*.5))*100),0,100):0;

      const support=own.filter(p=>p.i!==receiver.i).map(p=>{
        const d=Math.hypot(p.x-receiver.x,p.y-receiver.y);
        const forward=receiver.y-p.y;
        const width=Math.abs(p.x-receiver.x);
        const nearest=opp.length?Math.min(...opp.map(o=>Math.hypot(p.x-o.x,p.y-o.y))):999;
        const score=(nearest*.55)+(forward>0?18:0)+(width>30?10:0)-d*.35;
        return {...p,d,score,free:nearest};
      }).sort((a,b)=>b.score-a.score)[0];

      const free=own.filter(p=>p.i!==receiver.i).map(p=>{
        const d=opp.length?Math.min(...opp.map(o=>Math.hypot(p.x-o.x,p.y-o.y))):999;
        return {...p,space:d};
      }).sort((a,b)=>b.space-a.space)[0];

      let choice="PLAY THROUGH";
      let reason="The receiver has time and the next forward action remains available.";
      let confidence=70;
      if(!opp.length){
        choice="PLAY THROUGH";
        reason="No opposition shape is loaded. The engine is preserving the attacking picture without inventing pressure.";
        confidence=64;
      }else if(pressurePct>=72){
        if(support&&support.free>pitchW*.16){
          choice="BOUNCE → THIRD MAN";
          reason="Pressure is tight, so the safest progression is a bounce pass that releases the third player beyond the first press.";
          confidence=88;
        }else{
          choice="BOUNCE → SUPPORT";
          reason="The first presser is tight and the cleanest response is to secure the ball with the nearest safe support.";
          confidence=84;
        }
      }else if(pressurePct>=42){
        if(free&&free.space>pitchW*.24){
          choice="SWITCH → FREE PLAYER";
          reason="Medium pressure has opened space away from the ball; move the block before attacking the next line.";
          confidence=82;
        }else{
          choice="THIRD-MAN";
          reason="Pressure is developing but central support is available, so a timed third-man run offers the best progression.";
          confidence=79;
        }
      }else if(free&&free.space>pitchW*.28){
        choice="SWITCH → FREE PLAYER";
        reason="Immediate pressure is low and a clear free player is available on the far side.";
        confidence=86;
      }

      document.getElementById("aiChoice").textContent=choice;
      document.getElementById("aiReason").textContent=reason;
      document.getElementById("aiConfidence").textContent=confidence+"% CONFIDENCE";
      document.getElementById("aiPressure").textContent=opp.length?pressurePct+"%":"OPEN";
      document.getElementById("aiSupport").textContent=support?"#"+(support.i+1):"—";
      document.getElementById("aiFree").textContent=free&&(!opp.length||free.space>pitchW*.2)?"#"+(free.i+1):"—";
      window.__wealdstoneAIDecision={choice,confidence,pressurePct,receiver:receiver.i,support:support?.i??null,free:free?.i??null};
    }

    document.getElementById("aiScan").onclick=scan;
    shell.addEventListener("click",e=>{
      const b=e.target.closest("[data-pro='ai']");
      if(b)setTimeout(scan,30);
    });
    setInterval(scan,900);
    setTimeout(scan,120);
    window.WealdstoneAIDecision={scan};
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();