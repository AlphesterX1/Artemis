import React, { useEffect, useRef } from "react";

/*
 * ============================================================
 * ARTEMIS OS
 * Single-file React implementation
 * ============================================================
 *
 * The original Artemis OS markup, styling, and application logic
 * are kept together in this one JSX file so the existing behavior
 * and visual design are preserved.
 */

// ============================================================
// Original Artemis CSS
// ============================================================

const ARTEMIS_CSS = String.raw`:root{
  --hand:'Patrick Hand','Segoe Print',sans-serif;
  --scrawl:'Patrick Hand','Segoe Print',sans-serif;
  --flourish:'Caveat','Patrick Hand',cursive;

  --rw: 15px 20px 16px 21px;
  --rwm: 10px 13px 11px 14px;
  --rc: 9px 15px 10px 16px;
  --rn: 3px 12px 4px 11px;
  --rb: 8px 12px 9px 13px;
  --rd: 10px 14px 11px 15px;
  --rm: 10px 14px 11px 15px;
  --rmo: 15px 19px 16px 20px;
  --rt: 7px 10px 7px 10px;

  --paper:#f6efdc; --paper2:#ecdfc0; --panel:#fffcf3;
  --ink:#33281a; --soft:#7c6b4f; --line:#cbb98f;
  --accent:#4a5fd9; --accent2:#4f8f5b; --danger:#c1483d;
  --shadow:rgba(42,32,19,.24); --edge:#2a2013;
  --grain:.05; --sel:rgba(74,95,217,.14);
}
:root[data-theme="kraft"]{
  --edge:#251707; --paper:#cda874; --paper2:#b8905a; --panel:#e9d09f;
  --ink:#32210f; --soft:#6d4f2b; --line:#9a7a4d;
  --accent:#2f6690; --accent2:#4c7a45; --danger:#a8402f;
  --shadow:rgba(37,23,7,.32); --sel:rgba(47,102,144,.18);
}
:root[data-theme="cotton"]{
  --edge:#262319; --paper:#f8f5ed; --paper2:#eae4d3; --panel:#fffdf8;
  --ink:#2c2a23; --soft:#7a7666; --line:#cdc6b2;
  --accent:#c8434a; --accent2:#2f8f63; --danger:#c8434a;
  --shadow:rgba(38,35,25,.18); --grain:.035; --sel:rgba(200,67,74,.13);
}
:root[data-theme="sage"]{
  --edge:#1d2818; --paper:#e5eddb; --paper2:#cfe0c3; --panel:#f6faf0;
  --ink:#263323; --soft:#5e6c54; --line:#a1b791;
  --accent:#cc7248; --accent2:#457a4c; --danger:#b1483c;
  --shadow:rgba(29,40,24,.24); --sel:rgba(204,114,72,.16);
}
:root[data-theme="chalkboard"]{
  --edge:#0a0f0b; --paper:#233227; --paper2:#19241a; --panel:#2d3e32;
  --ink:#eef1e6; --soft:#a6b5a0; --line:#4c5e4e;
  --accent:#e8c860; --accent2:#7fbf8c; --danger:#ff8f7f;
  --shadow:rgba(0,0,0,.46); --grain:.065; --sel:rgba(232,200,96,.16);
}
:root[data-theme="blueprint"]{
  --edge:#050c15; --paper:#112544; --paper2:#0b1a2e; --panel:#183255;
  --ink:#e3edfb; --soft:#8fa9c9; --line:#35577f;
  --accent:#74cdfa; --accent2:#f2c17f; --danger:#ff8a8a;
  --shadow:rgba(0,0,0,.5); --sel:rgba(116,205,250,.16);
}
:root[data-theme="charcoal"]{
  --edge:#0e0c0d; --paper:#282528; --paper2:#1c1a1c; --panel:#332e31;
  --ink:#eee8de; --soft:#a89f92; --line:#524a4c;
  --accent:#ff9a5c; --accent2:#7bb0d6; --danger:#ff7a68;
  --shadow:rgba(0,0,0,.5); --sel:rgba(255,154,92,.16);
}
:root[data-theme="inkwell"]{
  --edge:#0a0916; --paper:#1c1932; --paper2:#131226; --panel:#242038;
  --ink:#ece8fb; --soft:#9d97bf; --line:#46426b;
  --accent:#ff86d0; --accent2:#78d3b6; --danger:#ff8a8a;
  --shadow:rgba(0,0,0,.5); --sel:rgba(255,134,208,.18);
}

*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden}
body{
  font-family:var(--hand);font-size:16.5px;color:var(--ink);letter-spacing:.1px;
  background:var(--paper);cursor:none;-webkit-font-smoothing:antialiased;
}
#grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:var(--grain);
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>");
  mix-blend-mode:multiply}
:root[data-theme^="c"] #grain,:root[data-theme="blueprint"] #grain,:root[data-theme="inkwell"] #grain{mix-blend-mode:overlay}
button,input,textarea,select{font-family:inherit;font-size:inherit;color:inherit;cursor:none}
button{background:none;border:none;padding:0}
::-webkit-scrollbar{width:9px;height:9px}
::-webkit-scrollbar-thumb{background:var(--line);border-radius:5px}
::-webkit-scrollbar-track{background:transparent}
::selection{background:var(--sel)}

/* ---------- cursor ---------- */
#cur{position:fixed;z-index:10000;pointer-events:none;left:0;top:0;width:15px;height:18px;transform:translate(-1px,-1px);
  filter:drop-shadow(1px 1.5px 0 rgba(0,0,0,.18));transition:width .12s,height .12s}
#ring{position:fixed;z-index:9999;pointer-events:none;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;
  border:2px dashed var(--accent);border-radius:50%;background:transparent;opacity:.5;
  transition:width .16s,height .16s,margin .16s,border-radius .16s,opacity .2s,background .16s}
body.c-click #ring{width:34px;height:34px;margin:-17px 0 0 -17px;opacity:.9;background:var(--sel)}
body.c-drag #ring{border-radius:var(--rc);width:30px;height:30px;margin:-15px 0 0 -15px}
body.c-text #ring{width:2px;height:18px;margin:-9px 0 0 -1px;border-radius:2px;border:none;background:var(--accent);opacity:.8}

/* ---------- desktop ---------- */
#desk{position:fixed;inset:0 0 84px 0;overflow:hidden}
#icons{position:absolute;inset:18px auto auto 18px;display:flex;flex-direction:column;flex-wrap:wrap;gap:3px;max-height:calc(100vh - 150px)}
.dicon{width:90px;padding:9px 6px;text-align:center;border-radius:var(--rc);border:1.5px solid transparent;opacity:.85;transition:opacity .12s,background .12s,transform .12s}
.dicon:hover{background:var(--panel);border-color:var(--line);opacity:1;box-shadow:2px 3px 0 var(--shadow);transform:translateY(-2px) rotate(-2deg)}
.dicon .gl{font-size:25px;line-height:1.1;display:flex;justify-content:center}
.dicon .gl svg,.tile .gl svg{display:block}
.dicon .lb{font-size:14.5px;margin-top:3px;line-height:1.15;color:var(--ink)}

/* ---------- windows ---------- */
.win{position:absolute;display:flex;flex-direction:column;min-width:280px;min-height:180px;
  background:var(--panel);border:2px solid var(--edge);border-radius:var(--rw);
  box-shadow:3px 5px 0 var(--shadow),0 14px 30px -10px rgba(0,0,0,.18);
  overflow:hidden;opacity:.96;transition:opacity .15s,box-shadow .15s,border-radius .15s;
  animation:winOpen .26s cubic-bezier(.22,1.4,.5,1) both}
.win.on{opacity:1;box-shadow:5px 8px 0 var(--shadow),0 20px 40px -8px rgba(0,0,0,.22)}
.win.max{border-radius:var(--rwm)}
.wbar{display:flex;align-items:center;gap:9px;padding:7px 11px;background:var(--paper2);
  border-bottom:2px dashed var(--line);flex:0 0 auto}
.wtitle{font-family:var(--flourish);font-weight:600;font-size:23px;flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--ink)}
.wbtn{width:18px;height:18px;border:1.6px solid var(--edge);border-radius:6px 9px 6px 9px;background:var(--panel);
  font-size:11px;line-height:0;display:grid;place-items:center;transition:transform .1s,background .1s,color .1s}
.wbtn:hover{background:var(--accent);border-color:var(--accent);color:var(--panel);transform:scale(1.08)}
.wbody{flex:1;overflow:auto;position:relative}
.wgrip{position:absolute;right:2px;bottom:2px;width:16px;height:16px;opacity:.6;background:
  linear-gradient(135deg,transparent 45%,var(--line) 45%,var(--line) 55%,transparent 55%,transparent 70%,var(--line) 70%,var(--line) 80%,transparent 80%)}

/* ---------- dock ---------- */
#dock{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:900;display:flex;align-items:center;gap:5px;
  max-width:calc(100vw - 24px);padding:7px 12px;background:var(--panel);border:2px solid var(--edge);
  border-radius:var(--rw);box-shadow:3px 5px 0 var(--shadow),0 12px 26px -8px rgba(0,0,0,.2);
  animation:dockIn .32s cubic-bezier(.22,1.4,.5,1) both}
#dock .sep{width:2px;align-self:stretch;margin:3px 1px;background:var(--line);opacity:.45;border-radius:2px}
.dk{font-size:20px;padding:6px 8px;border-radius:var(--rd);line-height:1;display:flex;align-items:center;
  transition:background .12s,transform .12s;position:relative}
.dk:hover{background:var(--paper2);transform:translateY(-2px) rotate(-3deg)}
.dk .lb{font-size:9.5px;position:absolute;bottom:-13px;left:50%;transform:translateX(-50%);white-space:nowrap;
  color:var(--soft);opacity:0;transition:opacity .12s;pointer-events:none}
.dk:hover .lb{opacity:1}
#startb{background:var(--accent);border-radius:var(--rd);padding:7px 10px}
#startb:hover{filter:brightness(1.08);background:var(--accent);transform:translateY(-2px) rotate(-4deg)}
#startb svg path,#startb svg line{stroke:var(--panel)}
#chips{display:flex;gap:6px;overflow-x:auto;max-width:42vw;scrollbar-width:none;padding:2px 1px}
#chips::-webkit-scrollbar{display:none}
.chip{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;flex:0 0 auto;padding:4px 12px;border:1.6px solid var(--line);border-radius:var(--rt);font-size:14px;
  transition:background .12s,border-color .12s,transform .12s;animation:chipIn .18s ease-out both}
.chip:hover{transform:translateY(-1px)}
.chip.on{border-color:var(--accent);background:var(--sel);color:var(--ink)}
#clock{font-family:var(--flourish);font-weight:600;font-size:19px;min-width:66px;text-align:right;color:var(--ink)}

/* ---------- menus / modals ---------- */
.menu{position:fixed;z-index:9500;min-width:194px;padding:6px;background:var(--panel);
  border:2px solid var(--edge);border-radius:var(--rm);box-shadow:3px 5px 0 var(--shadow),0 14px 26px -8px rgba(0,0,0,.22);
  animation:menuIn .15s cubic-bezier(.22,1.4,.5,1) both}
.menu .mi{display:block;width:100%;text-align:left;padding:6px 10px;border-radius:7px;white-space:nowrap;transition:background .1s}
.menu .mi:hover{background:var(--sel)}
.menu .mh{padding:4px 10px;font-family:var(--flourish);font-weight:600;font-size:19px;color:var(--soft);border-bottom:2px dashed var(--line);margin-bottom:4px}
.menu hr{border:none;border-top:2px dashed var(--line);margin:5px 2px}
#scrim{position:fixed;inset:0;z-index:9600;background:rgba(20,15,8,.32);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(1.5px)}
.modal{width:min(560px,92vw);max-height:86vh;overflow:auto;padding:20px 22px;background:var(--panel);
  border:2px solid var(--edge);border-radius:var(--rmo);box-shadow:5px 8px 0 var(--shadow),0 24px 50px -12px rgba(0,0,0,.3);
  animation:modalIn .2s cubic-bezier(.22,1.4,.5,1) both}
.modal h3{font-family:var(--flourish);font-weight:700;font-size:27px;margin:0 0 12px;color:var(--ink)}
.fld{display:block;margin:11px 0 4px;color:var(--soft);font-size:15px}
input[type=text],input[type=number],input[type=date],input[type=time],textarea,select{
  width:100%;padding:7px 10px;background:var(--paper);border:1.8px solid var(--line);border-radius:var(--rb);outline:none;transition:border-color .1s}
input:focus,textarea:focus,select:focus{border-color:var(--accent)}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{padding:5px 14px;border:1.8px solid var(--edge);border-radius:var(--rb);background:var(--paper2);
  box-shadow:2px 3px 0 var(--shadow);transition:transform .1s,background .1s,color .1s}
.btn:hover{background:var(--accent);border-color:var(--accent);color:var(--panel);transform:translateY(-1px) rotate(-.6deg)}
.btn:active{transform:scale(.95) rotate(0)}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--panel)}
.btn.sm{padding:3px 11px;font-size:14.5px;box-shadow:2px 2px 0 var(--shadow)}
.btn.on{background:var(--accent);border-color:var(--accent);color:var(--panel)}
#toasts{position:fixed;right:16px;bottom:100px;z-index:9700;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.toast{max-width:320px;padding:9px 15px;background:var(--panel);border:2px solid var(--edge);
  border-radius:var(--rc);box-shadow:3px 5px 0 var(--shadow);animation:toastIn .22s cubic-bezier(.22,1.4,.5,1) both}

/* ---------- board ---------- */
.bwrap{position:absolute;inset:0;display:flex;flex-direction:column}
.btool{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 11px;border-bottom:2px dashed var(--line);background:var(--paper2)}
.bcanvasholder{flex:1;position:relative;overflow:hidden;background:var(--paper)}
.bcanvas{position:absolute;left:0;top:0;transform-origin:0 0}
.bgrid{position:absolute;inset:0;pointer-events:none;opacity:.5}
.card{position:absolute;width:212px;padding:0 0 9px;background:var(--panel);border:2px solid var(--edge);
  border-radius:var(--rc);box-shadow:2px 4px 0 var(--shadow);overflow:hidden;animation:popIn .2s cubic-bezier(.22,1.4,.5,1) both}
.card.done{opacity:.6}
.card.hi{outline:3px dashed var(--accent);outline-offset:4px}
.card .ttl{display:flex;gap:8px;align-items:flex-start;background:var(--sel);border-bottom:2px dashed var(--line);padding:8px 11px}
.card .ttl .tx{flex:1;word-break:break-word;line-height:1.25}
.card.done .tx{text-decoration:line-through}
.card .meta,.card>.dim,.card .subs{padding-left:11px;padding-right:11px}
.card .meta{padding-top:6px}
.chk{flex:0 0 auto;width:18px;height:18px;border:2px solid var(--edge);border-radius:5px 8px 5px 8px;
  display:grid;place-items:center;font-size:13px;line-height:0;background:var(--panel);transition:background .1s}
.meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;font-size:13.5px;color:var(--soft)}
.pill{padding:0 7px;border:1.6px solid var(--line);border-radius:var(--rt)}
.pill.p-high{border-color:var(--accent);color:var(--accent)}
.pill.p-low{opacity:.7}
.pill.over{background:var(--danger);color:var(--panel);border-color:var(--danger)}
.subs{margin:6px 0 0;padding:0;list-style:none;border-top:2px dashed var(--line);padding-top:5px}
.subs li{display:flex;gap:6px;align-items:flex-start;font-size:14.5px;line-height:1.25;margin-top:3px}
.subs li.d .stx{text-decoration:line-through;opacity:.6}
.note{position:absolute;width:180px;min-height:96px;padding:9px 11px;border:1.8px solid rgba(0,0,0,.18);
  border-radius:var(--rn);box-shadow:2px 4px 0 rgba(0,0,0,.12);font-family:var(--flourish);font-weight:600;font-size:19px;line-height:1.2}
.note .nx{outline:none;min-height:60px;white-space:pre-wrap;word-break:break-word;color:#3a3320}
.fcard{position:absolute;width:150px;padding:9px;text-align:center;background:var(--panel);
  border:2px solid var(--edge);border-radius:var(--rc);box-shadow:2px 4px 0 var(--shadow);animation:popIn .2s cubic-bezier(.22,1.4,.5,1) both}
.fcard img{width:100%;height:84px;object-fit:cover;border:1.6px solid var(--line);border-radius:6px;display:block}
.fbadge{height:84px;display:grid;place-items:center;font-family:var(--flourish);font-weight:600;font-size:24px;
  border:2px dashed var(--line);border-radius:8px;color:var(--soft)}
.fname{font-size:13.5px;margin-top:6px;word-break:break-all;line-height:1.15}
.bcard{position:absolute;width:172px;padding:10px;background:var(--paper2);border:2px solid var(--edge);
  border-radius:var(--rc);box-shadow:2px 4px 0 var(--shadow);animation:popIn .2s cubic-bezier(.22,1.4,.5,1) both}
.drawlayer{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.tiltA,.tiltB,.tiltC,.tiltD{transform:none}
.note.tiltA{animation:noteInA .22s cubic-bezier(.22,1.4,.5,1) both}
.note.tiltB{animation:noteInB .22s cubic-bezier(.22,1.4,.5,1) both}
.note.tiltC{animation:noteInC .22s cubic-bezier(.22,1.4,.5,1) both}
.note.tiltD{animation:noteInD .22s cubic-bezier(.22,1.4,.5,1) both}
.bar{height:10px;border:1.8px solid var(--edge);border-radius:6px;overflow:hidden;background:var(--paper)}
.bar i{display:block;height:100%;background:var(--accent2);transition:width .4s ease}

/* ---------- generic app layout ---------- */
.pad{padding:15px 17px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(146px,1fr));gap:12px}
.tile{padding:11px;text-align:center;background:var(--panel);border:2px solid var(--edge);
  border-radius:var(--rc);box-shadow:2px 4px 0 var(--shadow);transition:transform .1s,background .1s;animation:popIn .2s cubic-bezier(.22,1.4,.5,1) both}
.tile:hover{background:var(--paper2);transform:translateY(-1px)}
.tile .gl{font-size:29px;display:flex;justify-content:center}
.tile .nm{word-break:break-word;line-height:1.2;margin:4px 0;font-weight:600}
.list{display:flex;flex-direction:column;gap:8px}
.item{display:flex;gap:9px;align-items:center;padding:9px 12px;background:var(--panel);
  border:2px solid var(--edge);border-radius:var(--rc);box-shadow:2px 4px 0 var(--shadow);animation:popIn .18s cubic-bezier(.22,1.4,.5,1) both}
.dim{color:var(--soft);font-size:14.5px}
h4.sec{font-family:var(--flourish);font-weight:700;font-size:22px;margin:17px 0 8px;border-bottom:2px dashed var(--line);padding-bottom:4px;color:var(--ink)}
h4.sec:first-child{margin-top:0}
.tag{padding:2px 10px;border:1.6px solid var(--line);border-radius:var(--rt);font-size:14.5px;transition:background .1s}
.tag.on{background:var(--accent);color:var(--panel);border-color:var(--accent)}
.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-auto-rows:minmax(64px,auto);gap:5px;min-width:0}
.cal>*{min-width:0}
.cell{min-width:0;min-height:64px;padding:4px;border:1.8px solid var(--line);border-radius:9px;background:var(--panel);transition:background .1s;overflow:hidden}
.cell.oth{opacity:.42}.cell.tod{border-color:var(--accent);border-style:dashed}
.cell.sel{background:var(--sel);border-color:var(--accent)}
.cell .dn{font-size:13.5px;color:var(--soft)}
.ev{display:block;min-width:0;max-width:100%;font-size:12.5px;line-height:1.2;margin-top:2px;padding:1px 5px;border-radius:5px;background:var(--accent2);color:var(--panel);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---------- script editor ---------- */
.sedit{position:absolute;inset:0;display:flex;flex-direction:column}
.stool{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 11px;background:var(--paper2);border-bottom:2px dashed var(--line)}
.smain{flex:1;display:flex;min-height:0}
.slib{width:188px;flex:0 0 auto;overflow:auto;padding:9px;border-right:2px dashed var(--line);background:var(--paper2)}
.slib .cat{font-family:var(--flourish);font-weight:600;font-size:18px;margin:10px 0 3px;color:var(--soft)}
.nbtn{display:block;width:100%;text-align:left;padding:4px 8px;font-size:14.5px;border:1.6px solid transparent;border-radius:7px;transition:background .1s}
.nbtn:hover{border-color:var(--line);background:var(--panel)}
.sholder{flex:1;position:relative;overflow:hidden;background:var(--paper)}
.scanvas{position:absolute;left:0;top:0;transform-origin:0 0}
.wires{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.node{position:absolute;width:196px;background:var(--panel);border:2px solid var(--edge);
  border-radius:var(--rc);box-shadow:2px 4px 0 var(--shadow);overflow:hidden;animation:popIn .18s cubic-bezier(.22,1.4,.5,1) both}
.node.sel{outline:3px dashed var(--accent);outline-offset:3px}
.node.fire{background:var(--sel)}
.node.err{border-color:var(--danger);border-style:dashed}
.node .nh{padding:5px 10px;background:var(--sel);border-bottom:2px dashed var(--line);font-family:var(--flourish);font-weight:600;font-size:18px;
  display:flex;justify-content:space-between;gap:6px;color:var(--ink)}
.node .nh-t{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.node .nh .cnt{font-family:var(--hand);font-size:12.5px;color:var(--soft);flex:0 0 auto}
.node .nb{padding:6px 9px;font-size:14.5px}
.port{display:flex;align-items:center;gap:6px;margin:3px 0;position:relative}
.port.out{justify-content:flex-end;text-align:right}
.dot{width:12px;height:12px;border:2px solid var(--edge);border-radius:50%;background:var(--panel);flex:0 0 auto;transition:background .1s}
.dot.ex{border-radius:3px;background:var(--ink)}
.dot:hover{background:var(--accent);border-color:var(--accent)}
.port .pl{color:var(--soft)}
.sside{width:216px;flex:0 0 auto;overflow:auto;padding:10px;border-left:2px dashed var(--line);background:var(--paper2)}
.slog{height:124px;overflow:auto;padding:7px 11px;border-top:2px dashed var(--line);background:var(--paper2);font-size:13.5px}
.slog div{border-bottom:1px dotted var(--line);padding:2px 0}
.slog .er{color:var(--danger)}
.graphwrap{position:relative;width:100%;height:100%;overflow:hidden}
@media (max-width:760px){
  .slib{width:132px}.sside{display:none}
  #chips{max-width:28vw}
  .dicon{width:74px}
}

/* ---------- sketchy scrapbook animations ---------- */
@keyframes popIn{0%{opacity:0;transform:scale(.86)}100%{opacity:1;transform:scale(1)}}
@keyframes noteInA{0%{opacity:0;transform:scale(.8) rotate(-9deg)}100%{opacity:1;transform:scale(1) rotate(-1.4deg)}}
@keyframes noteInB{0%{opacity:0;transform:scale(.8) rotate(8deg)}100%{opacity:1;transform:scale(1) rotate(1.2deg)}}
@keyframes noteInC{0%{opacity:0;transform:scale(.8) rotate(-7deg)}100%{opacity:1;transform:scale(1) rotate(-.6deg)}}
@keyframes noteInD{0%{opacity:0;transform:scale(.8) rotate(9deg)}100%{opacity:1;transform:scale(1) rotate(1.7deg)}}
@keyframes winOpen{0%{opacity:0;transform:scale(.92) rotate(-1.4deg)}55%{opacity:1;transform:scale(1.02) rotate(.4deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes menuIn{0%{opacity:0;transform:scale(.9) translateY(4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes modalIn{0%{opacity:0;transform:scale(.9) rotate(-1deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes toastIn{0%{opacity:0;margin-right:-26px}100%{opacity:1;margin-right:0}}
@keyframes dockIn{0%{opacity:0;transform:translate(-50%,14px) scale(.94)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes chipIn{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){
  *{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important}
}`;

// ============================================================
// Original Artemis DOM
// ============================================================

const ARTEMIS_BODY = String.raw`<div id="grain"></div>
<div id="desk"><div id="icons"></div></div>
<div id="dock"></div>
<div id="toasts"></div>
<svg id="cur" viewBox="0 0 22 26" fill="none"><path d="M3 2 L3 21 L8 16.5 L11.5 24 L14.5 22.5 L11 15.5 L18 15 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/></svg>
<div id="ring"></div>
<script>
/* ============================ core ============================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=p=>(p||'i')+Math.random().toString(36).slice(2,9);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function localISO(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return '${y}-${m}-${day}';
}
const todayISO=()=>localISO();
const TILT=['tiltA','tiltB','tiltC','tiltD'];
const tiltOf=id=>TILT[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%4];
const THEMES=[['parchment','Parchment'],['kraft','Kraft'],['cotton','Cotton'],['sage','Sage'],['chalkboard','Chalkboard'],['blueprint','Blueprint'],['charcoal','Charcoal'],['inkwell','Inkwell']];
const NOTE_COLORS=['#ffe397','#ffc2cf','#b7ecd2','#c2ddff','#e6c8fb','#ffd8ac'];
const KEY='artemis-os-v1';
const ICON_BOW=\`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.6 C3.4 8 3.4 16 8 21.4"/><path d="M8 2.6 L8 21.4"/><line x1="3.5" y1="12" x2="21" y2="12" stroke="var(--accent)"/><path d="M21 12 L17 10.2 M21 12 L17 13.8" stroke="var(--accent)"/><path d="M3.5 12 L6.4 10.4 M3.5 12 L6.4 13.6" stroke-width="1.3"/></svg>\`;
const ICON_PALETTE=\`<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.3c-5 0-9 3.5-9 7.9 0 3 2 4.9 4.4 4.9.9 0 1.5-.5 1.5-1.3 0-.6-.4-1-.4-1.6 0-1 1-1.5 2-1.5h3.4c3 0 5.9-2.1 5.9-5.4 0-2.6-3.6-4.4-7.8-4.4Z"/><circle cx="8.3" cy="9.4" r="1.05" fill="var(--accent)" stroke="none"/><circle cx="12" cy="7.3" r="1.05" fill="var(--accent2)" stroke="none"/><circle cx="15.5" cy="9.4" r="1.05" fill="var(--line)" stroke="none"/></svg>\`;
const ICON_CURSOR=\`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"><path d="M5 3.5 L5 18 L9 14.3 L11.6 20.4 L14.3 19.2 L11.6 13.1 L17 12.7 Z" fill="var(--paper)"/></svg>\`;

/* ---------- one consistent line-art icon set for every app ---------- */
const APP_ICON_PATHS={
  boards:'<rect x="3.6" y="4.2" width="16.8" height="15.6" rx="2.3"/><line x1="9" y1="4.2" x2="9" y2="19.8"/><line x1="15" y1="4.2" x2="15" y2="19.8"/>',
  'files-mgr':'<path d="M3.5 7.2 L3.5 18.4 L20.5 18.4 L20.5 9.2 L11.2 9.2 L9.4 7.2 Z"/>',
  projects:'<path d="M4 12.2 L12 4.2 L19 4.2 L19 11.2 L11 19.2 Z"/><circle cx="15.6" cy="7.6" r="1.25" fill="var(--ink)" stroke="none"/>',
  graph:'<circle cx="6.2" cy="7" r="2.15"/><circle cx="17.8" cy="7" r="2.15"/><circle cx="12" cy="18" r="2.15"/><line x1="7.9" y1="8.3" x2="10.4" y2="16.1"/><line x1="16.1" y1="8.3" x2="13.6" y2="16.1"/><line x1="8.3" y1="7" x2="15.7" y2="7"/>',
  calendar:'<rect x="3.6" y="5.6" width="16.8" height="14.6" rx="2"/><line x1="3.6" y1="9.8" x2="20.4" y2="9.8"/><line x1="7.6" y1="3.4" x2="7.6" y2="7.4"/><line x1="16.4" y1="3.4" x2="16.4" y2="7.4"/>',
  files:'<rect x="6.2" y="4.6" width="12" height="14.6" rx="1.6" transform="rotate(-7 12.2 12)"/><rect x="5.8" y="5.2" width="12" height="14.6" rx="1.6" fill="var(--panel)"/>',
  search:'<circle cx="10.4" cy="10.4" r="6.1"/><line x1="14.9" y1="14.9" x2="20.2" y2="20.2"/>',
  scripts:'<circle cx="12" cy="12" r="4.1"/><circle cx="12" cy="12" r="1.3" fill="var(--ink)" stroke="none"/><line x1="12" y1="3.6" x2="12" y2="6.3"/><line x1="12" y1="17.7" x2="12" y2="20.4"/><line x1="3.6" y1="12" x2="6.3" y2="12"/><line x1="17.7" y1="12" x2="20.4" y2="12"/><line x1="6.3" y1="6.3" x2="8.1" y2="8.1"/><line x1="15.9" y1="15.9" x2="17.7" y2="17.7"/><line x1="17.7" y1="6.3" x2="15.9" y2="8.1"/><line x1="8.1" y1="15.9" x2="6.3" y2="17.7"/>',
};
function appIcon(id,size){
  const p=APP_ICON_PATHS[id];if(!p)return '';
  const s=size||19;
  return \`<svg viewBox="0 0 24 24" width="\${s}" height="\${s}" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto">\${p}</svg>\`;
}

/* ---------- cursor glyph system ---------- */
const CURSOR_DEFS={
  arrow:{name:'Arrow',vb:'0 0 16 19',w:15,h:18,svg:'<path d="M2 1 L2 15 L5.4 12 L7.8 17 L10.2 15.8 L7.8 11 L12.8 10.6 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>'},
  pencil:{name:'Pencil',vb:'0 0 17 19',w:15,h:18,svg:'<path d="M3 16 L3 13 L11 5 L14 8 L6 16 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 5 L14 8" stroke="var(--accent)" stroke-width="1.5"/><path d="M2.2 17 L3.4 13.6 L5.4 15.6 Z" fill="var(--ink)"/>'},
  dot:{name:'Dot',vb:'0 0 16 16',w:14,h:14,svg:'<circle cx="8" cy="8" r="4.3" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/>'},
  star:{name:'Star',vb:'0 0 18 18',w:16,h:16,svg:'<path d="M9 1.4 L10.6 6.4 L15.8 6.7 L11.7 9.9 L13.1 14.8 L9 11.9 L4.9 14.8 L6.3 9.9 L2.2 6.7 L7.4 6.4 Z" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>'},
};
function setCursorGlyph(id){
  const d=CURSOR_DEFS[id]||CURSOR_DEFS.arrow;const cur=$('#cur');if(!cur)return;
  cur.setAttribute('viewBox',d.vb);cur.style.width=d.w+'px';cur.style.height=d.h+'px';cur.innerHTML=d.svg;
}
function cursorMenu(x,y){
  menu(x,y,Object.entries(CURSOR_DEFS).map(([id,d])=>[(S.cursor===id?'● ':'○ ')+d.name,()=>{
    S.cursor=id;setCursorGlyph(id);save();}]),'Cursor');
}

let S=null, saveT=null;
function blankState(){
  const home={id:'b_home',name:'Home',parent:null,projects:[],tasks:[],notes:[],files:[],strokes:[],cam:{x:0,y:0,z:1},created:Date.now()};
  return {v:1,theme:'parchment',boards:{b_home:home},projects:[],events:[],files:[],scripts:{},
    desktop:['boards','scripts','calendar'],cursor:'arrow',seenIntro:false};
}
function load(){
  try{const raw=localStorage.getItem(KEY); S=raw?JSON.parse(raw):blankState();}catch(e){S=blankState();}
  if(!S||!S.boards)S=blankState();
  for(const b of Object.values(S.boards)){b.tasks||=[];b.notes||=[];b.files||=[];b.strokes||=[];b.projects||=[];b.cam||={x:0,y:0,z:1};}
  S.scripts||={};S.projects||=[];S.events||=[];S.files||=[];S.desktop||=['boards','scripts','calendar'];S.cursor||='arrow';
  document.documentElement.dataset.theme=S.theme||'parchment';
}
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{
  try{localStorage.setItem(KEY,JSON.stringify(S));}
  catch(e){toast('Out of storage. Delete a few attached files to keep saving.');}
},220);}

/* ---------- event bus (scripts listen here) ---------- */
const Bus={h:{},on(t,f){(this.h[t]||=[]).push(f)},emit(t,p){(this.h[t]||[]).forEach(f=>{try{f(p)}catch(e){console.warn(e)}});(this.h['*']||[]).forEach(f=>f(t,p))}};
const dirty=new Set();
function changed(kind,payload){ if(kind)Bus.emit(kind,payload||{}); save(); refresh(); }
const refreshers=new Map();
function refresh(){refreshers.forEach(f=>{try{f()}catch(e){}});}

/* ---------- toasts ---------- */
function toast(msg,ms=3200){
  const d=document.createElement('div');d.className='toast';d.textContent=msg;
  d.style.transform=\`rotate(\${(Math.random()*3-1.5).toFixed(2)}deg)\`;
  $('#toasts').appendChild(d);setTimeout(()=>d.remove(),ms);
}

/* ---------- cursor ---------- */
(function(){
  const cur=$('#cur'),ring=$('#ring');let rx=0,ry=0,mx=0,my=0;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.transform=\`translate(\${mx}px,\${my}px)\`;
    const t=e.target,cs=t&&t.closest?t.closest('input,textarea,[contenteditable="true"]'):null;
    const dg=t&&t.closest?t.closest('.card,.note,.fcard,.node,.wbar,.bcard,.chip'):null;
    const ck=t&&t.closest?t.closest('button,.dicon,.tile,.mi,.item,.dot,.cell'):null;
    document.body.classList.toggle('c-text',!!cs);
    document.body.classList.toggle('c-drag',!cs&&!!dg);
    document.body.classList.toggle('c-click',!cs&&!dg&&!!ck);
  },{passive:true});
  (function loop(){rx+=(mx-rx)*.22;ry+=(my-ry)*.22;ring.style.transform=\`translate(\${rx}px,\${ry}px)\`;requestAnimationFrame(loop)})();
})();

/* ---------- drag helper ---------- */
function drag(handle,onMove,onStart,onEnd){
  handle.addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    if(e.target.closest('input,textarea,button,select,[contenteditable="true"],.dot'))return;
    e.preventDefault();const sx=e.clientX,sy=e.clientY;let moved=false;
    onStart&&onStart(e);
    const mv=ev=>{if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>2)moved=true;onMove(ev.clientX-sx,ev.clientY-sy,ev)};
    const up=ev=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);onEnd&&onEnd(moved,ev)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}

/* ---------- context menu ---------- */
let openMenu=null;
function menu(x,y,items,head){
  closeMenu();const m=document.createElement('div');m.className='menu';
  if(head)m.insertAdjacentHTML('beforeend',\`<div class="mh">\${esc(head)}</div>\`);
  items.forEach(it=>{
    if(it==='-'){m.insertAdjacentHTML('beforeend','<hr>');return;}
    const b=document.createElement('button');b.className='mi';b.textContent=it[0];
    b.onclick=()=>{closeMenu();it[1]()};m.appendChild(b);
  });
  document.body.appendChild(m);
  const r=m.getBoundingClientRect();
  m.style.left=Math.min(x,innerWidth-r.width-8)+'px';
  m.style.top=Math.min(y,innerHeight-r.height-8)+'px';
  openMenu=m;setTimeout(()=>document.addEventListener('mousedown',closeOnOut),0);
}
function closeOnOut(e){if(openMenu&&!openMenu.contains(e.target))closeMenu()}
function closeMenu(){if(openMenu){openMenu.remove();openMenu=null;document.removeEventListener('mousedown',closeOnOut)}}

/* ---------- modal ---------- */
function modal(title,bodyHTML,buttons,onMount){
  const sc=document.createElement('div');sc.id='scrim';
  sc.innerHTML=\`<div class="modal"><h3>\${esc(title)}</h3><div class="mbody">\${bodyHTML}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"></div></div>\`;
  const row=$('.row:last-child',sc);
  (buttons||[['Close',null]]).forEach(([lb,fn,pri])=>{
    const b=document.createElement('button');b.className='btn'+(pri?' pri':'');b.textContent=lb;
    b.onclick=()=>{if(!fn||fn($('.mbody',sc))!==false)sc.remove()};row.appendChild(b);
  });
  sc.addEventListener('mousedown',e=>{if(e.target===sc)sc.remove()});
  document.body.appendChild(sc);onMount&&onMount($('.mbody',sc),sc);
  const f=$('input,textarea,select',sc);f&&f.focus();
  return sc;
}
function ask(title,label,val,cb){
  modal(title,\`<label class="fld">\${esc(label)}</label><input type="text" id="_v" value="\${esc(val||'')}">\`,
    [['Cancel',null],['Save',b=>{const v=$('#_v',b).value.trim();if(v)cb(v)},1]],
    b=>{$('#_v',b).onkeydown=e=>{if(e.key==='Enter')$('.btn.pri',b.parentElement).click()}});
}
function confirmBox(title,msg,cb,label){
  modal(title,\`<p>\${esc(msg)}</p>\`,[['Cancel',null],[label||'Delete',()=>cb(),1]]);
}

/* ============================ windows ============================ */
let zTop=100;const WINS=new Map();
function openWin(opt){
  if(opt.id&&WINS.has(opt.id)){const w=WINS.get(opt.id);focusWin(w);if(opt.onReopen)opt.onReopen(w);return w;}
  const id=opt.id||uid('w');
  const el=document.createElement('div');el.className='win';
  const w=Math.min(opt.w||760,innerWidth-40),h=Math.min(opt.h||520,innerHeight-130);
  el.style.width=w+'px';el.style.height=h+'px';
  el.style.left=clamp((innerWidth-w)/2+(WINS.size%5)*24-48,8,innerWidth-w-8)+'px';
  el.style.top=clamp(58+(WINS.size%5)*22,8,Math.max(8,innerHeight-h-100))+'px';
  el.innerHTML=\`<div class="wbar"><span style="font-size:19px">\${opt.icon||'📄'}</span>
    <div class="wtitle"></div>
    <button class="wbtn" data-a="min" title="Minimize">–</button>
    <button class="wbtn" data-a="max" title="Maximize">▢</button>
    <button class="wbtn" data-a="close" title="Close">✕</button></div>
    <div class="wbody"></div><div class="wgrip"></div>\`;
  $('.wtitle',el).textContent=opt.title||'Window';
  $('#desk').appendChild(el);
  const win={id,el,body:$('.wbody',el),opt,min:false,max:false,
    setTitle(t){$('.wtitle',el).textContent=t;opt.title=t;renderChips();}};
  WINS.set(id,win);
  drag($('.wbar',el),(dx,dy)=>{if(win.max)return;
    el.style.left=clamp(win._l+dx,-w+90,innerWidth-70)+'px';el.style.top=clamp(win._t+dy,0,innerHeight-60)+'px';},
    ()=>{win._l=parseFloat(el.style.left);win._t=parseFloat(el.style.top);focusWin(win)});
  drag($('.wgrip',el),(dx,dy)=>{el.style.width=Math.max(300,win._w+dx)+'px';el.style.height=Math.max(200,win._h+dy)+'px';
    win.opt.onResize&&win.opt.onResize();},
    ()=>{win._w=el.offsetWidth;win._h=el.offsetHeight});
  el.addEventListener('mousedown',()=>focusWin(win));
  $$('.wbtn',el).forEach(b=>b.onclick=e=>{e.stopPropagation();
    const a=b.dataset.a;
    if(a==='close')closeWin(win);
    else if(a==='min'){win.min=true;el.style.display='none';renderChips();}
    else{win.max=!win.max;el.classList.toggle('max',win.max);
      if(win.max){win._r={l:el.style.left,t:el.style.top,w:el.style.width,h:el.style.height};
        Object.assign(el.style,{left:'6px',top:'6px',width:'calc(100vw - 12px)',height:'calc(100vh - 104px)'});}
      else Object.assign(el.style,{left:win._r.l,top:win._r.t,width:win._r.w,height:win._r.h});
      win.opt.onResize&&win.opt.onResize();}
  });
  focusWin(win);
  if(opt.render)opt.render(win.body,win);
  if(opt.refresh)refreshers.set(id,()=>opt.refresh(win));
  renderChips();
  return win;
}
function focusWin(w){
  if(w.min){w.min=false;w.el.style.display='';}
  zTop++;w.el.style.zIndex=zTop;
  WINS.forEach(x=>x.el.classList.toggle('on',x===w));
  renderChips();
}
function closeWin(w){
  if(w.opt.onClose)w.opt.onClose();
  refreshers.delete(w.id);WINS.delete(w.id);w.el.remove();renderChips();
}

/* ============================ desktop + dock ============================ */
const APPS=[
  {id:'boards',icon:appIcon('boards'),name:'Boards',run:()=>openBoard('b_home')},
  {id:'files-mgr',icon:appIcon('files-mgr'),name:'File Manager',run:()=>openFileManager()},
  {id:'projects',icon:appIcon('projects'),name:'Projects',run:()=>openProjects()},
  {id:'graph',icon:appIcon('graph'),name:'Graph View',run:()=>openGraph()},
  {id:'calendar',icon:appIcon('calendar'),name:'Calendar',run:()=>openCalendar()},
  {id:'files',icon:appIcon('files'),name:'Files',run:()=>openFiles()},
  {id:'search',icon:appIcon('search'),name:'Search & Stats',run:()=>openSearch()},
  {id:'scripts',icon:appIcon('scripts'),name:'Scripts',run:()=>openScripts()},
];
function renderDesktop(){
  const shown=(S.desktop||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean);
  $('#icons').innerHTML=shown.map(a=>\`<button class="dicon" data-a="\${a.id}"><div class="gl">\${a.icon}</div><div class="lb">\${a.name}</div></button>\`).join('');
  $$('#icons .dicon').forEach(b=>{
    b.onclick=()=>APPS.find(a=>a.id===b.dataset.a).run();
    b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Open',()=>APPS.find(a=>a.id===b.dataset.a).run()],
        ['Remove from desk',()=>{S.desktop=S.desktop.filter(x=>x!==b.dataset.a);save();renderDesktop()}]],
        APPS.find(a=>a.id===b.dataset.a).name)};
  });
}
function addIconMenu(x,y){
  const missing=APPS.filter(a=>!(S.desktop||[]).includes(a.id));
  if(!missing.length)return menu(x,y,[['Everything is already on the desk',()=>{}]],'Add an icon');
  menu(x,y,missing.map(a=>[a.name,()=>{S.desktop.push(a.id);save();renderDesktop()}]),'Add an icon');
}

function deskMenu(){
  $('#desk').addEventListener('contextmenu',e=>{
    if(e.target.closest('.win'))return;e.preventDefault();
    menu(e.clientX,e.clientY,[['New board',()=>newBoardDialog(null)],
      ['Add an icon…',()=>addIconMenu(e.clientX,e.clientY)],
      ['All apps…',()=>appMenu(e.clientX,e.clientY)],
      ['Change theme…',()=>themeMenu(e.clientX,e.clientY)]],'Desk');
  });
}
function appMenu(x,y){menu(x,y,APPS.map(a=>[a.name,a.run]),'Apps')}
const DOCK_QUICK=['boards','scripts','calendar','search'];
function renderDock(){
  const quick=DOCK_QUICK.map(id=>APPS.find(a=>a.id===id)).filter(Boolean);
  $('#dock').innerHTML=
    \`<button class="dk" id="startb" title="Artemis OS">\${ICON_BOW}</button>
     <span class="sep"></span>
     \${quick.map(a=>\`<button class="dk" data-a="\${a.id}" title="\${a.name}">\${a.icon}<span class="lb">\${a.name}</span></button>\`).join('')}
     <span class="sep"></span>
     <div id="chips"></div>
     <span class="sep"></span>
     <button class="dk" id="cursorb" title="Cursor">\${ICON_CURSOR}</button>
     <button class="dk" id="themeb" title="Theme">\${ICON_PALETTE}</button>
     <div id="clock"></div>\`;
  $$('#dock .dk[data-a]').forEach(b=>b.onclick=()=>APPS.find(a=>a.id===b.dataset.a).run());
  $('#themeb').onclick=e=>themeMenu(e.clientX,e.clientY-320);
  $('#cursorb').onclick=e=>cursorMenu(e.clientX,e.clientY-260);
  $('#startb').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();
    menu(r.left,Math.max(20,r.top-30-APPS.length*30),[...APPS.map(a=>[a.name,a.run]),'-',
      ['Add a desk icon…',()=>addIconMenu(r.left,r.top-300)],
      ['Change theme…',()=>themeMenu(r.left,r.top-320)],
      ['Change cursor…',()=>cursorMenu(r.left,r.top-260)],
      ['Close all windows',()=>[...WINS.values()].forEach(closeWin)]],'Artemis OS');
  };
  renderChips();
  setInterval(()=>{const d=new Date();$('#clock').textContent=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})},1000);
  $('#clock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
}
function renderChips(){
  const c=$('#chips');if(!c)return;c.innerHTML='';
  WINS.forEach(w=>{const b=document.createElement('button');
    b.className='chip'+(w.el.classList.contains('on')&&!w.min?' on':'');
    b.textContent=w.opt.title||'';
    b.onclick=()=>{w.min||!w.el.classList.contains('on')?focusWin(w):(w.min=true,w.el.style.display='none',renderChips())};
    b.oncontextmenu=e=>{e.preventDefault();menu(e.clientX,e.clientY,[['Close',()=>closeWin(w)]])};
    c.appendChild(b);});
}
function themeMenu(x,y){
  menu(x,y,THEMES.map(([id,nm])=>[(S.theme===id?'● ':'○ ')+nm,()=>{S.theme=id;document.documentElement.dataset.theme=id;save();}]),'Themes');
}
</script>
<script>
/* ============================ data API ============================ */
const A={
  board:id=>S.boards[id],
  allBoards:()=>Object.values(S.boards),
  children:id=>Object.values(S.boards).filter(b=>b.parent===id),
  parent:id=>{const b=S.boards[id];return b&&b.parent?S.boards[b.parent]:null},
  path(id){const out=[];let b=S.boards[id];while(b){out.unshift(b);b=b.parent?S.boards[b.parent]:null}return out},
  createBoard(name,parent,projects){
    const b={id:uid('b'),name:name||'New board',parent:parent||null,projects:projects||[],
      tasks:[],notes:[],files:[],strokes:[],cam:{x:0,y:0,z:1},created:Date.now()};
    S.boards[b.id]=b;Bus.emit('board.created',{board:b});return b;},
  deleteBoard(id){ if(id==='b_home')return false;
    A.children(id).forEach(c=>c.parent=S.boards[id].parent);
    Object.values(S.scripts).filter(s=>s.boardId===id).forEach(s=>s.boardId=null);
    delete S.boards[id];[...WINS.values()].filter(w=>w.id==='board:'+id).forEach(closeWin);return true;},
  dupBoard(id){const src=S.boards[id];if(!src)return null;
    const b=JSON.parse(JSON.stringify(src));b.id=uid('b');b.name=src.name+' copy';b.created=Date.now();
    b.tasks.forEach(t=>t.id=uid('t'));b.notes.forEach(n=>n.id=uid('n'));b.files.forEach(f=>f.id=uid('fc'));
    S.boards[b.id]=b;Bus.emit('board.created',{board:b});return b;},
  stats(id){const b=S.boards[id];if(!b)return{done:0,total:0,pct:0};
    const total=b.tasks.length,done=b.tasks.filter(t=>t.done).length;
    return{done,total,pct:total?Math.round(done/total*100):0};},
  freeSpot(b,w=230,h=130){
    let x=40,y=40;const items=[...b.tasks,...b.notes,...b.files];
    for(let r=0;r<400;r++){const ok=!items.some(i=>Math.abs(i.x-x)<w&&Math.abs(i.y-y)<h);
      if(ok)return{x,y};x+=w;if(x>40+w*4){x=40;y+=h}}
    return{x:40+Math.random()*400,y:40+Math.random()*300};},
  addTask(boardId,title,opts){
    const b=S.boards[boardId];if(!b)return null;
    const p=A.freeSpot(b);
    const t=Object.assign({id:uid('t'),title:title||'New task',done:false,x:p.x,y:p.y,priority:'normal',
      status:'todo',desc:'',deadline:'',tags:[],subtasks:[],created:Date.now()},opts||{});
    b.tasks.push(t);Bus.emit('task.created',{boardId,task:t});return t;},
  findTask(id){for(const b of Object.values(S.boards)){const t=b.tasks.find(x=>x.id===id);if(t)return{board:b,task:t}}return null},
  delTask(id){const f=A.findTask(id);if(!f)return false;
    f.board.tasks=f.board.tasks.filter(t=>t.id!==id);Bus.emit('task.deleted',{boardId:f.board.id,task:f.task});return true;},
  moveTaskToBoard(id,boardId){const f=A.findTask(id),to=S.boards[boardId];if(!f||!to||f.board.id===boardId)return false;
    f.board.tasks=f.board.tasks.filter(t=>t.id!==id);const p=A.freeSpot(to);f.task.x=p.x;f.task.y=p.y;to.tasks.push(f.task);
    Bus.emit('task.moved',{from:f.board.id,boardId,task:f.task});return true;},
  setDone(id,v){const f=A.findTask(id);if(!f)return false;const was=f.task.done;f.task.done=!!v;
    if(was!==!!v)Bus.emit(v?'task.completed':'task.uncompleted',{boardId:f.board.id,task:f.task});return true;},
  rename(id,name){const f=A.findTask(id);if(!f)return false;const old=f.task.title;f.task.title=name;
    Bus.emit('task.renamed',{boardId:f.board.id,task:f.task,old});return true;},
  addSub(taskId,title){const f=A.findTask(taskId);if(!f)return null;
    const s={id:uid('s'),title:title||'Subtask',done:false};f.task.subtasks.push(s);
    Bus.emit('subtask.created',{boardId:f.board.id,task:f.task,subtask:s});return s;},
  addNote(boardId,text,color){const b=S.boards[boardId];if(!b)return null;const p=A.freeSpot(b,200,120);
    const n={id:uid('n'),text:text||'',x:p.x,y:p.y,w:180,h:110,color:color||NOTE_COLORS[Math.floor(Math.random()*NOTE_COLORS.length)]};
    b.notes.push(n);Bus.emit('note.created',{boardId,note:n});return n;},
  addFileCard(boardId,fileId){const b=S.boards[boardId];if(!b)return null;const p=A.freeSpot(b,170,140);
    const c={id:uid('fc'),fileId,x:p.x,y:p.y};b.files.push(c);Bus.emit('file.attached',{boardId,card:c});return c;},
  file:id=>S.files.find(f=>f.id===id),
  project:id=>S.projects.find(p=>p.id===id),
  projName:id=>{const p=A.project(id);return p?p.name:'?'},
  isOverdue:t=>!!t.deadline&&!t.done&&t.deadline<todayISO(),
  objects(b){return[...b.tasks.map(o=>({o,k:'task'})),...b.notes.map(o=>({o,k:'note'})),...b.files.map(o=>({o,k:'file'}))]},
};
const PRIOS=['low','normal','high','urgent'],STATUSES=['todo','doing','blocked','done'];

/* ---------- layout engine (shared with scripts) ---------- */
function sizeOf(k){return k==='task'?[212,120]:k==='note'?[180,110]:[150,140]}
const Layout={
  grid(items,opt={}){const cols=opt.cols||Math.ceil(Math.sqrt(items.length))||1;
    const gx=opt.gx||240,gy=opt.gy||150,ox=opt.x??60,oy=opt.y??60;
    items.forEach((it,i)=>{it.o.x=ox+(i%cols)*gx;it.o.y=oy+Math.floor(i/cols)*gy});},
  rows(items,o={}){Layout.grid(items,{cols:o.cols||Math.ceil(items.length/Math.max(1,o.rows||2)),...o})},
  columns(items,o={}){Layout.grid(items,{cols:o.cols||3,...o})},
  vertical(items,o={}){const x=o.x??80,y=o.y??60,g=o.gap||140;items.forEach((it,i)=>{it.o.x=x;it.o.y=y+i*g})},
  horizontal(items,o={}){const x=o.x??60,y=o.y??80,g=o.gap||240;items.forEach((it,i)=>{it.o.x=x+i*g;it.o.y=y})},
  circle(items,o={}){const cx=o.x??520,cy=o.y??380,r=o.r||Math.max(190,items.length*34);
    items.forEach((it,i)=>{const a=i/items.length*Math.PI*2-Math.PI/2;it.o.x=cx+Math.cos(a)*r;it.o.y=cy+Math.sin(a)*r});},
  spiral(items,o={}){const cx=o.x??520,cy=o.y??380;items.forEach((it,i)=>{const a=i*.6,r=60+i*26;
    it.o.x=cx+Math.cos(a)*r;it.o.y=cy+Math.sin(a)*r});},
  stack(items,o={}){const x=o.x??90,y=o.y??90;items.forEach((it,i)=>{it.o.x=x+i*11;it.o.y=y+i*13})},
  align(items,o={}){const how=o.how||'left';
    if(!items.length)return;
    if(how==='left'){const m=Math.min(...items.map(i=>i.o.x));items.forEach(i=>i.o.x=m)}
    else if(how==='right'){const m=Math.max(...items.map(i=>i.o.x));items.forEach(i=>i.o.x=m)}
    else if(how==='top'){const m=Math.min(...items.map(i=>i.o.y));items.forEach(i=>i.o.y=m)}
    else if(how==='bottom'){const m=Math.max(...items.map(i=>i.o.y));items.forEach(i=>i.o.y=m)}
    else{const m=items.reduce((a,i)=>a+i.o.y,0)/items.length;items.forEach(i=>i.o.y=m)}},
  distribute(items,o={}){if(items.length<3)return;const axis=o.axis||'x';
    const s=[...items].sort((a,b)=>a.o[axis]-b.o[axis]),lo=s[0].o[axis],hi=s[s.length-1].o[axis],st=(hi-lo)/(s.length-1);
    s.forEach((it,i)=>it.o[axis]=lo+st*i);},
  pack(items,o={}){let x=o.x??50,y=o.y??50,rowH=0;const maxW=o.w||960;
    items.forEach(it=>{const[w,h]=sizeOf(it.k);if(x+w>maxW+(o.x??50)){x=o.x??50;y+=rowH+22;rowH=0}
      it.o.x=x;it.o.y=y;x+=w+22;rowH=Math.max(rowH,h)});},
};
</script>
<script>
/* ============================ board app ============================ */
function openBoard(id){
  const b=A.board(id);if(!b){toast('That board is gone.');return}
  const win=openWin({id:'board:'+id,title:b.name,icon:appIcon('boards'),w:900,h:600,
    render:(body,w)=>buildBoard(body,w,id),refresh:w=>w.api&&w.api.render(),
    onResize:()=>{}});
  return win;
}
function buildBoard(body,win,id){
  body.innerHTML=\`<div class="bwrap">
    <div class="btool"></div>
    <div class="bcanvasholder"><div class="bcanvas">
      <svg class="drawlayer" width="4000" height="3000"></svg>
    </div></div></div>\`;
  const holder=$('.bcanvasholder',body),canvas=$('.bcanvas',body),svg=$('.drawlayer',body),tool=$('.btool',body);
  const st={tool:'select',pen:'#2c2620',penW:3,sel:new Set()};
  const B=()=>A.board(id);
  const cam=()=>B().cam;

  function applyCam(){const c=cam();canvas.style.transform=\`translate(\${c.x}px,\${c.y}px) scale(\${c.z})\`}
  function toBoard(ev){const r=holder.getBoundingClientRect(),c=cam();
    return{x:(ev.clientX-r.left-c.x)/c.z,y:(ev.clientY-r.top-c.y)/c.z}}

  /* ---------- toolbar ---------- */
  function renderTool(){
    const bd=B(),s=A.stats(id);
    tool.innerHTML=\`
      <button class="btn sm" data-a="add">+ Add</button>
      <button class="btn sm \${st.tool!=='select'?'on':''}" data-a="draw">\${st.tool==='pen'?'✏ Pen':st.tool==='erase'?'🧽 Eraser':'✏ Draw'}</button>
      <button class="btn sm" data-a="view">\${Math.round(cam().z*100)}%</button>
      <button class="btn sm" data-a="more">⋯</button>
      <div style="flex:1;min-width:20px"></div>
      <span class="dim">\${s.done}/\${s.total}</span>
      <div class="bar" style="width:76px"><i style="width:\${s.pct}%"></i></div>\`;
    $$('[data-a]',tool).forEach(el=>el.onclick=e=>act(el.dataset.a,e));
  }
  function mpos(e){const r=e.currentTarget?e.currentTarget.getBoundingClientRect():null;
    return r?{x:r.left,y:r.bottom+4}:{x:e.clientX,y:e.clientY}}
  function act(a,e){
    const bd=B(),m=mpos(e);
    if(a==='add')menu(m.x,m.y,[
      ['Task',()=>{A.addTask(id,'New task');changed('board.changed',{boardId:id})}],
      ['Sticky note',()=>{A.addNote(id,'');changed('board.changed',{boardId:id})}],
      ['Sub-board',()=>newBoardDialog(id)],
      ['File attachment…',()=>pickFiles(fs=>{fs.forEach(f=>A.addFileCard(id,f.id));changed('board.changed',{boardId:id})})],
    ],'Add to board');
    else if(a==='draw')menu(m.x,m.y,[
      [(st.tool==='select'?'● ':'○ ')+'Move & pan',()=>{st.tool='select';renderTool()}],
      [(st.tool==='erase'?'● ':'○ ')+'Eraser',()=>{st.tool='erase';renderTool()}],
      '-',
      ...[['Ink','#2c2620'],['Coral','#ff6f61'],['Azure','#4d96ff'],['Meadow','#37b874'],['Violet','#8c6bff']]
        .map(([nm,c])=>[(st.tool==='pen'&&st.pen===c?'● ':'○ ')+'Pen — '+nm,()=>{st.tool='pen';st.pen=c;renderTool()}]),
    ],'Drawing');
    else if(a==='view')menu(m.x,m.y,[
      ['Zoom in',()=>zoomAt(holder.clientWidth/2,holder.clientHeight/2,1.2)],
      ['Zoom out',()=>zoomAt(holder.clientWidth/2,holder.clientHeight/2,1/1.2)],
      ['Fit everything',fit],
      ['Reset to 100%',()=>{const c=cam();c.x=0;c.y=0;c.z=1;applyCam();renderTool();save()}],
    ],'View');
    else if(a==='more')menu(m.x,m.y,[
      ['Check every task',()=>{bd.tasks.forEach(t=>A.setDone(t.id,true));changed('board.changed',{boardId:id})}],
      ['Uncheck every task',()=>{bd.tasks.forEach(t=>A.setDone(t.id,false));changed('board.changed',{boardId:id})}],
      ['Clear completed',()=>{const n=bd.tasks.filter(t=>t.done).length;
        if(!n)return toast('Nothing completed to clear.');
        confirmBox('Clear completed',\`Remove \${n} completed task\${n>1?'s':''} from this board?\`,()=>{
          bd.tasks.filter(t=>t.done).forEach(t=>A.delTask(t.id));changed('board.changed',{boardId:id})},'Clear')}],
      ['Arrange in a grid',()=>{Layout.grid(A.objects(bd));changed('board.changed',{boardId:id})}],
      '-',
      ['Projects: '+(bd.projects.length?bd.projects.map(A.projName).join(', '):'none'),()=>tagMenu({clientX:m.x,clientY:m.y},bd)],
      ['Scripts…',()=>boardScriptsMenu({clientX:m.x,clientY:m.y},id)],
      ['Rename board…',()=>ask('Rename board','Name',bd.name,v=>{bd.name=v;changed('board.changed',{boardId:id})})],
    ],A.path(id).map(x=>x.name).join(' › '));
  }
  function tagMenu(e,bd){
    if(!S.projects.length)return menu(e.clientX,e.clientY,[['Create a project first…',()=>openProjects()]],'Projects');
    menu(e.clientX,e.clientY,S.projects.map(p=>[(bd.projects.includes(p.id)?'● ':'○ ')+p.name,()=>{
      bd.projects.includes(p.id)?bd.projects=bd.projects.filter(x=>x!==p.id):bd.projects.push(p.id);
      changed('project.changed',{boardId:id});renderTool();}]),'Tag this board');
  }

  /* ---------- camera ---------- */
  function zoomAt(px,py,f){const c=cam();const z=clamp(c.z*f,.2,3);
    c.x=px-(px-c.x)*(z/c.z);c.y=py-(py-c.y)*(z/c.z);c.z=z;applyCam();renderTool();save();}
  holder.addEventListener('wheel',e=>{e.preventDefault();
    const r=holder.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?1.12:1/1.12);},{passive:false});
  function fit(){const b=B(),items=A.objects(b);const c=cam();
    if(!items.length){c.x=0;c.y=0;c.z=1;applyCam();renderTool();return}
    const xs=items.map(i=>i.o.x),ys=items.map(i=>i.o.y);
    const minx=Math.min(...xs)-40,miny=Math.min(...ys)-40,maxx=Math.max(...xs)+250,maxy=Math.max(...ys)+180;
    const z=clamp(Math.min(holder.clientWidth/(maxx-minx),holder.clientHeight/(maxy-miny)),.2,1.6);
    c.z=z;c.x=-minx*z+10;c.y=-miny*z+10;applyCam();renderTool();save();}

  /* ---------- canvas interaction: pan / draw / erase ---------- */
  let panning=null,stroke=null;
  holder.addEventListener('contextmenu',e=>e.preventDefault());
  holder.addEventListener('mousedown',e=>{
    const onItem=e.target.closest('.card,.note,.fcard,.bcard');
    if(e.button===2||(e.button===0&&!onItem&&st.tool==='select')){
      const c=cam();panning={sx:e.clientX,sy:e.clientY,cx:c.x,cy:c.y};
      if(e.button===2&&stroke){stroke=null}
      return;
    }
    if(onItem||e.button!==0)return;
    const p=toBoard(e);
    if(st.tool==='pen'){stroke={id:uid('k'),color:st.pen,w:st.penW,pts:[[p.x,p.y]]};B().strokes.push(stroke);drawStrokes();}
    else if(st.tool==='erase'){eraseAt(p)}
  });
  addEventListener('mousemove',e=>{
    if(panning){const c=cam();c.x=panning.cx+(e.clientX-panning.sx);c.y=panning.cy+(e.clientY-panning.sy);applyCam();return}
    if(!win.el.isConnected)return;
    const p=toBoard(e);
    if(stroke&&(e.buttons&1)){stroke.pts.push([p.x,p.y]);drawStrokes();}
    else if(st.tool==='erase'&&(e.buttons&1)&&holder.contains(e.target))eraseAt(p);
  });
  addEventListener('mouseup',()=>{if(panning){panning=null;save()}if(stroke){stroke=null;save()}});
  function eraseAt(p){const b=B(),r=16/cam().z;const before=b.strokes.length;
    b.strokes=b.strokes.filter(s=>!s.pts.some(pt=>Math.hypot(pt[0]-p.x,pt[1]-p.y)<r));
    if(b.strokes.length!==before){drawStrokes();save()}}
  function drawStrokes(){
    svg.innerHTML=B().strokes.map(s=>\`<polyline points="\${s.pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"
      fill="none" stroke="\${s.color}" stroke-width="\${s.w}" stroke-linecap="round" stroke-linejoin="round"/>\`).join('');}

  /* ---------- items ---------- */
  function render(){
    const b=B();if(!b)return;win.setTitle(b.name);
    $$('.card,.note,.fcard,.bcard',canvas).forEach(e=>e.remove());
    b.tasks.forEach(t=>canvas.appendChild(taskEl(t)));
    b.notes.forEach(n=>canvas.appendChild(noteEl(n)));
    b.files.forEach(c=>canvas.appendChild(fileEl(c)));
    A.children(id).forEach((c,i)=>canvas.appendChild(subEl(c,i)));
    drawStrokes();applyCam();renderTool();
  }
  function place(el,o){el.style.left=o.x+'px';el.style.top=o.y+'px'}
  function makeDraggable(el,o,after){
    drag(el,(dx,dy)=>{el.style.left=(el._x+dx/cam().z)+'px';el.style.top=(el._y+dy/cam().z)+'px';},
      ()=>{el._x=o.x;el._y=o.y;el.style.zIndex=++zTop},
      (moved)=>{if(!moved)return;o.x=Math.round(parseFloat(el.style.left));o.y=Math.round(parseFloat(el.style.top));
        save();after&&after()});
  }
  function editable(el,get,set){
    el.ondblclick=e=>{e.stopPropagation();el.contentEditable='true';el.focus();
      document.execCommand&&document.getSelection().selectAllChildren(el);
      const done=()=>{el.contentEditable='false';const v=el.textContent.trim();if(v&&v!==get())set(v);else el.textContent=get();};
      el.onblur=done;el.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();el.blur()}if(ev.key==='Escape'){el.textContent=get();el.blur()}};};
  }
  function taskEl(t){
    const el=document.createElement('div');
    el.className='card '+(t.done?'done ':'')+tiltOf(t.id);el.dataset.tid=t.id;place(el,t);
    const over=A.isOverdue(t);
    el.innerHTML=\`<div class="ttl"><button class="chk">\${t.done?'✓':''}</button><div class="tx">\${esc(t.title)}</div></div>
      <div class="meta">
        \${t.priority!=='normal'?\`<span class="pill p-\${t.priority}">\${t.priority}</span>\`:''}
        \${t.status&&t.status!=='todo'?\`<span class="pill">\${t.status}</span>\`:''}
        \${t.deadline?\`<span class="pill \${over?'over':''}">\${t.deadline.slice(5)}</span>\`:''}
        \${t.tags.map(g=>\`<span class="pill">#\${esc(g)}</span>\`).join('')}
        \${t.subtasks.length?\`<span class="pill">\${t.subtasks.filter(s=>s.done).length}/\${t.subtasks.length}</span>\`:''}
      </div>
      \${t.desc?\`<div class="dim" style="margin-top:4px">\${esc(t.desc)}</div>\`:''}
      \${t.subtasks.length?\`<ul class="subs">\${t.subtasks.map(s=>
        \`<li class="\${s.done?'d':''}" data-sid="\${s.id}"><button class="chk" style="width:15px;height:15px;font-size:11px">\${s.done?'✓':''}</button><span class="stx">\${esc(s.title)}</span></li>\`).join('')}</ul>\`:''}\`;
    $('.chk',el).onclick=e=>{e.stopPropagation();A.setDone(t.id,!t.done);changed('board.changed',{boardId:id})};
    $$('.subs li',el).forEach(li=>{const s=t.subtasks.find(x=>x.id===li.dataset.sid);
      $('.chk',li).onclick=e=>{e.stopPropagation();s.done=!s.done;changed('board.changed',{boardId:id})};
      $('.stx',li).ondblclick=e=>{e.stopPropagation();ask('Rename subtask','Subtask',s.title,v=>{s.title=v;changed()})};});
    editable($('.tx',el),()=>t.title,v=>{A.rename(t.id,v);changed('board.changed',{boardId:id})});
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();taskMenu(e,t)};
    makeDraggable(el,t,()=>Bus.emit('task.moved',{boardId:id,task:t}));
    return el;
  }
  function taskMenu(e,t){
    menu(e.clientX,e.clientY,[
      [t.done?'Mark not done':'Mark done',()=>{A.setDone(t.id,!t.done);changed('board.changed',{boardId:id})}],
      ['Rename…',()=>ask('Rename task','Title',t.title,v=>{A.rename(t.id,v);changed('board.changed',{boardId:id})})],
      ['Add subtask…',()=>ask('New subtask','Title','',v=>{A.addSub(t.id,v);changed('board.changed',{boardId:id})})],
      ['Edit details…',()=>taskDetails(t,id)],
      ['Priority ▸',()=>menu(e.clientX+40,e.clientY,PRIOS.map(p=>[(t.priority===p?'● ':'○ ')+p,()=>{t.priority=p;changed('board.changed',{boardId:id})}]),'Priority')],
      ['Status ▸',()=>menu(e.clientX+40,e.clientY,STATUSES.map(p=>[(t.status===p?'● ':'○ ')+p,()=>{t.status=p;if(p==='done')A.setDone(t.id,true);changed('board.changed',{boardId:id})}]),'Status')],
      '-',
      ['Duplicate',()=>{const c=JSON.parse(JSON.stringify(t));c.id=uid('t');c.x+=26;c.y+=26;c.subtasks.forEach(s=>s.id=uid('s'));
        B().tasks.push(c);Bus.emit('task.created',{boardId:id,task:c});changed('board.changed',{boardId:id})}],
      ['Move to board…',()=>pickBoard('Move task to…',bid=>{A.moveTaskToBoard(t.id,bid);changed('board.changed',{boardId:id})},id)],
      ['Make subtask of…',()=>pickTask(id,t.id,other=>{
        other.subtasks.push({id:uid('s'),title:t.title,done:t.done});A.delTask(t.id);changed('board.changed',{boardId:id})})],
      '-',
      ['Delete',()=>{A.delTask(t.id);changed('board.changed',{boardId:id})}],
    ],t.title);
  }
  function noteEl(n){
    const el=document.createElement('div');el.className='note '+tiltOf(n.id);place(el,n);
    el.style.background=n.color;el.style.width=(n.w||180)+'px';el.style.minHeight=(n.h||110)+'px';el.style.color='#3a3026';
    el.innerHTML=\`<div class="nx"></div>\`;$('.nx',el).textContent=n.text;
    const nx=$('.nx',el);
    nx.ondblclick=()=>{nx.contentEditable='true';nx.focus();
      nx.onblur=()=>{nx.contentEditable='false';n.text=nx.textContent;changed('board.changed',{boardId:id})}};
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Edit text',()=>nx.dispatchEvent(new Event('dblclick'))],
        ['Colour ▸',()=>menu(e.clientX+40,e.clientY,NOTE_COLORS.map((c,i)=>['Colour '+(i+1),()=>{n.color=c;changed()}]))],
        ['Bigger',()=>{n.w=(n.w||180)+40;n.h=(n.h||110)+30;changed()}],
        ['Smaller',()=>{n.w=Math.max(110,(n.w||180)-40);n.h=Math.max(70,(n.h||110)-30);changed()}],
        ['Delete',()=>{B().notes=B().notes.filter(x=>x.id!==n.id);changed('board.changed',{boardId:id})}]],'Note')};
    makeDraggable(el,n);return el;
  }
  function fileEl(c){
    const f=A.file(c.fileId);const el=document.createElement('div');el.className='fcard '+tiltOf(c.id);place(el,c);
    const img=f&&f.type.startsWith('image/');
    el.innerHTML=\`\${img?\`<img src="\${f.data}" alt="">\`:\`<div class="fbadge">\${f?esc((f.name.split('.').pop()||'file').slice(0,4)):'?'}</div>\`}
      <div class="fname">\${f?esc(f.name):'missing file'}</div>\`;
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Open',()=>f&&window.open(f.data,'_blank')],
        ['Rename…',()=>f&&ask('Rename file','Name',f.name,v=>{f.name=v;changed()})],
        ['Remove from board',()=>{B().files=B().files.filter(x=>x.id!==c.id);changed('board.changed',{boardId:id})}]],f?f.name:'File')};
    makeDraggable(el,c);return el;
  }
  function subEl(sb,i){
    const el=document.createElement('div');el.className='bcard '+tiltOf(sb.id);
    if(sb.bx==null){sb.bx=760;sb.by=60+i*130}
    el.style.left=sb.bx+'px';el.style.top=sb.by+'px';
    const s=A.stats(sb.id);
    el.innerHTML=\`<div style="display:flex;align-items:center;gap:6px;font-family:var(--scrawl);font-size:20px">\${appIcon('boards',18)}<span>\${esc(sb.name)}</span></div>
      <div class="dim">\${s.done}/\${s.total} done</div><div class="bar" style="margin-top:4px"><i style="width:\${s.pct}%"></i></div>\`;
    el.ondblclick=()=>openBoard(sb.id);
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Open',()=>openBoard(sb.id)],
        ['Rename…',()=>ask('Rename board','Name',sb.name,v=>{sb.name=v;changed('board.changed',{boardId:sb.id})})],
        ['Delete board',()=>confirmBox('Delete board',\`Delete “\${sb.name}” and everything on it?\`,()=>{A.deleteBoard(sb.id);changed()})]],sb.name)};
    drag(el,(dx,dy)=>{el.style.left=(el._x+dx/cam().z)+'px';el.style.top=(el._y+dy/cam().z)+'px'},
      ()=>{el._x=sb.bx;el._y=sb.by},m=>{if(!m)return;sb.bx=parseFloat(el.style.left);sb.by=parseFloat(el.style.top);save()});
    return el;
  }
  holder.addEventListener('contextmenu',e=>{
    if(e.target.closest('.card,.note,.fcard,.bcard'))return;
    const p=toBoard(e);
    menu(e.clientX,e.clientY,[
      ['New task here',()=>{const t=A.addTask(id,'New task');t.x=p.x;t.y=p.y;changed('board.changed',{boardId:id})}],
      ['New sticky note here',()=>{const n=A.addNote(id,'');n.x=p.x;n.y=p.y;changed('board.changed',{boardId:id})}],
      ['New sub-board',()=>newBoardDialog(id)],
      ['Attach file…',()=>pickFiles(fs=>{fs.forEach(f=>{const c=A.addFileCard(id,f.id);c.x=p.x;c.y=p.y});changed('board.changed',{boardId:id})})],
      '-',
      ['New script for this board',()=>{const s=newScript(id);openScriptEditor(s.id)}],
      ['Scripts on this board',()=>boardScriptsMenu(e,id)],
      '-',['Arrange in a grid',()=>{Layout.grid(A.objects(B()));changed('board.changed',{boardId:id})}],
      ['Fit to view',fit],
    ],B().name);
  });

  win.api={render,flash(oid){const el=$(\`[data-tid="\${oid}"]\`,canvas)||canvas.querySelector('.card');
      if(el){el.classList.add('hi');setTimeout(()=>el.classList.remove('hi'),900)}},
    focus(o){const c=cam();c.x=holder.clientWidth/2-o.x*c.z-100;c.y=holder.clientHeight/2-o.y*c.z-60;applyCam();save()},
    pan(dx,dy){const c=cam();c.x+=dx;c.y+=dy;applyCam()},
    zoom(z){cam().z=clamp(z,.2,3);applyCam();renderTool()},boardId:id};
  render();
}

/* ---------- shared pickers ---------- */
function newBoardDialog(parent){
  modal('New board',\`<label class="fld">Name</label><input type="text" id="_n" value="New board">
    <label class="fld">Lives inside</label><select id="_p">\${Object.values(S.boards).map(b=>
      \`<option value="\${b.id}" \${b.id===parent?'selected':''}>\${esc(A.path(b.id).map(x=>x.name).join(' › '))}</option>\`).join('')}
      <option value="">— top level —</option></select>
    <label class="fld">Projects</label><div class="row" id="_pr">\${S.projects.length?S.projects.map(p=>
      \`<button class="tag" data-p="\${p.id}">\${esc(p.name)}</button>\`).join(''):'<span class="dim">No projects yet.</span>'}</div>\`,
    [['Cancel',null],['Create board',b=>{
      const nm=$('#_n',b).value.trim()||'New board',pa=$('#_p',b).value||null;
      const pr=$$('#_pr .tag.on',b).map(x=>x.dataset.p);
      const nb=A.createBoard(nm,pa,pr);changed();openBoard(nb.id);},1]],
    b=>{$$('#_pr .tag',b).forEach(t=>t.onclick=()=>t.classList.toggle('on'))});
}
function pickBoard(title,cb,exclude){
  menu(innerWidth/2-120,120,Object.values(S.boards).filter(b=>b.id!==exclude)
    .map(b=>[A.path(b.id).map(x=>x.name).join(' › '),()=>cb(b.id)]),title);
}
function pickTask(boardId,exclude,cb){
  const b=A.board(boardId),list=b.tasks.filter(t=>t.id!==exclude);
  if(!list.length)return toast('No other tasks on this board.');
  menu(innerWidth/2-120,120,list.map(t=>[t.title,()=>cb(t)]),'Choose a task');
}
function pickFiles(cb){
  const inp=document.createElement('input');inp.type='file';inp.multiple=true;
  inp.onchange=()=>{const out=[],list=[...inp.files];let left=list.length;
    if(!left)return;
    list.forEach(f=>{
      if(f.size>1_800_000){toast(\`\${f.name} is too big to store (1.8 MB max).\`);if(!--left&&out.length)cb(out);return}
      const r=new FileReader();
      r.onload=()=>{const rec={id:uid('f'),name:f.name,type:f.type||'application/octet-stream',size:f.size,data:r.result,added:Date.now()};
        S.files.push(rec);out.push(rec);if(!--left)cb(out);};
      r.readAsDataURL(f);});};
  inp.click();
}
function taskDetails(t,boardId){
  modal('Task details',\`<label class="fld">Title</label><input type="text" id="_t" value="\${esc(t.title)}">
    <label class="fld">Description</label><textarea id="_d" rows="3">\${esc(t.desc)}</textarea>
    <div class="row"><div style="flex:1"><label class="fld">Priority</label>
      <select id="_p">\${PRIOS.map(p=>\`<option \${t.priority===p?'selected':''}>\${p}</option>\`).join('')}</select></div>
      <div style="flex:1"><label class="fld">Status</label>
      <select id="_s">\${STATUSES.map(p=>\`<option \${t.status===p?'selected':''}>\${p}</option>\`).join('')}</select></div></div>
    <label class="fld">Deadline</label><input type="date" id="_dl" value="\${t.deadline||''}">
    <label class="fld">Tags (comma separated)</label><input type="text" id="_g" value="\${esc(t.tags.join(', '))}">\`,
    [['Cancel',null],['Save task',b=>{
      const nv=$('#_t',b).value.trim();if(nv&&nv!==t.title)A.rename(t.id,nv);
      t.desc=$('#_d',b).value;t.priority=$('#_p',b).value;t.status=$('#_s',b).value;
      t.deadline=$('#_dl',b).value;t.tags=$('#_g',b).value.split(',').map(s=>s.trim()).filter(Boolean);
      if(t.status==='done')A.setDone(t.id,true);
      changed('board.changed',{boardId});},1]]);
}
</script>
<script>
/* ============================ node registry ============================ */
const NODES={};
const CATS=['Events','Board','Task','Query','Sort','Layout','Logic','Data','Notes','Files','Projects','Calendar','Ask','Visual','Script'];
function def(o){o.ins||=[];o.outs||=[];o.params||=[];NODES[o.t]=o;return o}
const X=(id,l)=>({id,l,x:true});
const P=(id,l)=>({id,l});
const toItems=(list,k='task')=>list.map(o=>({o,k}));
const asArr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
const num=v=>{const n=parseFloat(v);return isNaN(n)?0:n};
function tomorrowISO(){const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10)}

/* ---------- events ---------- */
const EVENTS=[
  ['ev.boardOpened','Board Opened','board.opened'],['ev.boardChanged','Board Changed','board.changed'],
  ['ev.taskCreated','Task Created','task.created'],['ev.taskCompleted','Task Completed','task.completed'],
  ['ev.taskUncompleted','Task Uncompleted','task.uncompleted'],['ev.taskMoved','Task Moved','task.moved'],
  ['ev.taskRenamed','Task Renamed','task.renamed'],['ev.taskDeleted','Task Deleted','task.deleted'],
  ['ev.subCreated','Subtask Created','subtask.created'],['ev.noteCreated','Note Created','note.created'],
  ['ev.fileAttached','File Attached','file.attached'],['ev.boardCreated','Board Created','board.created'],
  ['ev.projectChanged','Project Changed','project.changed'],['ev.manual','Manual Run','script.manual'],
  ['ev.enabled','Script Enabled','script.enabled'],['ev.disabled','Script Disabled','script.disabled'],
  ['ev.eventCreated','Calendar Event Created','cal.created'],['ev.eventStarting','Event Starting','cal.starting'],
  ['ev.eventFinished','Event Finished','cal.finished'],
];
EVENTS.forEach(([t,title,sig])=>def({t,cat:'Events',title,ev:sig,
  outs:[X('out','when'),P('task','task'),P('board','board')],
  run:C=>({next:'out'}),data:C=>({task:C.payload.task||null,board:C.payload.boardId?A.board(C.payload.boardId):C.board()})}));
def({t:'ev.timer',cat:'Events',title:'Timer',ev:'timer',params:[{id:'sec',l:'Every N seconds',k:'num',d:60}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.interval',cat:'Events',title:'Recurring Interval',ev:'interval',params:[{id:'min',l:'Every N minutes',k:'num',d:15}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.at',cat:'Events',title:'Scheduled Time',ev:'at',params:[{id:'time',l:'At time',k:'time',d:'09:00'}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.morning',cat:'Events',title:'Every Morning',ev:'at',params:[{id:'time',l:'At time',k:'time',d:'08:00'}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.weekly',cat:'Events',title:'Every Monday',ev:'weekly',
  params:[{id:'day',l:'Day',k:'sel',o:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],d:'Monday'},{id:'time',l:'At',k:'time',d:'08:00'}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.custom',cat:'Events',title:'Custom Event',ev:'custom',params:[{id:'name',l:'Event name',k:'text',d:'ping'}],
  outs:[X('out','when'),P('data','data')],run:()=>({next:'out'}),data:C=>({data:C.payload.data??null})});

/* ---------- board ---------- */
def({t:'b.current',cat:'Board',title:'Get Current Board',pure:1,outs:[P('board','board'),P('name','name')],
  run:C=>{const b=C.board();return{board:b,name:b?b.name:''}}});
def({t:'b.get',cat:'Board',title:'Get Board',pure:1,params:[{id:'name',l:'Board name',k:'text'}],outs:[P('board','board')],
  run:(C,I,p)=>({board:Object.values(S.boards).find(b=>b.name.toLowerCase()===String(p.name||'').toLowerCase())||null})});
def({t:'b.create',cat:'Board',title:'Create Board',ins:[X('in'),P('name','name')],outs:[X('out'),P('board','board')],
  params:[{id:'name',l:'Name',k:'text',d:'New board'},{id:'child',l:'Inside current board',k:'check',d:true}],
  run:(C,I,p)=>{if(!C.can('boards'))return C.deny('create boards');
    const b=C.mut(()=>A.createBoard(I.name||p.name,p.child?C.boardId:null),{name:I.name||p.name});
    C.plan('Create 1 board');return{next:'out',out:{board:b}}}});
def({t:'b.delete',cat:'Board',title:'Delete Board',ins:[X('in'),P('board','board')],outs:[X('out')],
  run:(C,I)=>{const b=I.board;if(!b)return{next:'out'};
    if(!C.can('boards')||!C.can('delete'))return C.deny('delete boards');
    C.plan('Delete board “'+b.name+'”');C.mut(()=>A.deleteBoard(b.id));return{next:'out'}}});
def({t:'b.rename',cat:'Board',title:'Rename Board',ins:[X('in'),P('board','board'),P('name','name')],outs:[X('out')],
  params:[{id:'name',l:'New name',k:'text'}],
  run:(C,I,p)=>{const b=I.board||C.board();if(b&&C.can('boards')){C.plan('Rename board');C.mut(()=>b.name=String(I.name??p.name??b.name))}return{next:'out'}}});
def({t:'b.move',cat:'Board',title:'Move Board',ins:[X('in'),P('board','board'),P('parent','into')],outs:[X('out')],
  run:(C,I)=>{const b=I.board||C.board();if(b&&I.parent&&C.can('boards'))C.mut(()=>b.parent=I.parent.id);return{next:'out'}}});
def({t:'b.dup',cat:'Board',title:'Duplicate Board',ins:[X('in'),P('board','board')],outs:[X('out'),P('board','copy')],
  run:(C,I)=>{const b=I.board||C.board();const c=C.can('boards')?C.mut(()=>A.dupBoard(b.id)):null;
    C.plan('Duplicate a board');return{next:'out',out:{board:c}}}});
def({t:'b.parent',cat:'Board',title:'Get Parent Board',pure:1,ins:[P('board','board')],outs:[P('board','parent')],
  run:(C,I)=>({board:A.parent((I.board||C.board()).id)})});
def({t:'b.children',cat:'Board',title:'Get Child Boards',pure:1,ins:[P('board','board')],outs:[P('list','boards'),P('count','count')],
  run:(C,I)=>{const l=A.children((I.board||C.board()).id);return{list:l,count:l.length}}});
def({t:'b.tags',cat:'Board',title:'Get Project Tags',pure:1,ins:[P('board','board')],outs:[P('list','tags')],
  run:(C,I)=>({list:(I.board||C.board()).projects.map(A.projName)})});
def({t:'b.addTag',cat:'Board',title:'Add Project Tag',ins:[X('in'),P('board','board')],outs:[X('out')],
  params:[{id:'name',l:'Project',k:'proj'}],
  run:(C,I,p)=>{const b=I.board||C.board(),pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    if(b&&pr&&!b.projects.includes(pr.id))C.mut(()=>b.projects.push(pr.id));return{next:'out'}}});
def({t:'b.rmTag',cat:'Board',title:'Remove Project Tag',ins:[X('in'),P('board','board')],outs:[X('out')],
  params:[{id:'name',l:'Project',k:'proj'}],
  run:(C,I,p)=>{const b=I.board||C.board(),pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    if(b&&pr)C.mut(()=>b.projects=b.projects.filter(x=>x!==pr.id));return{next:'out'}}});
def({t:'b.stats',cat:'Board',title:'Board Statistics',pure:1,ins:[P('board','board')],
  outs:[P('done','done'),P('total','total'),P('pct','percent')],
  run:(C,I)=>{const s=A.stats((I.board||C.board()).id);return{done:s.done,total:s.total,pct:s.pct}}});

/* ---------- task getters ---------- */
const GETTERS=[
  ['t.all','All Tasks',ts=>ts],['t.done','Completed Tasks',ts=>ts.filter(t=>t.done)],
  ['t.open','Incomplete Tasks',ts=>ts.filter(t=>!t.done)],
  ['t.overdue','Overdue Tasks',ts=>ts.filter(A.isOverdue)],
  ['t.today','Tasks Due Today',ts=>ts.filter(t=>t.deadline===todayISO())],
  ['t.tomorrow','Tasks Due Tomorrow',ts=>ts.filter(t=>t.deadline===tomorrowISO())],
  ['t.nodl','Tasks Without Deadlines',ts=>ts.filter(t=>!t.deadline)],
];
GETTERS.forEach(([t,title,fn])=>def({t,cat:'Task',title,pure:1,ins:[P('board','board')],
  outs:[P('list','tasks'),P('count','count')],
  run:(C,I)=>{const b=I.board||C.board();const l=fn(b?b.tasks.slice():[]);return{list:l,count:l.length}}}));
def({t:'t.tagged',cat:'Task',title:'Tasks With Tag',pure:1,ins:[P('board','board')],params:[{id:'tag',l:'Tag',k:'text'}],
  outs:[P('list','tasks')],run:(C,I,p)=>({list:(I.board||C.board()).tasks.filter(t=>t.tags.includes(p.tag))})});
def({t:'t.project',cat:'Task',title:'Get Project Tasks',pure:1,params:[{id:'name',l:'Project',k:'proj'}],
  outs:[P('list','tasks'),P('count','count')],
  run:(C,I,p)=>{const pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    const l=pr?Object.values(S.boards).filter(b=>b.projects.includes(pr.id)).flatMap(b=>b.tasks):[];
    return{list:l,count:l.length}}});
def({t:'t.allBoards',cat:'Task',title:'Tasks Across All Boards',pure:1,outs:[P('list','tasks'),P('count','count')],
  run:()=>{const l=Object.values(S.boards).flatMap(b=>b.tasks);return{list:l,count:l.length}}});

/* ---------- task actions ---------- */
def({t:'t.create',cat:'Task',title:'Create Task',ins:[X('in'),P('title','title'),P('board','board')],
  outs:[X('out'),P('task','task')],params:[{id:'title',l:'Title',k:'text',d:'New task'},{id:'prio',l:'Priority',k:'sel',o:PRIOS,d:'normal'}],
  run:(C,I,p)=>{if(!C.can('tasks'))return C.deny('create tasks');
    const b=I.board||C.board();C.plan('Create 1 task');
    const t=C.mut(()=>A.addTask(b.id,String(I.title??p.title),{priority:p.prio}),{title:I.title??p.title});
    return{next:'out',out:{task:t}}}});
def({t:'t.delete',cat:'Task',title:'Delete Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{const list=asArr(I.task);if(!C.can('tasks')||!C.can('delete'))return C.deny('delete tasks');
    C.plan(\`Delete \${list.length} task(s)\`);C.mut(()=>list.forEach(t=>t&&A.delTask(t.id)));return{next:'out'}}});
def({t:'t.dup',cat:'Task',title:'Duplicate Task',ins:[X('in'),P('task','task')],outs:[X('out'),P('task','copy')],
  run:(C,I)=>{const t=asArr(I.task)[0];let c=null;
    if(t&&C.can('tasks'))c=C.mut(()=>{const f=A.findTask(t.id);const n=JSON.parse(JSON.stringify(t));n.id=uid('t');n.x+=24;n.y+=24;
      f.board.tasks.push(n);Bus.emit('task.created',{boardId:f.board.id,task:n});return n});
    return{next:'out',out:{task:c}}}});
def({t:'t.rename',cat:'Task',title:'Rename Task',ins:[X('in'),P('task','task'),P('name','name')],outs:[X('out')],
  params:[{id:'name',l:'New name',k:'text'}],
  run:(C,I,p)=>{asArr(I.task).forEach(t=>t&&C.can('tasks')&&C.mut(()=>A.rename(t.id,String(I.name??p.name))));
    C.plan('Rename task(s)');return{next:'out'}}});
def({t:'t.complete',cat:'Task',title:'Complete Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{const l=asArr(I.task);C.plan(\`Complete \${l.length} task(s)\`);
    if(C.can('tasks'))C.mut(()=>l.forEach(t=>t&&A.setDone(t.id,true)));return{next:'out'}}});
def({t:'t.uncomplete',cat:'Task',title:'Uncomplete Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{const l=asArr(I.task);if(C.can('tasks'))C.mut(()=>l.forEach(t=>t&&A.setDone(t.id,false)));return{next:'out'}}});
def({t:'t.toBoard',cat:'Task',title:'Move Task to Board',ins:[X('in'),P('task','task'),P('board','board')],outs:[X('out')],
  params:[{id:'name',l:'Board name (if unlinked)',k:'text'}],
  run:(C,I,p)=>{const l=asArr(I.task);
    const to=I.board||Object.values(S.boards).find(b=>b.name.toLowerCase()===String(p.name||'').toLowerCase());
    if(!to)return{next:'out'};C.plan(\`Move \${l.length} task(s) to “\${to.name}”\`);
    if(C.can('tasks'))C.mut(()=>l.forEach(t=>t&&A.moveTaskToBoard(t.id,to.id)));return{next:'out'}}});
def({t:'t.sub',cat:'Task',title:'Create Subtask',ins:[X('in'),P('task','task'),P('title','title')],outs:[X('out')],
  params:[{id:'title',l:'Title',k:'text',d:'Subtask'}],
  run:(C,I,p)=>{asArr(I.task).forEach(t=>t&&C.mut(()=>A.addSub(t.id,String(I.title??p.title))));return{next:'out'}}});
def({t:'t.rmSub',cat:'Task',title:'Remove Subtasks',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'only',l:'Only completed',k:'check',d:true}],
  run:(C,I,p)=>{asArr(I.task).forEach(t=>t&&C.mut(()=>t.subtasks=p.only?t.subtasks.filter(s=>!s.done):[]));return{next:'out'}}});
def({t:'t.prio',cat:'Task',title:'Set Priority',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'v',l:'Priority',k:'sel',o:PRIOS,d:'high'}],
  run:(C,I,p)=>{const l=asArr(I.task);C.plan(\`Set priority on \${l.length} task(s)\`);
    C.mut(()=>l.forEach(t=>t&&(t.priority=p.v)));return{next:'out'}}});
def({t:'t.status',cat:'Task',title:'Set Status',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'v',l:'Status',k:'sel',o:STATUSES,d:'doing'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&(t.status=p.v)));return{next:'out'}}});
def({t:'t.desc',cat:'Task',title:'Set Description',ins:[X('in'),P('task','task'),P('text','text')],outs:[X('out')],
  params:[{id:'text',l:'Description',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&(t.desc=String(I.text??p.text??''))));return{next:'out'}}});
def({t:'t.deadline',cat:'Task',title:'Set Deadline',ins:[X('in'),P('task','task'),P('date','date')],outs:[X('out')],
  params:[{id:'date',l:'Date',k:'date'},{id:'rel',l:'Or relative',k:'sel',o:['—','today','tomorrow','+7 days'],d:'—'}],
  run:(C,I,p)=>{let d=I.date||p.date||'';
    if(p.rel==='today')d=todayISO();else if(p.rel==='tomorrow')d=tomorrowISO();
    else if(p.rel==='+7 days'){const x=new Date();x.setDate(x.getDate()+7);d=x.toISOString().slice(0,10)}
    C.mut(()=>asArr(I.task).forEach(t=>t&&(t.deadline=d)));return{next:'out'}}});
def({t:'t.addTag',cat:'Task',title:'Add Tag',ins:[X('in'),P('task','task')],outs:[X('out')],params:[{id:'tag',l:'Tag',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&!t.tags.includes(p.tag)&&t.tags.push(p.tag)));return{next:'out'}}});
def({t:'t.rmTag',cat:'Task',title:'Remove Tag',ins:[X('in'),P('task','task')],outs:[X('out')],params:[{id:'tag',l:'Tag',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&(t.tags=t.tags.filter(g=>g!==p.tag))));return{next:'out'}}});
def({t:'t.sync',cat:'Task',title:'Sync Task States',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'by',l:'Match tasks elsewhere by',k:'sel',o:['same title'],d:'same title'}],
  run:(C,I)=>{asArr(I.task).forEach(t=>{if(!t)return;
    Object.values(S.boards).forEach(b=>b.tasks.forEach(o=>{
      if(o.id!==t.id&&o.title===t.title&&o.done!==t.done)C.mut(()=>A.setDone(o.id,t.done))}))});
    C.plan('Synchronise matching tasks');return{next:'out'}}});

/* ---------- query ---------- */
const OPS=['equals','does not equal','greater than','less than','greater or equal','less or equal','contains','starts with','is empty','exists'];
function cmp(v,op,b){
  const sv=v==null?'':String(v).toLowerCase(),sb=String(b??'').toLowerCase();
  switch(op){
    case 'equals':return sv===sb;case 'does not equal':return sv!==sb;
    case 'greater than':return num(v)>num(b);case 'less than':return num(v)<num(b);
    case 'greater or equal':return num(v)>=num(b);case 'less or equal':return num(v)<=num(b);
    case 'contains':return sv.includes(sb);case 'starts with':return sv.startsWith(sb);
    case 'is empty':return sv==='';case 'exists':return sv!=='';}
  return false;
}
const FIELDS=['title','done','priority','status','deadline','tags','description','subtask count','overdue'];
function fieldOf(t,f){switch(f){case 'title':return t.title;case 'done':return t.done?'true':'false';
  case 'priority':return t.priority;case 'status':return t.status;case 'deadline':return t.deadline;
  case 'tags':return (t.tags||[]).join(',');case 'description':return t.desc;
  case 'subtask count':return (t.subtasks||[]).length;case 'overdue':return A.isOverdue(t)?'true':'false';}return ''}
def({t:'q.filter',cat:'Query',title:'Filter',pure:1,ins:[P('list','list')],outs:[P('list','matches'),P('count','count'),P('rest','rejected')],
  params:[{id:'f',l:'Field',k:'sel',o:FIELDS,d:'title'},{id:'op',l:'Condition',k:'sel',o:OPS,d:'contains'},{id:'v',l:'Value',k:'text'}],
  run:(C,I,p)=>{const l=asArr(I.list),m=l.filter(t=>cmp(fieldOf(t,p.f),p.op,p.v));
    return{list:m,count:m.length,rest:l.filter(t=>!m.includes(t))}}});
def({t:'q.and',cat:'Query',title:'AND',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  run:(C,I)=>({v:!!truthy(I.a)&&!!truthy(I.b)})});
def({t:'q.or',cat:'Query',title:'OR',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  run:(C,I)=>({v:!!truthy(I.a)||!!truthy(I.b)})});
def({t:'q.not',cat:'Query',title:'NOT',pure:1,ins:[P('a','value')],outs:[P('v','result')],run:(C,I)=>({v:!truthy(I.a)})});
def({t:'q.compare',cat:'Query',title:'Compare',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  params:[{id:'op',l:'Condition',k:'sel',o:OPS,d:'equals'},{id:'b',l:'…value',k:'text'}],
  run:(C,I,p)=>({v:cmp(I.a,p.op,I.b??p.b)})});
def({t:'q.intersect',cat:'Query',title:'Both Lists (AND)',pure:1,ins:[P('a','list a'),P('b','list b')],outs:[P('list','list')],
  run:(C,I)=>({list:asArr(I.a).filter(x=>asArr(I.b).includes(x))})});
function truthy(v){return Array.isArray(v)?v.length>0:!!v&&v!=='false'}

/* ---------- sort ---------- */
const SORTK=['name','priority','deadline','creation date','completion status','status','tags','subtask count'];
function sortKey(t,k){switch(k){case 'name':return (t.title||'').toLowerCase();
  case 'priority':return PRIOS.indexOf(t.priority);case 'deadline':return t.deadline||'9999';
  case 'creation date':return t.created||0;case 'completion status':return t.done?1:0;
  case 'status':return STATUSES.indexOf(t.status);case 'tags':return (t.tags||[]).join(',');
  case 'subtask count':return (t.subtasks||[]).length;}return 0}
def({t:'s.sort',cat:'Sort',title:'Sort',pure:1,ins:[P('list','list')],outs:[P('list','sorted')],
  params:[{id:'k',l:'By',k:'sel',o:SORTK,d:'priority'},{id:'dir',l:'Order',k:'sel',o:['ascending','descending'],d:'descending'}],
  run:(C,I,p)=>{const l=asArr(I.list).slice().sort((a,b)=>{const x=sortKey(a,p.k),y=sortKey(b,p.k);
      return x<y?-1:x>y?1:0});if(p.dir==='descending')l.reverse();return{list:l}}});
def({t:'s.group',cat:'Sort',title:'Group By',pure:1,ins:[P('list','list')],outs:[P('groups','groups'),P('count','groups #')],
  params:[{id:'k',l:'Field',k:'sel',o:FIELDS,d:'priority'}],
  run:(C,I,p)=>{const g={};asArr(I.list).forEach(t=>{(g[fieldOf(t,p.k)]||=[]).push(t)});
    return{groups:Object.entries(g).map(([k,v])=>({key:k,items:v})),count:Object.keys(g).length}}});
def({t:'s.unique',cat:'Sort',title:'Unique',pure:1,ins:[P('list','list')],outs:[P('list','list')],
  params:[{id:'k',l:'By field',k:'sel',o:FIELDS,d:'title'}],
  run:(C,I,p)=>{const seen=new Set(),out=[];asArr(I.list).forEach(t=>{const k=fieldOf(t,p.k);
    if(!seen.has(k)){seen.add(k);out.push(t)}});return{list:out}}});

/* ---------- layout ---------- */
const LAYOUTS=[['l.grid','Arrange Grid','grid'],['l.rows','Arrange Rows','rows'],['l.cols','Arrange Columns','columns'],
 ['l.vert','Arrange Vertically','vertical'],['l.horiz','Arrange Horizontally','horizontal'],
 ['l.circle','Arrange Circle','circle'],['l.spiral','Arrange Spiral','spiral'],['l.stack','Stack','stack'],['l.pack','Pack','pack']];
LAYOUTS.forEach(([t,title,fn])=>def({t,cat:'Layout',title,ins:[X('in'),P('list','items')],outs:[X('out')],
  params:[{id:'x',l:'Start X',k:'num',d:60},{id:'y',l:'Start Y',k:'num',d:60},{id:'cols',l:'Columns / gap',k:'num',d:0}],
  run:(C,I,p)=>{const l=asArr(I.list);if(!l.length)return{next:'out'};
    C.plan(\`Rearrange \${l.length} card(s)\`);
    C.mut(()=>Layout[fn](toItems(l),{x:num(p.x),y:num(p.y),cols:num(p.cols)||undefined,gap:num(p.cols)||undefined}));
    C.touch();return{next:'out'}}}));
def({t:'l.align',cat:'Layout',title:'Align',ins:[X('in'),P('list','items')],outs:[X('out')],
  params:[{id:'how',l:'Edge',k:'sel',o:['left','right','top','bottom','middle'],d:'left'}],
  run:(C,I,p)=>{C.mut(()=>Layout.align(toItems(asArr(I.list)),{how:p.how}));C.touch();return{next:'out'}}});
def({t:'l.dist',cat:'Layout',title:'Distribute',ins:[X('in'),P('list','items')],outs:[X('out')],
  params:[{id:'axis',l:'Axis',k:'sel',o:['x','y'],d:'x'}],
  run:(C,I,p)=>{C.mut(()=>Layout.distribute(toItems(asArr(I.list)),{axis:p.axis}));C.touch();return{next:'out'}}});
def({t:'l.move',cat:'Layout',title:'Move Object',ins:[X('in'),P('obj','object')],outs:[X('out')],
  params:[{id:'x',l:'X',k:'num',d:80},{id:'y',l:'Y',k:'num',d:80},{id:'rel',l:'Relative',k:'check',d:false}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.obj).forEach(o=>{if(!o)return;
    o.x=p.rel?o.x+num(p.x):num(p.x);o.y=p.rel?o.y+num(p.y):num(p.y)}));C.touch();return{next:'out'}}});
def({t:'l.resize',cat:'Layout',title:'Resize Note',ins:[X('in'),P('obj','note')],outs:[X('out')],
  params:[{id:'w',l:'Width',k:'num',d:200},{id:'h',l:'Height',k:'num',d:140}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.obj).forEach(o=>{if(o){o.w=num(p.w);o.h=num(p.h)}}));C.touch();return{next:'out'}}});
def({t:'l.urgent',cat:'Layout',title:'Move to Urgent Area',ins:[X('in'),P('list','tasks')],outs:[X('out')],
  run:(C,I)=>{const l=asArr(I.list);C.plan(\`Move \${l.length} task(s) to the urgent corner\`);
    C.mut(()=>Layout.vertical(toItems(l),{x:-260,y:60,gap:140}));C.touch();return{next:'out'}}});

/* ---------- logic ---------- */
def({t:'x.if',cat:'Logic',title:'If / Else',ins:[X('in'),P('cond','condition')],outs:[X('then','then'),X('else','else')],
  run:(C,I)=>({next:truthy(I.cond)?'then':'else'})});
def({t:'x.switch',cat:'Logic',title:'Switch / Case',ins:[X('in'),P('v','value')],
  outs:[X('a','case A'),X('b','case B'),X('c','case C'),X('out','default')],
  params:[{id:'a',l:'Case A',k:'text'},{id:'b',l:'Case B',k:'text'},{id:'c',l:'Case C',k:'text'}],
  run:(C,I,p)=>{const v=String(I.v??'').toLowerCase();
    return{next:v===String(p.a??'').toLowerCase()?'a':v===String(p.b??'').toLowerCase()?'b':v===String(p.c??'').toLowerCase()?'c':'out'}}});
def({t:'x.foreach',cat:'Logic',title:'For Each',ins:[X('in'),P('list','list')],
  outs:[X('body','each'),X('out','after'),P('item','item'),P('i','index')],loop:'list',
  run:()=>({next:'out'})});
def({t:'x.repeat',cat:'Logic',title:'Repeat',ins:[X('in')],outs:[X('body','each'),X('out','after'),P('i','index')],
  params:[{id:'n',l:'Times',k:'num',d:3}],loop:'count',run:()=>({next:'out'})});
def({t:'x.while',cat:'Logic',title:'While',ins:[X('in'),P('cond','condition')],outs:[X('body','each'),X('out','after')],
  loop:'while',run:()=>({next:'out'})});
def({t:'x.delay',cat:'Logic',title:'Delay',ins:[X('in')],outs:[X('out')],params:[{id:'ms',l:'Milliseconds',k:'num',d:400}],
  run:async(C,I,p)=>{if(!C.dry)await new Promise(r=>setTimeout(r,clamp(num(p.ms),0,5000)));return{next:'out'}}});
def({t:'x.wait',cat:'Logic',title:'Wait Seconds',ins:[X('in')],outs:[X('out')],params:[{id:'s',l:'Seconds',k:'num',d:1}],
  run:async(C,I,p)=>{if(!C.dry)await new Promise(r=>setTimeout(r,clamp(num(p.s)*1000,0,10000)));return{next:'out'}}});
def({t:'x.stop',cat:'Logic',title:'Stop',ins:[X('in')],outs:[],run:C=>{C.log('Stopped.');return{stop:true}}});
def({t:'x.log',cat:'Logic',title:'Log Message',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'m',l:'Message',k:'text',d:'…'}],
  run:(C,I,p)=>{C.log(String(p.m)+(I.v!==undefined?' → '+fmt(I.v):''));return{next:'out'}}});

/* ---------- data ---------- */
function fmt(v){if(v==null)return '—';if(Array.isArray(v))return \`[\${v.length} item\${v.length===1?'':'s'}]\`;
  if(typeof v==='object')return v.title||v.name||'{object}';return String(v)}
def({t:'d.text',cat:'Data',title:'Text',pure:1,outs:[P('v','text')],params:[{id:'v',l:'Value',k:'text',d:''}],run:(C,I,p)=>({v:String(p.v??'')})});
def({t:'d.num',cat:'Data',title:'Number',pure:1,outs:[P('v','number')],params:[{id:'v',l:'Value',k:'num',d:0}],run:(C,I,p)=>({v:num(p.v)})});
def({t:'d.bool',cat:'Data',title:'Boolean',pure:1,outs:[P('v','value')],params:[{id:'v',l:'True',k:'check',d:true}],run:(C,I,p)=>({v:!!p.v})});
def({t:'d.date',cat:'Data',title:'Date',pure:1,outs:[P('v','date')],
  params:[{id:'mode',l:'Which',k:'sel',o:['today','tomorrow','fixed'],d:'today'},{id:'v',l:'Fixed date',k:'date'}],
  run:(C,I,p)=>({v:p.mode==='today'?todayISO():p.mode==='tomorrow'?tomorrowISO():(p.v||todayISO())})});
def({t:'d.time',cat:'Data',title:'Time Now',pure:1,outs:[P('v','time'),P('hour','hour'),P('weekday','weekday')],
  run:()=>{const d=new Date();return{v:d.toTimeString().slice(0,5),hour:d.getHours(),
    weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]}}});
def({t:'d.get',cat:'Data',title:'Get Property',pure:1,ins:[P('obj','object')],outs:[P('v','value')],
  params:[{id:'f',l:'Field',k:'sel',o:FIELDS,d:'title'}],
  run:(C,I,p)=>{const o=Array.isArray(I.obj)?I.obj[0]:I.obj;return{v:o?fieldOf(o,p.f):''}}});
def({t:'d.var.get',cat:'Data',title:'Get Variable',pure:1,outs:[P('v','value')],params:[{id:'n',l:'Name',k:'text',d:'count'}],
  run:(C,I,p)=>({v:C.vars[p.n]})});
def({t:'d.var.set',cat:'Data',title:'Set Variable',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'n',l:'Name',k:'text',d:'count'},{id:'v',l:'Fallback value',k:'text'}],
  run:(C,I,p)=>{C.vars[p.n]=I.v!==undefined?I.v:p.v;return{next:'out'}}});
const AGG=[['d.count','Count',l=>l.length],['d.sum','Sum',l=>l.reduce((a,b)=>a+num(b),0)],
  ['d.avg','Average',l=>l.length?l.reduce((a,b)=>a+num(b),0)/l.length:0],
  ['d.min','Minimum',l=>l.length?Math.min(...l.map(num)):0],['d.max','Maximum',l=>l.length?Math.max(...l.map(num)):0]];
AGG.forEach(([t,title,fn])=>def({t,cat:'Data',title,pure:1,ins:[P('list','list')],outs:[P('v','value')],
  params:t==='d.count'?[]:[{id:'f',l:'Field',k:'sel',o:FIELDS,d:'subtask count'}],
  run:(C,I,p)=>({v:fn(asArr(I.list).map(x=>p&&p.f?fieldOf(x,p.f):x))})}));
def({t:'d.math',cat:'Data',title:'Maths',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  params:[{id:'op',l:'Operation',k:'sel',o:['+','−','×','÷','%'],d:'+'},{id:'b',l:'…or b',k:'num',d:0}],
  run:(C,I,p)=>{const a=num(I.a),b=I.b!==undefined?num(I.b):num(p.b);
    return{v:p.op==='+'?a+b:p.op==='−'?a-b:p.op==='×'?a*b:p.op==='÷'?(b?a/b:0):(b?a%b:0)}}});
def({t:'d.format',cat:'Data',title:'Format Text',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','text')],
  params:[{id:'tpl',l:'Template ({a} {b})',k:'text',d:'{a} of {b}'}],
  run:(C,I,p)=>({v:String(p.tpl).replace(/\\{a\\}/g,fmt(I.a)).replace(/\\{b\\}/g,fmt(I.b))})});
def({t:'d.merge',cat:'Data',title:'Merge Lists',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('list','list')],
  run:(C,I)=>({list:[...asArr(I.a),...asArr(I.b)]})});
def({t:'d.split',cat:'Data',title:'Split Text',pure:1,ins:[P('v','text')],outs:[P('list','parts')],
  params:[{id:'sep',l:'Separator',k:'text',d:','}],
  run:(C,I,p)=>({list:String(I.v??'').split(p.sep||',').map(s=>s.trim())})});
def({t:'d.replace',cat:'Data',title:'Replace Text',pure:1,ins:[P('v','text')],outs:[P('v','text')],
  params:[{id:'a',l:'Find',k:'text'},{id:'b',l:'Replace with',k:'text'}],
  run:(C,I,p)=>({v:String(I.v??'').split(p.a||'').join(p.b||'')})});
def({t:'d.first',cat:'Data',title:'First / Nth Item',pure:1,ins:[P('list','list')],outs:[P('v','item')],
  params:[{id:'i',l:'Index (0 = first)',k:'num',d:0}],run:(C,I,p)=>({v:asArr(I.list)[num(p.i)]??null})});

/* ---------- notes & files ---------- */
def({t:'n.create',cat:'Notes',title:'Create Note',ins:[X('in'),P('text','text'),P('board','board')],outs:[X('out'),P('note','note')],
  params:[{id:'text',l:'Text',k:'text',d:'Note'}],
  run:(C,I,p)=>{if(!C.can('notes'))return C.deny('create notes');
    C.plan('Create 1 note');const n=C.mut(()=>A.addNote((I.board||C.board()).id,String(I.text??p.text)),{});
    return{next:'out',out:{note:n}}}});
def({t:'n.find',cat:'Notes',title:'Find Notes',pure:1,ins:[P('board','board')],outs:[P('list','notes')],
  params:[{id:'q',l:'Text contains',k:'text'}],
  run:(C,I,p)=>({list:(I.board||C.board()).notes.filter(n=>!p.q||n.text.toLowerCase().includes(String(p.q).toLowerCase()))})});
def({t:'n.edit',cat:'Notes',title:'Edit Note',ins:[X('in'),P('note','note'),P('text','text')],outs:[X('out')],
  params:[{id:'text',l:'New text',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.note).forEach(n=>n&&(n.text=String(I.text??p.text??''))));C.touch();return{next:'out'}}});
def({t:'n.summary',cat:'Notes',title:'Update Summary Note',ins:[X('in'),P('text','text')],outs:[X('out')],
  params:[{id:'title',l:'Note starts with',k:'text',d:'Summary'},{id:'text',l:'Fallback text',k:'text'}],
  run:(C,I,p)=>{const b=C.board();const txt=String(I.text??p.text??'');
    let n=b.notes.find(x=>x.text.startsWith(p.title));
    C.plan('Update 1 summary note');
    C.mut(()=>{if(!n)n=A.addNote(b.id,'');n.text=p.title+'\\n'+txt});C.touch();return{next:'out'}}});
def({t:'n.color',cat:'Notes',title:'Change Note Colour',ins:[X('in'),P('note','note')],outs:[X('out')],
  params:[{id:'i',l:'Colour 1–6',k:'num',d:1}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.note).forEach(n=>n&&(n.color=NOTE_COLORS[clamp(num(p.i)-1,0,5)])));C.touch();return{next:'out'}}});
def({t:'n.delete',cat:'Notes',title:'Delete Notes',ins:[X('in'),P('note','note')],outs:[X('out')],
  run:(C,I)=>{if(!C.can('delete'))return C.deny('delete notes');const b=C.board();
    const ids=asArr(I.note).map(n=>n&&n.id);C.plan(\`Delete \${ids.length} note(s)\`);
    C.mut(()=>b.notes=b.notes.filter(n=>!ids.includes(n.id)));C.touch();return{next:'out'}}});
def({t:'f.find',cat:'Files',title:'Find Files',pure:1,ins:[P('board','board')],outs:[P('list','file cards'),P('count','count')],
  params:[{id:'q',l:'Name contains',k:'text'}],
  run:(C,I,p)=>{const b=I.board||C.board();
    const l=b.files.filter(c=>{const f=A.file(c.fileId);return f&&(!p.q||f.name.toLowerCase().includes(String(p.q).toLowerCase()))});
    return{list:l,count:l.length}}});
def({t:'f.rename',cat:'Files',title:'Rename File',ins:[X('in'),P('file','file card'),P('name','name')],outs:[X('out')],
  params:[{id:'name',l:'New name',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.file).forEach(c=>{const f=c&&A.file(c.fileId);if(f)f.name=String(I.name??p.name??f.name)}));return{next:'out'}}});
def({t:'f.group',cat:'Files',title:'Group Files',ins:[X('in'),P('file','file cards')],outs:[X('out')],
  params:[{id:'x',l:'X',k:'num',d:820},{id:'y',l:'Y',k:'num',d:60}],
  run:(C,I,p)=>{C.mut(()=>Layout.grid(toItems(asArr(I.file),'file'),{x:num(p.x),y:num(p.y),cols:2,gx:170,gy:160}));C.touch();return{next:'out'}}});
def({t:'f.delete',cat:'Files',title:'Remove File Cards',ins:[X('in'),P('file','file cards')],outs:[X('out')],
  run:(C,I)=>{if(!C.can('delete'))return C.deny('remove files');const b=C.board();
    const ids=asArr(I.file).map(c=>c&&c.id);C.plan(\`Remove \${ids.length} file card(s)\`);
    C.mut(()=>b.files=b.files.filter(c=>!ids.includes(c.id)));C.touch();return{next:'out'}}});

/* ---------- projects ---------- */
def({t:'p.boards',cat:'Projects',title:'Find Project Boards',pure:1,params:[{id:'name',l:'Project',k:'proj'}],
  outs:[P('list','boards'),P('count','count')],
  run:(C,I,p)=>{const pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    const l=pr?Object.values(S.boards).filter(b=>b.projects.includes(pr.id)):[];return{list:l,count:l.length}}});
def({t:'p.aggregate',cat:'Projects',title:'Aggregate Across Boards',pure:1,ins:[P('list','boards')],
  outs:[P('list','tasks'),P('done','done'),P('total','total'),P('pct','percent')],
  run:(C,I)=>{const bs=asArr(I.list),tasks=bs.flatMap(b=>b.tasks||[]);
    const done=tasks.filter(t=>t.done).length;
    return{list:tasks,done,total:tasks.length,pct:tasks.length?Math.round(done/tasks.length*100):0}}});
def({t:'p.summary',cat:'Projects',title:'Create Project Summary',ins:[X('in'),P('list','boards')],outs:[X('out'),P('text','text')],
  run:(C,I)=>{const bs=asArr(I.list);
    const text=bs.map(b=>{const s=A.stats(b.id);return \`\${b.name}: \${s.done}/\${s.total} (\${s.pct}%)\`}).join('\\n');
    C.plan('Write a project summary');return{next:'out',out:{text}}}});

/* ---------- calendar ---------- */
def({t:'c.create',cat:'Calendar',title:'Create Calendar Event',ins:[X('in'),P('title','title'),P('date','date')],outs:[X('out')],
  params:[{id:'title',l:'Title',k:'text',d:'Event'},{id:'date',l:'Date',k:'date'},{id:'time',l:'Time',k:'time',d:'09:00'}],
  run:(C,I,p)=>{C.plan('Create 1 calendar event');
    C.mut(()=>{S.events.push({id:uid('e'),title:String(I.title??p.title),date:I.date||p.date||todayISO(),time:p.time,project:null});
      Bus.emit('cal.created',{})});return{next:'out'}}});
def({t:'c.upcoming',cat:'Calendar',title:'Upcoming Events',pure:1,outs:[P('list','events'),P('count','count')],
  params:[{id:'days',l:'Within N days',k:'num',d:7}],
  run:(C,I,p)=>{const end=new Date();end.setDate(end.getDate()+num(p.days));const e2=end.toISOString().slice(0,10);
    const l=S.events.filter(e=>e.date>=todayISO()&&e.date<=e2);return{list:l,count:l.length}}});

/* ---------- interaction ---------- */
def({t:'u.message',cat:'Ask',title:'Show Message',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'m',l:'Message',k:'text',d:'Done.'}],
  run:async(C,I,p)=>{const msg=String(p.m)+(I.v!==undefined?' '+fmt(I.v):'');
    C.log(msg);if(!C.dry)await new Promise(r=>modal('Script says',\`<p>\${esc(msg)}</p>\`,[['OK',()=>r(),1]]));return{next:'out'}}});
def({t:'u.notify',cat:'Ask',title:'Show Notification',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'m',l:'Message',k:'text',d:'Script finished'}],
  run:(C,I,p)=>{const m=String(p.m)+(I.v!==undefined?' '+fmt(I.v):'');C.log(m);if(!C.dry)toast(m);return{next:'out'}}});
def({t:'u.confirm',cat:'Ask',title:'Confirm',ins:[X('in')],outs:[X('then','yes'),X('else','no')],
  params:[{id:'m',l:'Question',k:'text',d:'Continue?'}],
  run:async(C,I,p)=>{if(C.dry)return{next:'then'};
    const ok=await new Promise(r=>modal('Script asks',\`<p>\${esc(p.m)}</p>\`,[['No',()=>r(false)],['Yes',()=>r(true),1]]));
    return{next:ok?'then':'else'}}});
def({t:'u.input',cat:'Ask',title:'Ask User',ins:[X('in')],outs:[X('out'),P('v','answer')],
  params:[{id:'m',l:'Question',k:'text',d:'Name?'},{id:'kind',l:'Answer',k:'sel',o:['text','number'],d:'text'}],
  run:async(C,I,p)=>{if(C.dry)return{next:'out',out:{v:''}};
    const v=await new Promise(r=>modal('Script asks',
      \`<label class="fld">\${esc(p.m)}</label><input type="\${p.kind==='number'?'number':'text'}" id="_a">\`,
      [['Cancel',()=>r(null)],['OK',b=>r($('#_a',b).value),1]]));
    return{next:'out',out:{v:p.kind==='number'?num(v):v}}}});
def({t:'u.choose',cat:'Ask',title:'Choose Option',ins:[X('in')],outs:[X('out'),P('v','choice')],
  params:[{id:'o',l:'Options (comma separated)',k:'text',d:'A, B, C'}],
  run:async(C,I,p)=>{const opts=String(p.o).split(',').map(s=>s.trim()).filter(Boolean);
    if(C.dry)return{next:'out',out:{v:opts[0]}};
    const v=await new Promise(r=>modal('Choose',\`<div class="row">\${opts.map((o,i)=>
      \`<button class="btn" data-i="\${i}">\${esc(o)}</button>\`).join('')}</div>\`,[['Cancel',()=>r(null)]],
      b=>$$('[data-i]',b).forEach(x=>x.onclick=()=>{r(opts[+x.dataset.i]);b.closest('#scrim').remove()})));
    return{next:'out',out:{v}}}});
def({t:'u.chooseTask',cat:'Ask',title:'Choose Task',ins:[X('in'),P('list','from')],outs:[X('out'),P('task','task')],
  run:async(C,I)=>{const l=asArr(I.list).length?asArr(I.list):C.board().tasks;
    if(C.dry||!l.length)return{next:'out',out:{task:l[0]||null}};
    const t=await new Promise(r=>modal('Choose a task',\`<div class="list">\${l.map((t,i)=>
      \`<button class="item" data-i="\${i}">\${esc(t.title)}</button>\`).join('')}</div>\`,[['Cancel',()=>r(null)]],
      b=>$$('[data-i]',b).forEach(x=>x.onclick=()=>{r(l[+x.dataset.i]);b.closest('#scrim').remove()})));
    return{next:'out',out:{task:t}}}});
def({t:'u.chooseBoard',cat:'Ask',title:'Choose Board',ins:[X('in')],outs:[X('out'),P('board','board')],
  run:async(C)=>{const l=Object.values(S.boards);if(C.dry)return{next:'out',out:{board:l[0]}};
    const b=await new Promise(r=>modal('Choose a board',\`<div class="list">\${l.map((b,i)=>
      \`<button class="item" data-i="\${i}">\${esc(A.path(b.id).map(x=>x.name).join(' › '))}</button>\`).join('')}</div>\`,
      [['Cancel',()=>r(null)]],bd=>$$('[data-i]',bd).forEach(x=>x.onclick=()=>{r(l[+x.dataset.i]);bd.closest('#scrim').remove()})));
    return{next:'out',out:{board:b}}}});

/* ---------- visual ---------- */
def({t:'v.highlight',cat:'Visual',title:'Highlight Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{if(!C.dry)asArr(I.task).forEach(t=>t&&C.view()&&C.view().flash(t.id));return{next:'out'}}});
def({t:'v.focus',cat:'Visual',title:'Focus Camera',ins:[X('in'),P('obj','object')],outs:[X('out')],
  run:(C,I)=>{const o=asArr(I.obj)[0];if(o&&!C.dry&&C.view())C.view().focus(o);return{next:'out'}}});
def({t:'v.zoom',cat:'Visual',title:'Zoom Camera',ins:[X('in')],outs:[X('out')],params:[{id:'z',l:'Zoom %',k:'num',d:100}],
  run:(C,I,p)=>{if(!C.dry&&C.view())C.view().zoom(num(p.z)/100);return{next:'out'}}});
def({t:'v.pan',cat:'Visual',title:'Pan Camera',ins:[X('in')],outs:[X('out')],
  params:[{id:'x',l:'dX',k:'num',d:100},{id:'y',l:'dY',k:'num',d:0}],
  run:(C,I,p)=>{if(!C.dry&&C.view())C.view().pan(num(p.x),num(p.y));return{next:'out'}}});
def({t:'v.flash',cat:'Visual',title:'Flash Object',ins:[X('in'),P('obj','object')],outs:[X('out')],
  run:(C,I)=>{if(!C.dry&&C.view())asArr(I.obj).forEach(o=>o&&C.view().flash(o.id));return{next:'out'}}});
def({t:'v.open',cat:'Visual',title:'Open Board Window',ins:[X('in'),P('board','board')],outs:[X('out')],
  run:(C,I)=>{const b=I.board||C.board();if(b&&!C.dry)openBoard(b.id);return{next:'out'}}});

/* ---------- script io ---------- */
def({t:'sc.input',cat:'Script',title:'Script Input',pure:1,outs:[P('v','value')],params:[{id:'n',l:'Input name',k:'text',d:'Tasks'}],
  run:(C,I,p)=>({v:C.inputs[p.n]})});
def({t:'sc.output',cat:'Script',title:'Script Output',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'n',l:'Output name',k:'text',d:'Result'}],
  run:(C,I,p)=>{C.outputs[p.n]=I.v;C.log('Output '+p.n+' = '+fmt(I.v));return{next:'out'}}});
def({t:'sc.emit',cat:'Script',title:'Emit Custom Event',ins:[X('in'),P('v','data')],outs:[X('out')],
  params:[{id:'n',l:'Event name',k:'text',d:'ping'}],
  run:(C,I,p)=>{C.log('Emitted “'+p.n+'”');if(!C.dry)setTimeout(()=>Bus.emit('custom:'+p.n,{data:I.v}),0);return{next:'out'}}});
def({t:'sc.run',cat:'Script',title:'Run Another Script',ins:[X('in'),P('v','input')],outs:[X('out'),P('v','outputs')],
  params:[{id:'n',l:'Script name',k:'text'}],
  run:async(C,I,p)=>{const s=Object.values(S.scripts).find(x=>x.name===p.n);
    if(!s||C.dry)return{next:'out',out:{v:null}};
    const r=await runScript(s,{},{Tasks:I.v});return{next:'out',out:{v:r&&r.outputs}}}});
</script>
<script>
/* ============================ interpreter ============================ */
class Ctx{
  constructor(script,opt,inputs){
    this.s=script;this.opt=opt||{};this.payload=this.opt.payload||{};
    this.boardId=this.opt.boardId||this.payload.boardId||script.boardId||'b_home';
    if(!S.boards[this.boardId])this.boardId='b_home';
    this.vars={};(script.vars||[]).forEach(v=>this.vars[v.name]=v.value);
    this.inputs=inputs||{};this.outputs={};this.dry=!!this.opt.dry;
    this.plans=[];this.logs=[];this.steps=0;this.tick=0;this.outCache={};this.loopVals={};
    this.counts={};this.errs=0;this.dirtyBoard=false;
  }
  board(){return S.boards[this.boardId]}
  view(){const w=WINS.get('board:'+this.boardId);return w&&w.api}
  node(id){return this.s.nodes.find(n=>n.id===id)}
  nextOf(id,port){const e=this.s.edges.find(e=>e.from.n===id&&e.from.port===port);return e?e.to.n:null}
  paramsOf(n){const d=NODES[n.t],p={};(d.params||[]).forEach(q=>p[q.id]=(n.p&&n.p[q.id]!==undefined)?n.p[q.id]:q.d);return p}
  inputsOf(n){const d=NODES[n.t],o={};
    (d.ins||[]).filter(i=>!i.x).forEach(i=>{o[i.id]=this.evalIn(n,i.id)});return o}
  evalIn(n,port){
    const e=this.s.edges.find(e=>e.to.n===n.id&&e.to.port===port);
    if(!e)return undefined;
    const src=this.node(e.from.n);if(!src)return undefined;
    return this.outValue(src,e.from.port);
  }
  outValue(src,port){
    const d=NODES[src.t];if(!d)return undefined;
    if(d.loop){const lv=this.loopVals[src.id]||{};return port==='item'?lv.item:port==='i'?lv.i:undefined}
    if(d.data)return d.data(this)[port];
    if(d.pure){
      this._pc=this._pc||{};
      const k=src.id+':'+this.tick;
      if(!(k in this._pc)){
        let v;try{v=d.run(this,this.inputsOf(src),this.paramsOf(src),src)}catch(e){this.err(src,e);v={}}
        this._pc[k]=v||{};this.fire(src.id,true);
      }
      return this._pc[k][port];
    }
    return (this.outCache[src.id]||{})[port];
  }
  fire(id,quiet){this.counts[id]=(this.counts[id]||0)+1;if(this.opt.onFire&&!quiet)this.opt.onFire(id)}
  log(m){const line=m;this.logs.push(line);if(this.opt.onLog)this.opt.onLog(line,false)}
  err(n,e){this.errs++;const m=(NODES[n.t]?NODES[n.t].title:n.t)+': '+(e&&e.message||e);
    this.logs.push(m);if(this.opt.onLog)this.opt.onLog(m,true);if(this.opt.onErr)this.opt.onErr(n.id)}
  can(perm){return (this.s.perms||{})[perm]!==false}
  deny(what){this.log('Blocked: this script is not allowed to '+what+'.');return{next:'out'}}
  plan(t){this.plans.push(t)}
  mut(fn,dryVal){if(this.dry)return dryVal||null;this.dirtyBoard=true;return fn()}
  touch(){this.dirtyBoard=true}
  async execChain(id){
    let guard=0;
    while(id&&guard++<800&&this.steps<5000){
      const n=this.node(id);if(!n)break;
      const d=NODES[n.t];if(!d){this.log('Unknown node '+n.t);break}
      this.steps++;this.tick++;this._pc={};this.fire(n.id);
      let res;
      try{res=d.loop?await this.runLoop(n,d):await d.run(this,this.inputsOf(n),this.paramsOf(n),n)}
      catch(e){this.err(n,e);break}
      if(res&&res.out)this.outCache[n.id]=res.out;
      if(res&&res.stop)return 'stop';
      id=this.nextOf(n.id,(res&&res.next)||'out');
    }
    if(this.steps>=5000)this.log('Stopped: step limit reached.');
    return 'ok';
  }
  async runLoop(n,d){
    const body=this.nextOf(n.id,'body');
    if(d.loop==='list'){
      const items=asArr(this.evalIn(n,'list'));
      for(let i=0;i<items.length&&i<600;i++){
        this.loopVals[n.id]={item:items[i],i};this.tick++;
        if(body&&await this.execChain(body)==='stop')return{stop:true};
      }
    }else if(d.loop==='count'){
      const t=clamp(num(this.paramsOf(n).n),0,500);
      for(let i=0;i<t;i++){this.loopVals[n.id]={item:i,i};this.tick++;
        if(body&&await this.execChain(body)==='stop')return{stop:true}}
    }else{
      let i=0;
      while(truthy(this.evalIn(n,'cond'))&&i<500){this.loopVals[n.id]={item:i,i:i++};this.tick++;
        if(body&&await this.execChain(body)==='stop')return{stop:true}}
    }
    return{next:'out'};
  }
}
const RUNNING=new Set();
async function runScript(script,opt={},inputs={}){
  if(!script||!script.nodes)return null;
  const C=new Ctx(script,opt,inputs);
  const starts=opt.start?[opt.start]:script.nodes.filter(n=>NODES[n.t]&&NODES[n.t].ev).map(n=>n.id);
  if(!starts.length){C.log('No trigger node — add one from Events.');return C}
  RUNNING.add(script.id);
  const t0=performance.now();
  try{for(const s of starts)await C.execChain(s)}finally{RUNNING.delete(script.id)}
  C.ms=Math.round(performance.now()-t0);
  if(!C.dry){
    script.runs=(script.runs||0)+1;script.lastRun=Date.now();script.lastMs=C.ms;
    script.err=C.errs>0;
    script.log=[...(script.log||[]),...C.logs.map(l=>({t:Date.now(),m:l}))].slice(-60);
    if(C.dirtyBoard){save();refresh()}else save();
  }
  return C;
}
/* ---------- triggers ---------- */
const FIRE_GUARD={depth:0,last:{}};
function scriptsFor(evName,payload){
  return Object.values(S.scripts).filter(s=>s.enabled&&!RUNNING.has(s.id)&&(s.nodes||[]).some(n=>{
    const d=NODES[n.t];if(!d||!d.ev)return false;
    if(d.ev==='custom')return evName==='custom:'+((n.p&&n.p.name)||'ping');
    if(d.ev!==evName)return false;
    if(s.boardId&&payload&&payload.boardId&&payload.boardId!==s.boardId)return false;
    return true;}));
}
function triggerNodes(s,evName){
  return (s.nodes||[]).filter(n=>{const d=NODES[n.t];
    return d&&d.ev&&(d.ev==='custom'?evName==='custom:'+((n.p&&n.p.name)||'ping'):d.ev===evName)});
}
Bus.on('*',(ev,payload)=>{
  if(ev.startsWith('script.'))return;
  if(FIRE_GUARD.depth>3)return;
  const list=scriptsFor(ev,payload);
  list.forEach(s=>{
    const key=s.id+ev;const now=Date.now();
    if(FIRE_GUARD.last[key]&&now-FIRE_GUARD.last[key]<180)return;
    FIRE_GUARD.last[key]=now;
    setTimeout(async()=>{
      FIRE_GUARD.depth++;
      try{for(const n of triggerNodes(s,ev))
        await runScript(s,{start:n.id,payload,boardId:payload&&payload.boardId||s.boardId,
          onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)});}
      finally{FIRE_GUARD.depth--}
    },60);
  });
});
/* timers */
const TIMER_LAST={};
setInterval(()=>{
  const now=new Date(),hm=now.toTimeString().slice(0,5),day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  Object.values(S.scripts).forEach(s=>{
    if(!s.enabled||RUNNING.has(s.id))return;
    (s.nodes||[]).forEach(n=>{
      const d=NODES[n.t];if(!d||!d.ev)return;const p=n.p||{},k=s.id+n.id;
      let go=false;
      if(d.ev==='timer'){const ms=clamp(num(p.sec??60),5,86400)*1000;
        if(Date.now()-(TIMER_LAST[k]||0)>=ms)go=true}
      else if(d.ev==='interval'){const ms=clamp(num(p.min??15),1,1440)*60000;
        if(Date.now()-(TIMER_LAST[k]||0)>=ms)go=true}
      else if(d.ev==='at'){if(hm===(p.time||'09:00')&&TIMER_LAST[k]!==hm+todayISO())
        {TIMER_LAST[k]=hm+todayISO();go=true;runScript(s,{start:n.id,onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)});return}}
      else if(d.ev==='weekly'){if(day===(p.day||'Monday')&&hm===(p.time||'08:00')&&TIMER_LAST[k]!==hm+todayISO())
        {TIMER_LAST[k]=hm+todayISO();runScript(s,{start:n.id,onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)});return}}
      if(go){TIMER_LAST[k]=Date.now();
        runScript(s,{start:n.id,onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)})}
    });
  });
  const hm2=new Date().toTimeString().slice(0,5);
  S.events.filter(e=>e.date===todayISO()&&e.time===hm2&&!e._fired).forEach(e=>{e._fired=1;Bus.emit('cal.starting',{event:e})});
},10000);

/* ---------- script helpers ---------- */
function newScript(boardId,name){
  const s={id:uid('sc'),name:name||'New script',boardId:boardId||null,enabled:false,
    nodes:[{id:uid('n'),t:'ev.manual',x:60,y:80,p:{}}],edges:[],vars:[],runs:0,log:[],
    perms:{tasks:true,boards:true,notes:true,files:true,delete:false}};
  S.scripts[s.id]=s;save();refresh();return s;
}
function previewScript(s,after){
  runScript(s,{dry:true}).then(C=>{
    const lines=C.plans.length?C.plans:['Nothing would change — this script only reads.'];
    modal('Script preview',\`<p class="dim">“\${esc(s.name)}” would:</p>
      <div class="list" style="margin-top:8px">\${lines.map(l=>\`<div class="item">✓ \${esc(l)}</div>\`).join('')}</div>
      \${C.errs?\`<p style="color:var(--accent)">\${C.errs} node(s) reported an error during the dry run.</p>\`:''}\`,
      after?[['Cancel',null],['Enable script',()=>after(),1]]:[['Close',null]]);
  });
}
function scriptStateLabel(s){return s.err?'⚠ Error':RUNNING.has(s.id)?'● Running':s.enabled?'● Enabled':'○ Disabled'}
function boardScriptsMenu(e,boardId){
  const list=Object.values(S.scripts).filter(s=>s.boardId===boardId);
  menu(e.clientX,e.clientY,[
    ...list.map(s=>[scriptStateLabel(s)+'  '+s.name,()=>openScriptEditor(s.id)]),
    ...(list.length?['-']:[]),
    ['+ New script for this board',()=>{const s=newScript(boardId);openScriptEditor(s.id)}],
    ['Use a template…',()=>templateMenu(boardId)],
    ['Open Scripts manager',openScripts],
  ],'Scripts on this board');
}
/* ---------- templates ---------- */
const TEMPLATES={
  'Automatic Task Organiser':b=>chain(b,[['ev.taskCreated',{}],['t.all',{}],['s.sort',{k:'priority',dir:'descending'}],
    ['s.sort',{k:'deadline',dir:'ascending'}],['l.grid',{x:60,y:60,cols:4}]],'Keeps every card sorted and laid out.'),
  'Overdue Task Manager':b=>chain(b,[['ev.morning',{time:'08:00'}],['t.overdue',{}],['t.prio',{v:'urgent'}],
    ['l.urgent',{}],['u.notify',{m:'Overdue tasks moved to the urgent column'}]],'Sweeps overdue work into one place each morning.'),
  'Completed Task Cleaner':b=>{
    if(!Object.values(S.boards).some(x=>x.name==='Archive'))A.createBoard('Archive',b||null,[]);
    return chain(b,[['ev.weekly',{day:'Sunday',time:'20:00'}],['t.done',{}],
      ['t.toBoard',{name:'Archive'}]],'Files finished tasks into an Archive board every Sunday.');},
  'Project Dashboard':b=>{const s=chain(b,[['ev.boardChanged',{}],['b.stats',{}],
    ['d.format',{tpl:'{a} of {b} tasks done'}],['n.summary',{title:'Summary'}]],'Keeps a live summary note on the board.');
    const st=s.nodes.find(n=>n.t==='b.stats'),f=s.nodes.find(n=>n.t==='d.format');
    if(st&&f)s.edges.push({id:uid('e'),from:{n:st.id,port:'total'},to:{n:f.id,port:'b'}});
    return s;},
};
function chain(boardId,steps,desc){
  const s=newScript(boardId,'');s.nodes=[];s.desc=desc;
  let prev=null,dataPrev=null,y=70;
  steps.forEach(([t,p],i)=>{
    const d=NODES[t];const n={id:uid('n'),t,x:60+i*236,y:y+(i%2)*40,p:Object.assign({},p)};
    s.nodes.push(n);
    const hasExecIn=(d.ins||[]).some(x=>x.x);
    if(prev&&hasExecIn)s.edges.push({id:uid('e'),from:{n:prev,port:'out'},to:{n:n.id,port:'in'}});
    if(hasExecIn||d.ev)prev=n.id;
    const dIn=(d.ins||[]).find(x=>!x.x&&(x.id==='list'||x.id==='task'||x.id==='text'||x.id==='a'));
    if(dataPrev&&dIn)s.edges.push({id:uid('e'),from:{n:dataPrev.n,port:dataPrev.port},to:{n:n.id,port:dIn.id}});
    const dOut=(d.outs||[]).find(x=>!x.x&&(x.id==='list'||x.id==='task'||x.id==='done'||x.id==='text'||x.id==='v'));
    if(dOut)dataPrev={n:n.id,port:dOut.id};
  });
  save();return s;
}
function templateMenu(boardId){
  menu(innerWidth/2-140,140,Object.keys(TEMPLATES).map(k=>[k,()=>{
    const s=TEMPLATES[k](boardId);s.name=k;save();refresh();openScriptEditor(s.id);
    toast('Template added. Check the preview, then enable it.');}]),'Script templates');
}
/* live editor hooks */
const LIVE={};
function liveFire(sid,nid){const f=LIVE[sid];f&&f.fire&&f.fire(nid)}
function liveLog(sid,m,e){const f=LIVE[sid];f&&f.log&&f.log(m,e)}
</script>
<script>
/* ============================ script editor ============================ */
function openScriptEditor(id){
  const s=S.scripts[id];if(!s)return toast('That script is gone.');
  openWin({id:'script:'+id,title:s.name,icon:appIcon('scripts'),w:1040,h:660,render:(b,w)=>buildEditor(b,w,id),
    onClose:()=>delete LIVE[id],refresh:w=>w.api&&w.api.light()});
}
function buildEditor(body,win,id){
  const s=()=>S.scripts[id];
  body.innerHTML=\`<div class="sedit">
    <div class="stool"></div>
    <div class="smain">
      <div class="slib"></div>
      <div class="sholder"><div class="scanvas"><svg class="wires" width="6000" height="4000"></svg></div></div>
      <div class="sside"></div>
    </div>
    <div class="slog"></div></div>\`;
  const tool=$('.stool',body),lib=$('.slib',body),holder=$('.sholder',body),canvas=$('.scanvas',body),
        svg=$('.wires',body),side=$('.sside',body),logEl=$('.slog',body);
  const st={sel:null,cam:s().cam||{x:0,y:0,z:1},link:null,filter:''};
  s().cam=st.cam;

  /* ---- toolbar ---- */
  function renderTool(){
    const sc=s();
    tool.innerHTML=\`<button class="btn sm" data-a="run">▶ Run</button>
      <button class="btn sm \${sc.enabled?'on':''}" data-a="toggle">\${sc.enabled?'Enabled':'Disabled'}</button>
      <button class="btn sm" data-a="more">⋯</button>
      <div style="flex:1"></div>
      <span class="dim">\${esc(sc.name)} · \${sc.boardId?esc((A.board(sc.boardId)||{name:'?'}).name):'any board'} · \${sc.runs||0} runs</span>\`;
    $$('[data-a]',tool).forEach(b=>b.onclick=e=>toolAct(b.dataset.a,e));
  }
  function toolAct(a,e){
    const sc=s();
    const r=e.currentTarget.getBoundingClientRect(),m={clientX:r.left,clientY:r.bottom+4};
    if(a==='run')doRun();
    else if(a==='toggle'){
      if(!sc.enabled)previewScript(sc,()=>{sc.enabled=true;Bus.emit('script.enabled',{});changed();renderTool();toast('Script enabled.')});
      else{sc.enabled=false;Bus.emit('script.disabled',{});changed();renderTool()}}
    else if(a==='more')menu(m.clientX,m.clientY,[
      ['Preview what it will do',()=>previewScript(sc)],
      ['Rename…',()=>ask('Rename script','Name',sc.name,v=>{sc.name=v;win.setTitle(v);changed()})],
      ['Attach to board…',()=>menu(m.clientX+20,m.clientY,[['Any board (global)',()=>{sc.boardId=null;changed();renderTool()}],
        ...Object.values(S.boards).map(b=>[A.path(b.id).map(x=>x.name).join(' › '),()=>{sc.boardId=b.id;changed();renderTool()}])],'Attach to board')],
      ['Permissions…',()=>permsDialog(sc,renderTool)],
      ['Variables ('+(sc.vars||[]).length+')…',()=>varsDialog(sc)],
      ['Tidy layout',()=>{tidy();render()}],
      ['Export file',()=>{const blob=new Blob([JSON.stringify(sc,null,2)],{type:'application/json'});
        const u=URL.createObjectURL(blob),a2=document.createElement('a');a2.href=u;a2.download=sc.name.replace(/\\W+/g,'-')+'.artemis.json';a2.click();
        setTimeout(()=>URL.revokeObjectURL(u),2000)}],
      '-',['Delete script',()=>confirmBox('Delete script',\`Delete “\${sc.name}”?\`,()=>{delete S.scripts[id];closeWin(win);changed()})],
    ],'Script');
  }
  function tidy(){
    const sc=s(),seen=new Set(),cols=[];
    const starts=sc.nodes.filter(n=>NODES[n.t]&&NODES[n.t].ev);
    let layer=starts.length?starts:sc.nodes.slice(0,1);
    while(layer.length&&cols.length<20){
      cols.push(layer);layer.forEach(n=>seen.add(n.id));
      const nx=[];layer.forEach(n=>sc.edges.filter(e=>e.from.n===n.id).forEach(e=>{
        const t=sc.nodes.find(x=>x.id===e.to.n);if(t&&!seen.has(t.id)&&!nx.includes(t))nx.push(t)}));
      layer=nx;
    }
    sc.nodes.filter(n=>!seen.has(n.id)).forEach((n,i)=>{n.x=60;n.y=560+i*80});
    cols.forEach((c,ci)=>c.forEach((n,ri)=>{n.x=60+ci*250;n.y=60+ri*190}));
    save();
  }

  /* ---- library ---- */
  function renderLib(){
    // built once; the search input is never recreated, so typing keeps its cursor position.
    if(!$('#_q',lib)){
      lib.innerHTML=\`<input type="text" placeholder="Find a node…" id="_q" style="margin-bottom:6px"><div id="_nl"></div>\`;
      const q=$('#_q',lib);q.value=st.filter;
      q.oninput=e=>{st.filter=e.target.value;renderNodeList()};
    }
    renderNodeList();
  }
  function renderNodeList(){
    $('#_nl',lib).innerHTML=CATS.map(c=>{
        const list=Object.values(NODES).filter(n=>n.cat===c&&(!st.filter||n.title.toLowerCase().includes(st.filter.toLowerCase())));
        if(!list.length)return '';
        return \`<div class="cat">\${c}</div>\`+list.map(n=>\`<button class="nbtn" data-t="\${n.t}">\${esc(n.title)}</button>\`).join('');
      }).join('')||'<p class="dim" style="padding:4px 7px">No matches.</p>';
    $$('.nbtn',lib).forEach(b=>b.onclick=()=>addNode(b.dataset.t));
  }
  function addNode(t,at){
    const c=st.cam,r=holder.getBoundingClientRect();
    const x=at?at.x:(holder.clientWidth/2-c.x)/c.z-90,y=at?at.y:(holder.clientHeight/2-c.y)/c.z-40;
    const n={id:uid('n'),t,x:Math.round(x),y:Math.round(y),p:{}};
    s().nodes.push(n);st.sel=n.id;save();render();
  }

  /* ---- camera ---- */
  function applyCam(){canvas.style.transform=\`translate(\${st.cam.x}px,\${st.cam.y}px) scale(\${st.cam.z})\`}
  holder.addEventListener('wheel',e=>{e.preventDefault();const r=holder.getBoundingClientRect();
    const px=e.clientX-r.left,py=e.clientY-r.top,f=e.deltaY<0?1.1:1/1.1,z=clamp(st.cam.z*f,.3,2);
    st.cam.x=px-(px-st.cam.x)*(z/st.cam.z);st.cam.y=py-(py-st.cam.y)*(z/st.cam.z);st.cam.z=z;applyCam();drawWires();},{passive:false});
  let pan=null;
  holder.addEventListener('contextmenu',e=>{
    if(e.target.closest('.node'))return;e.preventDefault();
    const r=holder.getBoundingClientRect();
    const at={x:(e.clientX-r.left-st.cam.x)/st.cam.z,y:(e.clientY-r.top-st.cam.y)/st.cam.z};
    menu(e.clientX,e.clientY,[['Add node ▸',()=>catMenu(e,at)],['Tidy layout',()=>{tidy();render()}],
      ['Run now',doRun],['Fit view',()=>{st.cam={x:20,y:20,z:.8};s().cam=st.cam;applyCam();drawWires()}]],'Script canvas');
  });
  function catMenu(e,at){menu(e.clientX+30,e.clientY,CATS.map(c=>[c+' ▸',()=>
    menu(e.clientX+60,e.clientY,Object.values(NODES).filter(n=>n.cat===c).map(n=>[n.title,()=>addNode(n.t,at)]),c)]),'Add node')}
  holder.addEventListener('mousedown',e=>{
    if(e.target.closest('.node')||e.target.classList.contains('dot'))return;
    if(e.button===0&&!st.link){st.sel=null;renderSide();$$('.node',canvas).forEach(n=>n.classList.remove('sel'))}
    pan={sx:e.clientX,sy:e.clientY,cx:st.cam.x,cy:st.cam.y};
  });
  addEventListener('mousemove',e=>{
    if(pan){st.cam.x=pan.cx+(e.clientX-pan.sx);st.cam.y=pan.cy+(e.clientY-pan.sy);applyCam();}
    if(st.link){const p=canvasPt(e);st.link.to=p;drawWires();}
  });
  addEventListener('mouseup',e=>{if(pan){pan=null;save()}
    if(st.link){const dot=e.target.closest&&e.target.closest('.dot');
      if(dot)finishLink(dot);st.link=null;drawWires();}});
  function canvasPt(e){const r=holder.getBoundingClientRect();
    return{x:(e.clientX-r.left-st.cam.x)/st.cam.z,y:(e.clientY-r.top-st.cam.y)/st.cam.z}}

  /* ---- nodes ---- */
  function render(){
    const sc=s();if(!sc)return;win.setTitle(sc.name);
    $$('.node',canvas).forEach(e=>e.remove());
    sc.nodes.forEach(n=>canvas.appendChild(nodeEl(n)));
    applyCam();drawWires();renderTool();renderSide();renderLog();
  }
  function nodeEl(n){
    const d=NODES[n.t]||{title:n.t,ins:[],outs:[],params:[]};
    const el=document.createElement('div');el.className='node'+(st.sel===n.id?' sel':'');
    el.dataset.n=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';
    const pv=(d.params||[]).map(q=>{const v=n.p&&n.p[q.id]!==undefined?n.p[q.id]:q.d;
      return v===''||v===undefined?'':\`<div class="dim">\${esc(q.l)}: \${esc(q.k==='check'?(v?'yes':'no'):String(v))}</div>\`}).join('');
    el.innerHTML=\`<div class="nh"><span class="nh-t">\${d.ev?'⚡ ':''}\${esc(d.title)}</span><span class="cnt"></span></div>
      <div class="nb">
        \${(d.ins||[]).map(i=>\`<div class="port"><span class="dot \${i.x?'ex':''}" data-dir="in" data-port="\${i.id}"></span><span class="pl">\${esc(i.l||i.id)}</span></div>\`).join('')}
        \${pv}
        \${(d.outs||[]).map(o=>\`<div class="port out"><span class="pl">\${esc(o.l||o.id)}</span><span class="dot \${o.x?'ex':''}" data-dir="out" data-port="\${o.id}"></span></div>\`).join('')}
      </div>\`;
    drag($('.nh',el),(dx,dy)=>{el.style.left=(el._x+dx/st.cam.z)+'px';el.style.top=(el._y+dy/st.cam.z)+'px';drawWires();},
      ()=>{el._x=n.x;el._y=n.y;st.sel=n.id;$$('.node',canvas).forEach(x=>x.classList.toggle('sel',x===el));renderSide();},
      m=>{n.x=Math.round(parseFloat(el.style.left));n.y=Math.round(parseFloat(el.style.top));save();drawWires()});
    el.addEventListener('mousedown',e=>{if(e.target.classList.contains('dot'))return;
      st.sel=n.id;$$('.node',canvas).forEach(x=>x.classList.toggle('sel',x===el));renderSide()});
    $$('.dot',el).forEach(dot=>{
      dot.addEventListener('mousedown',e=>{e.stopPropagation();e.preventDefault();
        st.link={from:{n:n.id,port:dot.dataset.port,dir:dot.dataset.dir},to:canvasPt(e)};});
      dot.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();
        const sc=s();const before=sc.edges.length;
        sc.edges=sc.edges.filter(x=>!(x.from.n===n.id&&x.from.port===dot.dataset.port)&&!(x.to.n===n.id&&x.to.port===dot.dataset.port));
        if(sc.edges.length!==before){save();drawWires()}});
    });
    el.oncontextmenu=e=>{if(e.target.classList.contains('dot'))return;
      e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Duplicate',()=>{const c=JSON.parse(JSON.stringify(n));c.id=uid('n');c.x+=30;c.y+=30;s().nodes.push(c);save();render()}],
        ['Disconnect all',()=>{s().edges=s().edges.filter(x=>x.from.n!==n.id&&x.to.n!==n.id);save();render()}],
        ['Delete node',()=>{s().edges=s().edges.filter(x=>x.from.n!==n.id&&x.to.n!==n.id);
          s().nodes=s().nodes.filter(x=>x.id!==n.id);st.sel=null;save();render()}]],d.title)};
    return el;
  }
  function finishLink(dot){
    const a=st.link.from,b={n:dot.closest('.node').dataset.n,port:dot.dataset.port,dir:dot.dataset.dir};
    if(a.dir===b.dir||a.n===b.n)return;
    const from=a.dir==='out'?a:b,to=a.dir==='out'?b:a;
    const dOut=(NODES[s().nodes.find(n=>n.id===from.n).t].outs||[]).find(o=>o.id===from.port);
    const dIn=(NODES[s().nodes.find(n=>n.id===to.n).t].ins||[]).find(o=>o.id===to.port);
    if(!dOut||!dIn||!!dOut.x!==!!dIn.x)return toast('Those two plugs don’t match.');
    const sc=s();
    sc.edges=sc.edges.filter(e=>!(e.to.n===to.n&&e.to.port===to.port));
    if(dOut.x)sc.edges=sc.edges.filter(e=>!(e.from.n===from.n&&e.from.port===from.port));
    sc.edges.push({id:uid('e'),from:{n:from.n,port:from.port},to:{n:to.n,port:to.port}});
    save();drawWires();
  }
  function dotPos(nid,port,dir){
    const nEl=canvas.querySelector(\`.node[data-n="\${nid}"]\`);if(!nEl)return null;
    const d=nEl.querySelector(\`.dot[data-port="\${port}"][data-dir="\${dir}"]\`);if(!d)return null;
    const cr=canvas.getBoundingClientRect(),dr=d.getBoundingClientRect();
    return{x:(dr.left+dr.width/2-cr.left)/st.cam.z,y:(dr.top+dr.height/2-cr.top)/st.cam.z};
  }
  function drawWires(){
    const sc=s();if(!sc)return;
    const segs=sc.edges.map(e=>{
      const a=dotPos(e.from.n,e.from.port,'out'),b=dotPos(e.to.n,e.to.port,'in');
      if(!a||!b)return '';
      const dx=Math.max(40,Math.abs(b.x-a.x)*.5);
      const ex=sc.nodes.find(n=>n.id===e.from.n);
      const isExec=(NODES[ex.t].outs||[]).find(o=>o.id===e.from.port&&o.x);
      return \`<path d="M\${a.x},\${a.y} C\${a.x+dx},\${a.y} \${b.x-dx},\${b.y} \${b.x},\${b.y}" fill="none"
        stroke="\${isExec?'var(--ink)':'var(--accent2)'}" stroke-width="\${isExec?3:2.4}"
        \${isExec?'':'stroke-dasharray="7 5"'} stroke-linecap="round"/>\`;
    }).join('');
    let tmp='';
    if(st.link){const a=dotPos(st.link.from.n,st.link.from.port,st.link.from.dir);
      if(a)tmp=\`<path d="M\${a.x},\${a.y} L\${st.link.to.x},\${st.link.to.y}" stroke="var(--accent)" stroke-width="2.6" fill="none" stroke-dasharray="5 5"/>\`}
    svg.innerHTML=segs+tmp;
  }

  /* ---- inspector ---- */
  function renderSide(){
    const sc=s(),n=sc.nodes.find(x=>x.id===st.sel);
    if(!n){side.innerHTML=\`<div class="cat">Script</div><p class="dim">\${esc(sc.desc||'Pick a node to edit it. Drag from a plug to wire nodes together; right-click a plug to unplug it.')}</p>
      <div class="cat">Trigger</div><p class="dim">\${sc.nodes.filter(x=>NODES[x.t]&&NODES[x.t].ev).map(x=>NODES[x.t].title).join(', ')||'None yet — add one from Events.'}</p>
      <div class="cat">Nodes</div><p class="dim">\${sc.nodes.length} nodes, \${sc.edges.length} connections</p>\`;return}
    const d=NODES[n.t];
    side.innerHTML=\`<div class="cat">\${esc(d.title)}</div>
      <div id="_pp"></div>
      <div class="cat">Debug</div>
      <p class="dim">Ran \${(win.api&&win.api.counts[n.id])||0} time(s) in the last run.<br>
      Inputs: \${(d.ins||[]).filter(i=>!i.x).map(i=>i.l).join(', ')||'—'}<br>
      Outputs: \${(d.outs||[]).filter(i=>!i.x).map(i=>i.l).join(', ')||'—'}</p>
      <button class="btn sm" id="_del">Delete node</button>\`;
    const pp=$('#_pp',side);
    (d.params||[]).forEach(q=>{
      const v=n.p[q.id]!==undefined?n.p[q.id]:q.d;
      const w=document.createElement('div');
      if(q.k==='check'){w.innerHTML=\`<label class="fld">\${esc(q.l)}</label>
        <button class="btn sm \${v?'on':''}" id="c_\${q.id}">\${v?'Yes':'No'}</button>\`;
        w.querySelector('button').onclick=e=>{n.p[q.id]=!v;save();render()};}
      else if(q.k==='sel'||q.k==='proj'){
        const opts=q.k==='proj'?S.projects.map(p=>p.name):q.o;
        w.innerHTML=\`<label class="fld">\${esc(q.l)}</label><select>\${(opts||[]).map(o=>
          \`<option \${String(v)===String(o)?'selected':''}>\${esc(o)}</option>\`).join('')}</select>\`;
        w.querySelector('select').onchange=e=>{n.p[q.id]=e.target.value;save();render()};}
      else{const type=q.k==='num'?'number':q.k==='date'?'date':q.k==='time'?'time':'text';
        w.innerHTML=\`<label class="fld">\${esc(q.l)}</label><input type="\${type}" value="\${esc(v??'')}">\`;
        w.querySelector('input').onchange=e=>{n.p[q.id]=q.k==='num'?num(e.target.value):e.target.value;save();render()};}
      pp.appendChild(w);
    });
    $('#_del',side).onclick=()=>{s().edges=s().edges.filter(x=>x.from.n!==n.id&&x.to.n!==n.id);
      s().nodes=s().nodes.filter(x=>x.id!==n.id);st.sel=null;save();render()};
  }

  /* ---- run + log ---- */
  let lines=[];
  function renderLog(){
    logEl.innerHTML=(lines.length?lines:[['Press “Run now” to watch it work. Nodes light up as they fire.',false]])
      .map(([m,e])=>\`<div class="\${e?'er':''}">\${esc(m)}</div>\`).join('');
    logEl.scrollTop=logEl.scrollHeight;
  }
  function doRun(){
    lines=[];renderLog();
    win.api.counts={};
    runScript(s(),{onFire:nid=>{
        win.api.counts[nid]=(win.api.counts[nid]||0)+1;
        const el=canvas.querySelector(\`.node[data-n="\${nid}"]\`);
        if(el){el.classList.add('fire');const c=$('.cnt',el);if(c)c.textContent='×'+win.api.counts[nid];
          setTimeout(()=>el.classList.remove('fire'),420)}},
      onLog:(m,e)=>{lines.push([m,e]);renderLog()},
      onErr:nid=>{const el=canvas.querySelector(\`.node[data-n="\${nid}"]\`);el&&el.classList.add('err')}})
    .then(C=>{lines.push([\`Finished in \${C.ms}ms · \${C.steps} steps\${C.errs?\` · \${C.errs} error(s)\`:''}\`,C.errs>0]);
      renderLog();renderTool();refresh();});
  }
  win.api={counts:{},light(){renderTool()},render};
  LIVE[id]={fire:nid=>{const el=canvas.querySelector(\`.node[data-n="\${nid}"]\`);
      if(el){el.classList.add('fire');setTimeout(()=>el.classList.remove('fire'),420)}},
    log:(m,e)=>{lines.push([m,e]);renderLog()}};
  renderLib();render();
}
function permsDialog(sc,after){
  const P=sc.perms||(sc.perms={tasks:true,boards:true,notes:true,files:true,delete:false});
  modal('What this script may change',
    ['tasks','boards','notes','files','delete'].map(k=>
      \`<div class="row" style="margin:6px 0"><button class="btn sm \${P[k]?'on':''}" data-k="\${k}">\${P[k]?'Allowed':'Blocked'}</button>
       <span>\${k==='delete'?'Delete things (tasks, notes, boards, files)':'Change '+k}</span></div>\`).join(''),
    [['Done',()=>after&&after(),1]],
    b=>$$('[data-k]',b).forEach(x=>x.onclick=()=>{P[x.dataset.k]=!P[x.dataset.k];
      x.classList.toggle('on',P[x.dataset.k]);x.textContent=P[x.dataset.k]?'Allowed':'Blocked';save()}));
}
function varsDialog(sc){
  sc.vars||=[];
  const draw=b=>{$('#_vl',b).innerHTML=sc.vars.map((v,i)=>
    \`<div class="row" style="margin:5px 0"><input type="text" value="\${esc(v.name)}" data-i="\${i}" data-f="name" style="flex:1">
     <input type="text" value="\${esc(v.value??'')}" data-i="\${i}" data-f="value" style="flex:1">
     <button class="btn sm" data-x="\${i}">✕</button></div>\`).join('')||'<p class="dim">No variables yet.</p>';
    $$('[data-f]',b).forEach(inp=>inp.onchange=()=>{sc.vars[+inp.dataset.i][inp.dataset.f]=inp.value;save()});
    $$('[data-x]',b).forEach(x=>x.onclick=()=>{sc.vars.splice(+x.dataset.x,1);save();draw(b)});};
  modal('Variables',\`<div id="_vl"></div><button class="btn sm" id="_add" style="margin-top:8px">+ Add variable</button>
    <p class="dim" style="margin-top:8px">Read them with “Get Variable”, write them with “Set Variable”.</p>\`,
    [['Done',null,1]],b=>{draw(b);$('#_add',b).onclick=()=>{sc.vars.push({name:'value'+(sc.vars.length+1),value:''});save();draw(b)}});
}
</script>
<script>
/* ============================ scripts manager ============================ */
function openScripts(){
  openWin({id:'scripts',title:'Scripts',icon:appIcon('scripts'),w:700,h:520,render:drawScripts,refresh:w=>drawScripts(w.body,w)});
}
function drawScripts(body,win){
  const list=Object.values(S.scripts);
  body.innerHTML=\`<div class="pad">
    <div class="row"><button class="btn sm" id="_new">+ New script</button>
      <button class="btn sm" id="_tpl">Start from a template</button>
      <button class="btn sm" id="_imp">Import script</button></div>
    <h4 class="sec">All automations</h4>
    <div class="list" id="_l"></div></div>\`;
  $('#_new',body).onclick=()=>{const s=newScript(null);openScriptEditor(s.id)};
  $('#_tpl',body).onclick=()=>templateMenu(null);
  $('#_imp',body).onclick=()=>{
    const i=document.createElement('input');i.type='file';i.accept='.json';
    i.onchange=()=>{const r=new FileReader();r.onload=()=>{
      try{const o=JSON.parse(r.result);o.id=uid('sc');o.enabled=false;S.scripts[o.id]=o;changed();toast('Script imported (disabled until you enable it).')}
      catch(e){toast('That file isn’t a script Artemis can read.')}};r.readAsText(i.files[0])};
    i.click()};
  $('#_l',body).innerHTML=list.length?list.map(s=>\`<div class="item" data-s="\${s.id}">
      <span style="width:88px">\${scriptStateLabel(s)}</span>
      <div style="flex:1"><div>\${esc(s.name)}</div>
        <div class="dim">\${s.boardId?esc((A.board(s.boardId)||{name:'missing board'}).name):'any board'} · \${s.nodes.length} nodes · \${s.runs||0} runs\${s.lastRun?' · last '+new Date(s.lastRun).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):''}</div></div>
      <button class="btn sm" data-a="run">▶</button>
      <button class="btn sm" data-a="edit">Edit</button>
      <button class="btn sm" data-a="more">…</button></div>\`).join('')
    :\`<p class="dim">No scripts yet. A script watches a board and does the tidying for you — build the behaviour once, then use the board normally.</p>\`;
  $$('#_l .item',body).forEach(it=>{
    const s=S.scripts[it.dataset.s];
    $('[data-a="edit"]',it).onclick=()=>openScriptEditor(s.id);
    $('[data-a="run"]',it).onclick=()=>runScript(s).then(C=>toast(\`“\${s.name}” ran \${C.steps} steps\${C.errs?\` with \${C.errs} error(s)\`:''}.\`));
    $('[data-a="more"]',it).onclick=e=>menu(e.clientX,e.clientY,[
      [s.enabled?'Disable':'Enable',()=>{if(s.enabled){s.enabled=false;changed()}else previewScript(s,()=>{s.enabled=true;changed()})}],
      ['Preview actions',()=>previewScript(s)],
      ['Rename…',()=>ask('Rename script','Name',s.name,v=>{s.name=v;changed()})],
      ['Duplicate',()=>{const c=JSON.parse(JSON.stringify(s));c.id=uid('sc');c.name=s.name+' copy';c.enabled=false;S.scripts[c.id]=c;changed()}],
      ['Reuse on another board…',()=>pickBoard('Attach a copy to…',bid=>{
        const c=JSON.parse(JSON.stringify(s));c.id=uid('sc');c.name=s.name+' ('+A.board(bid).name+')';c.boardId=bid;c.enabled=false;
        S.scripts[c.id]=c;changed();toast('Copied. Enable it when you’re ready.')})],
      ['Execution history',()=>modal('History — '+s.name,(s.log||[]).length?
        \`<div class="list">\${s.log.slice(-25).reverse().map(l=>\`<div class="item"><span class="dim" style="width:70px">\${new Date(l.t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span><span>\${esc(l.m)}</span></div>\`).join('')}</div>\`
        :'<p class="dim">This script hasn’t run yet.</p>',[['Close',null]])],
      '-',['Delete',()=>confirmBox('Delete script',\`Delete “\${s.name}”?\`,()=>{delete S.scripts[s.id];changed()})],
    ],s.name);
  });
}

/* ============================ file manager ============================ */
function openFileManager(){
  openWin({id:'files-mgr',title:'File Manager',icon:appIcon('files-mgr'),w:720,h:520,render:drawFM,refresh:w=>drawFM(w.body,w)});
}
function drawFM(body,win){
  const boards=Object.values(S.boards);
  body.innerHTML=\`<div class="pad">
    <div class="row"><button class="btn sm" id="_new">+ New board</button><span class="dim">\${boards.length} boards</span></div>
    <h4 class="sec">Boards</h4><div class="grid" id="_g"></div></div>\`;
  $('#_new',body).onclick=()=>newBoardDialog(null);
  $('#_g',body).innerHTML=boards.map(b=>{const s=A.stats(b.id),kids=A.children(b.id).length;
    return \`<button class="tile" data-b="\${b.id}"><div class="gl">\${appIcon('boards',30)}</div>
      <div class="nm">\${esc(b.name)}</div>
      <div class="bar"><i style="width:\${s.pct}%"></i></div>
      <div class="dim">\${s.done}/\${s.total}\${kids?\` · \${kids} inside\`:''}</div>
      <div class="dim">\${b.projects.map(p=>'#'+esc(A.projName(p))).join(' ')}</div></button>\`}).join('');
  $$('#_g .tile',body).forEach(t=>{
    const b=A.board(t.dataset.b);
    t.onclick=()=>openBoard(b.id);
    t.oncontextmenu=e=>{e.preventDefault();menu(e.clientX,e.clientY,[
      ['Open',()=>openBoard(b.id)],
      ['Rename…',()=>ask('Rename board','Name',b.name,v=>{b.name=v;changed()})],
      ['Move inside…',()=>pickBoard('Move inside…',id=>{b.parent=id;changed()},b.id)],
      ['Move to top level',()=>{b.parent=null;changed()}],
      ['Tag project ▸',()=>menu(e.clientX+30,e.clientY,S.projects.map(p=>[(b.projects.includes(p.id)?'● ':'○ ')+p.name,
        ()=>{b.projects.includes(p.id)?b.projects=b.projects.filter(x=>x!==p.id):b.projects.push(p.id);changed('project.changed',{boardId:b.id})}]))],
      ['Duplicate',()=>{A.dupBoard(b.id);changed()}],
      '-',['Delete',()=>b.id==='b_home'?toast('The Home board stays.'):
        confirmBox('Delete board',\`Delete “\${b.name}” and everything on it?\`,()=>{A.deleteBoard(b.id);changed()})],
    ],b.name)};
  });
}

/* ============================ projects ============================ */
function openProjects(){
  openWin({id:'projects',title:'Projects',icon:appIcon('projects'),w:620,h:480,render:drawProjects,refresh:w=>drawProjects(w.body,w)});
}
function drawProjects(body){
  body.innerHTML=\`<div class="pad"><div class="row"><button class="btn sm" id="_new">+ New project</button></div>
    <h4 class="sec">Project tags</h4><div class="list" id="_l"></div></div>\`;
  $('#_new',body).onclick=()=>ask('New project','Name','',v=>{S.projects.push({id:uid('p'),name:v});changed('project.changed',{})});
  $('#_l',body).innerHTML=S.projects.length?S.projects.map(p=>{
    const bs=Object.values(S.boards).filter(b=>b.projects.includes(p.id));
    const tasks=bs.flatMap(b=>b.tasks),done=tasks.filter(t=>t.done).length;
    return \`<div class="item" data-p="\${p.id}"><div style="flex:1"><div>\${esc(p.name)}</div>
      <div class="dim">\${bs.length} board(s) · \${done}/\${tasks.length} tasks done</div></div>
      <button class="btn sm" data-a="view">View</button><button class="btn sm" data-a="open">Open all</button>
      <button class="btn sm" data-a="ren">✎</button><button class="btn sm" data-a="del">🗑</button></div>\`}).join('')
    :'<p class="dim">No projects yet. A project is a label you can put on any board, however deeply nested.</p>';
  $$('#_l .item',body).forEach(it=>{
    const p=A.project(it.dataset.p);
    $('[data-a="view"]',it).onclick=()=>openProjectView(p.id);
    $('[data-a="open"]',it).onclick=()=>Object.values(S.boards).filter(b=>b.projects.includes(p.id)).forEach(b=>openBoard(b.id));
    $('[data-a="ren"]',it).onclick=()=>ask('Rename project','Name',p.name,v=>{p.name=v;changed('project.changed',{})});
    $('[data-a="del"]',it).onclick=()=>confirmBox('Delete project',\`Remove the “\${p.name}” tag from every board?\`,()=>{
      S.projects=S.projects.filter(x=>x.id!==p.id);
      Object.values(S.boards).forEach(b=>b.projects=b.projects.filter(x=>x!==p.id));changed('project.changed',{})});
  });
}
function openProjectView(pid){
  const p=A.project(pid);if(!p)return;
  openWin({id:'proj:'+pid,title:p.name,icon:appIcon('projects'),w:600,h:460,render:draw,refresh:w=>draw(w.body,w)});
  function draw(body){
    const bs=Object.values(S.boards).filter(b=>b.projects.includes(pid));
    const tasks=bs.flatMap(b=>b.tasks),done=tasks.filter(t=>t.done).length;
    body.innerHTML=\`<div class="pad"><div class="row"><div class="bar" style="flex:1"><i style="width:\${tasks.length?done/tasks.length*100:0}%"></i></div>
      <span class="dim">\${done}/\${tasks.length}</span></div>
      <h4 class="sec">Boards in this project</h4><div class="grid">\${bs.map(b=>{const s=A.stats(b.id);
        return \`<button class="tile" data-b="\${b.id}"><div class="gl">\${appIcon('boards',30)}</div><div class="nm">\${esc(b.name)}</div>
          <div class="bar"><i style="width:\${s.pct}%"></i></div><div class="dim">\${s.done}/\${s.total}</div></button>\`}).join('')
        ||'<p class="dim">Tag a board with this project to see it here.</p>'}</div></div>\`;
    $$('.tile',body).forEach(t=>t.onclick=()=>openBoard(t.dataset.b));
  }
}

/* ============================ graph view ============================ */
function openGraph(){
  openWin({id:'graph',title:'Graph View',icon:appIcon('graph'),w:680,h:600,render:drawGraph,refresh:w=>drawGraph(w.body,w),onResize:()=>{const w=WINS.get('graph');w&&drawGraph(w.body,w)}});
}
function drawGraph(body){
  const W=body.clientWidth||620,H=body.clientHeight||540,cx=W/2,cy=H/2;
  const roots=Object.values(S.boards).filter(b=>!b.parent);
  const pos={},levels=[];
  (function walk(list,depth,a0,a1){
    if(!list.length)return;(levels[depth]||=[]).push(...list);
    const span=(a1-a0)/list.length;
    list.forEach((b,i)=>{const a=a0+span*(i+.5),r=depth*Math.min(W,H)*.18;
      pos[b.id]={x:cx+Math.cos(a-Math.PI/2)*r,y:cy+Math.sin(a-Math.PI/2)*r,a};
      walk(A.children(b.id),depth+1,a0+span*i,a0+span*(i+1));});
  })(roots,0,0,Math.PI*2);
  const links=Object.values(S.boards).filter(b=>b.parent&&pos[b.parent]&&pos[b.id])
    .map(b=>\`<line x1="\${pos[b.parent].x}" y1="\${pos[b.parent].y}" x2="\${pos[b.id].x}" y2="\${pos[b.id].y}"
      stroke="var(--line)" stroke-width="2" stroke-dasharray="6 5"/>\`).join('');
  const nodes=Object.values(S.boards).filter(b=>pos[b.id]).map(b=>{
    const s=A.stats(b.id),r=16+Math.min(26,s.total*2.4),p=pos[b.id];
    return \`<g data-b="\${b.id}" style="cursor:none">
      <circle cx="\${p.x}" cy="\${p.y}" r="\${r}" fill="var(--panel)" stroke="var(--ink)" stroke-width="2.5"/>
      <circle cx="\${p.x}" cy="\${p.y}" r="\${Math.max(3,r*(s.pct/100))}" fill="var(--accent2)" opacity=".85"/>
      <text x="\${p.x}" y="\${p.y+r+16}" text-anchor="middle" font-family="var(--scrawl)" font-size="17" fill="var(--ink)">\${esc(b.name)}</text>
      <text x="\${p.x}" y="\${p.y+5}" text-anchor="middle" font-size="13" fill="var(--ink)">\${s.done}/\${s.total}</text></g>\`}).join('');
  body.innerHTML=\`<div class="graphwrap"><svg width="\${W}" height="\${H}">\${links}\${nodes}</svg>
    <div class="dim" style="position:absolute;left:12px;bottom:10px">Circle size = tasks · fill = finished</div></div>\`;
  $$('g[data-b]',body).forEach(g=>g.onclick=()=>openBoard(g.dataset.b));
}

/* ============================ calendar ============================ */
function openCalendar(){
  const st={m:new Date().getMonth(),y:new Date().getFullYear(),sel:todayISO()};
  openWin({id:'calendar',title:'Calendar',icon:appIcon('calendar'),w:820,h:580,render:(b,w)=>draw(b),refresh:w=>draw(w.body)});
  function draw(body){
    const first=new Date(st.y,st.m,1),start=new Date(first);start.setDate(1-first.getDay());
    const cells=[...Array(42)].map((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});
    const iso=d=>d.toISOString().slice(0,10);
    const dayEv=st.sel?S.events.filter(e=>e.date===st.sel):[];
    const upcoming=S.events.filter(e=>e.date>=todayISO()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,8);
    body.innerHTML=\`<div class="pad" style="display:flex;gap:16px;height:100%;box-sizing:border-box">
      <div style="flex:1;min-width:0">
        <div class="row"><button class="btn sm" id="_p">‹</button>
          <strong style="font-family:var(--scrawl);font-size:23px">\${first.toLocaleString([],{month:'long'})} \${st.y}</strong>
          <button class="btn sm" id="_n">›</button><button class="btn sm" id="_t">Today</button>
          <div style="flex:1"></div><button class="btn sm" id="_add">+ Event</button></div>
        <div class="cal" style="margin-top:10px">\${['S','M','T','W','T','F','S'].map(d=>\`<div class="dim" style="text-align:center">\${d}</div>\`).join('')}
        \${cells.map(d=>{const k=iso(d),evs=S.events.filter(e=>e.date===k);
          return \`<div class="cell \${d.getMonth()!==st.m?'oth':''} \${k===todayISO()?'tod':''} \${k===st.sel?'sel':''}" data-d="\${k}">
            <div class="dn">\${d.getDate()}</div>\${evs.slice(0,3).map(e=>{const p=e.project&&A.project(e.project);
              return \`<div class="ev" \${p?\`style="background:var(--accent)"\`:''}>\${esc(e.time||'')} \${esc(e.title)}</div>\`}).join('')}
            \${evs.length>3?\`<div class="dim">+\${evs.length-3}</div>\`:''}</div>\`}).join('')}</div></div>
      <div style="width:240px;flex:0 0 auto;overflow:auto">
        <h4 class="sec">\${st.sel||'—'}</h4>
        <div class="list">\${dayEv.length?dayEv.map(e=>\`<div class="item" data-e="\${e.id}"><div style="flex:1">
          <div>\${esc(e.title)}</div><div class="dim">\${esc(e.time||'all day')}\${e.project?' · '+esc(A.projName(e.project)):''}</div></div>
          <button class="btn sm" data-x="\${e.id}">🗑</button></div>\`).join('')
          :'<p class="dim">Nothing on this day.</p>'}</div>
        <h4 class="sec">Coming up</h4>
        <div class="list">\${upcoming.length?upcoming.map(e=>\`<div class="item"><div style="flex:1">
          <div>\${esc(e.title)}</div><div class="dim">\${e.date} \${esc(e.time||'')}</div></div></div>\`).join('')
          :'<p class="dim">No reminders ahead.</p>'}</div></div></div>\`;
    $('#_p',body).onclick=()=>{st.m--;if(st.m<0){st.m=11;st.y--}draw(body)};
    $('#_n',body).onclick=()=>{st.m++;if(st.m>11){st.m=0;st.y++}draw(body)};
    $('#_t',body).onclick=()=>{const d=new Date();st.m=d.getMonth();st.y=d.getFullYear();st.sel=todayISO();draw(body)};
    $('#_add',body).onclick=()=>addEvent(st.sel,()=>draw(body));
    $$('.cell',body).forEach(c=>{c.onclick=()=>{st.sel=c.dataset.d;draw(body)};
      c.ondblclick=()=>addEvent(c.dataset.d,()=>draw(body))});
    $$('[data-x]',body).forEach(b=>b.onclick=()=>{S.events=S.events.filter(e=>e.id!==b.dataset.x);changed();draw(body)});
  }
  function addEvent(date,after){
    modal('New event',\`<label class="fld">Title</label><input type="text" id="_t" value="">
      <div class="row"><div style="flex:1"><label class="fld">Date</label><input type="date" id="_d" value="\${date||todayISO()}"></div>
      <div style="flex:1"><label class="fld">Time</label><input type="time" id="_h" value="09:00"></div></div>
      <label class="fld">Project</label><select id="_p"><option value="">— none —</option>
        \${S.projects.map(p=>\`<option value="\${p.id}">\${esc(p.name)}</option>\`).join('')}</select>\`,
      [['Cancel',null],['Add event',b=>{const t=$('#_t',b).value.trim();if(!t)return false;
        S.events.push({id:uid('e'),title:t,date:$('#_d',b).value,time:$('#_h',b).value,project:$('#_p',b).value||null});
        changed('cal.created',{});after&&after();},1]]);
  }
}

/* ============================ files library ============================ */
function openFiles(){
  openWin({id:'files',title:'Files',icon:appIcon('files'),w:640,h:500,render:draw,refresh:w=>draw(w.body)});
  function draw(body){
    body.innerHTML=\`<div class="pad"><div class="row"><button class="btn sm" id="_u">+ Upload files</button>
      <span class="dim">\${S.files.length} file(s)</span></div>
      <h4 class="sec">Everything you’ve attached</h4><div class="grid" id="_g"></div></div>\`;
    $('#_u',body).onclick=()=>pickFiles(()=>{changed();draw(body)});
    $('#_g',body).innerHTML=S.files.length?S.files.map(f=>\`<div class="tile" data-f="\${f.id}">
      \${f.type.startsWith('image/')?\`<img src="\${f.data}" style="width:100%;height:78px;object-fit:cover;border-radius:6px">\`
        :\`<div class="gl">📄</div>\`}
      <div class="nm">\${esc(f.name)}</div><div class="dim">\${Math.round(f.size/1024)} KB</div>
      <div class="row" style="justify-content:center;margin-top:4px">
        <button class="btn sm" data-a="open">Open</button><button class="btn sm" data-a="del">🗑</button></div></div>\`).join('')
      :'<p class="dim">Nothing here yet. Attach a file from any board, or upload one now.</p>';
    $$('#_g .tile',body).forEach(t=>{const f=A.file(t.dataset.f);
      $('[data-a="open"]',t).onclick=()=>window.open(f.data,'_blank');
      $('[data-a="del"]',t).onclick=()=>confirmBox('Delete file',\`Delete “\${f.name}” and remove its cards from every board?\`,()=>{
        S.files=S.files.filter(x=>x.id!==f.id);
        Object.values(S.boards).forEach(b=>b.files=b.files.filter(c=>c.fileId!==f.id));changed();draw(body)});});
  }
}

/* ============================ search & stats ============================ */
function openSearch(){
  const st={q:''};
  openWin({id:'search',title:'Search & Stats',icon:appIcon('search'),w:660,h:520,render:draw,refresh:w=>draw(w.body)});
  function draw(body){
    const boards=Object.values(S.boards),tasks=boards.flatMap(b=>b.tasks.map(t=>({t,b})));
    const done=tasks.filter(x=>x.t.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0;
    const hits=st.q?tasks.filter(x=>x.t.title.toLowerCase().includes(st.q.toLowerCase())).slice(0,40):[];
    body.innerHTML=\`<div class="pad">
      <input type="text" id="_q" placeholder="Find any task, anywhere…" value="\${esc(st.q)}">
      \${st.q?\`<h4 class="sec">\${hits.length} match\${hits.length===1?'':'es'}</h4>
        <div class="list">\${hits.map(h=>\`<div class="item"><button class="chk" data-t="\${h.t.id}">\${h.t.done?'✓':''}</button>
          <div style="flex:1"><div>\${esc(h.t.title)}</div><div class="dim">\${esc(A.path(h.b.id).map(x=>x.name).join(' › '))}</div></div>
          <button class="btn sm" data-o="\${h.b.id}">Open</button></div>\`).join('')||'<p class="dim">No task by that name.</p>'}</div>\`
        :\`<h4 class="sec">System</h4>
        <div class="list">
          <div class="item"><span style="flex:1">Boards</span><strong>\${boards.length}</strong></div>
          <div class="item"><span style="flex:1">Tasks finished</span><div class="bar" style="width:120px"><i style="width:\${pct}%"></i></div><strong>\${done}/\${tasks.length}</strong></div>
          <div class="item"><span style="flex:1">Sticky notes</span><strong>\${boards.reduce((a,b)=>a+b.notes.length,0)}</strong></div>
          <div class="item"><span style="flex:1">Attached files</span><strong>\${S.files.length}</strong></div>
          <div class="item"><span style="flex:1">Projects</span><strong>\${S.projects.length}</strong></div>
          <div class="item"><span style="flex:1">Scripts (enabled)</span><strong>\${Object.values(S.scripts).filter(s=>s.enabled).length}/\${Object.keys(S.scripts).length}</strong></div>
          <div class="item"><span style="flex:1">Open windows</span><strong>\${WINS.size}</strong></div>
        </div>
        <h4 class="sec">Start over</h4>
        <p class="dim">Wipes every board, note, file, project and script on this device.</p>
        <button class="btn" id="_reset">Reset Artemis OS</button>\`}</div>\`;
    const q=$('#_q',body);q.oninput=e=>{st.q=e.target.value;draw(body);const n=$('#_q',body);n.focus();n.setSelectionRange(n.value.length,n.value.length)};
    $$('[data-t]',body).forEach(b=>b.onclick=()=>{A.setDone(b.dataset.t,!A.findTask(b.dataset.t).task.done);
      changed('board.changed',{});draw(body)});
    $$('[data-o]',body).forEach(b=>b.onclick=()=>openBoard(b.dataset.o));
    const r=$('#_reset',body);
    if(r)r.onclick=()=>confirmBox('Reset everything',
      'This clears all boards, tasks, notes, files, projects and scripts stored in this browser.',()=>{
        localStorage.removeItem(KEY);S=blankState();[...WINS.values()].forEach(closeWin);
        document.documentElement.dataset.theme=S.theme;save();refresh();toast('Fresh desk.');openBoard('b_home');},'Reset');
  }
}

/* ============================ boot ============================ */
load();setCursorGlyph(S.cursor);renderDesktop();deskMenu();renderDock();
Bus.on('board.opened',()=>{});
(function first(){
  if(!S.seenIntro){
    S.seenIntro=true;
    const b=A.board('b_home');
    if(!b.tasks.length){
      const t1=A.addTask('b_home','Drag me anywhere on the board',{x:80,y:90,priority:'normal'});
      const t2=A.addTask('b_home','Right-click the canvas for everything',{x:80,y:250,priority:'high'});
      A.addSub(t2.id,'Try the pen and the eraser');
      A.addTask('b_home','Open Scripts and add a template',{x:340,y:90,deadline:todayISO(),priority:'urgent'});
      A.addNote('b_home','Double-click a card to rename it.\\nScroll to zoom, drag empty space to pan.',NOTE_COLORS[0]);
    }
    save();
  }
  openBoard('b_home');
  Bus.emit('board.opened',{boardId:'b_home'});
})();
addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeMenu();const sc=$('#scrim');if(sc)sc.remove()}
});
</script>`;

// ============================================================
// Original Artemis application JavaScript
// ============================================================

const ARTEMIS_SCRIPT = String.raw`/* ============================ core ============================ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=p=>(p||'i')+Math.random().toString(36).slice(2,9);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function localISO(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return '${y}-${m}-${day}';
}
const todayISO=()=>localISO();
const TILT=['tiltA','tiltB','tiltC','tiltD'];
const tiltOf=id=>TILT[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%4];
const THEMES=[['parchment','Parchment'],['kraft','Kraft'],['cotton','Cotton'],['sage','Sage'],['chalkboard','Chalkboard'],['blueprint','Blueprint'],['charcoal','Charcoal'],['inkwell','Inkwell']];
const NOTE_COLORS=['#ffe397','#ffc2cf','#b7ecd2','#c2ddff','#e6c8fb','#ffd8ac'];
const KEY='artemis-os-v1';
const ICON_BOW=\`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.6 C3.4 8 3.4 16 8 21.4"/><path d="M8 2.6 L8 21.4"/><line x1="3.5" y1="12" x2="21" y2="12" stroke="var(--accent)"/><path d="M21 12 L17 10.2 M21 12 L17 13.8" stroke="var(--accent)"/><path d="M3.5 12 L6.4 10.4 M3.5 12 L6.4 13.6" stroke-width="1.3"/></svg>\`;
const ICON_PALETTE=\`<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.3c-5 0-9 3.5-9 7.9 0 3 2 4.9 4.4 4.9.9 0 1.5-.5 1.5-1.3 0-.6-.4-1-.4-1.6 0-1 1-1.5 2-1.5h3.4c3 0 5.9-2.1 5.9-5.4 0-2.6-3.6-4.4-7.8-4.4Z"/><circle cx="8.3" cy="9.4" r="1.05" fill="var(--accent)" stroke="none"/><circle cx="12" cy="7.3" r="1.05" fill="var(--accent2)" stroke="none"/><circle cx="15.5" cy="9.4" r="1.05" fill="var(--line)" stroke="none"/></svg>\`;
const ICON_CURSOR=\`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"><path d="M5 3.5 L5 18 L9 14.3 L11.6 20.4 L14.3 19.2 L11.6 13.1 L17 12.7 Z" fill="var(--paper)"/></svg>\`;

/* ---------- one consistent line-art icon set for every app ---------- */
const APP_ICON_PATHS={
  boards:'<rect x="3.6" y="4.2" width="16.8" height="15.6" rx="2.3"/><line x1="9" y1="4.2" x2="9" y2="19.8"/><line x1="15" y1="4.2" x2="15" y2="19.8"/>',
  'files-mgr':'<path d="M3.5 7.2 L3.5 18.4 L20.5 18.4 L20.5 9.2 L11.2 9.2 L9.4 7.2 Z"/>',
  projects:'<path d="M4 12.2 L12 4.2 L19 4.2 L19 11.2 L11 19.2 Z"/><circle cx="15.6" cy="7.6" r="1.25" fill="var(--ink)" stroke="none"/>',
  graph:'<circle cx="6.2" cy="7" r="2.15"/><circle cx="17.8" cy="7" r="2.15"/><circle cx="12" cy="18" r="2.15"/><line x1="7.9" y1="8.3" x2="10.4" y2="16.1"/><line x1="16.1" y1="8.3" x2="13.6" y2="16.1"/><line x1="8.3" y1="7" x2="15.7" y2="7"/>',
  calendar:'<rect x="3.6" y="5.6" width="16.8" height="14.6" rx="2"/><line x1="3.6" y1="9.8" x2="20.4" y2="9.8"/><line x1="7.6" y1="3.4" x2="7.6" y2="7.4"/><line x1="16.4" y1="3.4" x2="16.4" y2="7.4"/>',
  files:'<rect x="6.2" y="4.6" width="12" height="14.6" rx="1.6" transform="rotate(-7 12.2 12)"/><rect x="5.8" y="5.2" width="12" height="14.6" rx="1.6" fill="var(--panel)"/>',
  search:'<circle cx="10.4" cy="10.4" r="6.1"/><line x1="14.9" y1="14.9" x2="20.2" y2="20.2"/>',
  scripts:'<circle cx="12" cy="12" r="4.1"/><circle cx="12" cy="12" r="1.3" fill="var(--ink)" stroke="none"/><line x1="12" y1="3.6" x2="12" y2="6.3"/><line x1="12" y1="17.7" x2="12" y2="20.4"/><line x1="3.6" y1="12" x2="6.3" y2="12"/><line x1="17.7" y1="12" x2="20.4" y2="12"/><line x1="6.3" y1="6.3" x2="8.1" y2="8.1"/><line x1="15.9" y1="15.9" x2="17.7" y2="17.7"/><line x1="17.7" y1="6.3" x2="15.9" y2="8.1"/><line x1="8.1" y1="15.9" x2="6.3" y2="17.7"/>',
};
function appIcon(id,size){
  const p=APP_ICON_PATHS[id];if(!p)return '';
  const s=size||19;
  return \`<svg viewBox="0 0 24 24" width="\${s}" height="\${s}" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto">\${p}</svg>\`;
}

/* ---------- cursor glyph system ---------- */
const CURSOR_DEFS={
  arrow:{name:'Arrow',vb:'0 0 16 19',w:15,h:18,svg:'<path d="M2 1 L2 15 L5.4 12 L7.8 17 L10.2 15.8 L7.8 11 L12.8 10.6 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round"/>'},
  pencil:{name:'Pencil',vb:'0 0 17 19',w:15,h:18,svg:'<path d="M3 16 L3 13 L11 5 L14 8 L6 16 Z" fill="var(--panel)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 5 L14 8" stroke="var(--accent)" stroke-width="1.5"/><path d="M2.2 17 L3.4 13.6 L5.4 15.6 Z" fill="var(--ink)"/>'},
  dot:{name:'Dot',vb:'0 0 16 16',w:14,h:14,svg:'<circle cx="8" cy="8" r="4.3" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5"/>'},
  star:{name:'Star',vb:'0 0 18 18',w:16,h:16,svg:'<path d="M9 1.4 L10.6 6.4 L15.8 6.7 L11.7 9.9 L13.1 14.8 L9 11.9 L4.9 14.8 L6.3 9.9 L2.2 6.7 L7.4 6.4 Z" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>'},
};
function setCursorGlyph(id){
  const d=CURSOR_DEFS[id]||CURSOR_DEFS.arrow;const cur=$('#cur');if(!cur)return;
  cur.setAttribute('viewBox',d.vb);cur.style.width=d.w+'px';cur.style.height=d.h+'px';cur.innerHTML=d.svg;
}
function cursorMenu(x,y){
  menu(x,y,Object.entries(CURSOR_DEFS).map(([id,d])=>[(S.cursor===id?'● ':'○ ')+d.name,()=>{
    S.cursor=id;setCursorGlyph(id);save();}]),'Cursor');
}

let S=null, saveT=null;
function blankState(){
  const home={id:'b_home',name:'Home',parent:null,projects:[],tasks:[],notes:[],files:[],strokes:[],cam:{x:0,y:0,z:1},created:Date.now()};
  return {v:1,theme:'parchment',boards:{b_home:home},projects:[],events:[],files:[],scripts:{},
    desktop:['boards','scripts','calendar'],cursor:'arrow',seenIntro:false};
}
function load(){
  try{const raw=localStorage.getItem(KEY); S=raw?JSON.parse(raw):blankState();}catch(e){S=blankState();}
  if(!S||!S.boards)S=blankState();
  for(const b of Object.values(S.boards)){b.tasks||=[];b.notes||=[];b.files||=[];b.strokes||=[];b.projects||=[];b.cam||={x:0,y:0,z:1};}
  S.scripts||={};S.projects||=[];S.events||=[];S.files||=[];S.desktop||=['boards','scripts','calendar'];S.cursor||='arrow';
  document.documentElement.dataset.theme=S.theme||'parchment';
}
function save(){clearTimeout(saveT);saveT=setTimeout(()=>{
  try{localStorage.setItem(KEY,JSON.stringify(S));}
  catch(e){toast('Out of storage. Delete a few attached files to keep saving.');}
},220);}

/* ---------- event bus (scripts listen here) ---------- */
const Bus={h:{},on(t,f){(this.h[t]||=[]).push(f)},emit(t,p){(this.h[t]||[]).forEach(f=>{try{f(p)}catch(e){console.warn(e)}});(this.h['*']||[]).forEach(f=>f(t,p))}};
const dirty=new Set();
function changed(kind,payload){ if(kind)Bus.emit(kind,payload||{}); save(); refresh(); }
const refreshers=new Map();
function refresh(){refreshers.forEach(f=>{try{f()}catch(e){}});}

/* ---------- toasts ---------- */
function toast(msg,ms=3200){
  const d=document.createElement('div');d.className='toast';d.textContent=msg;
  d.style.transform=\`rotate(\${(Math.random()*3-1.5).toFixed(2)}deg)\`;
  $('#toasts').appendChild(d);setTimeout(()=>d.remove(),ms);
}

/* ---------- cursor ---------- */
(function(){
  const cur=$('#cur'),ring=$('#ring');let rx=0,ry=0,mx=0,my=0;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.style.transform=\`translate(\${mx}px,\${my}px)\`;
    const t=e.target,cs=t&&t.closest?t.closest('input,textarea,[contenteditable="true"]'):null;
    const dg=t&&t.closest?t.closest('.card,.note,.fcard,.node,.wbar,.bcard,.chip'):null;
    const ck=t&&t.closest?t.closest('button,.dicon,.tile,.mi,.item,.dot,.cell'):null;
    document.body.classList.toggle('c-text',!!cs);
    document.body.classList.toggle('c-drag',!cs&&!!dg);
    document.body.classList.toggle('c-click',!cs&&!dg&&!!ck);
  },{passive:true});
  (function loop(){rx+=(mx-rx)*.22;ry+=(my-ry)*.22;ring.style.transform=\`translate(\${rx}px,\${ry}px)\`;requestAnimationFrame(loop)})();
})();

/* ---------- drag helper ---------- */
function drag(handle,onMove,onStart,onEnd){
  handle.addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    if(e.target.closest('input,textarea,button,select,[contenteditable="true"],.dot'))return;
    e.preventDefault();const sx=e.clientX,sy=e.clientY;let moved=false;
    onStart&&onStart(e);
    const mv=ev=>{if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>2)moved=true;onMove(ev.clientX-sx,ev.clientY-sy,ev)};
    const up=ev=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);onEnd&&onEnd(moved,ev)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
  });
}

/* ---------- context menu ---------- */
let openMenu=null;
function menu(x,y,items,head){
  closeMenu();const m=document.createElement('div');m.className='menu';
  if(head)m.insertAdjacentHTML('beforeend',\`<div class="mh">\${esc(head)}</div>\`);
  items.forEach(it=>{
    if(it==='-'){m.insertAdjacentHTML('beforeend','<hr>');return;}
    const b=document.createElement('button');b.className='mi';b.textContent=it[0];
    b.onclick=()=>{closeMenu();it[1]()};m.appendChild(b);
  });
  document.body.appendChild(m);
  const r=m.getBoundingClientRect();
  m.style.left=Math.min(x,innerWidth-r.width-8)+'px';
  m.style.top=Math.min(y,innerHeight-r.height-8)+'px';
  openMenu=m;setTimeout(()=>document.addEventListener('mousedown',closeOnOut),0);
}
function closeOnOut(e){if(openMenu&&!openMenu.contains(e.target))closeMenu()}
function closeMenu(){if(openMenu){openMenu.remove();openMenu=null;document.removeEventListener('mousedown',closeOnOut)}}

/* ---------- modal ---------- */
function modal(title,bodyHTML,buttons,onMount){
  const sc=document.createElement('div');sc.id='scrim';
  sc.innerHTML=\`<div class="modal"><h3>\${esc(title)}</h3><div class="mbody">\${bodyHTML}</div>
    <div class="row" style="margin-top:16px;justify-content:flex-end"></div></div>\`;
  const row=$('.row:last-child',sc);
  (buttons||[['Close',null]]).forEach(([lb,fn,pri])=>{
    const b=document.createElement('button');b.className='btn'+(pri?' pri':'');b.textContent=lb;
    b.onclick=()=>{if(!fn||fn($('.mbody',sc))!==false)sc.remove()};row.appendChild(b);
  });
  sc.addEventListener('mousedown',e=>{if(e.target===sc)sc.remove()});
  document.body.appendChild(sc);onMount&&onMount($('.mbody',sc),sc);
  const f=$('input,textarea,select',sc);f&&f.focus();
  return sc;
}
function ask(title,label,val,cb){
  modal(title,\`<label class="fld">\${esc(label)}</label><input type="text" id="_v" value="\${esc(val||'')}">\`,
    [['Cancel',null],['Save',b=>{const v=$('#_v',b).value.trim();if(v)cb(v)},1]],
    b=>{$('#_v',b).onkeydown=e=>{if(e.key==='Enter')$('.btn.pri',b.parentElement).click()}});
}
function confirmBox(title,msg,cb,label){
  modal(title,\`<p>\${esc(msg)}</p>\`,[['Cancel',null],[label||'Delete',()=>cb(),1]]);
}

/* ============================ windows ============================ */
let zTop=100;const WINS=new Map();
function openWin(opt){
  if(opt.id&&WINS.has(opt.id)){const w=WINS.get(opt.id);focusWin(w);if(opt.onReopen)opt.onReopen(w);return w;}
  const id=opt.id||uid('w');
  const el=document.createElement('div');el.className='win';
  const w=Math.min(opt.w||760,innerWidth-40),h=Math.min(opt.h||520,innerHeight-130);
  el.style.width=w+'px';el.style.height=h+'px';
  el.style.left=clamp((innerWidth-w)/2+(WINS.size%5)*24-48,8,innerWidth-w-8)+'px';
  el.style.top=clamp(58+(WINS.size%5)*22,8,Math.max(8,innerHeight-h-100))+'px';
  el.innerHTML=\`<div class="wbar"><span style="font-size:19px">\${opt.icon||'📄'}</span>
    <div class="wtitle"></div>
    <button class="wbtn" data-a="min" title="Minimize">–</button>
    <button class="wbtn" data-a="max" title="Maximize">▢</button>
    <button class="wbtn" data-a="close" title="Close">✕</button></div>
    <div class="wbody"></div><div class="wgrip"></div>\`;
  $('.wtitle',el).textContent=opt.title||'Window';
  $('#desk').appendChild(el);
  const win={id,el,body:$('.wbody',el),opt,min:false,max:false,
    setTitle(t){$('.wtitle',el).textContent=t;opt.title=t;renderChips();}};
  WINS.set(id,win);
  drag($('.wbar',el),(dx,dy)=>{if(win.max)return;
    el.style.left=clamp(win._l+dx,-w+90,innerWidth-70)+'px';el.style.top=clamp(win._t+dy,0,innerHeight-60)+'px';},
    ()=>{win._l=parseFloat(el.style.left);win._t=parseFloat(el.style.top);focusWin(win)});
  drag($('.wgrip',el),(dx,dy)=>{el.style.width=Math.max(300,win._w+dx)+'px';el.style.height=Math.max(200,win._h+dy)+'px';
    win.opt.onResize&&win.opt.onResize();},
    ()=>{win._w=el.offsetWidth;win._h=el.offsetHeight});
  el.addEventListener('mousedown',()=>focusWin(win));
  $$('.wbtn',el).forEach(b=>b.onclick=e=>{e.stopPropagation();
    const a=b.dataset.a;
    if(a==='close')closeWin(win);
    else if(a==='min'){win.min=true;el.style.display='none';renderChips();}
    else{win.max=!win.max;el.classList.toggle('max',win.max);
      if(win.max){win._r={l:el.style.left,t:el.style.top,w:el.style.width,h:el.style.height};
        Object.assign(el.style,{left:'6px',top:'6px',width:'calc(100vw - 12px)',height:'calc(100vh - 104px)'});}
      else Object.assign(el.style,{left:win._r.l,top:win._r.t,width:win._r.w,height:win._r.h});
      win.opt.onResize&&win.opt.onResize();}
  });
  focusWin(win);
  if(opt.render)opt.render(win.body,win);
  if(opt.refresh)refreshers.set(id,()=>opt.refresh(win));
  renderChips();
  return win;
}
function focusWin(w){
  if(w.min){w.min=false;w.el.style.display='';}
  zTop++;w.el.style.zIndex=zTop;
  WINS.forEach(x=>x.el.classList.toggle('on',x===w));
  renderChips();
}
function closeWin(w){
  if(w.opt.onClose)w.opt.onClose();
  refreshers.delete(w.id);WINS.delete(w.id);w.el.remove();renderChips();
}

/* ============================ desktop + dock ============================ */
const APPS=[
  {id:'boards',icon:appIcon('boards'),name:'Boards',run:()=>openBoard('b_home')},
  {id:'files-mgr',icon:appIcon('files-mgr'),name:'File Manager',run:()=>openFileManager()},
  {id:'projects',icon:appIcon('projects'),name:'Projects',run:()=>openProjects()},
  {id:'graph',icon:appIcon('graph'),name:'Graph View',run:()=>openGraph()},
  {id:'calendar',icon:appIcon('calendar'),name:'Calendar',run:()=>openCalendar()},
  {id:'files',icon:appIcon('files'),name:'Files',run:()=>openFiles()},
  {id:'search',icon:appIcon('search'),name:'Search & Stats',run:()=>openSearch()},
  {id:'scripts',icon:appIcon('scripts'),name:'Scripts',run:()=>openScripts()},
];
function renderDesktop(){
  const shown=(S.desktop||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean);
  $('#icons').innerHTML=shown.map(a=>\`<button class="dicon" data-a="\${a.id}"><div class="gl">\${a.icon}</div><div class="lb">\${a.name}</div></button>\`).join('');
  $$('#icons .dicon').forEach(b=>{
    b.onclick=()=>APPS.find(a=>a.id===b.dataset.a).run();
    b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Open',()=>APPS.find(a=>a.id===b.dataset.a).run()],
        ['Remove from desk',()=>{S.desktop=S.desktop.filter(x=>x!==b.dataset.a);save();renderDesktop()}]],
        APPS.find(a=>a.id===b.dataset.a).name)};
  });
}
function addIconMenu(x,y){
  const missing=APPS.filter(a=>!(S.desktop||[]).includes(a.id));
  if(!missing.length)return menu(x,y,[['Everything is already on the desk',()=>{}]],'Add an icon');
  menu(x,y,missing.map(a=>[a.name,()=>{S.desktop.push(a.id);save();renderDesktop()}]),'Add an icon');
}

function deskMenu(){
  $('#desk').addEventListener('contextmenu',e=>{
    if(e.target.closest('.win'))return;e.preventDefault();
    menu(e.clientX,e.clientY,[['New board',()=>newBoardDialog(null)],
      ['Add an icon…',()=>addIconMenu(e.clientX,e.clientY)],
      ['All apps…',()=>appMenu(e.clientX,e.clientY)],
      ['Change theme…',()=>themeMenu(e.clientX,e.clientY)]],'Desk');
  });
}
function appMenu(x,y){menu(x,y,APPS.map(a=>[a.name,a.run]),'Apps')}
const DOCK_QUICK=['boards','scripts','calendar','search'];
let dockInitialized=false;
let dockClockTimer=null;
function renderDock(){
  if(dockInitialized){
    renderChips();
    return;
  }
  dockInitialized=true;

  const quick=DOCK_QUICK.map(id=>APPS.find(a=>a.id===id)).filter(Boolean);
  $('#dock').innerHTML=
    \`<button class="dk" id="startb" title="Artemis OS">\${ICON_BOW}</button>
     <span class="sep"></span>
     \${quick.map(a=>\`<button class="dk" data-a="\${a.id}" title="\${a.name}">\${a.icon}<span class="lb">\${a.name}</span></button>\`).join('')}
     <span class="sep"></span>
     <div id="chips"></div>
     <span class="sep"></span>
     <button class="dk" id="cursorb" title="Cursor">\${ICON_CURSOR}</button>
     <button class="dk" id="themeb" title="Theme">\${ICON_PALETTE}</button>
     <div id="clock"></div>\`;
  $$('#dock .dk[data-a]').forEach(b=>b.onclick=()=>APPS.find(a=>a.id===b.dataset.a).run());
  $('#themeb').onclick=e=>themeMenu(e.clientX,e.clientY-320);
  $('#cursorb').onclick=e=>cursorMenu(e.clientX,e.clientY-260);
  $('#startb').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();
    menu(r.left,Math.max(20,r.top-30-APPS.length*30),[...APPS.map(a=>[a.name,a.run]),'-',
      ['Add a desk icon…',()=>addIconMenu(r.left,r.top-300)],
      ['Change theme…',()=>themeMenu(r.left,r.top-320)],
      ['Change cursor…',()=>cursorMenu(r.left,r.top-260)],
      ['Close all windows',()=>[...WINS.values()].forEach(closeWin)]],'Artemis OS');
  };
  renderChips();
  if(!dockClockTimer){
    dockClockTimer=setInterval(()=>{
      const clock=$('#clock');
      if(clock){
        const d=new Date();
        clock.textContent=d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
      }
    },1000);
  }
  $('#clock').textContent=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
}
function renderChips(){
  const c=$('#chips');if(!c)return;

  // Keep existing chips alive. Rebuilding them on every board change caused
  // their entrance animation to replay and made the dock look like it refreshed.
  const wanted=new Set();

  WINS.forEach(w=>{
    const key=w.id;
    wanted.add(key);

    let b=c.querySelector('[data-win-id="${CSS.escape(key)}"]');
    if(!b){
      b=document.createElement('button');
      b.className='chip';
      b.dataset.winId=key;
      b.onclick=()=>{w.min||!w.el.classList.contains('on')
        ?focusWin(w)
        :(w.min=true,w.el.style.display='none',renderChips())};
      b.oncontextmenu=e=>{
        e.preventDefault();
        menu(e.clientX,e.clientY,[['Close',()=>closeWin(w)]]);
      };
      c.appendChild(b);
    }

    b.classList.toggle('on',w.el.classList.contains('on')&&!w.min);
    b.textContent=w.opt.title||'';
  });

  [...c.children].forEach(b=>{
    if(!wanted.has(b.dataset.winId))b.remove();
  });
}
function themeMenu(x,y){
  menu(x,y,THEMES.map(([id,nm])=>[(S.theme===id?'● ':'○ ')+nm,()=>{S.theme=id;document.documentElement.dataset.theme=id;save();}]),'Themes');
}

/* ============================ data API ============================ */
const A={
  board:id=>S.boards[id],
  allBoards:()=>Object.values(S.boards),
  children:id=>Object.values(S.boards).filter(b=>b.parent===id),
  parent:id=>{const b=S.boards[id];return b&&b.parent?S.boards[b.parent]:null},
  path(id){const out=[];let b=S.boards[id];while(b){out.unshift(b);b=b.parent?S.boards[b.parent]:null}return out},
  createBoard(name,parent,projects){
    const b={id:uid('b'),name:name||'New board',parent:parent||null,projects:projects||[],
      tasks:[],notes:[],files:[],strokes:[],cam:{x:0,y:0,z:1},created:Date.now()};
    S.boards[b.id]=b;Bus.emit('board.created',{board:b});return b;},
  deleteBoard(id){ if(id==='b_home')return false;
    A.children(id).forEach(c=>c.parent=S.boards[id].parent);
    Object.values(S.scripts).filter(s=>s.boardId===id).forEach(s=>s.boardId=null);
    delete S.boards[id];[...WINS.values()].filter(w=>w.id==='board:'+id).forEach(closeWin);return true;},
  dupBoard(id){const src=S.boards[id];if(!src)return null;
    const b=JSON.parse(JSON.stringify(src));b.id=uid('b');b.name=src.name+' copy';b.created=Date.now();
    b.tasks.forEach(t=>t.id=uid('t'));b.notes.forEach(n=>n.id=uid('n'));b.files.forEach(f=>f.id=uid('fc'));
    S.boards[b.id]=b;Bus.emit('board.created',{board:b});return b;},
  stats(id){const b=S.boards[id];if(!b)return{done:0,total:0,pct:0};
    const total=b.tasks.length,done=b.tasks.filter(t=>t.done).length;
    return{done,total,pct:total?Math.round(done/total*100):0};},
  freeSpot(b,w=230,h=130){
    let x=40,y=40;const items=[...b.tasks,...b.notes,...b.files];
    for(let r=0;r<400;r++){const ok=!items.some(i=>Math.abs(i.x-x)<w&&Math.abs(i.y-y)<h);
      if(ok)return{x,y};x+=w;if(x>40+w*4){x=40;y+=h}}
    return{x:40+Math.random()*400,y:40+Math.random()*300};},
  addTask(boardId,title,opts){
    const b=S.boards[boardId];if(!b)return null;
    const p=A.freeSpot(b);
    const t=Object.assign({id:uid('t'),title:title||'New task',done:false,x:p.x,y:p.y,priority:'normal',
      status:'todo',desc:'',deadline:'',tags:[],subtasks:[],created:Date.now()},opts||{});
    b.tasks.push(t);Bus.emit('task.created',{boardId,task:t});return t;},
  findTask(id){for(const b of Object.values(S.boards)){const t=b.tasks.find(x=>x.id===id);if(t)return{board:b,task:t}}return null},
  delTask(id){const f=A.findTask(id);if(!f)return false;
    f.board.tasks=f.board.tasks.filter(t=>t.id!==id);Bus.emit('task.deleted',{boardId:f.board.id,task:f.task});return true;},
  moveTaskToBoard(id,boardId){const f=A.findTask(id),to=S.boards[boardId];if(!f||!to||f.board.id===boardId)return false;
    f.board.tasks=f.board.tasks.filter(t=>t.id!==id);const p=A.freeSpot(to);f.task.x=p.x;f.task.y=p.y;to.tasks.push(f.task);
    Bus.emit('task.moved',{from:f.board.id,boardId,task:f.task});return true;},
  setDone(id,v){const f=A.findTask(id);if(!f)return false;const was=f.task.done;f.task.done=!!v;
    if(was!==!!v)Bus.emit(v?'task.completed':'task.uncompleted',{boardId:f.board.id,task:f.task});return true;},
  rename(id,name){const f=A.findTask(id);if(!f)return false;const old=f.task.title;f.task.title=name;
    Bus.emit('task.renamed',{boardId:f.board.id,task:f.task,old});return true;},
  addSub(taskId,title){const f=A.findTask(taskId);if(!f)return null;
    const s={id:uid('s'),title:title||'Subtask',done:false};f.task.subtasks.push(s);
    Bus.emit('subtask.created',{boardId:f.board.id,task:f.task,subtask:s});return s;},
  addNote(boardId,text,color){const b=S.boards[boardId];if(!b)return null;const p=A.freeSpot(b,200,120);
    const n={id:uid('n'),text:text||'',x:p.x,y:p.y,w:180,h:110,color:color||NOTE_COLORS[Math.floor(Math.random()*NOTE_COLORS.length)]};
    b.notes.push(n);Bus.emit('note.created',{boardId,note:n});return n;},
  addFileCard(boardId,fileId){const b=S.boards[boardId];if(!b)return null;const p=A.freeSpot(b,170,140);
    const c={id:uid('fc'),fileId,x:p.x,y:p.y};b.files.push(c);Bus.emit('file.attached',{boardId,card:c});return c;},
  file:id=>S.files.find(f=>f.id===id),
  project:id=>S.projects.find(p=>p.id===id),
  projName:id=>{const p=A.project(id);return p?p.name:'?'},
  isOverdue:t=>!!t.deadline&&!t.done&&t.deadline<todayISO(),
  objects(b){return[...b.tasks.map(o=>({o,k:'task'})),...b.notes.map(o=>({o,k:'note'})),...b.files.map(o=>({o,k:'file'}))]},
};
const PRIOS=['low','normal','high','urgent'],STATUSES=['todo','doing','blocked','done'];

/* ---------- layout engine (shared with scripts) ---------- */
function sizeOf(k){return k==='task'?[212,120]:k==='note'?[180,110]:[150,140]}
const Layout={
  grid(items,opt={}){const cols=opt.cols||Math.ceil(Math.sqrt(items.length))||1;
    const gx=opt.gx||240,gy=opt.gy||150,ox=opt.x??60,oy=opt.y??60;
    items.forEach((it,i)=>{it.o.x=ox+(i%cols)*gx;it.o.y=oy+Math.floor(i/cols)*gy});},
  rows(items,o={}){Layout.grid(items,{cols:o.cols||Math.ceil(items.length/Math.max(1,o.rows||2)),...o})},
  columns(items,o={}){Layout.grid(items,{cols:o.cols||3,...o})},
  vertical(items,o={}){const x=o.x??80,y=o.y??60,g=o.gap||140;items.forEach((it,i)=>{it.o.x=x;it.o.y=y+i*g})},
  horizontal(items,o={}){const x=o.x??60,y=o.y??80,g=o.gap||240;items.forEach((it,i)=>{it.o.x=x+i*g;it.o.y=y})},
  circle(items,o={}){const cx=o.x??520,cy=o.y??380,r=o.r||Math.max(190,items.length*34);
    items.forEach((it,i)=>{const a=i/items.length*Math.PI*2-Math.PI/2;it.o.x=cx+Math.cos(a)*r;it.o.y=cy+Math.sin(a)*r});},
  spiral(items,o={}){const cx=o.x??520,cy=o.y??380;items.forEach((it,i)=>{const a=i*.6,r=60+i*26;
    it.o.x=cx+Math.cos(a)*r;it.o.y=cy+Math.sin(a)*r});},
  stack(items,o={}){const x=o.x??90,y=o.y??90;items.forEach((it,i)=>{it.o.x=x+i*11;it.o.y=y+i*13})},
  align(items,o={}){const how=o.how||'left';
    if(!items.length)return;
    if(how==='left'){const m=Math.min(...items.map(i=>i.o.x));items.forEach(i=>i.o.x=m)}
    else if(how==='right'){const m=Math.max(...items.map(i=>i.o.x));items.forEach(i=>i.o.x=m)}
    else if(how==='top'){const m=Math.min(...items.map(i=>i.o.y));items.forEach(i=>i.o.y=m)}
    else if(how==='bottom'){const m=Math.max(...items.map(i=>i.o.y));items.forEach(i=>i.o.y=m)}
    else{const m=items.reduce((a,i)=>a+i.o.y,0)/items.length;items.forEach(i=>i.o.y=m)}},
  distribute(items,o={}){if(items.length<3)return;const axis=o.axis||'x';
    const s=[...items].sort((a,b)=>a.o[axis]-b.o[axis]),lo=s[0].o[axis],hi=s[s.length-1].o[axis],st=(hi-lo)/(s.length-1);
    s.forEach((it,i)=>it.o[axis]=lo+st*i);},
  pack(items,o={}){let x=o.x??50,y=o.y??50,rowH=0;const maxW=o.w||960;
    items.forEach(it=>{const[w,h]=sizeOf(it.k);if(x+w>maxW+(o.x??50)){x=o.x??50;y+=rowH+22;rowH=0}
      it.o.x=x;it.o.y=y;x+=w+22;rowH=Math.max(rowH,h)});},
};

/* ============================ board app ============================ */
function openBoard(id){
  const b=A.board(id);if(!b){toast('That board is gone.');return}
  const win=openWin({id:'board:'+id,title:b.name,icon:appIcon('boards'),w:900,h:600,
    render:(body,w)=>buildBoard(body,w,id),refresh:w=>w.api&&w.api.render(),
    onResize:()=>{}});
  return win;
}
function buildBoard(body,win,id){
  body.innerHTML=\`<div class="bwrap">
    <div class="btool"></div>
    <div class="bcanvasholder"><div class="bcanvas">
      <svg class="drawlayer" width="4000" height="3000"></svg>
    </div></div></div>\`;
  const holder=$('.bcanvasholder',body),canvas=$('.bcanvas',body),svg=$('.drawlayer',body),tool=$('.btool',body);
  const st={tool:'select',pen:'#2c2620',penW:3,sel:new Set()};
  const B=()=>A.board(id);
  const cam=()=>B().cam;

  function applyCam(){const c=cam();canvas.style.transform=\`translate(\${c.x}px,\${c.y}px) scale(\${c.z})\`}
  function toBoard(ev){const r=holder.getBoundingClientRect(),c=cam();
    return{x:(ev.clientX-r.left-c.x)/c.z,y:(ev.clientY-r.top-c.y)/c.z}}

  /* ---------- toolbar ---------- */
  function renderTool(){
    const bd=B(),s=A.stats(id);
    tool.innerHTML=\`
      <button class="btn sm" data-a="add">+ Add</button>
      <button class="btn sm \${st.tool!=='select'?'on':''}" data-a="draw">\${st.tool==='pen'?'✏ Pen':st.tool==='erase'?'🧽 Eraser':'✏ Draw'}</button>
      <button class="btn sm" data-a="view">\${Math.round(cam().z*100)}%</button>
      <button class="btn sm" data-a="more">⋯</button>
      <div style="flex:1;min-width:20px"></div>
      <span class="dim">\${s.done}/\${s.total}</span>
      <div class="bar" style="width:76px"><i style="width:\${s.pct}%"></i></div>\`;
    $$('[data-a]',tool).forEach(el=>el.onclick=e=>act(el.dataset.a,e));
  }
  function mpos(e){const r=e.currentTarget?e.currentTarget.getBoundingClientRect():null;
    return r?{x:r.left,y:r.bottom+4}:{x:e.clientX,y:e.clientY}}
  function act(a,e){
    const bd=B(),m=mpos(e);
    if(a==='add')menu(m.x,m.y,[
      ['Task',()=>{A.addTask(id,'New task');changed('board.changed',{boardId:id})}],
      ['Sticky note',()=>{A.addNote(id,'');changed('board.changed',{boardId:id})}],
      ['Sub-board',()=>newBoardDialog(id)],
      ['File attachment…',()=>pickFiles(fs=>{fs.forEach(f=>A.addFileCard(id,f.id));changed('board.changed',{boardId:id})})],
    ],'Add to board');
    else if(a==='draw')menu(m.x,m.y,[
      [(st.tool==='select'?'● ':'○ ')+'Move & pan',()=>{st.tool='select';renderTool()}],
      [(st.tool==='erase'?'● ':'○ ')+'Eraser',()=>{st.tool='erase';renderTool()}],
      '-',
      ...[['Ink','#2c2620'],['Coral','#ff6f61'],['Azure','#4d96ff'],['Meadow','#37b874'],['Violet','#8c6bff']]
        .map(([nm,c])=>[(st.tool==='pen'&&st.pen===c?'● ':'○ ')+'Pen — '+nm,()=>{st.tool='pen';st.pen=c;renderTool()}]),
    ],'Drawing');
    else if(a==='view')menu(m.x,m.y,[
      ['Zoom in',()=>zoomAt(holder.clientWidth/2,holder.clientHeight/2,1.2)],
      ['Zoom out',()=>zoomAt(holder.clientWidth/2,holder.clientHeight/2,1/1.2)],
      ['Fit everything',fit],
      ['Reset to 100%',()=>{const c=cam();c.x=0;c.y=0;c.z=1;applyCam();renderTool();save()}],
    ],'View');
    else if(a==='more')menu(m.x,m.y,[
      ['Check every task',()=>{bd.tasks.forEach(t=>A.setDone(t.id,true));changed('board.changed',{boardId:id})}],
      ['Uncheck every task',()=>{bd.tasks.forEach(t=>A.setDone(t.id,false));changed('board.changed',{boardId:id})}],
      ['Clear completed',()=>{const n=bd.tasks.filter(t=>t.done).length;
        if(!n)return toast('Nothing completed to clear.');
        confirmBox('Clear completed',\`Remove \${n} completed task\${n>1?'s':''} from this board?\`,()=>{
          bd.tasks.filter(t=>t.done).forEach(t=>A.delTask(t.id));changed('board.changed',{boardId:id})},'Clear')}],
      ['Arrange in a grid',()=>{Layout.grid(A.objects(bd));changed('board.changed',{boardId:id})}],
      '-',
      ['Projects: '+(bd.projects.length?bd.projects.map(A.projName).join(', '):'none'),()=>tagMenu({clientX:m.x,clientY:m.y},bd)],
      ['Scripts…',()=>boardScriptsMenu({clientX:m.x,clientY:m.y},id)],
      ['Rename board…',()=>ask('Rename board','Name',bd.name,v=>{bd.name=v;changed('board.changed',{boardId:id})})],
    ],A.path(id).map(x=>x.name).join(' › '));
  }
  function tagMenu(e,bd){
    if(!S.projects.length)return menu(e.clientX,e.clientY,[['Create a project first…',()=>openProjects()]],'Projects');
    menu(e.clientX,e.clientY,S.projects.map(p=>[(bd.projects.includes(p.id)?'● ':'○ ')+p.name,()=>{
      bd.projects.includes(p.id)?bd.projects=bd.projects.filter(x=>x!==p.id):bd.projects.push(p.id);
      changed('project.changed',{boardId:id});renderTool();}]),'Tag this board');
  }

  /* ---------- camera ---------- */
  function zoomAt(px,py,f){const c=cam();const z=clamp(c.z*f,.2,3);
    c.x=px-(px-c.x)*(z/c.z);c.y=py-(py-c.y)*(z/c.z);c.z=z;applyCam();renderTool();save();}
  holder.addEventListener('wheel',e=>{e.preventDefault();
    const r=holder.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?1.12:1/1.12);},{passive:false});
  function fit(){const b=B(),items=A.objects(b);const c=cam();
    if(!items.length){c.x=0;c.y=0;c.z=1;applyCam();renderTool();return}
    const xs=items.map(i=>i.o.x),ys=items.map(i=>i.o.y);
    const minx=Math.min(...xs)-40,miny=Math.min(...ys)-40,maxx=Math.max(...xs)+250,maxy=Math.max(...ys)+180;
    const z=clamp(Math.min(holder.clientWidth/(maxx-minx),holder.clientHeight/(maxy-miny)),.2,1.6);
    c.z=z;c.x=-minx*z+10;c.y=-miny*z+10;applyCam();renderTool();save();}

  /* ---------- canvas interaction: pan / draw / erase ---------- */
  let panning=null,stroke=null;
  holder.addEventListener('contextmenu',e=>e.preventDefault());
  holder.addEventListener('mousedown',e=>{
    const onItem=e.target.closest('.card,.note,.fcard,.bcard');
    if(e.button===2||(e.button===0&&!onItem&&st.tool==='select')){
      const c=cam();panning={sx:e.clientX,sy:e.clientY,cx:c.x,cy:c.y};
      if(e.button===2&&stroke){stroke=null}
      return;
    }
    if(onItem||e.button!==0)return;
    const p=toBoard(e);
    if(st.tool==='pen'){stroke={id:uid('k'),color:st.pen,w:st.penW,pts:[[p.x,p.y]]};B().strokes.push(stroke);drawStrokes();}
    else if(st.tool==='erase'){eraseAt(p)}
  });
  addEventListener('mousemove',e=>{
    if(panning){const c=cam();c.x=panning.cx+(e.clientX-panning.sx);c.y=panning.cy+(e.clientY-panning.sy);applyCam();return}
    if(!win.el.isConnected)return;
    const p=toBoard(e);
    if(stroke&&(e.buttons&1)){stroke.pts.push([p.x,p.y]);drawStrokes();}
    else if(st.tool==='erase'&&(e.buttons&1)&&holder.contains(e.target))eraseAt(p);
  });
  addEventListener('mouseup',()=>{if(panning){panning=null;save()}if(stroke){stroke=null;save()}});
  function eraseAt(p){const b=B(),r=16/cam().z;const before=b.strokes.length;
    b.strokes=b.strokes.filter(s=>!s.pts.some(pt=>Math.hypot(pt[0]-p.x,pt[1]-p.y)<r));
    if(b.strokes.length!==before){drawStrokes();save()}}
  function drawStrokes(){
    svg.innerHTML=B().strokes.map(s=>\`<polyline points="\${s.pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}"
      fill="none" stroke="\${s.color}" stroke-width="\${s.w}" stroke-linecap="round" stroke-linejoin="round"/>\`).join('');}

  /* ---------- items ---------- */
  function render(){
    const b=B();if(!b)return;win.setTitle(b.name);
    $$('.card,.note,.fcard,.bcard',canvas).forEach(e=>e.remove());
    b.tasks.forEach(t=>canvas.appendChild(taskEl(t)));
    b.notes.forEach(n=>canvas.appendChild(noteEl(n)));
    b.files.forEach(c=>canvas.appendChild(fileEl(c)));
    A.children(id).forEach((c,i)=>canvas.appendChild(subEl(c,i)));
    drawStrokes();applyCam();renderTool();
  }
  function place(el,o){el.style.left=o.x+'px';el.style.top=o.y+'px'}
  function makeDraggable(el,o,after){
    drag(el,(dx,dy)=>{el.style.left=(el._x+dx/cam().z)+'px';el.style.top=(el._y+dy/cam().z)+'px';},
      ()=>{el._x=o.x;el._y=o.y;el.style.zIndex=++zTop},
      (moved)=>{if(!moved)return;o.x=Math.round(parseFloat(el.style.left));o.y=Math.round(parseFloat(el.style.top));
        save();after&&after()});
  }
  function editable(el,get,set){
    el.ondblclick=e=>{e.stopPropagation();el.contentEditable='true';el.focus();
      document.execCommand&&document.getSelection().selectAllChildren(el);
      const done=()=>{el.contentEditable='false';const v=el.textContent.trim();if(v&&v!==get())set(v);else el.textContent=get();};
      el.onblur=done;el.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();el.blur()}if(ev.key==='Escape'){el.textContent=get();el.blur()}};};
  }
  function taskEl(t){
    const el=document.createElement('div');
    el.className='card '+(t.done?'done ':'')+tiltOf(t.id);el.dataset.tid=t.id;place(el,t);
    const over=A.isOverdue(t);
    el.innerHTML=\`<div class="ttl"><button class="chk">\${t.done?'✓':''}</button><div class="tx">\${esc(t.title)}</div></div>
      <div class="meta">
        \${t.priority!=='normal'?\`<span class="pill p-\${t.priority}">\${t.priority}</span>\`:''}
        \${t.status&&t.status!=='todo'?\`<span class="pill">\${t.status}</span>\`:''}
        \${t.deadline?\`<span class="pill \${over?'over':''}">\${t.deadline.slice(5)}</span>\`:''}
        \${t.tags.map(g=>\`<span class="pill">#\${esc(g)}</span>\`).join('')}
        \${t.subtasks.length?\`<span class="pill">\${t.subtasks.filter(s=>s.done).length}/\${t.subtasks.length}</span>\`:''}
      </div>
      \${t.desc?\`<div class="dim" style="margin-top:4px">\${esc(t.desc)}</div>\`:''}
      \${t.subtasks.length?\`<ul class="subs">\${t.subtasks.map(s=>
        \`<li class="\${s.done?'d':''}" data-sid="\${s.id}"><button class="chk" style="width:15px;height:15px;font-size:11px">\${s.done?'✓':''}</button><span class="stx">\${esc(s.title)}</span></li>\`).join('')}</ul>\`:''}\`;
    $('.chk',el).onclick=e=>{e.stopPropagation();A.setDone(t.id,!t.done);changed('board.changed',{boardId:id})};
    $$('.subs li',el).forEach(li=>{const s=t.subtasks.find(x=>x.id===li.dataset.sid);
      $('.chk',li).onclick=e=>{e.stopPropagation();s.done=!s.done;changed('board.changed',{boardId:id})};
      $('.stx',li).ondblclick=e=>{e.stopPropagation();ask('Rename subtask','Subtask',s.title,v=>{s.title=v;changed()})};});
    editable($('.tx',el),()=>t.title,v=>{A.rename(t.id,v);changed('board.changed',{boardId:id})});
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();taskMenu(e,t)};
    makeDraggable(el,t,()=>Bus.emit('task.moved',{boardId:id,task:t}));
    return el;
  }
  function taskMenu(e,t){
    menu(e.clientX,e.clientY,[
      [t.done?'Mark not done':'Mark done',()=>{A.setDone(t.id,!t.done);changed('board.changed',{boardId:id})}],
      ['Rename…',()=>ask('Rename task','Title',t.title,v=>{A.rename(t.id,v);changed('board.changed',{boardId:id})})],
      ['Add subtask…',()=>ask('New subtask','Title','',v=>{A.addSub(t.id,v);changed('board.changed',{boardId:id})})],
      ['Edit details…',()=>taskDetails(t,id)],
      ['Priority ▸',()=>menu(e.clientX+40,e.clientY,PRIOS.map(p=>[(t.priority===p?'● ':'○ ')+p,()=>{t.priority=p;changed('board.changed',{boardId:id})}]),'Priority')],
      ['Status ▸',()=>menu(e.clientX+40,e.clientY,STATUSES.map(p=>[(t.status===p?'● ':'○ ')+p,()=>{t.status=p;if(p==='done')A.setDone(t.id,true);changed('board.changed',{boardId:id})}]),'Status')],
      '-',
      ['Duplicate',()=>{const c=JSON.parse(JSON.stringify(t));c.id=uid('t');c.x+=26;c.y+=26;c.subtasks.forEach(s=>s.id=uid('s'));
        B().tasks.push(c);Bus.emit('task.created',{boardId:id,task:c});changed('board.changed',{boardId:id})}],
      ['Move to board…',()=>pickBoard('Move task to…',bid=>{A.moveTaskToBoard(t.id,bid);changed('board.changed',{boardId:id})},id)],
      ['Make subtask of…',()=>pickTask(id,t.id,other=>{
        other.subtasks.push({id:uid('s'),title:t.title,done:t.done});A.delTask(t.id);changed('board.changed',{boardId:id})})],
      '-',
      ['Delete',()=>{A.delTask(t.id);changed('board.changed',{boardId:id})}],
    ],t.title);
  }
  function noteEl(n){
    const el=document.createElement('div');el.className='note '+tiltOf(n.id);place(el,n);
    el.style.background=n.color;el.style.width=(n.w||180)+'px';el.style.minHeight=(n.h||110)+'px';el.style.color='#3a3026';
    el.innerHTML=\`<div class="nx"></div>\`;$('.nx',el).textContent=n.text;
    const nx=$('.nx',el);
    nx.ondblclick=()=>{nx.contentEditable='true';nx.focus();
      nx.onblur=()=>{nx.contentEditable='false';n.text=nx.textContent;changed('board.changed',{boardId:id})}};
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Edit text',()=>nx.dispatchEvent(new Event('dblclick'))],
        ['Colour ▸',()=>menu(e.clientX+40,e.clientY,NOTE_COLORS.map((c,i)=>['Colour '+(i+1),()=>{n.color=c;changed()}]))],
        ['Bigger',()=>{n.w=(n.w||180)+40;n.h=(n.h||110)+30;changed()}],
        ['Smaller',()=>{n.w=Math.max(110,(n.w||180)-40);n.h=Math.max(70,(n.h||110)-30);changed()}],
        ['Delete',()=>{B().notes=B().notes.filter(x=>x.id!==n.id);changed('board.changed',{boardId:id})}]],'Note')};
    makeDraggable(el,n);return el;
  }
  function fileEl(c){
    const f=A.file(c.fileId);const el=document.createElement('div');el.className='fcard '+tiltOf(c.id);place(el,c);
    const img=f&&f.type.startsWith('image/');
    el.innerHTML=\`\${img?\`<img src="\${f.data}" alt="">\`:\`<div class="fbadge">\${f?esc((f.name.split('.').pop()||'file').slice(0,4)):'?'}</div>\`}
      <div class="fname">\${f?esc(f.name):'missing file'}</div>\`;
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Open',()=>f&&window.open(f.data,'_blank')],
        ['Rename…',()=>f&&ask('Rename file','Name',f.name,v=>{f.name=v;changed()})],
        ['Remove from board',()=>{B().files=B().files.filter(x=>x.id!==c.id);changed('board.changed',{boardId:id})}]],f?f.name:'File')};
    makeDraggable(el,c);return el;
  }
  function subEl(sb,i){
    const el=document.createElement('div');el.className='bcard '+tiltOf(sb.id);
    if(sb.bx==null){sb.bx=760;sb.by=60+i*130}
    el.style.left=sb.bx+'px';el.style.top=sb.by+'px';
    const s=A.stats(sb.id);
    el.innerHTML=\`<div style="display:flex;align-items:center;gap:6px;font-family:var(--scrawl);font-size:20px">\${appIcon('boards',18)}<span>\${esc(sb.name)}</span></div>
      <div class="dim">\${s.done}/\${s.total} done</div><div class="bar" style="margin-top:4px"><i style="width:\${s.pct}%"></i></div>\`;
    el.ondblclick=()=>openBoard(sb.id);
    el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Open',()=>openBoard(sb.id)],
        ['Rename…',()=>ask('Rename board','Name',sb.name,v=>{sb.name=v;changed('board.changed',{boardId:sb.id})})],
        ['Delete board',()=>confirmBox('Delete board',\`Delete “\${sb.name}” and everything on it?\`,()=>{A.deleteBoard(sb.id);changed()})]],sb.name)};
    drag(el,(dx,dy)=>{el.style.left=(el._x+dx/cam().z)+'px';el.style.top=(el._y+dy/cam().z)+'px'},
      ()=>{el._x=sb.bx;el._y=sb.by},m=>{if(!m)return;sb.bx=parseFloat(el.style.left);sb.by=parseFloat(el.style.top);save()});
    return el;
  }
  holder.addEventListener('contextmenu',e=>{
    if(e.target.closest('.card,.note,.fcard,.bcard'))return;
    const p=toBoard(e);
    menu(e.clientX,e.clientY,[
      ['New task here',()=>{const t=A.addTask(id,'New task');t.x=p.x;t.y=p.y;changed('board.changed',{boardId:id})}],
      ['New sticky note here',()=>{const n=A.addNote(id,'');n.x=p.x;n.y=p.y;changed('board.changed',{boardId:id})}],
      ['New sub-board',()=>newBoardDialog(id)],
      ['Attach file…',()=>pickFiles(fs=>{fs.forEach(f=>{const c=A.addFileCard(id,f.id);c.x=p.x;c.y=p.y});changed('board.changed',{boardId:id})})],
      '-',
      ['New script for this board',()=>{const s=newScript(id);openScriptEditor(s.id)}],
      ['Scripts on this board',()=>boardScriptsMenu(e,id)],
      '-',['Arrange in a grid',()=>{Layout.grid(A.objects(B()));changed('board.changed',{boardId:id})}],
      ['Fit to view',fit],
    ],B().name);
  });

  win.api={render,flash(oid){const el=$(\`[data-tid="\${oid}"]\`,canvas)||canvas.querySelector('.card');
      if(el){el.classList.add('hi');setTimeout(()=>el.classList.remove('hi'),900)}},
    focus(o){const c=cam();c.x=holder.clientWidth/2-o.x*c.z-100;c.y=holder.clientHeight/2-o.y*c.z-60;applyCam();save()},
    pan(dx,dy){const c=cam();c.x+=dx;c.y+=dy;applyCam()},
    zoom(z){cam().z=clamp(z,.2,3);applyCam();renderTool()},boardId:id};
  render();
}

/* ---------- shared pickers ---------- */
function newBoardDialog(parent){
  modal('New board',\`<label class="fld">Name</label><input type="text" id="_n" value="New board">
    <label class="fld">Lives inside</label><select id="_p">\${Object.values(S.boards).map(b=>
      \`<option value="\${b.id}" \${b.id===parent?'selected':''}>\${esc(A.path(b.id).map(x=>x.name).join(' › '))}</option>\`).join('')}
      <option value="">— top level —</option></select>
    <label class="fld">Projects</label><div class="row" id="_pr">\${S.projects.length?S.projects.map(p=>
      \`<button class="tag" data-p="\${p.id}">\${esc(p.name)}</button>\`).join(''):'<span class="dim">No projects yet.</span>'}</div>\`,
    [['Cancel',null],['Create board',b=>{
      const nm=$('#_n',b).value.trim()||'New board',pa=$('#_p',b).value||null;
      const pr=$$('#_pr .tag.on',b).map(x=>x.dataset.p);
      const nb=A.createBoard(nm,pa,pr);changed();openBoard(nb.id);},1]],
    b=>{$$('#_pr .tag',b).forEach(t=>t.onclick=()=>t.classList.toggle('on'))});
}
function pickBoard(title,cb,exclude){
  menu(innerWidth/2-120,120,Object.values(S.boards).filter(b=>b.id!==exclude)
    .map(b=>[A.path(b.id).map(x=>x.name).join(' › '),()=>cb(b.id)]),title);
}
function pickTask(boardId,exclude,cb){
  const b=A.board(boardId),list=b.tasks.filter(t=>t.id!==exclude);
  if(!list.length)return toast('No other tasks on this board.');
  menu(innerWidth/2-120,120,list.map(t=>[t.title,()=>cb(t)]),'Choose a task');
}
function pickFiles(cb){
  const inp=document.createElement('input');inp.type='file';inp.multiple=true;
  inp.onchange=()=>{const out=[],list=[...inp.files];let left=list.length;
    if(!left)return;
    list.forEach(f=>{
      if(f.size>1_800_000){toast(\`\${f.name} is too big to store (1.8 MB max).\`);if(!--left&&out.length)cb(out);return}
      const r=new FileReader();
      r.onload=()=>{const rec={id:uid('f'),name:f.name,type:f.type||'application/octet-stream',size:f.size,data:r.result,added:Date.now()};
        S.files.push(rec);out.push(rec);if(!--left)cb(out);};
      r.readAsDataURL(f);});};
  inp.click();
}
function taskDetails(t,boardId){
  modal('Task details',\`<label class="fld">Title</label><input type="text" id="_t" value="\${esc(t.title)}">
    <label class="fld">Description</label><textarea id="_d" rows="3">\${esc(t.desc)}</textarea>
    <div class="row"><div style="flex:1"><label class="fld">Priority</label>
      <select id="_p">\${PRIOS.map(p=>\`<option \${t.priority===p?'selected':''}>\${p}</option>\`).join('')}</select></div>
      <div style="flex:1"><label class="fld">Status</label>
      <select id="_s">\${STATUSES.map(p=>\`<option \${t.status===p?'selected':''}>\${p}</option>\`).join('')}</select></div></div>
    <label class="fld">Deadline</label><input type="date" id="_dl" value="\${t.deadline||''}">
    <label class="fld">Tags (comma separated)</label><input type="text" id="_g" value="\${esc(t.tags.join(', '))}">\`,
    [['Cancel',null],['Save task',b=>{
      const nv=$('#_t',b).value.trim();if(nv&&nv!==t.title)A.rename(t.id,nv);
      t.desc=$('#_d',b).value;t.priority=$('#_p',b).value;t.status=$('#_s',b).value;
      t.deadline=$('#_dl',b).value;t.tags=$('#_g',b).value.split(',').map(s=>s.trim()).filter(Boolean);
      if(t.status==='done')A.setDone(t.id,true);
      changed('board.changed',{boardId});},1]]);
}

/* ============================ node registry ============================ */
const NODES={};
const CATS=['Events','Board','Task','Query','Sort','Layout','Logic','Data','Notes','Files','Projects','Calendar','Ask','Visual','Script'];
function def(o){o.ins||=[];o.outs||=[];o.params||=[];NODES[o.t]=o;return o}
const X=(id,l)=>({id,l,x:true});
const P=(id,l)=>({id,l});
const toItems=(list,k='task')=>list.map(o=>({o,k}));
const asArr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
const num=v=>{const n=parseFloat(v);return isNaN(n)?0:n};
function tomorrowISO(){const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10)}

/* ---------- events ---------- */
const EVENTS=[
  ['ev.boardOpened','Board Opened','board.opened'],['ev.boardChanged','Board Changed','board.changed'],
  ['ev.taskCreated','Task Created','task.created'],['ev.taskCompleted','Task Completed','task.completed'],
  ['ev.taskUncompleted','Task Uncompleted','task.uncompleted'],['ev.taskMoved','Task Moved','task.moved'],
  ['ev.taskRenamed','Task Renamed','task.renamed'],['ev.taskDeleted','Task Deleted','task.deleted'],
  ['ev.subCreated','Subtask Created','subtask.created'],['ev.noteCreated','Note Created','note.created'],
  ['ev.fileAttached','File Attached','file.attached'],['ev.boardCreated','Board Created','board.created'],
  ['ev.projectChanged','Project Changed','project.changed'],['ev.manual','Manual Run','script.manual'],
  ['ev.enabled','Script Enabled','script.enabled'],['ev.disabled','Script Disabled','script.disabled'],
  ['ev.eventCreated','Calendar Event Created','cal.created'],['ev.eventStarting','Event Starting','cal.starting'],
  ['ev.eventFinished','Event Finished','cal.finished'],
];
EVENTS.forEach(([t,title,sig])=>def({t,cat:'Events',title,ev:sig,
  outs:[X('out','when'),P('task','task'),P('board','board')],
  run:C=>({next:'out'}),data:C=>({task:C.payload.task||null,board:C.payload.boardId?A.board(C.payload.boardId):C.board()})}));
def({t:'ev.timer',cat:'Events',title:'Timer',ev:'timer',params:[{id:'sec',l:'Every N seconds',k:'num',d:60}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.interval',cat:'Events',title:'Recurring Interval',ev:'interval',params:[{id:'min',l:'Every N minutes',k:'num',d:15}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.at',cat:'Events',title:'Scheduled Time',ev:'at',params:[{id:'time',l:'At time',k:'time',d:'09:00'}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.morning',cat:'Events',title:'Every Morning',ev:'at',params:[{id:'time',l:'At time',k:'time',d:'08:00'}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.weekly',cat:'Events',title:'Every Monday',ev:'weekly',
  params:[{id:'day',l:'Day',k:'sel',o:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],d:'Monday'},{id:'time',l:'At',k:'time',d:'08:00'}],
  outs:[X('out','when')],run:()=>({next:'out'})});
def({t:'ev.custom',cat:'Events',title:'Custom Event',ev:'custom',params:[{id:'name',l:'Event name',k:'text',d:'ping'}],
  outs:[X('out','when'),P('data','data')],run:()=>({next:'out'}),data:C=>({data:C.payload.data??null})});

/* ---------- board ---------- */
def({t:'b.current',cat:'Board',title:'Get Current Board',pure:1,outs:[P('board','board'),P('name','name')],
  run:C=>{const b=C.board();return{board:b,name:b?b.name:''}}});
def({t:'b.get',cat:'Board',title:'Get Board',pure:1,params:[{id:'name',l:'Board name',k:'text'}],outs:[P('board','board')],
  run:(C,I,p)=>({board:Object.values(S.boards).find(b=>b.name.toLowerCase()===String(p.name||'').toLowerCase())||null})});
def({t:'b.create',cat:'Board',title:'Create Board',ins:[X('in'),P('name','name')],outs:[X('out'),P('board','board')],
  params:[{id:'name',l:'Name',k:'text',d:'New board'},{id:'child',l:'Inside current board',k:'check',d:true}],
  run:(C,I,p)=>{if(!C.can('boards'))return C.deny('create boards');
    const b=C.mut(()=>A.createBoard(I.name||p.name,p.child?C.boardId:null),{name:I.name||p.name});
    C.plan('Create 1 board');return{next:'out',out:{board:b}}}});
def({t:'b.delete',cat:'Board',title:'Delete Board',ins:[X('in'),P('board','board')],outs:[X('out')],
  run:(C,I)=>{const b=I.board;if(!b)return{next:'out'};
    if(!C.can('boards')||!C.can('delete'))return C.deny('delete boards');
    C.plan('Delete board “'+b.name+'”');C.mut(()=>A.deleteBoard(b.id));return{next:'out'}}});
def({t:'b.rename',cat:'Board',title:'Rename Board',ins:[X('in'),P('board','board'),P('name','name')],outs:[X('out')],
  params:[{id:'name',l:'New name',k:'text'}],
  run:(C,I,p)=>{const b=I.board||C.board();if(b&&C.can('boards')){C.plan('Rename board');C.mut(()=>b.name=String(I.name??p.name??b.name))}return{next:'out'}}});
def({t:'b.move',cat:'Board',title:'Move Board',ins:[X('in'),P('board','board'),P('parent','into')],outs:[X('out')],
  run:(C,I)=>{const b=I.board||C.board();if(b&&I.parent&&C.can('boards'))C.mut(()=>b.parent=I.parent.id);return{next:'out'}}});
def({t:'b.dup',cat:'Board',title:'Duplicate Board',ins:[X('in'),P('board','board')],outs:[X('out'),P('board','copy')],
  run:(C,I)=>{const b=I.board||C.board();const c=C.can('boards')?C.mut(()=>A.dupBoard(b.id)):null;
    C.plan('Duplicate a board');return{next:'out',out:{board:c}}}});
def({t:'b.parent',cat:'Board',title:'Get Parent Board',pure:1,ins:[P('board','board')],outs:[P('board','parent')],
  run:(C,I)=>({board:A.parent((I.board||C.board()).id)})});
def({t:'b.children',cat:'Board',title:'Get Child Boards',pure:1,ins:[P('board','board')],outs:[P('list','boards'),P('count','count')],
  run:(C,I)=>{const l=A.children((I.board||C.board()).id);return{list:l,count:l.length}}});
def({t:'b.tags',cat:'Board',title:'Get Project Tags',pure:1,ins:[P('board','board')],outs:[P('list','tags')],
  run:(C,I)=>({list:(I.board||C.board()).projects.map(A.projName)})});
def({t:'b.addTag',cat:'Board',title:'Add Project Tag',ins:[X('in'),P('board','board')],outs:[X('out')],
  params:[{id:'name',l:'Project',k:'proj'}],
  run:(C,I,p)=>{const b=I.board||C.board(),pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    if(b&&pr&&!b.projects.includes(pr.id))C.mut(()=>b.projects.push(pr.id));return{next:'out'}}});
def({t:'b.rmTag',cat:'Board',title:'Remove Project Tag',ins:[X('in'),P('board','board')],outs:[X('out')],
  params:[{id:'name',l:'Project',k:'proj'}],
  run:(C,I,p)=>{const b=I.board||C.board(),pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    if(b&&pr)C.mut(()=>b.projects=b.projects.filter(x=>x!==pr.id));return{next:'out'}}});
def({t:'b.stats',cat:'Board',title:'Board Statistics',pure:1,ins:[P('board','board')],
  outs:[P('done','done'),P('total','total'),P('pct','percent')],
  run:(C,I)=>{const s=A.stats((I.board||C.board()).id);return{done:s.done,total:s.total,pct:s.pct}}});

/* ---------- task getters ---------- */
const GETTERS=[
  ['t.all','All Tasks',ts=>ts],['t.done','Completed Tasks',ts=>ts.filter(t=>t.done)],
  ['t.open','Incomplete Tasks',ts=>ts.filter(t=>!t.done)],
  ['t.overdue','Overdue Tasks',ts=>ts.filter(A.isOverdue)],
  ['t.today','Tasks Due Today',ts=>ts.filter(t=>t.deadline===todayISO())],
  ['t.tomorrow','Tasks Due Tomorrow',ts=>ts.filter(t=>t.deadline===tomorrowISO())],
  ['t.nodl','Tasks Without Deadlines',ts=>ts.filter(t=>!t.deadline)],
];
GETTERS.forEach(([t,title,fn])=>def({t,cat:'Task',title,pure:1,ins:[P('board','board')],
  outs:[P('list','tasks'),P('count','count')],
  run:(C,I)=>{const b=I.board||C.board();const l=fn(b?b.tasks.slice():[]);return{list:l,count:l.length}}}));
def({t:'t.tagged',cat:'Task',title:'Tasks With Tag',pure:1,ins:[P('board','board')],params:[{id:'tag',l:'Tag',k:'text'}],
  outs:[P('list','tasks')],run:(C,I,p)=>({list:(I.board||C.board()).tasks.filter(t=>t.tags.includes(p.tag))})});
def({t:'t.project',cat:'Task',title:'Get Project Tasks',pure:1,params:[{id:'name',l:'Project',k:'proj'}],
  outs:[P('list','tasks'),P('count','count')],
  run:(C,I,p)=>{const pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    const l=pr?Object.values(S.boards).filter(b=>b.projects.includes(pr.id)).flatMap(b=>b.tasks):[];
    return{list:l,count:l.length}}});
def({t:'t.allBoards',cat:'Task',title:'Tasks Across All Boards',pure:1,outs:[P('list','tasks'),P('count','count')],
  run:()=>{const l=Object.values(S.boards).flatMap(b=>b.tasks);return{list:l,count:l.length}}});

/* ---------- task actions ---------- */
def({t:'t.create',cat:'Task',title:'Create Task',ins:[X('in'),P('title','title'),P('board','board')],
  outs:[X('out'),P('task','task')],params:[{id:'title',l:'Title',k:'text',d:'New task'},{id:'prio',l:'Priority',k:'sel',o:PRIOS,d:'normal'}],
  run:(C,I,p)=>{if(!C.can('tasks'))return C.deny('create tasks');
    const b=I.board||C.board();C.plan('Create 1 task');
    const t=C.mut(()=>A.addTask(b.id,String(I.title??p.title),{priority:p.prio}),{title:I.title??p.title});
    return{next:'out',out:{task:t}}}});
def({t:'t.delete',cat:'Task',title:'Delete Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{const list=asArr(I.task);if(!C.can('tasks')||!C.can('delete'))return C.deny('delete tasks');
    C.plan(\`Delete \${list.length} task(s)\`);C.mut(()=>list.forEach(t=>t&&A.delTask(t.id)));return{next:'out'}}});
def({t:'t.dup',cat:'Task',title:'Duplicate Task',ins:[X('in'),P('task','task')],outs:[X('out'),P('task','copy')],
  run:(C,I)=>{const t=asArr(I.task)[0];let c=null;
    if(t&&C.can('tasks'))c=C.mut(()=>{const f=A.findTask(t.id);const n=JSON.parse(JSON.stringify(t));n.id=uid('t');n.x+=24;n.y+=24;
      f.board.tasks.push(n);Bus.emit('task.created',{boardId:f.board.id,task:n});return n});
    return{next:'out',out:{task:c}}}});
def({t:'t.rename',cat:'Task',title:'Rename Task',ins:[X('in'),P('task','task'),P('name','name')],outs:[X('out')],
  params:[{id:'name',l:'New name',k:'text'}],
  run:(C,I,p)=>{asArr(I.task).forEach(t=>t&&C.can('tasks')&&C.mut(()=>A.rename(t.id,String(I.name??p.name))));
    C.plan('Rename task(s)');return{next:'out'}}});
def({t:'t.complete',cat:'Task',title:'Complete Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{const l=asArr(I.task);C.plan(\`Complete \${l.length} task(s)\`);
    if(C.can('tasks'))C.mut(()=>l.forEach(t=>t&&A.setDone(t.id,true)));return{next:'out'}}});
def({t:'t.uncomplete',cat:'Task',title:'Uncomplete Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{const l=asArr(I.task);if(C.can('tasks'))C.mut(()=>l.forEach(t=>t&&A.setDone(t.id,false)));return{next:'out'}}});
def({t:'t.toBoard',cat:'Task',title:'Move Task to Board',ins:[X('in'),P('task','task'),P('board','board')],outs:[X('out')],
  params:[{id:'name',l:'Board name (if unlinked)',k:'text'}],
  run:(C,I,p)=>{const l=asArr(I.task);
    const to=I.board||Object.values(S.boards).find(b=>b.name.toLowerCase()===String(p.name||'').toLowerCase());
    if(!to)return{next:'out'};C.plan(\`Move \${l.length} task(s) to “\${to.name}”\`);
    if(C.can('tasks'))C.mut(()=>l.forEach(t=>t&&A.moveTaskToBoard(t.id,to.id)));return{next:'out'}}});
def({t:'t.sub',cat:'Task',title:'Create Subtask',ins:[X('in'),P('task','task'),P('title','title')],outs:[X('out')],
  params:[{id:'title',l:'Title',k:'text',d:'Subtask'}],
  run:(C,I,p)=>{asArr(I.task).forEach(t=>t&&C.mut(()=>A.addSub(t.id,String(I.title??p.title))));return{next:'out'}}});
def({t:'t.rmSub',cat:'Task',title:'Remove Subtasks',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'only',l:'Only completed',k:'check',d:true}],
  run:(C,I,p)=>{asArr(I.task).forEach(t=>t&&C.mut(()=>t.subtasks=p.only?t.subtasks.filter(s=>!s.done):[]));return{next:'out'}}});
def({t:'t.prio',cat:'Task',title:'Set Priority',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'v',l:'Priority',k:'sel',o:PRIOS,d:'high'}],
  run:(C,I,p)=>{const l=asArr(I.task);C.plan(\`Set priority on \${l.length} task(s)\`);
    C.mut(()=>l.forEach(t=>t&&(t.priority=p.v)));return{next:'out'}}});
def({t:'t.status',cat:'Task',title:'Set Status',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'v',l:'Status',k:'sel',o:STATUSES,d:'doing'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&(t.status=p.v)));return{next:'out'}}});
def({t:'t.desc',cat:'Task',title:'Set Description',ins:[X('in'),P('task','task'),P('text','text')],outs:[X('out')],
  params:[{id:'text',l:'Description',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&(t.desc=String(I.text??p.text??''))));return{next:'out'}}});
def({t:'t.deadline',cat:'Task',title:'Set Deadline',ins:[X('in'),P('task','task'),P('date','date')],outs:[X('out')],
  params:[{id:'date',l:'Date',k:'date'},{id:'rel',l:'Or relative',k:'sel',o:['—','today','tomorrow','+7 days'],d:'—'}],
  run:(C,I,p)=>{let d=I.date||p.date||'';
    if(p.rel==='today')d=todayISO();else if(p.rel==='tomorrow')d=tomorrowISO();
    else if(p.rel==='+7 days'){const x=new Date();x.setDate(x.getDate()+7);d=x.toISOString().slice(0,10)}
    C.mut(()=>asArr(I.task).forEach(t=>t&&(t.deadline=d)));return{next:'out'}}});
def({t:'t.addTag',cat:'Task',title:'Add Tag',ins:[X('in'),P('task','task')],outs:[X('out')],params:[{id:'tag',l:'Tag',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&!t.tags.includes(p.tag)&&t.tags.push(p.tag)));return{next:'out'}}});
def({t:'t.rmTag',cat:'Task',title:'Remove Tag',ins:[X('in'),P('task','task')],outs:[X('out')],params:[{id:'tag',l:'Tag',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.task).forEach(t=>t&&(t.tags=t.tags.filter(g=>g!==p.tag))));return{next:'out'}}});
def({t:'t.sync',cat:'Task',title:'Sync Task States',ins:[X('in'),P('task','task')],outs:[X('out')],
  params:[{id:'by',l:'Match tasks elsewhere by',k:'sel',o:['same title'],d:'same title'}],
  run:(C,I)=>{asArr(I.task).forEach(t=>{if(!t)return;
    Object.values(S.boards).forEach(b=>b.tasks.forEach(o=>{
      if(o.id!==t.id&&o.title===t.title&&o.done!==t.done)C.mut(()=>A.setDone(o.id,t.done))}))});
    C.plan('Synchronise matching tasks');return{next:'out'}}});

/* ---------- query ---------- */
const OPS=['equals','does not equal','greater than','less than','greater or equal','less or equal','contains','starts with','is empty','exists'];
function cmp(v,op,b){
  const sv=v==null?'':String(v).toLowerCase(),sb=String(b??'').toLowerCase();
  switch(op){
    case 'equals':return sv===sb;case 'does not equal':return sv!==sb;
    case 'greater than':return num(v)>num(b);case 'less than':return num(v)<num(b);
    case 'greater or equal':return num(v)>=num(b);case 'less or equal':return num(v)<=num(b);
    case 'contains':return sv.includes(sb);case 'starts with':return sv.startsWith(sb);
    case 'is empty':return sv==='';case 'exists':return sv!=='';}
  return false;
}
const FIELDS=['title','done','priority','status','deadline','tags','description','subtask count','overdue'];
function fieldOf(t,f){switch(f){case 'title':return t.title;case 'done':return t.done?'true':'false';
  case 'priority':return t.priority;case 'status':return t.status;case 'deadline':return t.deadline;
  case 'tags':return (t.tags||[]).join(',');case 'description':return t.desc;
  case 'subtask count':return (t.subtasks||[]).length;case 'overdue':return A.isOverdue(t)?'true':'false';}return ''}
def({t:'q.filter',cat:'Query',title:'Filter',pure:1,ins:[P('list','list')],outs:[P('list','matches'),P('count','count'),P('rest','rejected')],
  params:[{id:'f',l:'Field',k:'sel',o:FIELDS,d:'title'},{id:'op',l:'Condition',k:'sel',o:OPS,d:'contains'},{id:'v',l:'Value',k:'text'}],
  run:(C,I,p)=>{const l=asArr(I.list),m=l.filter(t=>cmp(fieldOf(t,p.f),p.op,p.v));
    return{list:m,count:m.length,rest:l.filter(t=>!m.includes(t))}}});
def({t:'q.and',cat:'Query',title:'AND',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  run:(C,I)=>({v:!!truthy(I.a)&&!!truthy(I.b)})});
def({t:'q.or',cat:'Query',title:'OR',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  run:(C,I)=>({v:!!truthy(I.a)||!!truthy(I.b)})});
def({t:'q.not',cat:'Query',title:'NOT',pure:1,ins:[P('a','value')],outs:[P('v','result')],run:(C,I)=>({v:!truthy(I.a)})});
def({t:'q.compare',cat:'Query',title:'Compare',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  params:[{id:'op',l:'Condition',k:'sel',o:OPS,d:'equals'},{id:'b',l:'…value',k:'text'}],
  run:(C,I,p)=>({v:cmp(I.a,p.op,I.b??p.b)})});
def({t:'q.intersect',cat:'Query',title:'Both Lists (AND)',pure:1,ins:[P('a','list a'),P('b','list b')],outs:[P('list','list')],
  run:(C,I)=>({list:asArr(I.a).filter(x=>asArr(I.b).includes(x))})});
function truthy(v){return Array.isArray(v)?v.length>0:!!v&&v!=='false'}

/* ---------- sort ---------- */
const SORTK=['name','priority','deadline','creation date','completion status','status','tags','subtask count'];
function sortKey(t,k){switch(k){case 'name':return (t.title||'').toLowerCase();
  case 'priority':return PRIOS.indexOf(t.priority);case 'deadline':return t.deadline||'9999';
  case 'creation date':return t.created||0;case 'completion status':return t.done?1:0;
  case 'status':return STATUSES.indexOf(t.status);case 'tags':return (t.tags||[]).join(',');
  case 'subtask count':return (t.subtasks||[]).length;}return 0}
def({t:'s.sort',cat:'Sort',title:'Sort',pure:1,ins:[P('list','list')],outs:[P('list','sorted')],
  params:[{id:'k',l:'By',k:'sel',o:SORTK,d:'priority'},{id:'dir',l:'Order',k:'sel',o:['ascending','descending'],d:'descending'}],
  run:(C,I,p)=>{const l=asArr(I.list).slice().sort((a,b)=>{const x=sortKey(a,p.k),y=sortKey(b,p.k);
      return x<y?-1:x>y?1:0});if(p.dir==='descending')l.reverse();return{list:l}}});
def({t:'s.group',cat:'Sort',title:'Group By',pure:1,ins:[P('list','list')],outs:[P('groups','groups'),P('count','groups #')],
  params:[{id:'k',l:'Field',k:'sel',o:FIELDS,d:'priority'}],
  run:(C,I,p)=>{const g={};asArr(I.list).forEach(t=>{(g[fieldOf(t,p.k)]||=[]).push(t)});
    return{groups:Object.entries(g).map(([k,v])=>({key:k,items:v})),count:Object.keys(g).length}}});
def({t:'s.unique',cat:'Sort',title:'Unique',pure:1,ins:[P('list','list')],outs:[P('list','list')],
  params:[{id:'k',l:'By field',k:'sel',o:FIELDS,d:'title'}],
  run:(C,I,p)=>{const seen=new Set(),out=[];asArr(I.list).forEach(t=>{const k=fieldOf(t,p.k);
    if(!seen.has(k)){seen.add(k);out.push(t)}});return{list:out}}});

/* ---------- layout ---------- */
const LAYOUTS=[['l.grid','Arrange Grid','grid'],['l.rows','Arrange Rows','rows'],['l.cols','Arrange Columns','columns'],
 ['l.vert','Arrange Vertically','vertical'],['l.horiz','Arrange Horizontally','horizontal'],
 ['l.circle','Arrange Circle','circle'],['l.spiral','Arrange Spiral','spiral'],['l.stack','Stack','stack'],['l.pack','Pack','pack']];
LAYOUTS.forEach(([t,title,fn])=>def({t,cat:'Layout',title,ins:[X('in'),P('list','items')],outs:[X('out')],
  params:[{id:'x',l:'Start X',k:'num',d:60},{id:'y',l:'Start Y',k:'num',d:60},{id:'cols',l:'Columns / gap',k:'num',d:0}],
  run:(C,I,p)=>{const l=asArr(I.list);if(!l.length)return{next:'out'};
    C.plan(\`Rearrange \${l.length} card(s)\`);
    C.mut(()=>Layout[fn](toItems(l),{x:num(p.x),y:num(p.y),cols:num(p.cols)||undefined,gap:num(p.cols)||undefined}));
    C.touch();return{next:'out'}}}));
def({t:'l.align',cat:'Layout',title:'Align',ins:[X('in'),P('list','items')],outs:[X('out')],
  params:[{id:'how',l:'Edge',k:'sel',o:['left','right','top','bottom','middle'],d:'left'}],
  run:(C,I,p)=>{C.mut(()=>Layout.align(toItems(asArr(I.list)),{how:p.how}));C.touch();return{next:'out'}}});
def({t:'l.dist',cat:'Layout',title:'Distribute',ins:[X('in'),P('list','items')],outs:[X('out')],
  params:[{id:'axis',l:'Axis',k:'sel',o:['x','y'],d:'x'}],
  run:(C,I,p)=>{C.mut(()=>Layout.distribute(toItems(asArr(I.list)),{axis:p.axis}));C.touch();return{next:'out'}}});
def({t:'l.move',cat:'Layout',title:'Move Object',ins:[X('in'),P('obj','object')],outs:[X('out')],
  params:[{id:'x',l:'X',k:'num',d:80},{id:'y',l:'Y',k:'num',d:80},{id:'rel',l:'Relative',k:'check',d:false}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.obj).forEach(o=>{if(!o)return;
    o.x=p.rel?o.x+num(p.x):num(p.x);o.y=p.rel?o.y+num(p.y):num(p.y)}));C.touch();return{next:'out'}}});
def({t:'l.resize',cat:'Layout',title:'Resize Note',ins:[X('in'),P('obj','note')],outs:[X('out')],
  params:[{id:'w',l:'Width',k:'num',d:200},{id:'h',l:'Height',k:'num',d:140}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.obj).forEach(o=>{if(o){o.w=num(p.w);o.h=num(p.h)}}));C.touch();return{next:'out'}}});
def({t:'l.urgent',cat:'Layout',title:'Move to Urgent Area',ins:[X('in'),P('list','tasks')],outs:[X('out')],
  run:(C,I)=>{const l=asArr(I.list);C.plan(\`Move \${l.length} task(s) to the urgent corner\`);
    C.mut(()=>Layout.vertical(toItems(l),{x:-260,y:60,gap:140}));C.touch();return{next:'out'}}});

/* ---------- logic ---------- */
def({t:'x.if',cat:'Logic',title:'If / Else',ins:[X('in'),P('cond','condition')],outs:[X('then','then'),X('else','else')],
  run:(C,I)=>({next:truthy(I.cond)?'then':'else'})});
def({t:'x.switch',cat:'Logic',title:'Switch / Case',ins:[X('in'),P('v','value')],
  outs:[X('a','case A'),X('b','case B'),X('c','case C'),X('out','default')],
  params:[{id:'a',l:'Case A',k:'text'},{id:'b',l:'Case B',k:'text'},{id:'c',l:'Case C',k:'text'}],
  run:(C,I,p)=>{const v=String(I.v??'').toLowerCase();
    return{next:v===String(p.a??'').toLowerCase()?'a':v===String(p.b??'').toLowerCase()?'b':v===String(p.c??'').toLowerCase()?'c':'out'}}});
def({t:'x.foreach',cat:'Logic',title:'For Each',ins:[X('in'),P('list','list')],
  outs:[X('body','each'),X('out','after'),P('item','item'),P('i','index')],loop:'list',
  run:()=>({next:'out'})});
def({t:'x.repeat',cat:'Logic',title:'Repeat',ins:[X('in')],outs:[X('body','each'),X('out','after'),P('i','index')],
  params:[{id:'n',l:'Times',k:'num',d:3}],loop:'count',run:()=>({next:'out'})});
def({t:'x.while',cat:'Logic',title:'While',ins:[X('in'),P('cond','condition')],outs:[X('body','each'),X('out','after')],
  loop:'while',run:()=>({next:'out'})});
def({t:'x.delay',cat:'Logic',title:'Delay',ins:[X('in')],outs:[X('out')],params:[{id:'ms',l:'Milliseconds',k:'num',d:400}],
  run:async(C,I,p)=>{if(!C.dry)await new Promise(r=>setTimeout(r,clamp(num(p.ms),0,5000)));return{next:'out'}}});
def({t:'x.wait',cat:'Logic',title:'Wait Seconds',ins:[X('in')],outs:[X('out')],params:[{id:'s',l:'Seconds',k:'num',d:1}],
  run:async(C,I,p)=>{if(!C.dry)await new Promise(r=>setTimeout(r,clamp(num(p.s)*1000,0,10000)));return{next:'out'}}});
def({t:'x.stop',cat:'Logic',title:'Stop',ins:[X('in')],outs:[],run:C=>{C.log('Stopped.');return{stop:true}}});
def({t:'x.log',cat:'Logic',title:'Log Message',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'m',l:'Message',k:'text',d:'…'}],
  run:(C,I,p)=>{C.log(String(p.m)+(I.v!==undefined?' → '+fmt(I.v):''));return{next:'out'}}});

/* ---------- data ---------- */
function fmt(v){if(v==null)return '—';if(Array.isArray(v))return \`[\${v.length} item\${v.length===1?'':'s'}]\`;
  if(typeof v==='object')return v.title||v.name||'{object}';return String(v)}
def({t:'d.text',cat:'Data',title:'Text',pure:1,outs:[P('v','text')],params:[{id:'v',l:'Value',k:'text',d:''}],run:(C,I,p)=>({v:String(p.v??'')})});
def({t:'d.num',cat:'Data',title:'Number',pure:1,outs:[P('v','number')],params:[{id:'v',l:'Value',k:'num',d:0}],run:(C,I,p)=>({v:num(p.v)})});
def({t:'d.bool',cat:'Data',title:'Boolean',pure:1,outs:[P('v','value')],params:[{id:'v',l:'True',k:'check',d:true}],run:(C,I,p)=>({v:!!p.v})});
def({t:'d.date',cat:'Data',title:'Date',pure:1,outs:[P('v','date')],
  params:[{id:'mode',l:'Which',k:'sel',o:['today','tomorrow','fixed'],d:'today'},{id:'v',l:'Fixed date',k:'date'}],
  run:(C,I,p)=>({v:p.mode==='today'?todayISO():p.mode==='tomorrow'?tomorrowISO():(p.v||todayISO())})});
def({t:'d.time',cat:'Data',title:'Time Now',pure:1,outs:[P('v','time'),P('hour','hour'),P('weekday','weekday')],
  run:()=>{const d=new Date();return{v:d.toTimeString().slice(0,5),hour:d.getHours(),
    weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]}}});
def({t:'d.get',cat:'Data',title:'Get Property',pure:1,ins:[P('obj','object')],outs:[P('v','value')],
  params:[{id:'f',l:'Field',k:'sel',o:FIELDS,d:'title'}],
  run:(C,I,p)=>{const o=Array.isArray(I.obj)?I.obj[0]:I.obj;return{v:o?fieldOf(o,p.f):''}}});
def({t:'d.var.get',cat:'Data',title:'Get Variable',pure:1,outs:[P('v','value')],params:[{id:'n',l:'Name',k:'text',d:'count'}],
  run:(C,I,p)=>({v:C.vars[p.n]})});
def({t:'d.var.set',cat:'Data',title:'Set Variable',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'n',l:'Name',k:'text',d:'count'},{id:'v',l:'Fallback value',k:'text'}],
  run:(C,I,p)=>{C.vars[p.n]=I.v!==undefined?I.v:p.v;return{next:'out'}}});
const AGG=[['d.count','Count',l=>l.length],['d.sum','Sum',l=>l.reduce((a,b)=>a+num(b),0)],
  ['d.avg','Average',l=>l.length?l.reduce((a,b)=>a+num(b),0)/l.length:0],
  ['d.min','Minimum',l=>l.length?Math.min(...l.map(num)):0],['d.max','Maximum',l=>l.length?Math.max(...l.map(num)):0]];
AGG.forEach(([t,title,fn])=>def({t,cat:'Data',title,pure:1,ins:[P('list','list')],outs:[P('v','value')],
  params:t==='d.count'?[]:[{id:'f',l:'Field',k:'sel',o:FIELDS,d:'subtask count'}],
  run:(C,I,p)=>({v:fn(asArr(I.list).map(x=>p&&p.f?fieldOf(x,p.f):x))})}));
def({t:'d.math',cat:'Data',title:'Maths',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','result')],
  params:[{id:'op',l:'Operation',k:'sel',o:['+','−','×','÷','%'],d:'+'},{id:'b',l:'…or b',k:'num',d:0}],
  run:(C,I,p)=>{const a=num(I.a),b=I.b!==undefined?num(I.b):num(p.b);
    return{v:p.op==='+'?a+b:p.op==='−'?a-b:p.op==='×'?a*b:p.op==='÷'?(b?a/b:0):(b?a%b:0)}}});
def({t:'d.format',cat:'Data',title:'Format Text',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('v','text')],
  params:[{id:'tpl',l:'Template ({a} {b})',k:'text',d:'{a} of {b}'}],
  run:(C,I,p)=>({v:String(p.tpl).replace(/\\{a\\}/g,fmt(I.a)).replace(/\\{b\\}/g,fmt(I.b))})});
def({t:'d.merge',cat:'Data',title:'Merge Lists',pure:1,ins:[P('a','a'),P('b','b')],outs:[P('list','list')],
  run:(C,I)=>({list:[...asArr(I.a),...asArr(I.b)]})});
def({t:'d.split',cat:'Data',title:'Split Text',pure:1,ins:[P('v','text')],outs:[P('list','parts')],
  params:[{id:'sep',l:'Separator',k:'text',d:','}],
  run:(C,I,p)=>({list:String(I.v??'').split(p.sep||',').map(s=>s.trim())})});
def({t:'d.replace',cat:'Data',title:'Replace Text',pure:1,ins:[P('v','text')],outs:[P('v','text')],
  params:[{id:'a',l:'Find',k:'text'},{id:'b',l:'Replace with',k:'text'}],
  run:(C,I,p)=>({v:String(I.v??'').split(p.a||'').join(p.b||'')})});
def({t:'d.first',cat:'Data',title:'First / Nth Item',pure:1,ins:[P('list','list')],outs:[P('v','item')],
  params:[{id:'i',l:'Index (0 = first)',k:'num',d:0}],run:(C,I,p)=>({v:asArr(I.list)[num(p.i)]??null})});

/* ---------- notes & files ---------- */
def({t:'n.create',cat:'Notes',title:'Create Note',ins:[X('in'),P('text','text'),P('board','board')],outs:[X('out'),P('note','note')],
  params:[{id:'text',l:'Text',k:'text',d:'Note'}],
  run:(C,I,p)=>{if(!C.can('notes'))return C.deny('create notes');
    C.plan('Create 1 note');const n=C.mut(()=>A.addNote((I.board||C.board()).id,String(I.text??p.text)),{});
    return{next:'out',out:{note:n}}}});
def({t:'n.find',cat:'Notes',title:'Find Notes',pure:1,ins:[P('board','board')],outs:[P('list','notes')],
  params:[{id:'q',l:'Text contains',k:'text'}],
  run:(C,I,p)=>({list:(I.board||C.board()).notes.filter(n=>!p.q||n.text.toLowerCase().includes(String(p.q).toLowerCase()))})});
def({t:'n.edit',cat:'Notes',title:'Edit Note',ins:[X('in'),P('note','note'),P('text','text')],outs:[X('out')],
  params:[{id:'text',l:'New text',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.note).forEach(n=>n&&(n.text=String(I.text??p.text??''))));C.touch();return{next:'out'}}});
def({t:'n.summary',cat:'Notes',title:'Update Summary Note',ins:[X('in'),P('text','text')],outs:[X('out')],
  params:[{id:'title',l:'Note starts with',k:'text',d:'Summary'},{id:'text',l:'Fallback text',k:'text'}],
  run:(C,I,p)=>{const b=C.board();const txt=String(I.text??p.text??'');
    let n=b.notes.find(x=>x.text.startsWith(p.title));
    C.plan('Update 1 summary note');
    C.mut(()=>{if(!n)n=A.addNote(b.id,'');n.text=p.title+'\\n'+txt});C.touch();return{next:'out'}}});
def({t:'n.color',cat:'Notes',title:'Change Note Colour',ins:[X('in'),P('note','note')],outs:[X('out')],
  params:[{id:'i',l:'Colour 1–6',k:'num',d:1}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.note).forEach(n=>n&&(n.color=NOTE_COLORS[clamp(num(p.i)-1,0,5)])));C.touch();return{next:'out'}}});
def({t:'n.delete',cat:'Notes',title:'Delete Notes',ins:[X('in'),P('note','note')],outs:[X('out')],
  run:(C,I)=>{if(!C.can('delete'))return C.deny('delete notes');const b=C.board();
    const ids=asArr(I.note).map(n=>n&&n.id);C.plan(\`Delete \${ids.length} note(s)\`);
    C.mut(()=>b.notes=b.notes.filter(n=>!ids.includes(n.id)));C.touch();return{next:'out'}}});
def({t:'f.find',cat:'Files',title:'Find Files',pure:1,ins:[P('board','board')],outs:[P('list','file cards'),P('count','count')],
  params:[{id:'q',l:'Name contains',k:'text'}],
  run:(C,I,p)=>{const b=I.board||C.board();
    const l=b.files.filter(c=>{const f=A.file(c.fileId);return f&&(!p.q||f.name.toLowerCase().includes(String(p.q).toLowerCase()))});
    return{list:l,count:l.length}}});
def({t:'f.rename',cat:'Files',title:'Rename File',ins:[X('in'),P('file','file card'),P('name','name')],outs:[X('out')],
  params:[{id:'name',l:'New name',k:'text'}],
  run:(C,I,p)=>{C.mut(()=>asArr(I.file).forEach(c=>{const f=c&&A.file(c.fileId);if(f)f.name=String(I.name??p.name??f.name)}));return{next:'out'}}});
def({t:'f.group',cat:'Files',title:'Group Files',ins:[X('in'),P('file','file cards')],outs:[X('out')],
  params:[{id:'x',l:'X',k:'num',d:820},{id:'y',l:'Y',k:'num',d:60}],
  run:(C,I,p)=>{C.mut(()=>Layout.grid(toItems(asArr(I.file),'file'),{x:num(p.x),y:num(p.y),cols:2,gx:170,gy:160}));C.touch();return{next:'out'}}});
def({t:'f.delete',cat:'Files',title:'Remove File Cards',ins:[X('in'),P('file','file cards')],outs:[X('out')],
  run:(C,I)=>{if(!C.can('delete'))return C.deny('remove files');const b=C.board();
    const ids=asArr(I.file).map(c=>c&&c.id);C.plan(\`Remove \${ids.length} file card(s)\`);
    C.mut(()=>b.files=b.files.filter(c=>!ids.includes(c.id)));C.touch();return{next:'out'}}});

/* ---------- projects ---------- */
def({t:'p.boards',cat:'Projects',title:'Find Project Boards',pure:1,params:[{id:'name',l:'Project',k:'proj'}],
  outs:[P('list','boards'),P('count','count')],
  run:(C,I,p)=>{const pr=S.projects.find(x=>x.id===p.name||x.name===p.name);
    const l=pr?Object.values(S.boards).filter(b=>b.projects.includes(pr.id)):[];return{list:l,count:l.length}}});
def({t:'p.aggregate',cat:'Projects',title:'Aggregate Across Boards',pure:1,ins:[P('list','boards')],
  outs:[P('list','tasks'),P('done','done'),P('total','total'),P('pct','percent')],
  run:(C,I)=>{const bs=asArr(I.list),tasks=bs.flatMap(b=>b.tasks||[]);
    const done=tasks.filter(t=>t.done).length;
    return{list:tasks,done,total:tasks.length,pct:tasks.length?Math.round(done/tasks.length*100):0}}});
def({t:'p.summary',cat:'Projects',title:'Create Project Summary',ins:[X('in'),P('list','boards')],outs:[X('out'),P('text','text')],
  run:(C,I)=>{const bs=asArr(I.list);
    const text=bs.map(b=>{const s=A.stats(b.id);return \`\${b.name}: \${s.done}/\${s.total} (\${s.pct}%)\`}).join('\\n');
    C.plan('Write a project summary');return{next:'out',out:{text}}}});

/* ---------- calendar ---------- */
def({t:'c.create',cat:'Calendar',title:'Create Calendar Event',ins:[X('in'),P('title','title'),P('date','date')],outs:[X('out')],
  params:[{id:'title',l:'Title',k:'text',d:'Event'},{id:'date',l:'Date',k:'date'},{id:'time',l:'Time',k:'time',d:'09:00'}],
  run:(C,I,p)=>{C.plan('Create 1 calendar event');
    C.mut(()=>{S.events.push({id:uid('e'),title:String(I.title??p.title),date:I.date||p.date||todayISO(),time:p.time,project:null});
      Bus.emit('cal.created',{})});return{next:'out'}}});
def({t:'c.upcoming',cat:'Calendar',title:'Upcoming Events',pure:1,outs:[P('list','events'),P('count','count')],
  params:[{id:'days',l:'Within N days',k:'num',d:7}],
  run:(C,I,p)=>{const end=new Date();end.setDate(end.getDate()+num(p.days));const e2=end.toISOString().slice(0,10);
    const l=S.events.filter(e=>e.date>=todayISO()&&e.date<=e2);return{list:l,count:l.length}}});

/* ---------- interaction ---------- */
def({t:'u.message',cat:'Ask',title:'Show Message',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'m',l:'Message',k:'text',d:'Done.'}],
  run:async(C,I,p)=>{const msg=String(p.m)+(I.v!==undefined?' '+fmt(I.v):'');
    C.log(msg);if(!C.dry)await new Promise(r=>modal('Script says',\`<p>\${esc(msg)}</p>\`,[['OK',()=>r(),1]]));return{next:'out'}}});
def({t:'u.notify',cat:'Ask',title:'Show Notification',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'m',l:'Message',k:'text',d:'Script finished'}],
  run:(C,I,p)=>{const m=String(p.m)+(I.v!==undefined?' '+fmt(I.v):'');C.log(m);if(!C.dry)toast(m);return{next:'out'}}});
def({t:'u.confirm',cat:'Ask',title:'Confirm',ins:[X('in')],outs:[X('then','yes'),X('else','no')],
  params:[{id:'m',l:'Question',k:'text',d:'Continue?'}],
  run:async(C,I,p)=>{if(C.dry)return{next:'then'};
    const ok=await new Promise(r=>modal('Script asks',\`<p>\${esc(p.m)}</p>\`,[['No',()=>r(false)],['Yes',()=>r(true),1]]));
    return{next:ok?'then':'else'}}});
def({t:'u.input',cat:'Ask',title:'Ask User',ins:[X('in')],outs:[X('out'),P('v','answer')],
  params:[{id:'m',l:'Question',k:'text',d:'Name?'},{id:'kind',l:'Answer',k:'sel',o:['text','number'],d:'text'}],
  run:async(C,I,p)=>{if(C.dry)return{next:'out',out:{v:''}};
    const v=await new Promise(r=>modal('Script asks',
      \`<label class="fld">\${esc(p.m)}</label><input type="\${p.kind==='number'?'number':'text'}" id="_a">\`,
      [['Cancel',()=>r(null)],['OK',b=>r($('#_a',b).value),1]]));
    return{next:'out',out:{v:p.kind==='number'?num(v):v}}}});
def({t:'u.choose',cat:'Ask',title:'Choose Option',ins:[X('in')],outs:[X('out'),P('v','choice')],
  params:[{id:'o',l:'Options (comma separated)',k:'text',d:'A, B, C'}],
  run:async(C,I,p)=>{const opts=String(p.o).split(',').map(s=>s.trim()).filter(Boolean);
    if(C.dry)return{next:'out',out:{v:opts[0]}};
    const v=await new Promise(r=>modal('Choose',\`<div class="row">\${opts.map((o,i)=>
      \`<button class="btn" data-i="\${i}">\${esc(o)}</button>\`).join('')}</div>\`,[['Cancel',()=>r(null)]],
      b=>$$('[data-i]',b).forEach(x=>x.onclick=()=>{r(opts[+x.dataset.i]);b.closest('#scrim').remove()})));
    return{next:'out',out:{v}}}});
def({t:'u.chooseTask',cat:'Ask',title:'Choose Task',ins:[X('in'),P('list','from')],outs:[X('out'),P('task','task')],
  run:async(C,I)=>{const l=asArr(I.list).length?asArr(I.list):C.board().tasks;
    if(C.dry||!l.length)return{next:'out',out:{task:l[0]||null}};
    const t=await new Promise(r=>modal('Choose a task',\`<div class="list">\${l.map((t,i)=>
      \`<button class="item" data-i="\${i}">\${esc(t.title)}</button>\`).join('')}</div>\`,[['Cancel',()=>r(null)]],
      b=>$$('[data-i]',b).forEach(x=>x.onclick=()=>{r(l[+x.dataset.i]);b.closest('#scrim').remove()})));
    return{next:'out',out:{task:t}}}});
def({t:'u.chooseBoard',cat:'Ask',title:'Choose Board',ins:[X('in')],outs:[X('out'),P('board','board')],
  run:async(C)=>{const l=Object.values(S.boards);if(C.dry)return{next:'out',out:{board:l[0]}};
    const b=await new Promise(r=>modal('Choose a board',\`<div class="list">\${l.map((b,i)=>
      \`<button class="item" data-i="\${i}">\${esc(A.path(b.id).map(x=>x.name).join(' › '))}</button>\`).join('')}</div>\`,
      [['Cancel',()=>r(null)]],bd=>$$('[data-i]',bd).forEach(x=>x.onclick=()=>{r(l[+x.dataset.i]);bd.closest('#scrim').remove()})));
    return{next:'out',out:{board:b}}}});

/* ---------- visual ---------- */
def({t:'v.highlight',cat:'Visual',title:'Highlight Task',ins:[X('in'),P('task','task')],outs:[X('out')],
  run:(C,I)=>{if(!C.dry)asArr(I.task).forEach(t=>t&&C.view()&&C.view().flash(t.id));return{next:'out'}}});
def({t:'v.focus',cat:'Visual',title:'Focus Camera',ins:[X('in'),P('obj','object')],outs:[X('out')],
  run:(C,I)=>{const o=asArr(I.obj)[0];if(o&&!C.dry&&C.view())C.view().focus(o);return{next:'out'}}});
def({t:'v.zoom',cat:'Visual',title:'Zoom Camera',ins:[X('in')],outs:[X('out')],params:[{id:'z',l:'Zoom %',k:'num',d:100}],
  run:(C,I,p)=>{if(!C.dry&&C.view())C.view().zoom(num(p.z)/100);return{next:'out'}}});
def({t:'v.pan',cat:'Visual',title:'Pan Camera',ins:[X('in')],outs:[X('out')],
  params:[{id:'x',l:'dX',k:'num',d:100},{id:'y',l:'dY',k:'num',d:0}],
  run:(C,I,p)=>{if(!C.dry&&C.view())C.view().pan(num(p.x),num(p.y));return{next:'out'}}});
def({t:'v.flash',cat:'Visual',title:'Flash Object',ins:[X('in'),P('obj','object')],outs:[X('out')],
  run:(C,I)=>{if(!C.dry&&C.view())asArr(I.obj).forEach(o=>o&&C.view().flash(o.id));return{next:'out'}}});
def({t:'v.open',cat:'Visual',title:'Open Board Window',ins:[X('in'),P('board','board')],outs:[X('out')],
  run:(C,I)=>{const b=I.board||C.board();if(b&&!C.dry)openBoard(b.id);return{next:'out'}}});

/* ---------- script io ---------- */
def({t:'sc.input',cat:'Script',title:'Script Input',pure:1,outs:[P('v','value')],params:[{id:'n',l:'Input name',k:'text',d:'Tasks'}],
  run:(C,I,p)=>({v:C.inputs[p.n]})});
def({t:'sc.output',cat:'Script',title:'Script Output',ins:[X('in'),P('v','value')],outs:[X('out')],
  params:[{id:'n',l:'Output name',k:'text',d:'Result'}],
  run:(C,I,p)=>{C.outputs[p.n]=I.v;C.log('Output '+p.n+' = '+fmt(I.v));return{next:'out'}}});
def({t:'sc.emit',cat:'Script',title:'Emit Custom Event',ins:[X('in'),P('v','data')],outs:[X('out')],
  params:[{id:'n',l:'Event name',k:'text',d:'ping'}],
  run:(C,I,p)=>{C.log('Emitted “'+p.n+'”');if(!C.dry)setTimeout(()=>Bus.emit('custom:'+p.n,{data:I.v}),0);return{next:'out'}}});
def({t:'sc.run',cat:'Script',title:'Run Another Script',ins:[X('in'),P('v','input')],outs:[X('out'),P('v','outputs')],
  params:[{id:'n',l:'Script name',k:'text'}],
  run:async(C,I,p)=>{const s=Object.values(S.scripts).find(x=>x.name===p.n);
    if(!s||C.dry)return{next:'out',out:{v:null}};
    const r=await runScript(s,{},{Tasks:I.v});return{next:'out',out:{v:r&&r.outputs}}}});

/* ============================ interpreter ============================ */
class Ctx{
  constructor(script,opt,inputs){
    this.s=script;this.opt=opt||{};this.payload=this.opt.payload||{};
    this.boardId=this.opt.boardId||this.payload.boardId||script.boardId||'b_home';
    if(!S.boards[this.boardId])this.boardId='b_home';
    this.vars={};(script.vars||[]).forEach(v=>this.vars[v.name]=v.value);
    this.inputs=inputs||{};this.outputs={};this.dry=!!this.opt.dry;
    this.plans=[];this.logs=[];this.steps=0;this.tick=0;this.outCache={};this.loopVals={};
    this.counts={};this.errs=0;this.dirtyBoard=false;
  }
  board(){return S.boards[this.boardId]}
  view(){const w=WINS.get('board:'+this.boardId);return w&&w.api}
  node(id){return this.s.nodes.find(n=>n.id===id)}
  nextOf(id,port){const e=this.s.edges.find(e=>e.from.n===id&&e.from.port===port);return e?e.to.n:null}
  paramsOf(n){const d=NODES[n.t],p={};(d.params||[]).forEach(q=>p[q.id]=(n.p&&n.p[q.id]!==undefined)?n.p[q.id]:q.d);return p}
  inputsOf(n){const d=NODES[n.t],o={};
    (d.ins||[]).filter(i=>!i.x).forEach(i=>{o[i.id]=this.evalIn(n,i.id)});return o}
  evalIn(n,port){
    const e=this.s.edges.find(e=>e.to.n===n.id&&e.to.port===port);
    if(!e)return undefined;
    const src=this.node(e.from.n);if(!src)return undefined;
    return this.outValue(src,e.from.port);
  }
  outValue(src,port){
    const d=NODES[src.t];if(!d)return undefined;
    if(d.loop){const lv=this.loopVals[src.id]||{};return port==='item'?lv.item:port==='i'?lv.i:undefined}
    if(d.data)return d.data(this)[port];
    if(d.pure){
      this._pc=this._pc||{};
      const k=src.id+':'+this.tick;
      if(!(k in this._pc)){
        let v;try{v=d.run(this,this.inputsOf(src),this.paramsOf(src),src)}catch(e){this.err(src,e);v={}}
        this._pc[k]=v||{};this.fire(src.id,true);
      }
      return this._pc[k][port];
    }
    return (this.outCache[src.id]||{})[port];
  }
  fire(id,quiet){this.counts[id]=(this.counts[id]||0)+1;if(this.opt.onFire&&!quiet)this.opt.onFire(id)}
  log(m){const line=m;this.logs.push(line);if(this.opt.onLog)this.opt.onLog(line,false)}
  err(n,e){this.errs++;const m=(NODES[n.t]?NODES[n.t].title:n.t)+': '+(e&&e.message||e);
    this.logs.push(m);if(this.opt.onLog)this.opt.onLog(m,true);if(this.opt.onErr)this.opt.onErr(n.id)}
  can(perm){return (this.s.perms||{})[perm]!==false}
  deny(what){this.log('Blocked: this script is not allowed to '+what+'.');return{next:'out'}}
  plan(t){this.plans.push(t)}
  mut(fn,dryVal){if(this.dry)return dryVal||null;this.dirtyBoard=true;return fn()}
  touch(){this.dirtyBoard=true}
  async execChain(id){
    let guard=0;
    while(id&&guard++<800&&this.steps<5000){
      const n=this.node(id);if(!n)break;
      const d=NODES[n.t];if(!d){this.log('Unknown node '+n.t);break}
      this.steps++;this.tick++;this._pc={};this.fire(n.id);
      let res;
      try{res=d.loop?await this.runLoop(n,d):await d.run(this,this.inputsOf(n),this.paramsOf(n),n)}
      catch(e){this.err(n,e);break}
      if(res&&res.out)this.outCache[n.id]=res.out;
      if(res&&res.stop)return 'stop';
      id=this.nextOf(n.id,(res&&res.next)||'out');
    }
    if(this.steps>=5000)this.log('Stopped: step limit reached.');
    return 'ok';
  }
  async runLoop(n,d){
    const body=this.nextOf(n.id,'body');
    if(d.loop==='list'){
      const items=asArr(this.evalIn(n,'list'));
      for(let i=0;i<items.length&&i<600;i++){
        this.loopVals[n.id]={item:items[i],i};this.tick++;
        if(body&&await this.execChain(body)==='stop')return{stop:true};
      }
    }else if(d.loop==='count'){
      const t=clamp(num(this.paramsOf(n).n),0,500);
      for(let i=0;i<t;i++){this.loopVals[n.id]={item:i,i};this.tick++;
        if(body&&await this.execChain(body)==='stop')return{stop:true}}
    }else{
      let i=0;
      while(truthy(this.evalIn(n,'cond'))&&i<500){this.loopVals[n.id]={item:i,i:i++};this.tick++;
        if(body&&await this.execChain(body)==='stop')return{stop:true}}
    }
    return{next:'out'};
  }
}
const RUNNING=new Set();
async function runScript(script,opt={},inputs={}){
  if(!script||!script.nodes)return null;
  const C=new Ctx(script,opt,inputs);
  const starts=opt.start?[opt.start]:script.nodes.filter(n=>NODES[n.t]&&NODES[n.t].ev).map(n=>n.id);
  if(!starts.length){C.log('No trigger node — add one from Events.');return C}
  RUNNING.add(script.id);
  const t0=performance.now();
  try{for(const s of starts)await C.execChain(s)}finally{RUNNING.delete(script.id)}
  C.ms=Math.round(performance.now()-t0);
  if(!C.dry){
    script.runs=(script.runs||0)+1;script.lastRun=Date.now();script.lastMs=C.ms;
    script.err=C.errs>0;
    script.log=[...(script.log||[]),...C.logs.map(l=>({t:Date.now(),m:l}))].slice(-60);
    if(C.dirtyBoard){save();refresh()}else save();
  }
  return C;
}
/* ---------- triggers ---------- */
const FIRE_GUARD={depth:0,last:{}};
function scriptsFor(evName,payload){
  return Object.values(S.scripts).filter(s=>s.enabled&&!RUNNING.has(s.id)&&(s.nodes||[]).some(n=>{
    const d=NODES[n.t];if(!d||!d.ev)return false;
    if(d.ev==='custom')return evName==='custom:'+((n.p&&n.p.name)||'ping');
    if(d.ev!==evName)return false;
    if(s.boardId&&payload&&payload.boardId&&payload.boardId!==s.boardId)return false;
    return true;}));
}
function triggerNodes(s,evName){
  return (s.nodes||[]).filter(n=>{const d=NODES[n.t];
    return d&&d.ev&&(d.ev==='custom'?evName==='custom:'+((n.p&&n.p.name)||'ping'):d.ev===evName)});
}
Bus.on('*',(ev,payload)=>{
  if(ev.startsWith('script.'))return;
  if(FIRE_GUARD.depth>3)return;
  const list=scriptsFor(ev,payload);
  list.forEach(s=>{
    const key=s.id+ev;const now=Date.now();
    if(FIRE_GUARD.last[key]&&now-FIRE_GUARD.last[key]<180)return;
    FIRE_GUARD.last[key]=now;
    setTimeout(async()=>{
      FIRE_GUARD.depth++;
      try{for(const n of triggerNodes(s,ev))
        await runScript(s,{start:n.id,payload,boardId:payload&&payload.boardId||s.boardId,
          onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)});}
      finally{FIRE_GUARD.depth--}
    },60);
  });
});
/* timers */
const TIMER_LAST={};
setInterval(()=>{
  const now=new Date(),hm=now.toTimeString().slice(0,5),day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  Object.values(S.scripts).forEach(s=>{
    if(!s.enabled||RUNNING.has(s.id))return;
    (s.nodes||[]).forEach(n=>{
      const d=NODES[n.t];if(!d||!d.ev)return;const p=n.p||{},k=s.id+n.id;
      let go=false;
      if(d.ev==='timer'){const ms=clamp(num(p.sec??60),5,86400)*1000;
        if(Date.now()-(TIMER_LAST[k]||0)>=ms)go=true}
      else if(d.ev==='interval'){const ms=clamp(num(p.min??15),1,1440)*60000;
        if(Date.now()-(TIMER_LAST[k]||0)>=ms)go=true}
      else if(d.ev==='at'){if(hm===(p.time||'09:00')&&TIMER_LAST[k]!==hm+todayISO())
        {TIMER_LAST[k]=hm+todayISO();go=true;runScript(s,{start:n.id,onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)});return}}
      else if(d.ev==='weekly'){if(day===(p.day||'Monday')&&hm===(p.time||'08:00')&&TIMER_LAST[k]!==hm+todayISO())
        {TIMER_LAST[k]=hm+todayISO();runScript(s,{start:n.id,onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)});return}}
      if(go){TIMER_LAST[k]=Date.now();
        runScript(s,{start:n.id,onFire:id=>liveFire(s.id,id),onLog:(m,e)=>liveLog(s.id,m,e)})}
    });
  });
  const hm2=new Date().toTimeString().slice(0,5);
  S.events.filter(e=>e.date===todayISO()&&e.time===hm2&&!e._fired).forEach(e=>{e._fired=1;Bus.emit('cal.starting',{event:e})});
},10000);

/* ---------- script helpers ---------- */
function newScript(boardId,name){
  const s={id:uid('sc'),name:name||'New script',boardId:boardId||null,enabled:false,
    nodes:[{id:uid('n'),t:'ev.manual',x:60,y:80,p:{}}],edges:[],vars:[],runs:0,log:[],
    perms:{tasks:true,boards:true,notes:true,files:true,delete:false}};
  S.scripts[s.id]=s;save();refresh();return s;
}
function previewScript(s,after){
  runScript(s,{dry:true}).then(C=>{
    const lines=C.plans.length?C.plans:['Nothing would change — this script only reads.'];
    modal('Script preview',\`<p class="dim">“\${esc(s.name)}” would:</p>
      <div class="list" style="margin-top:8px">\${lines.map(l=>\`<div class="item">✓ \${esc(l)}</div>\`).join('')}</div>
      \${C.errs?\`<p style="color:var(--accent)">\${C.errs} node(s) reported an error during the dry run.</p>\`:''}\`,
      after?[['Cancel',null],['Enable script',()=>after(),1]]:[['Close',null]]);
  });
}
function scriptStateLabel(s){return s.err?'⚠ Error':RUNNING.has(s.id)?'● Running':s.enabled?'● Enabled':'○ Disabled'}
function boardScriptsMenu(e,boardId){
  const list=Object.values(S.scripts).filter(s=>s.boardId===boardId);
  menu(e.clientX,e.clientY,[
    ...list.map(s=>[scriptStateLabel(s)+'  '+s.name,()=>openScriptEditor(s.id)]),
    ...(list.length?['-']:[]),
    ['+ New script for this board',()=>{const s=newScript(boardId);openScriptEditor(s.id)}],
    ['Use a template…',()=>templateMenu(boardId)],
    ['Open Scripts manager',openScripts],
  ],'Scripts on this board');
}
/* ---------- templates ---------- */
const TEMPLATES={
  'Automatic Task Organiser':b=>chain(b,[['ev.taskCreated',{}],['t.all',{}],['s.sort',{k:'priority',dir:'descending'}],
    ['s.sort',{k:'deadline',dir:'ascending'}],['l.grid',{x:60,y:60,cols:4}]],'Keeps every card sorted and laid out.'),
  'Overdue Task Manager':b=>chain(b,[['ev.morning',{time:'08:00'}],['t.overdue',{}],['t.prio',{v:'urgent'}],
    ['l.urgent',{}],['u.notify',{m:'Overdue tasks moved to the urgent column'}]],'Sweeps overdue work into one place each morning.'),
  'Completed Task Cleaner':b=>{
    if(!Object.values(S.boards).some(x=>x.name==='Archive'))A.createBoard('Archive',b||null,[]);
    return chain(b,[['ev.weekly',{day:'Sunday',time:'20:00'}],['t.done',{}],
      ['t.toBoard',{name:'Archive'}]],'Files finished tasks into an Archive board every Sunday.');},
  'Project Dashboard':b=>{const s=chain(b,[['ev.boardChanged',{}],['b.stats',{}],
    ['d.format',{tpl:'{a} of {b} tasks done'}],['n.summary',{title:'Summary'}]],'Keeps a live summary note on the board.');
    const st=s.nodes.find(n=>n.t==='b.stats'),f=s.nodes.find(n=>n.t==='d.format');
    if(st&&f)s.edges.push({id:uid('e'),from:{n:st.id,port:'total'},to:{n:f.id,port:'b'}});
    return s;},
};
function chain(boardId,steps,desc){
  const s=newScript(boardId,'');s.nodes=[];s.desc=desc;
  let prev=null,dataPrev=null,y=70;
  steps.forEach(([t,p],i)=>{
    const d=NODES[t];const n={id:uid('n'),t,x:60+i*236,y:y+(i%2)*40,p:Object.assign({},p)};
    s.nodes.push(n);
    const hasExecIn=(d.ins||[]).some(x=>x.x);
    if(prev&&hasExecIn)s.edges.push({id:uid('e'),from:{n:prev,port:'out'},to:{n:n.id,port:'in'}});
    if(hasExecIn||d.ev)prev=n.id;
    const dIn=(d.ins||[]).find(x=>!x.x&&(x.id==='list'||x.id==='task'||x.id==='text'||x.id==='a'));
    if(dataPrev&&dIn)s.edges.push({id:uid('e'),from:{n:dataPrev.n,port:dataPrev.port},to:{n:n.id,port:dIn.id}});
    const dOut=(d.outs||[]).find(x=>!x.x&&(x.id==='list'||x.id==='task'||x.id==='done'||x.id==='text'||x.id==='v'));
    if(dOut)dataPrev={n:n.id,port:dOut.id};
  });
  save();return s;
}
function templateMenu(boardId){
  menu(innerWidth/2-140,140,Object.keys(TEMPLATES).map(k=>[k,()=>{
    const s=TEMPLATES[k](boardId);s.name=k;save();refresh();openScriptEditor(s.id);
    toast('Template added. Check the preview, then enable it.');}]),'Script templates');
}
/* live editor hooks */
const LIVE={};
function liveFire(sid,nid){const f=LIVE[sid];f&&f.fire&&f.fire(nid)}
function liveLog(sid,m,e){const f=LIVE[sid];f&&f.log&&f.log(m,e)}

/* ============================ script editor ============================ */
function openScriptEditor(id){
  const s=S.scripts[id];if(!s)return toast('That script is gone.');
  openWin({id:'script:'+id,title:s.name,icon:appIcon('scripts'),w:1040,h:660,render:(b,w)=>buildEditor(b,w,id),
    onClose:()=>delete LIVE[id],refresh:w=>w.api&&w.api.light()});
}
function buildEditor(body,win,id){
  const s=()=>S.scripts[id];
  body.innerHTML=\`<div class="sedit">
    <div class="stool"></div>
    <div class="smain">
      <div class="slib"></div>
      <div class="sholder"><div class="scanvas"><svg class="wires" width="6000" height="4000"></svg></div></div>
      <div class="sside"></div>
    </div>
    <div class="slog"></div></div>\`;
  const tool=$('.stool',body),lib=$('.slib',body),holder=$('.sholder',body),canvas=$('.scanvas',body),
        svg=$('.wires',body),side=$('.sside',body),logEl=$('.slog',body);
  const st={sel:null,cam:s().cam||{x:0,y:0,z:1},link:null,filter:''};
  s().cam=st.cam;

  /* ---- toolbar ---- */
  function renderTool(){
    const sc=s();
    tool.innerHTML=\`<button class="btn sm" data-a="run">▶ Run</button>
      <button class="btn sm \${sc.enabled?'on':''}" data-a="toggle">\${sc.enabled?'Enabled':'Disabled'}</button>
      <button class="btn sm" data-a="more">⋯</button>
      <div style="flex:1"></div>
      <span class="dim">\${esc(sc.name)} · \${sc.boardId?esc((A.board(sc.boardId)||{name:'?'}).name):'any board'} · \${sc.runs||0} runs</span>\`;
    $$('[data-a]',tool).forEach(b=>b.onclick=e=>toolAct(b.dataset.a,e));
  }
  function toolAct(a,e){
    const sc=s();
    const r=e.currentTarget.getBoundingClientRect(),m={clientX:r.left,clientY:r.bottom+4};
    if(a==='run')doRun();
    else if(a==='toggle'){
      if(!sc.enabled)previewScript(sc,()=>{sc.enabled=true;Bus.emit('script.enabled',{});changed();renderTool();toast('Script enabled.')});
      else{sc.enabled=false;Bus.emit('script.disabled',{});changed();renderTool()}}
    else if(a==='more')menu(m.clientX,m.clientY,[
      ['Preview what it will do',()=>previewScript(sc)],
      ['Rename…',()=>ask('Rename script','Name',sc.name,v=>{sc.name=v;win.setTitle(v);changed()})],
      ['Attach to board…',()=>menu(m.clientX+20,m.clientY,[['Any board (global)',()=>{sc.boardId=null;changed();renderTool()}],
        ...Object.values(S.boards).map(b=>[A.path(b.id).map(x=>x.name).join(' › '),()=>{sc.boardId=b.id;changed();renderTool()}])],'Attach to board')],
      ['Permissions…',()=>permsDialog(sc,renderTool)],
      ['Variables ('+(sc.vars||[]).length+')…',()=>varsDialog(sc)],
      ['Tidy layout',()=>{tidy();render()}],
      ['Export file',()=>{const blob=new Blob([JSON.stringify(sc,null,2)],{type:'application/json'});
        const u=URL.createObjectURL(blob),a2=document.createElement('a');a2.href=u;a2.download=sc.name.replace(/\\W+/g,'-')+'.artemis.json';a2.click();
        setTimeout(()=>URL.revokeObjectURL(u),2000)}],
      '-',['Delete script',()=>confirmBox('Delete script',\`Delete “\${sc.name}”?\`,()=>{delete S.scripts[id];closeWin(win);changed()})],
    ],'Script');
  }
  function tidy(){
    const sc=s(),seen=new Set(),cols=[];
    const starts=sc.nodes.filter(n=>NODES[n.t]&&NODES[n.t].ev);
    let layer=starts.length?starts:sc.nodes.slice(0,1);
    while(layer.length&&cols.length<20){
      cols.push(layer);layer.forEach(n=>seen.add(n.id));
      const nx=[];layer.forEach(n=>sc.edges.filter(e=>e.from.n===n.id).forEach(e=>{
        const t=sc.nodes.find(x=>x.id===e.to.n);if(t&&!seen.has(t.id)&&!nx.includes(t))nx.push(t)}));
      layer=nx;
    }
    sc.nodes.filter(n=>!seen.has(n.id)).forEach((n,i)=>{n.x=60;n.y=560+i*80});
    cols.forEach((c,ci)=>c.forEach((n,ri)=>{n.x=60+ci*250;n.y=60+ri*190}));
    save();
  }

  /* ---- library ---- */
  function renderLib(){
    // built once; the search input is never recreated, so typing keeps its cursor position.
    if(!$('#_q',lib)){
      lib.innerHTML=\`<input type="text" placeholder="Find a node…" id="_q" style="margin-bottom:6px"><div id="_nl"></div>\`;
      const q=$('#_q',lib);q.value=st.filter;
      q.oninput=e=>{st.filter=e.target.value;renderNodeList()};
    }
    renderNodeList();
  }
  function renderNodeList(){
    $('#_nl',lib).innerHTML=CATS.map(c=>{
        const list=Object.values(NODES).filter(n=>n.cat===c&&(!st.filter||n.title.toLowerCase().includes(st.filter.toLowerCase())));
        if(!list.length)return '';
        return \`<div class="cat">\${c}</div>\`+list.map(n=>\`<button class="nbtn" data-t="\${n.t}">\${esc(n.title)}</button>\`).join('');
      }).join('')||'<p class="dim" style="padding:4px 7px">No matches.</p>';
    $$('.nbtn',lib).forEach(b=>b.onclick=()=>addNode(b.dataset.t));
  }
  function addNode(t,at){
    const c=st.cam,r=holder.getBoundingClientRect();
    const x=at?at.x:(holder.clientWidth/2-c.x)/c.z-90,y=at?at.y:(holder.clientHeight/2-c.y)/c.z-40;
    const n={id:uid('n'),t,x:Math.round(x),y:Math.round(y),p:{}};
    s().nodes.push(n);st.sel=n.id;save();render();
  }

  /* ---- camera ---- */
  function applyCam(){canvas.style.transform=\`translate(\${st.cam.x}px,\${st.cam.y}px) scale(\${st.cam.z})\`}
  holder.addEventListener('wheel',e=>{e.preventDefault();const r=holder.getBoundingClientRect();
    const px=e.clientX-r.left,py=e.clientY-r.top,f=e.deltaY<0?1.1:1/1.1,z=clamp(st.cam.z*f,.3,2);
    st.cam.x=px-(px-st.cam.x)*(z/st.cam.z);st.cam.y=py-(py-st.cam.y)*(z/st.cam.z);st.cam.z=z;applyCam();drawWires();},{passive:false});
  let pan=null;
  holder.addEventListener('contextmenu',e=>{
    if(e.target.closest('.node'))return;e.preventDefault();
    const r=holder.getBoundingClientRect();
    const at={x:(e.clientX-r.left-st.cam.x)/st.cam.z,y:(e.clientY-r.top-st.cam.y)/st.cam.z};
    menu(e.clientX,e.clientY,[['Add node ▸',()=>catMenu(e,at)],['Tidy layout',()=>{tidy();render()}],
      ['Run now',doRun],['Fit view',()=>{st.cam={x:20,y:20,z:.8};s().cam=st.cam;applyCam();drawWires()}]],'Script canvas');
  });
  function catMenu(e,at){menu(e.clientX+30,e.clientY,CATS.map(c=>[c+' ▸',()=>
    menu(e.clientX+60,e.clientY,Object.values(NODES).filter(n=>n.cat===c).map(n=>[n.title,()=>addNode(n.t,at)]),c)]),'Add node')}
  holder.addEventListener('mousedown',e=>{
    if(e.target.closest('.node')||e.target.classList.contains('dot'))return;
    if(e.button===0&&!st.link){st.sel=null;renderSide();$$('.node',canvas).forEach(n=>n.classList.remove('sel'))}
    pan={sx:e.clientX,sy:e.clientY,cx:st.cam.x,cy:st.cam.y};
  });
  addEventListener('mousemove',e=>{
    if(pan){st.cam.x=pan.cx+(e.clientX-pan.sx);st.cam.y=pan.cy+(e.clientY-pan.sy);applyCam();}
    if(st.link){const p=canvasPt(e);st.link.to=p;drawWires();}
  });
  addEventListener('mouseup',e=>{if(pan){pan=null;save()}
    if(st.link){const dot=e.target.closest&&e.target.closest('.dot');
      if(dot)finishLink(dot);st.link=null;drawWires();}});
  function canvasPt(e){const r=holder.getBoundingClientRect();
    return{x:(e.clientX-r.left-st.cam.x)/st.cam.z,y:(e.clientY-r.top-st.cam.y)/st.cam.z}}

  /* ---- nodes ---- */
  function render(){
    const sc=s();if(!sc)return;win.setTitle(sc.name);
    $$('.node',canvas).forEach(e=>e.remove());
    sc.nodes.forEach(n=>canvas.appendChild(nodeEl(n)));
    applyCam();drawWires();renderTool();renderSide();renderLog();
  }
  function nodeEl(n){
    const d=NODES[n.t]||{title:n.t,ins:[],outs:[],params:[]};
    const el=document.createElement('div');el.className='node'+(st.sel===n.id?' sel':'');
    el.dataset.n=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';
    const pv=(d.params||[]).map(q=>{const v=n.p&&n.p[q.id]!==undefined?n.p[q.id]:q.d;
      return v===''||v===undefined?'':\`<div class="dim">\${esc(q.l)}: \${esc(q.k==='check'?(v?'yes':'no'):String(v))}</div>\`}).join('');
    el.innerHTML=\`<div class="nh"><span class="nh-t">\${d.ev?'⚡ ':''}\${esc(d.title)}</span><span class="cnt"></span></div>
      <div class="nb">
        \${(d.ins||[]).map(i=>\`<div class="port"><span class="dot \${i.x?'ex':''}" data-dir="in" data-port="\${i.id}"></span><span class="pl">\${esc(i.l||i.id)}</span></div>\`).join('')}
        \${pv}
        \${(d.outs||[]).map(o=>\`<div class="port out"><span class="pl">\${esc(o.l||o.id)}</span><span class="dot \${o.x?'ex':''}" data-dir="out" data-port="\${o.id}"></span></div>\`).join('')}
      </div>\`;
    drag($('.nh',el),(dx,dy)=>{el.style.left=(el._x+dx/st.cam.z)+'px';el.style.top=(el._y+dy/st.cam.z)+'px';drawWires();},
      ()=>{el._x=n.x;el._y=n.y;st.sel=n.id;$$('.node',canvas).forEach(x=>x.classList.toggle('sel',x===el));renderSide();},
      m=>{n.x=Math.round(parseFloat(el.style.left));n.y=Math.round(parseFloat(el.style.top));save();drawWires()});
    el.addEventListener('mousedown',e=>{if(e.target.classList.contains('dot'))return;
      st.sel=n.id;$$('.node',canvas).forEach(x=>x.classList.toggle('sel',x===el));renderSide()});
    $$('.dot',el).forEach(dot=>{
      dot.addEventListener('mousedown',e=>{e.stopPropagation();e.preventDefault();
        st.link={from:{n:n.id,port:dot.dataset.port,dir:dot.dataset.dir},to:canvasPt(e)};});
      dot.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();
        const sc=s();const before=sc.edges.length;
        sc.edges=sc.edges.filter(x=>!(x.from.n===n.id&&x.from.port===dot.dataset.port)&&!(x.to.n===n.id&&x.to.port===dot.dataset.port));
        if(sc.edges.length!==before){save();drawWires()}});
    });
    el.oncontextmenu=e=>{if(e.target.classList.contains('dot'))return;
      e.preventDefault();e.stopPropagation();
      menu(e.clientX,e.clientY,[['Duplicate',()=>{const c=JSON.parse(JSON.stringify(n));c.id=uid('n');c.x+=30;c.y+=30;s().nodes.push(c);save();render()}],
        ['Disconnect all',()=>{s().edges=s().edges.filter(x=>x.from.n!==n.id&&x.to.n!==n.id);save();render()}],
        ['Delete node',()=>{s().edges=s().edges.filter(x=>x.from.n!==n.id&&x.to.n!==n.id);
          s().nodes=s().nodes.filter(x=>x.id!==n.id);st.sel=null;save();render()}]],d.title)};
    return el;
  }
  function finishLink(dot){
    const a=st.link.from,b={n:dot.closest('.node').dataset.n,port:dot.dataset.port,dir:dot.dataset.dir};
    if(a.dir===b.dir||a.n===b.n)return;
    const from=a.dir==='out'?a:b,to=a.dir==='out'?b:a;
    const dOut=(NODES[s().nodes.find(n=>n.id===from.n).t].outs||[]).find(o=>o.id===from.port);
    const dIn=(NODES[s().nodes.find(n=>n.id===to.n).t].ins||[]).find(o=>o.id===to.port);
    if(!dOut||!dIn||!!dOut.x!==!!dIn.x)return toast('Those two plugs don’t match.');
    const sc=s();
    sc.edges=sc.edges.filter(e=>!(e.to.n===to.n&&e.to.port===to.port));
    if(dOut.x)sc.edges=sc.edges.filter(e=>!(e.from.n===from.n&&e.from.port===from.port));
    sc.edges.push({id:uid('e'),from:{n:from.n,port:from.port},to:{n:to.n,port:to.port}});
    save();drawWires();
  }
  function dotPos(nid,port,dir){
    const nEl=canvas.querySelector(\`.node[data-n="\${nid}"]\`);if(!nEl)return null;
    const d=nEl.querySelector(\`.dot[data-port="\${port}"][data-dir="\${dir}"]\`);if(!d)return null;
    const cr=canvas.getBoundingClientRect(),dr=d.getBoundingClientRect();
    return{x:(dr.left+dr.width/2-cr.left)/st.cam.z,y:(dr.top+dr.height/2-cr.top)/st.cam.z};
  }
  function drawWires(){
    const sc=s();if(!sc)return;
    const segs=sc.edges.map(e=>{
      const a=dotPos(e.from.n,e.from.port,'out'),b=dotPos(e.to.n,e.to.port,'in');
      if(!a||!b)return '';
      const dx=Math.max(40,Math.abs(b.x-a.x)*.5);
      const ex=sc.nodes.find(n=>n.id===e.from.n);
      const isExec=(NODES[ex.t].outs||[]).find(o=>o.id===e.from.port&&o.x);
      return \`<path d="M\${a.x},\${a.y} C\${a.x+dx},\${a.y} \${b.x-dx},\${b.y} \${b.x},\${b.y}" fill="none"
        stroke="\${isExec?'var(--ink)':'var(--accent2)'}" stroke-width="\${isExec?3:2.4}"
        \${isExec?'':'stroke-dasharray="7 5"'} stroke-linecap="round"/>\`;
    }).join('');
    let tmp='';
    if(st.link){const a=dotPos(st.link.from.n,st.link.from.port,st.link.from.dir);
      if(a)tmp=\`<path d="M\${a.x},\${a.y} L\${st.link.to.x},\${st.link.to.y}" stroke="var(--accent)" stroke-width="2.6" fill="none" stroke-dasharray="5 5"/>\`}
    svg.innerHTML=segs+tmp;
  }

  /* ---- inspector ---- */
  function renderSide(){
    const sc=s(),n=sc.nodes.find(x=>x.id===st.sel);
    if(!n){side.innerHTML=\`<div class="cat">Script</div><p class="dim">\${esc(sc.desc||'Pick a node to edit it. Drag from a plug to wire nodes together; right-click a plug to unplug it.')}</p>
      <div class="cat">Trigger</div><p class="dim">\${sc.nodes.filter(x=>NODES[x.t]&&NODES[x.t].ev).map(x=>NODES[x.t].title).join(', ')||'None yet — add one from Events.'}</p>
      <div class="cat">Nodes</div><p class="dim">\${sc.nodes.length} nodes, \${sc.edges.length} connections</p>\`;return}
    const d=NODES[n.t];
    side.innerHTML=\`<div class="cat">\${esc(d.title)}</div>
      <div id="_pp"></div>
      <div class="cat">Debug</div>
      <p class="dim">Ran \${(win.api&&win.api.counts[n.id])||0} time(s) in the last run.<br>
      Inputs: \${(d.ins||[]).filter(i=>!i.x).map(i=>i.l).join(', ')||'—'}<br>
      Outputs: \${(d.outs||[]).filter(i=>!i.x).map(i=>i.l).join(', ')||'—'}</p>
      <button class="btn sm" id="_del">Delete node</button>\`;
    const pp=$('#_pp',side);
    (d.params||[]).forEach(q=>{
      const v=n.p[q.id]!==undefined?n.p[q.id]:q.d;
      const w=document.createElement('div');
      if(q.k==='check'){w.innerHTML=\`<label class="fld">\${esc(q.l)}</label>
        <button class="btn sm \${v?'on':''}" id="c_\${q.id}">\${v?'Yes':'No'}</button>\`;
        w.querySelector('button').onclick=e=>{n.p[q.id]=!v;save();render()};}
      else if(q.k==='sel'||q.k==='proj'){
        const opts=q.k==='proj'?S.projects.map(p=>p.name):q.o;
        w.innerHTML=\`<label class="fld">\${esc(q.l)}</label><select>\${(opts||[]).map(o=>
          \`<option \${String(v)===String(o)?'selected':''}>\${esc(o)}</option>\`).join('')}</select>\`;
        w.querySelector('select').onchange=e=>{n.p[q.id]=e.target.value;save();render()};}
      else{const type=q.k==='num'?'number':q.k==='date'?'date':q.k==='time'?'time':'text';
        w.innerHTML=\`<label class="fld">\${esc(q.l)}</label><input type="\${type}" value="\${esc(v??'')}">\`;
        w.querySelector('input').onchange=e=>{n.p[q.id]=q.k==='num'?num(e.target.value):e.target.value;save();render()};}
      pp.appendChild(w);
    });
    $('#_del',side).onclick=()=>{s().edges=s().edges.filter(x=>x.from.n!==n.id&&x.to.n!==n.id);
      s().nodes=s().nodes.filter(x=>x.id!==n.id);st.sel=null;save();render()};
  }

  /* ---- run + log ---- */
  let lines=[];
  function renderLog(){
    logEl.innerHTML=(lines.length?lines:[['Press “Run now” to watch it work. Nodes light up as they fire.',false]])
      .map(([m,e])=>\`<div class="\${e?'er':''}">\${esc(m)}</div>\`).join('');
    logEl.scrollTop=logEl.scrollHeight;
  }
  function doRun(){
    lines=[];renderLog();
    win.api.counts={};
    runScript(s(),{onFire:nid=>{
        win.api.counts[nid]=(win.api.counts[nid]||0)+1;
        const el=canvas.querySelector(\`.node[data-n="\${nid}"]\`);
        if(el){el.classList.add('fire');const c=$('.cnt',el);if(c)c.textContent='×'+win.api.counts[nid];
          setTimeout(()=>el.classList.remove('fire'),420)}},
      onLog:(m,e)=>{lines.push([m,e]);renderLog()},
      onErr:nid=>{const el=canvas.querySelector(\`.node[data-n="\${nid}"]\`);el&&el.classList.add('err')}})
    .then(C=>{lines.push([\`Finished in \${C.ms}ms · \${C.steps} steps\${C.errs?\` · \${C.errs} error(s)\`:''}\`,C.errs>0]);
      renderLog();renderTool();refresh();});
  }
  win.api={counts:{},light(){renderTool()},render};
  LIVE[id]={fire:nid=>{const el=canvas.querySelector(\`.node[data-n="\${nid}"]\`);
      if(el){el.classList.add('fire');setTimeout(()=>el.classList.remove('fire'),420)}},
    log:(m,e)=>{lines.push([m,e]);renderLog()}};
  renderLib();render();
}
function permsDialog(sc,after){
  const P=sc.perms||(sc.perms={tasks:true,boards:true,notes:true,files:true,delete:false});
  modal('What this script may change',
    ['tasks','boards','notes','files','delete'].map(k=>
      \`<div class="row" style="margin:6px 0"><button class="btn sm \${P[k]?'on':''}" data-k="\${k}">\${P[k]?'Allowed':'Blocked'}</button>
       <span>\${k==='delete'?'Delete things (tasks, notes, boards, files)':'Change '+k}</span></div>\`).join(''),
    [['Done',()=>after&&after(),1]],
    b=>$$('[data-k]',b).forEach(x=>x.onclick=()=>{P[x.dataset.k]=!P[x.dataset.k];
      x.classList.toggle('on',P[x.dataset.k]);x.textContent=P[x.dataset.k]?'Allowed':'Blocked';save()}));
}
function varsDialog(sc){
  sc.vars||=[];
  const draw=b=>{$('#_vl',b).innerHTML=sc.vars.map((v,i)=>
    \`<div class="row" style="margin:5px 0"><input type="text" value="\${esc(v.name)}" data-i="\${i}" data-f="name" style="flex:1">
     <input type="text" value="\${esc(v.value??'')}" data-i="\${i}" data-f="value" style="flex:1">
     <button class="btn sm" data-x="\${i}">✕</button></div>\`).join('')||'<p class="dim">No variables yet.</p>';
    $$('[data-f]',b).forEach(inp=>inp.onchange=()=>{sc.vars[+inp.dataset.i][inp.dataset.f]=inp.value;save()});
    $$('[data-x]',b).forEach(x=>x.onclick=()=>{sc.vars.splice(+x.dataset.x,1);save();draw(b)});};
  modal('Variables',\`<div id="_vl"></div><button class="btn sm" id="_add" style="margin-top:8px">+ Add variable</button>
    <p class="dim" style="margin-top:8px">Read them with “Get Variable”, write them with “Set Variable”.</p>\`,
    [['Done',null,1]],b=>{draw(b);$('#_add',b).onclick=()=>{sc.vars.push({name:'value'+(sc.vars.length+1),value:''});save();draw(b)}});
}

/* ============================ scripts manager ============================ */
function openScripts(){
  openWin({id:'scripts',title:'Scripts',icon:appIcon('scripts'),w:700,h:520,render:drawScripts,refresh:w=>drawScripts(w.body,w)});
}
function drawScripts(body,win){
  const list=Object.values(S.scripts);
  body.innerHTML=\`<div class="pad">
    <div class="row"><button class="btn sm" id="_new">+ New script</button>
      <button class="btn sm" id="_tpl">Start from a template</button>
      <button class="btn sm" id="_imp">Import script</button></div>
    <h4 class="sec">All automations</h4>
    <div class="list" id="_l"></div></div>\`;
  $('#_new',body).onclick=()=>{const s=newScript(null);openScriptEditor(s.id)};
  $('#_tpl',body).onclick=()=>templateMenu(null);
  $('#_imp',body).onclick=()=>{
    const i=document.createElement('input');i.type='file';i.accept='.json';
    i.onchange=()=>{const r=new FileReader();r.onload=()=>{
      try{const o=JSON.parse(r.result);o.id=uid('sc');o.enabled=false;S.scripts[o.id]=o;changed();toast('Script imported (disabled until you enable it).')}
      catch(e){toast('That file isn’t a script Artemis can read.')}};r.readAsText(i.files[0])};
    i.click()};
  $('#_l',body).innerHTML=list.length?list.map(s=>\`<div class="item" data-s="\${s.id}">
      <span style="width:88px">\${scriptStateLabel(s)}</span>
      <div style="flex:1"><div>\${esc(s.name)}</div>
        <div class="dim">\${s.boardId?esc((A.board(s.boardId)||{name:'missing board'}).name):'any board'} · \${s.nodes.length} nodes · \${s.runs||0} runs\${s.lastRun?' · last '+new Date(s.lastRun).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):''}</div></div>
      <button class="btn sm" data-a="run">▶</button>
      <button class="btn sm" data-a="edit">Edit</button>
      <button class="btn sm" data-a="more">…</button></div>\`).join('')
    :\`<p class="dim">No scripts yet. A script watches a board and does the tidying for you — build the behaviour once, then use the board normally.</p>\`;
  $$('#_l .item',body).forEach(it=>{
    const s=S.scripts[it.dataset.s];
    $('[data-a="edit"]',it).onclick=()=>openScriptEditor(s.id);
    $('[data-a="run"]',it).onclick=()=>runScript(s).then(C=>toast(\`“\${s.name}” ran \${C.steps} steps\${C.errs?\` with \${C.errs} error(s)\`:''}.\`));
    $('[data-a="more"]',it).onclick=e=>menu(e.clientX,e.clientY,[
      [s.enabled?'Disable':'Enable',()=>{if(s.enabled){s.enabled=false;changed()}else previewScript(s,()=>{s.enabled=true;changed()})}],
      ['Preview actions',()=>previewScript(s)],
      ['Rename…',()=>ask('Rename script','Name',s.name,v=>{s.name=v;changed()})],
      ['Duplicate',()=>{const c=JSON.parse(JSON.stringify(s));c.id=uid('sc');c.name=s.name+' copy';c.enabled=false;S.scripts[c.id]=c;changed()}],
      ['Reuse on another board…',()=>pickBoard('Attach a copy to…',bid=>{
        const c=JSON.parse(JSON.stringify(s));c.id=uid('sc');c.name=s.name+' ('+A.board(bid).name+')';c.boardId=bid;c.enabled=false;
        S.scripts[c.id]=c;changed();toast('Copied. Enable it when you’re ready.')})],
      ['Execution history',()=>modal('History — '+s.name,(s.log||[]).length?
        \`<div class="list">\${s.log.slice(-25).reverse().map(l=>\`<div class="item"><span class="dim" style="width:70px">\${new Date(l.t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span><span>\${esc(l.m)}</span></div>\`).join('')}</div>\`
        :'<p class="dim">This script hasn’t run yet.</p>',[['Close',null]])],
      '-',['Delete',()=>confirmBox('Delete script',\`Delete “\${s.name}”?\`,()=>{delete S.scripts[s.id];changed()})],
    ],s.name);
  });
}

/* ============================ file manager ============================ */
function openFileManager(){
  openWin({id:'files-mgr',title:'File Manager',icon:appIcon('files-mgr'),w:720,h:520,render:drawFM,refresh:w=>drawFM(w.body,w)});
}
function drawFM(body,win){
  const boards=Object.values(S.boards);
  body.innerHTML=\`<div class="pad">
    <div class="row"><button class="btn sm" id="_new">+ New board</button><span class="dim">\${boards.length} boards</span></div>
    <h4 class="sec">Boards</h4><div class="grid" id="_g"></div></div>\`;
  $('#_new',body).onclick=()=>newBoardDialog(null);
  $('#_g',body).innerHTML=boards.map(b=>{const s=A.stats(b.id),kids=A.children(b.id).length;
    return \`<button class="tile" data-b="\${b.id}"><div class="gl">\${appIcon('boards',30)}</div>
      <div class="nm">\${esc(b.name)}</div>
      <div class="bar"><i style="width:\${s.pct}%"></i></div>
      <div class="dim">\${s.done}/\${s.total}\${kids?\` · \${kids} inside\`:''}</div>
      <div class="dim">\${b.projects.map(p=>'#'+esc(A.projName(p))).join(' ')}</div></button>\`}).join('');
  $$('#_g .tile',body).forEach(t=>{
    const b=A.board(t.dataset.b);
    t.onclick=()=>openBoard(b.id);
    t.oncontextmenu=e=>{e.preventDefault();menu(e.clientX,e.clientY,[
      ['Open',()=>openBoard(b.id)],
      ['Rename…',()=>ask('Rename board','Name',b.name,v=>{b.name=v;changed()})],
      ['Move inside…',()=>pickBoard('Move inside…',id=>{b.parent=id;changed()},b.id)],
      ['Move to top level',()=>{b.parent=null;changed()}],
      ['Tag project ▸',()=>menu(e.clientX+30,e.clientY,S.projects.map(p=>[(b.projects.includes(p.id)?'● ':'○ ')+p.name,
        ()=>{b.projects.includes(p.id)?b.projects=b.projects.filter(x=>x!==p.id):b.projects.push(p.id);changed('project.changed',{boardId:b.id})}]))],
      ['Duplicate',()=>{A.dupBoard(b.id);changed()}],
      '-',['Delete',()=>b.id==='b_home'?toast('The Home board stays.'):
        confirmBox('Delete board',\`Delete “\${b.name}” and everything on it?\`,()=>{A.deleteBoard(b.id);changed()})],
    ],b.name)};
  });
}

/* ============================ projects ============================ */
function openProjects(){
  openWin({id:'projects',title:'Projects',icon:appIcon('projects'),w:620,h:480,render:drawProjects,refresh:w=>drawProjects(w.body,w)});
}
function drawProjects(body){
  body.innerHTML=\`<div class="pad"><div class="row"><button class="btn sm" id="_new">+ New project</button></div>
    <h4 class="sec">Project tags</h4><div class="list" id="_l"></div></div>\`;
  $('#_new',body).onclick=()=>ask('New project','Name','',v=>{S.projects.push({id:uid('p'),name:v});changed('project.changed',{})});
  $('#_l',body).innerHTML=S.projects.length?S.projects.map(p=>{
    const bs=Object.values(S.boards).filter(b=>b.projects.includes(p.id));
    const tasks=bs.flatMap(b=>b.tasks),done=tasks.filter(t=>t.done).length;
    return \`<div class="item" data-p="\${p.id}"><div style="flex:1"><div>\${esc(p.name)}</div>
      <div class="dim">\${bs.length} board(s) · \${done}/\${tasks.length} tasks done</div></div>
      <button class="btn sm" data-a="view">View</button><button class="btn sm" data-a="open">Open all</button>
      <button class="btn sm" data-a="ren">✎</button><button class="btn sm" data-a="del">🗑</button></div>\`}).join('')
    :'<p class="dim">No projects yet. A project is a label you can put on any board, however deeply nested.</p>';
  $$('#_l .item',body).forEach(it=>{
    const p=A.project(it.dataset.p);
    $('[data-a="view"]',it).onclick=()=>openProjectView(p.id);
    $('[data-a="open"]',it).onclick=()=>Object.values(S.boards).filter(b=>b.projects.includes(p.id)).forEach(b=>openBoard(b.id));
    $('[data-a="ren"]',it).onclick=()=>ask('Rename project','Name',p.name,v=>{p.name=v;changed('project.changed',{})});
    $('[data-a="del"]',it).onclick=()=>confirmBox('Delete project',\`Remove the “\${p.name}” tag from every board?\`,()=>{
      S.projects=S.projects.filter(x=>x.id!==p.id);
      Object.values(S.boards).forEach(b=>b.projects=b.projects.filter(x=>x!==p.id));changed('project.changed',{})});
  });
}
function openProjectView(pid){
  const p=A.project(pid);if(!p)return;
  openWin({id:'proj:'+pid,title:p.name,icon:appIcon('projects'),w:600,h:460,render:draw,refresh:w=>draw(w.body,w)});
  function draw(body){
    const bs=Object.values(S.boards).filter(b=>b.projects.includes(pid));
    const tasks=bs.flatMap(b=>b.tasks),done=tasks.filter(t=>t.done).length;
    body.innerHTML=\`<div class="pad"><div class="row"><div class="bar" style="flex:1"><i style="width:\${tasks.length?done/tasks.length*100:0}%"></i></div>
      <span class="dim">\${done}/\${tasks.length}</span></div>
      <h4 class="sec">Boards in this project</h4><div class="grid">\${bs.map(b=>{const s=A.stats(b.id);
        return \`<button class="tile" data-b="\${b.id}"><div class="gl">\${appIcon('boards',30)}</div><div class="nm">\${esc(b.name)}</div>
          <div class="bar"><i style="width:\${s.pct}%"></i></div><div class="dim">\${s.done}/\${s.total}</div></button>\`}).join('')
        ||'<p class="dim">Tag a board with this project to see it here.</p>'}</div></div>\`;
    $$('.tile',body).forEach(t=>t.onclick=()=>openBoard(t.dataset.b));
  }
}

/* ============================ graph view ============================ */
function openGraph(){
  openWin({id:'graph',title:'Graph View',icon:appIcon('graph'),w:680,h:600,render:drawGraph,refresh:w=>drawGraph(w.body,w),onResize:()=>{const w=WINS.get('graph');w&&drawGraph(w.body,w)}});
}
function drawGraph(body){
  const W=body.clientWidth||620,H=body.clientHeight||540,cx=W/2,cy=H/2;
  const roots=Object.values(S.boards).filter(b=>!b.parent);
  const pos={},levels=[];
  (function walk(list,depth,a0,a1){
    if(!list.length)return;(levels[depth]||=[]).push(...list);
    const span=(a1-a0)/list.length;
    list.forEach((b,i)=>{const a=a0+span*(i+.5),r=depth*Math.min(W,H)*.18;
      pos[b.id]={x:cx+Math.cos(a-Math.PI/2)*r,y:cy+Math.sin(a-Math.PI/2)*r,a};
      walk(A.children(b.id),depth+1,a0+span*i,a0+span*(i+1));});
  })(roots,0,0,Math.PI*2);
  const links=Object.values(S.boards).filter(b=>b.parent&&pos[b.parent]&&pos[b.id])
    .map(b=>\`<line x1="\${pos[b.parent].x}" y1="\${pos[b.parent].y}" x2="\${pos[b.id].x}" y2="\${pos[b.id].y}"
      stroke="var(--line)" stroke-width="2" stroke-dasharray="6 5"/>\`).join('');
  const nodes=Object.values(S.boards).filter(b=>pos[b.id]).map(b=>{
    const s=A.stats(b.id),r=16+Math.min(26,s.total*2.4),p=pos[b.id];
    return \`<g data-b="\${b.id}" style="cursor:none">
      <circle cx="\${p.x}" cy="\${p.y}" r="\${r}" fill="var(--panel)" stroke="var(--ink)" stroke-width="2.5"/>
      <circle cx="\${p.x}" cy="\${p.y}" r="\${Math.max(3,r*(s.pct/100))}" fill="var(--accent2)" opacity=".85"/>
      <text x="\${p.x}" y="\${p.y+r+16}" text-anchor="middle" font-family="var(--scrawl)" font-size="17" fill="var(--ink)">\${esc(b.name)}</text>
      <text x="\${p.x}" y="\${p.y+5}" text-anchor="middle" font-size="13" fill="var(--ink)">\${s.done}/\${s.total}</text></g>\`}).join('');
  body.innerHTML=\`<div class="graphwrap"><svg width="\${W}" height="\${H}">\${links}\${nodes}</svg>
    <div class="dim" style="position:absolute;left:12px;bottom:10px">Circle size = tasks · fill = finished</div></div>\`;
  $$('g[data-b]',body).forEach(g=>g.onclick=()=>openBoard(g.dataset.b));
}

/* ============================ calendar ============================ */
function openCalendar(){
  const st={m:new Date().getMonth(),y:new Date().getFullYear(),sel:todayISO()};
  openWin({id:'calendar',title:'Calendar',icon:appIcon('calendar'),w:820,h:580,render:(b,w)=>draw(b),refresh:w=>draw(w.body)});
  function draw(body){
    const first=new Date(st.y,st.m,1),start=new Date(first);start.setDate(1-first.getDay());
    const cells=[...Array(42)].map((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});
    const iso=d=>localISO(d);
    const dayEv=st.sel?S.events.filter(e=>e.date===st.sel):[];
    const upcoming=S.events.filter(e=>e.date>=todayISO()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,8);
    body.innerHTML=\`<div class="pad" style="display:flex;gap:16px;height:100%;box-sizing:border-box">
      <div style="flex:1;min-width:0">
        <div class="row"><button class="btn sm" id="_p">‹</button>
          <strong style="font-family:var(--scrawl);font-size:23px">\${first.toLocaleString([],{month:'long'})} \${st.y}</strong>
          <button class="btn sm" id="_n">›</button><button class="btn sm" id="_t">Today</button>
          <div style="flex:1"></div><button class="btn sm" id="_add">+ Event</button></div>
        <div class="cal" style="margin-top:10px">\${['S','M','T','W','T','F','S'].map(d=>\`<div class="dim" style="text-align:center">\${d}</div>\`).join('')}
        \${cells.map(d=>{const k=iso(d),evs=S.events.filter(e=>e.date===k);
          return \`<div class="cell \${d.getMonth()!==st.m?'oth':''} \${k===todayISO()?'tod':''} \${k===st.sel?'sel':''}" data-d="\${k}">
            <div class="dn">\${d.getDate()}</div>\${evs.slice(0,3).map(e=>{const p=e.project&&A.project(e.project);
              return \`<div class="ev" \${p?\`style="background:var(--accent)"\`:''}>\${esc(e.time||'')} \${esc(e.title)}</div>\`}).join('')}
            \${evs.length>3?\`<div class="dim">+\${evs.length-3}</div>\`:''}</div>\`}).join('')}</div></div>
      <div style="width:240px;flex:0 0 auto;overflow:auto">
        <h4 class="sec">\${st.sel||'—'}</h4>
        <div class="list">\${dayEv.length?dayEv.map(e=>\`<div class="item" data-e="\${e.id}"><div style="flex:1">
          <div>\${esc(e.title)}</div><div class="dim">\${esc(e.time||'all day')}\${e.project?' · '+esc(A.projName(e.project)):''}</div></div>
          <button class="btn sm" data-x="\${e.id}">🗑</button></div>\`).join('')
          :'<p class="dim">Nothing on this day.</p>'}</div>
        <h4 class="sec">Coming up</h4>
        <div class="list">\${upcoming.length?upcoming.map(e=>\`<div class="item"><div style="flex:1">
          <div>\${esc(e.title)}</div><div class="dim">\${e.date} \${esc(e.time||'')}</div></div></div>\`).join('')
          :'<p class="dim">No reminders ahead.</p>'}</div></div></div>\`;
    $('#_p',body).onclick=()=>{st.m--;if(st.m<0){st.m=11;st.y--}draw(body)};
    $('#_n',body).onclick=()=>{st.m++;if(st.m>11){st.m=0;st.y++}draw(body)};
    $('#_t',body).onclick=()=>{const d=new Date();st.m=d.getMonth();st.y=d.getFullYear();st.sel=todayISO();draw(body)};
    $('#_add',body).onclick=()=>addEvent(st.sel,()=>draw(body));
    $$('.cell',body).forEach(c=>{c.onclick=()=>{st.sel=c.dataset.d;draw(body)};
      c.ondblclick=()=>addEvent(c.dataset.d,()=>draw(body))});
    $$('[data-x]',body).forEach(b=>b.onclick=()=>{S.events=S.events.filter(e=>e.id!==b.dataset.x);changed();draw(body)});
  }
  function addEvent(date,after){
    modal('New event',\`<label class="fld">Title</label><input type="text" id="_t" value="">
      <div class="row"><div style="flex:1"><label class="fld">Date</label><input type="date" id="_d" value="\${date||todayISO()}"></div>
      <div style="flex:1"><label class="fld">Time</label><input type="time" id="_h" value="09:00"></div></div>
      <label class="fld">Project</label><select id="_p"><option value="">— none —</option>
        \${S.projects.map(p=>\`<option value="\${p.id}">\${esc(p.name)}</option>\`).join('')}</select>\`,
      [['Cancel',null],['Add event',b=>{const t=$('#_t',b).value.trim();if(!t)return false;
        S.events.push({id:uid('e'),title:t,date:$('#_d',b).value,time:$('#_h',b).value,project:$('#_p',b).value||null});
        changed('cal.created',{});after&&after();},1]]);
  }
}

/* ============================ files library ============================ */
function openFiles(){
  openWin({id:'files',title:'Files',icon:appIcon('files'),w:640,h:500,render:draw,refresh:w=>draw(w.body)});
  function draw(body){
    body.innerHTML=\`<div class="pad"><div class="row"><button class="btn sm" id="_u">+ Upload files</button>
      <span class="dim">\${S.files.length} file(s)</span></div>
      <h4 class="sec">Everything you’ve attached</h4><div class="grid" id="_g"></div></div>\`;
    $('#_u',body).onclick=()=>pickFiles(()=>{changed();draw(body)});
    $('#_g',body).innerHTML=S.files.length?S.files.map(f=>\`<div class="tile" data-f="\${f.id}">
      \${f.type.startsWith('image/')?\`<img src="\${f.data}" style="width:100%;height:78px;object-fit:cover;border-radius:6px">\`
        :\`<div class="gl">📄</div>\`}
      <div class="nm">\${esc(f.name)}</div><div class="dim">\${Math.round(f.size/1024)} KB</div>
      <div class="row" style="justify-content:center;margin-top:4px">
        <button class="btn sm" data-a="open">Open</button><button class="btn sm" data-a="del">🗑</button></div></div>\`).join('')
      :'<p class="dim">Nothing here yet. Attach a file from any board, or upload one now.</p>';
    $$('#_g .tile',body).forEach(t=>{const f=A.file(t.dataset.f);
      $('[data-a="open"]',t).onclick=()=>window.open(f.data,'_blank');
      $('[data-a="del"]',t).onclick=()=>confirmBox('Delete file',\`Delete “\${f.name}” and remove its cards from every board?\`,()=>{
        S.files=S.files.filter(x=>x.id!==f.id);
        Object.values(S.boards).forEach(b=>b.files=b.files.filter(c=>c.fileId!==f.id));changed();draw(body)});});
  }
}

/* ============================ search & stats ============================ */
function openSearch(){
  const st={q:''};
  openWin({id:'search',title:'Search & Stats',icon:appIcon('search'),w:660,h:520,render:draw,refresh:w=>draw(w.body)});
  function draw(body){
    const boards=Object.values(S.boards),tasks=boards.flatMap(b=>b.tasks.map(t=>({t,b})));
    const done=tasks.filter(x=>x.t.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0;
    const hits=st.q?tasks.filter(x=>x.t.title.toLowerCase().includes(st.q.toLowerCase())).slice(0,40):[];
    body.innerHTML=\`<div class="pad">
      <input type="text" id="_q" placeholder="Find any task, anywhere…" value="\${esc(st.q)}">
      \${st.q?\`<h4 class="sec">\${hits.length} match\${hits.length===1?'':'es'}</h4>
        <div class="list">\${hits.map(h=>\`<div class="item"><button class="chk" data-t="\${h.t.id}">\${h.t.done?'✓':''}</button>
          <div style="flex:1"><div>\${esc(h.t.title)}</div><div class="dim">\${esc(A.path(h.b.id).map(x=>x.name).join(' › '))}</div></div>
          <button class="btn sm" data-o="\${h.b.id}">Open</button></div>\`).join('')||'<p class="dim">No task by that name.</p>'}</div>\`
        :\`<h4 class="sec">System</h4>
        <div class="list">
          <div class="item"><span style="flex:1">Boards</span><strong>\${boards.length}</strong></div>
          <div class="item"><span style="flex:1">Tasks finished</span><div class="bar" style="width:120px"><i style="width:\${pct}%"></i></div><strong>\${done}/\${tasks.length}</strong></div>
          <div class="item"><span style="flex:1">Sticky notes</span><strong>\${boards.reduce((a,b)=>a+b.notes.length,0)}</strong></div>
          <div class="item"><span style="flex:1">Attached files</span><strong>\${S.files.length}</strong></div>
          <div class="item"><span style="flex:1">Projects</span><strong>\${S.projects.length}</strong></div>
          <div class="item"><span style="flex:1">Scripts (enabled)</span><strong>\${Object.values(S.scripts).filter(s=>s.enabled).length}/\${Object.keys(S.scripts).length}</strong></div>
          <div class="item"><span style="flex:1">Open windows</span><strong>\${WINS.size}</strong></div>
        </div>
        <h4 class="sec">Start over</h4>
        <p class="dim">Wipes every board, note, file, project and script on this device.</p>
        <button class="btn" id="_reset">Reset Artemis OS</button>\`}</div>\`;
    const q=$('#_q',body);q.oninput=e=>{st.q=e.target.value;draw(body);const n=$('#_q',body);n.focus();n.setSelectionRange(n.value.length,n.value.length)};
    $$('[data-t]',body).forEach(b=>b.onclick=()=>{A.setDone(b.dataset.t,!A.findTask(b.dataset.t).task.done);
      changed('board.changed',{});draw(body)});
    $$('[data-o]',body).forEach(b=>b.onclick=()=>openBoard(b.dataset.o));
    const r=$('#_reset',body);
    if(r)r.onclick=()=>confirmBox('Reset everything',
      'This clears all boards, tasks, notes, files, projects and scripts stored in this browser.',()=>{
        localStorage.removeItem(KEY);S=blankState();[...WINS.values()].forEach(closeWin);
        document.documentElement.dataset.theme=S.theme;save();refresh();toast('Fresh desk.');openBoard('b_home');},'Reset');
  }
}

/* ============================ boot ============================ */
load();setCursorGlyph(S.cursor);renderDesktop();deskMenu();renderDock();
Bus.on('board.opened',()=>{});
(function first(){
  if(!S.seenIntro){
    S.seenIntro=true;
    const b=A.board('b_home');
    if(!b.tasks.length){
      const t1=A.addTask('b_home','Drag me anywhere on the board',{x:80,y:90,priority:'normal'});
      const t2=A.addTask('b_home','Right-click the canvas for everything',{x:80,y:250,priority:'high'});
      A.addSub(t2.id,'Try the pen and the eraser');
      A.addTask('b_home','Open Scripts and add a template',{x:340,y:90,deadline:todayISO(),priority:'urgent'});
      A.addNote('b_home','Double-click a card to rename it.\\nScroll to zoom, drag empty space to pan.',NOTE_COLORS[0]);
    }
    save();
  }
  openBoard('b_home');
  Bus.emit('board.opened',{boardId:'b_home'});
})();
addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeMenu();const sc=$('#scrim');if(sc)sc.remove()}
});`;
// ============================================================
// Artemis React component
// ============================================================

function runArtemisScript(source) {
  const script = document.createElement("script");

  script.type = "text/javascript";
  script.text = source;

  document.body.appendChild(script);
  script.remove();
}

export default function Artemis() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      return;
    }

    mounted.current = true;

    const root = document.getElementById("root");

    if (!root) {
      return;
    }

    // Add Artemis styling once.
    let style = document.getElementById("artemis-styles");

    if (!style) {
      style = document.createElement("style");
      style.id = "artemis-styles";
      style.textContent = ARTEMIS_CSS;

      document.head.appendChild(style);
    }

    // Mount the original Artemis desktop.
    root.innerHTML = ARTEMIS_BODY;

    // Execute the original application logic.
    runArtemisScript(ARTEMIS_SCRIPT);

    return () => {
      // Artemis manages its own DOM and persistent state.
      // Nothing needs to be removed during normal React cleanup.
    };
  }, []);

  return null;
}
