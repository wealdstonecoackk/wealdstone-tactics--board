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
      .ai-decision button{width:100%;margin-top:7px;min-height:36px;font-size:9px;font-weight:900}.ai-decision button+button{margin-top:5px;border-color:#69d391;background:#18271f}
    `;
    document.head.appendChild(style);

    const panel=document.getElementById("proAiPanel");
    if(!panel) return;
    const card=document.createElement("div");
    card.id="aiDecisionCard";
    card.className="ai-decision";
    card.innerHTML='<div class="ai-decision-head"><strong>⚡ AI COACH • NEXT ACTION</strong><span id="aiConfidence">SCANNING</span></div><div id="aiChoice" class="ai-choice">READING THE PICTURE…</div><div id="aiReason" class="ai-reason">Position the ball and opposition to let the engine identify the best next action.</div><div class="ai-facts"><div class="ai-fact"><b id="aiPressure">—</b>PRESSURE</div><div class="ai-fact"><b id="aiSupport">—</b>SUPPORT</div><div class="ai-fact"><b id="aiFree">—</b>FREE PLAYER</div></div><button id="aiScan">🔄 SCAN</button><button id="aiPlay">▶ PLAY AI PLAN</button>';
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
      const forward=own.filter(p=>p.i!==receiver.i&&p.y<receiver.y-18).sort((a,b)=>Math.hypot(a.x-receiver.x,a.y-receiver.y)-Math.hypot(b.x-receiver.x,b.y-receiver.y))[0];
      const far=free&&Math.abs(free.x-receiver.x)>pitchW*.18;
      const insideLane=opp.length&&forward?Math.min(...opp.map(o=>Math.abs(o.x-forward.x)+Math.abs(o.y-forward.y))):999;
      const trapSide=receiver.x<pitchW*.5?"RIGHT":"LEFT";
      let action="PLAY THROUGH",mover=support?.i??null,runner=forward?.i??null;
      if(!opp.length){
        choice="PLAY THROUGH";
        reason="No opposition shape is loaded. The engine is preserving the attacking picture without inventing pressure.";
        confidence=64;
      }else if(pressurePct>=72){
        if(support&&support.free>pitchW*.16&&forward&&insideLane>pitchW*.18){
          choice="BOUNCE → THIRD MAN";
          action="BOUNCE";
          reason="Tight pressure plus a protected forward lane favours a bounce pass followed by a timed third-man run.";
          confidence=92;
          runner=forward.i;
        }else{
          choice="BOUNCE → SUPPORT";
          action="BOUNCE";
          reason="The press is closing quickly, so secure the ball first and use the safest support angle before progressing.";
          confidence=88;
          runner=support?.i??runner;
        }
      }else if(pressurePct>=42){
        if(far&&free.space>pitchW*.24){
          choice="SWITCH → FREE PLAYER";
          action="SWITCH";
          reason="The block is engaged on the ball side and a genuine far-side outlet is available.";
          confidence=89;
          mover=free.i;
          runner=support?.i??runner;
        }else if(forward&&insideLane>pitchW*.16){
          choice="THIRD-MAN";
          action="THIRD";
          reason="Medium pressure leaves a forward lane: fix the presser, set the ball and release the third player on the blind side.";
          confidence=86;
          runner=forward.i;
        }else{
          choice="BOUNCE → SUPPORT";
          action="BOUNCE";
          reason="No clean forward lane is available yet, so the intelligent choice is to recycle and move the press.";
          confidence=83;
        }
      }else if(far&&free.space>pitchW*.28){
        choice="SWITCH → FREE PLAYER";
        action="SWITCH";
        reason="Pressure is low and the far-side player has clear space to receive facing forward.";
        confidence=88;
        mover=free.i;
      }else if(forward){
        choice="PLAY THROUGH";
        action="THROUGH";
        reason="The receiver has time and a forward player can receive beyond the first line.";
        confidence=82;
        runner=forward.i;
      }
      const plan={action,mover,runner,receiver:receiver.i,trapSide};

      document.getElementById("aiChoice").textContent=choice;
      document.getElementById("aiReason").textContent=reason;
      document.getElementById("aiConfidence").textContent=confidence+"% CONFIDENCE";
      document.getElementById("aiPressure").textContent=opp.length?pressurePct+"%":"OPEN";
      document.getElementById("aiSupport").textContent=support?"#"+(support.i+1):"—";
      document.getElementById("aiFree").textContent=free&&(!opp.length||free.space>pitchW*.2)?"#"+(free.i+1):"—";
      window.__wealdstoneAIDecision={choice,confidence,pressurePct,receiver:receiver.i,support:support?.i??null,free:free?.i??null,plan};
    }

    document.getElementById("aiScan").onclick=scan;
    document.getElementById("aiPlay").onclick=()=>{ scan(); const p=window.__wealdstoneAIDecision?.receiver!=null?players[window.__wealdstoneAIDecision.receiver]:null; if(!p){return} stopPlayback(); sequence=[]; arrows=[]; createSmartPattern(p); msg("AI PLAN READY • PRESS PLAY"); setTimeout(()=>play(),60); };
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