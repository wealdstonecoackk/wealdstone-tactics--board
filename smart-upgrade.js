/* Wealdstone Smart Tactical Upgrade — adaptive decision refinement */
(function(){
  "use strict";
  function boot(){
    const pitch=document.getElementById("pitch");
    if(!pitch) return;
    const originalScan=window.WealdstoneAIDecision&&window.WealdstoneAIDecision.scan;
    if(typeof originalScan!=="function" || window.__wealdstoneSmartUpgrade) return;
    window.__wealdstoneSmartUpgrade=true;

    const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
    const centre=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
    const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

    function refine(){
      originalScan();
      const own=[...pitch.querySelectorAll(".player:not(.opp)")].map((el,i=>{const p=centre(el);return{...p,i,el}}));
      const opp=[...pitch.querySelectorAll(".player.opp")].map((el,i=>{const p=centre(el);return{...p,i,el}}));
      const ballEl=document.getElementById("ball");
      if(!own.length||!ballEl)return;
      const ball=centre(ballEl), receiver=own.map(p=>({...p,d:distance(p,ball)})).sort((a,b)=>a.d-b.d)[0];
      if(!receiver)return;

      const nearestOpp=p=>opp.length?Math.min(...opp.map(o=>distance(o,p))):999;
      const pressure=nearestOpp(receiver);
      const pitchRect=pitch.getBoundingClientRect();
      const W=pitchRect.width||400,H=pitchRect.height||700;
      const pressurePct=opp.length?clamp(Math.round(100-(pressure/(W*.48))*100),0,100):0;

      const candidates=own.filter(p=>p.i!==receiver.i).map(p=>{
        const d=distance(p,receiver);
        const space=nearestOpp(p);
        const forward=receiver.y-p.y;
        const lateral=Math.abs(p.x-receiver.x);
        const forwardLane=forward>H*.045;
        const central=Math.abs(p.x-(pitchRect.left+W/2))<W*.28;
        const supportAngle=(forwardLane?18:0)+(lateral>W*.12?8:0)+(central?5:0);
        return{...p,d,space,forward,lateral,forwardLane,score:space*.72-forward*.18+supportAngle-d*.08};
      });
      const forward=candidates.filter(p=>p.forwardLane).sort((a,b)=>{
        const sa=b.space+b.forward*0.22-Math.abs(b.lateral-W*.18)*.08;
        const sb=a.space+a.forward*0.22-Math.abs(a.lateral-W*.18)*.08;
        return sa-sb;
      })[0]||null;
      const support=candidates.slice().sort((a,b)=>b.score-a.score)[0]||null;
      const free=candidates.slice().sort((a,b)=>b.space-a.space)[0]||null;
      const far=free?Math.abs(free.x-receiver.x)>W*.20:false;
      const forwardSpace=forward?forward.space:0;
      const secureSupport=support&&support.space>W*.16;
      const clearThrough=forward&&forwardSpace>W*.18&&Math.abs(forward.x-receiver.x)<W*.38;

      let action="THROUGH", choice="PLAY THROUGH", reason="The live picture shows time to play forward.";
      let mover=support?support.i:null, runner=forward?forward.i:null, confidence=76;
      if(!opp.length){
        action=clearThrough?"THROUGH":"SWITCH";
        choice=action==="THROUGH"?"PLAY THROUGH":"SWITCH → FREE PLAYER";
        reason="No opposition press is loaded, so the engine selects the cleanest forward or far-side progression.";
        confidence=78;
      }else if(pressurePct>=72){
        if(clearThrough&&secureSupport){
          action="BOUNCE";choice="BOUNCE → THIRD MAN";
          reason="The receiver is under immediate pressure but a protected forward lane is available: set, spin, release.";
          runner=forward.i;mover=support.i;confidence=94;
        }else{
          action="BOUNCE";choice="BOUNCE → SUPPORT";
          reason="Pressure is arriving early, so the safest intelligent response is a short set into the strongest support angle.";
          runner=support?support.i:null;mover=free?free.i:null;confidence=91;
        }
      }else if(pressurePct>=42){
        if(far&&free.space>W*.24){
          action="SWITCH";choice="SWITCH → FREE PLAYER";
          reason="The live press is ball-side and the far-side outlet has enough separation to receive cleanly.";
          mover=free.i;runner=support?support.i:null;confidence=92;
        }else if(clearThrough){
          action="THIRD";choice="THIRD-MAN";
          reason="The first presser can be fixed before a third player attacks the next line.";
          runner=forward.i;mover=support?support.i:null;confidence=90;
        }else{
          action="BOUNCE";choice="BOUNCE → SUPPORT";
          reason="The forward lane is crowded, so recycle through the best support angle and move the block.";
          runner=support?support.i:null;mover=free?free.i:null;confidence=87;
        }
      }else if(clearThrough){
        action="THROUGH";choice="PLAY THROUGH";
        reason="Low pressure plus a separated forward option creates the cleanest progressive action.";
        runner=forward.i;confidence=88;
      }else if(far&&free.space>W*.28){
        action="SWITCH";choice="SWITCH → FREE PLAYER";
        reason="The ball-side pressure is light and the far-side player has the best receiving space.";
        mover=free.i;runner=support?support.i:null;confidence=89;
      }else{
        action="BOUNCE";choice="BOUNCE → SUPPORT";
        reason="The next action is not open yet, so secure possession and shift the opposition before progressing.";
        mover=support?support.i:(free?free.i:null);runner=forward?forward.i:null;confidence=82;
      }

      const plan={action,mover,runner,receiver:receiver.i,trapSide:(receiver.x-pitchRect.left)<W*.5?"RIGHT":"LEFT"};
      window.__wealdstoneAIDecision={
        ...(window.__wealdstoneAIDecision||{}),choice,confidence,pressurePct,
        receiver:receiver.i,support:support?support.i:null,free:free?free.i:null,plan
      };
      const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
      set("aiChoice",choice);set("aiReason",reason);set("aiConfidence",confidence+"% CONFIDENCE");
      set("aiPressure",opp.length?pressurePct+"%":"OPEN");
      set("aiSupport",support?"#"+(support.i+1):"—");
      set("aiFree",free&&(!opp.length||free.space>W*.2)?"#"+(free.i+1):"—");
    }

    // Preserve the existing AI API. Smart Upgrade owns only the scan decision.
    const api=window.WealdstoneAIDecision;
    api.scan=refine;
    refine();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
