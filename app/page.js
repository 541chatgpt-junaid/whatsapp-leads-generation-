"use client";
import { useEffect, useMemo, useState } from "react";
import { SEED_LEADS, STAGES, COUNTRIES, NICHES, CHANNELS } from "../lib/seed";

const KEY = "jm-lead-dashboard-v1";
const today = () => new Date().toISOString().slice(0,10);
const emptyLead = () => ({ id: Date.now().toString(), business:"", person:"", phone:"", city:"", country:"UK", niche:"Car Recovery", source:"", website:"No website", gmb:"Unknown", gap:"", stage:"New Lead", channel:"WhatsApp", variant:"A", dateSent:"", messageSent:"", reply:"No", replyDate:"", replyText:"", replyType:"", demoStatus:"Not Started", demoLink:"", demoPersonalized:"No", price:"", priceClearWithDemo:"No", closingQuestion:"", followUps:0, nextFollowUp:"", nextAction:"", notes:"", history:[] });

function heat(l){
  if(["Negotiation","Demo Requested"].includes(l.stage) || l.replyType==="Demo Requested") return "hot";
  if(["Replied","Demo Sent"].includes(l.stage)) return "warm";
  if(["Deal Closed","Delivered"].includes(l.stage)) return "done";
  return "cold";
}
const addDays=(d,n)=>{ const x=new Date(d+"T00:00:00"); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); };
const waNumber=(phone)=>{ if(!phone||phone.includes("landline")) return ""; const d=phone.replace(/[^0-9]/g,""); return d.length>=8?d:""; };
const PRE_SENT=["New Lead","Researched","Ready to Send","Hold"];
const PRE_REPLY=[...PRE_SENT,"Sent","Silent / Close File"];
const REPLY_TYPES=["Interested","Demo Requested","Price Asked","Question","Interested — later","Declined","Other"];
const TPL_KEY="jm-lead-templates-v1";
const loadTpl=()=>{ try{ return JSON.parse(localStorage.getItem(TPL_KEY))||{}; }catch(e){ return {}; } };
const saveTpl=(t)=>{ try{ localStorage.setItem(TPL_KEY,JSON.stringify(t)); }catch(e){} };
const fill=(t,l)=>t.replaceAll("{name}",(l.person||"").split(" ")[0]||"there").replaceAll("{business}",l.business||"");
const download=(content,type,name)=>{ const url=URL.createObjectURL(new Blob([content],{type})); const a=document.createElement("a"); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); };
const OPT_KEY="jm-lead-options-v1";
const loadOpts=()=>{ try{ const o=JSON.parse(localStorage.getItem(OPT_KEY))||{}; return {countries:o.countries||[],niches:o.niches||[]}; }catch(e){ return {countries:[],niches:[]}; } };
const uniq=(a)=>[...new Set(a.filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];
const digits=(p)=>(p||"").replace(/[^0-9]/g,"");
const pct=(a,b)=>b?Math.round(a/b*100):0;
function isDue(l){ return l.nextFollowUp && l.nextFollowUp <= today() && !["Deal Closed","Delivered","Declined"].includes(l.stage); }

export default function Page(){
  const [leads,setLeads]=useState(SEED_LEADS);
  const [view,setView]=useState("all"); // all | kanban | due | hot
  const [q,setQ]=useState(""); const [fc,setFc]=useState("All"); const [fs,setFs]=useState("All");
  const [editing,setEditing]=useState(null); const [detail,setDetail]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [sendFor,setSendFor]=useState(null); const [replyFor,setReplyFor]=useState(null);
  const [fn,setFn]=useState("All"); const [sort,setSort]=useState("recent");
  const [opts,setOpts]=useState({countries:[],niches:[]}); const [settings,setSettings]=useState(null);

  useEffect(()=>{ try{ const raw=localStorage.getItem(KEY); if(raw) setLeads(JSON.parse(raw)); }catch(e){} setOpts(loadOpts()); setLoaded(true); },[]);
  useEffect(()=>{ if(loaded) localStorage.setItem(KEY, JSON.stringify(leads)); },[leads,loaded]);
  useEffect(()=>{ if(loaded) try{ localStorage.setItem(OPT_KEY, JSON.stringify(opts)); }catch(e){} },[opts,loaded]);

  const allCountries = useMemo(()=>uniq([...COUNTRIES,...opts.countries,...leads.map(l=>l.country)]),[opts,leads]);
  const allNiches = useMemo(()=>uniq([...NICHES,...opts.niches,...leads.map(l=>l.niche)]),[opts,leads]);
  const addOption=(kind,name)=>{ const v=(name||"").trim(); if(!v) return false;
    const list=kind==="countries"?allCountries:allNiches;
    if(list.some(x=>x.toLowerCase()===v.toLowerCase())) return false;
    setOpts(o=>({...o,[kind]:[...o[kind],v]})); return true; };
  const removeOption=(kind,name)=>setOpts(o=>({...o,[kind]:o[kind].filter(x=>x!==name)}));
  const dl = detail ? leads.find(x=>x.id===detail.id) : null;

  const sentToday = leads.filter(l=>l.dateSent===today()).length;
  const replies = leads.filter(l=>l.reply==="Yes").length;
  const sent = leads.filter(l=>l.dateSent).length;
  const due = leads.filter(isDue);
  const hot = leads.filter(l=>heat(l)==="hot");

  const filtered = useMemo(()=> leads.filter(l=>{
    if(view==="due" && !isDue(l)) return false;
    if(view==="hot" && heat(l)!=="hot") return false;
    if(fc!=="All" && l.country!==fc) return false;
    if(fs!=="All" && l.stage!==fs) return false;
    if(fn!=="All" && l.niche!==fn) return false;
    const s=(l.business+" "+l.person+" "+l.phone+" "+l.city+" "+l.niche).toLowerCase();
    return s.includes(q.toLowerCase());
  }).sort((a,b)=>{
    if(sort==="followup") return (a.nextFollowUp||"9999").localeCompare(b.nextFollowUp||"9999");
    if(sort==="name") return a.business.localeCompare(b.business);
    if(sort==="sent") return (b.dateSent||"").localeCompare(a.dateSent||"");
    return 0;
  }),[leads,q,fc,fs,fn,sort,view]);

  const save = (lead)=>{ setLeads(prev=>{ const ex=prev.some(x=>x.id===lead.id); return ex? prev.map(x=>x.id===lead.id?lead:x) : [lead,...prev]; }); setEditing(null); };
  const remove = (id)=>{ if(confirm("Ye lead delete kar dein?")) setLeads(prev=>prev.filter(x=>x.id!==id)); setDetail(null); };
  const exportCsv = ()=>{
    const cols=["business","person","phone","city","country","niche","stage","channel","dateSent","reply","replyDate","replyText","demoStatus","demoLink","price","nextFollowUp","nextAction","notes"];
    const csv=[cols.join(","), ...leads.map(l=>cols.map(c=>`"${String(l[c]??"").replaceAll('"','""')}"`).join(","))].join("\n");
    download("\ufeff"+csv,"text/csv;charset=utf-8",`jm-leads-${today()}.csv`);
  };
  const patch=(id,f)=>setLeads(prev=>prev.map(x=>x.id===id?f(x):x));
  const setStage=(id,stage)=>patch(id,l=>l.stage===stage?l:{...l,stage,history:[...(l.history||[]),{date:today(),event:`Stage: ${l.stage} → ${stage}`}]});
  const backup=()=>{ const data={version:1,exportedAt:new Date().toISOString(),leads,options:opts,templates:loadTpl()};
    download(JSON.stringify(data,null,2),"application/json",`jm-leads-backup-${today()}.json`); };
  const restore=(file)=>{ const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result); const ls=Array.isArray(d)?d:d.leads;
      if(!Array.isArray(ls)) throw new Error("bad");
      if(!confirm(`Backup me ${ls.length} leads hain. Abhi wala data replace kar dein?`)) return;
      setLeads(ls); if(d.options) setOpts({countries:d.options.countries||[],niches:d.options.niches||[]}); if(d.templates) saveTpl(d.templates);
      setSettings(null); alert("Backup restore ho gaya ✓"); }catch(e){ alert("Ye file sahi backup nahi hai."); } }; r.readAsText(file); };
  const logSend=(lead,{text,variant,isFollow})=>{
    const d=today();
    patch(lead.id,l=>{ const n=isFollow?(Number(l.followUps)||0)+1:Number(l.followUps)||0; return {...l,
      channel:"WhatsApp",
      dateSent: isFollow? l.dateSent : d,
      variant: isFollow? l.variant : variant,
      messageSent: isFollow? l.messageSent : text,
      stage: PRE_SENT.includes(l.stage)? "Sent" : l.stage,
      followUps:n,
      nextFollowUp: addDays(d, isFollow?4:3),
      history:[...(l.history||[]),{date:d,event:isFollow?`Follow-up #${n} sent on WhatsApp: “${text.slice(0,140)}${text.length>140?"…":""}”`:`Pitch sent on WhatsApp (Variant ${variant}): “${text.slice(0,140)}${text.length>140?"…":""}”`}]
    };});
    setSendFor(null); setDetail(null);
  };
  const logReply=(lead,{text,type,date})=>{
    patch(lead.id,l=>{
      let stage=l.stage;
      if(type==="Declined") stage="Declined";
      else if(type==="Demo Requested" && !["Demo Sent","Negotiation","Deal Closed","Delivered"].includes(l.stage)) stage="Demo Requested";
      else if(PRE_REPLY.includes(l.stage)) stage="Replied";
      return {...l, reply:"Yes", replyDate:date, replyText:text, replyType:type, stage,
        nextFollowUp: type==="Declined"? "" : (l.nextFollowUp && l.nextFollowUp>date ? l.nextFollowUp : addDays(date,1)),
        history:[...(l.history||[]),{date,event:`Reply (${type}): “${text.slice(0,160)}${text.length>160?"…":""}”`}] };
    });
    setReplyFor(null); setDetail(null);
  };
  const resetSeed = ()=>{ if(confirm("Seed data wapas load kar dein? Aapki changes khatam ho jayengi.")){ setLeads(SEED_LEADS); localStorage.removeItem(KEY);} };

  const heatLabel = { hot:"Hot", warm:"Warm", done:"Closed", cold:"Cold" };
  const views = [
    { id:"all", label:"All leads", count:leads.length },
    { id:"kanban", label:"Pipeline", count:null },
    { id:"due", label:"Follow-up due", count:due.length },
    { id:"hot", label:"Hot leads", count:hot.length },
    { id:"reports", label:"Reports", count:null },
  ];
  const title = { all:"All leads", kanban:"Pipeline", due:"Follow-up due", hot:"Hot leads", reports:"Reports" }[view];
  const capFull = sentToday>=10;

  return (
  <div className="wrap">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">JM</div><div><b>Lead Dashboard</b><small>JM Digital Marketing</small></div></div>
      <div className="navlabel">Views</div>
      {views.map(v=>(
        <button key={v.id} className={`navbtn ${view===v.id?"active":""}`} onClick={()=>setView(v.id)}>
          <span>{v.label}</span>{v.count!==null&&<span className="count">{v.count}</span>}
        </button>))}
      <div className="capbox">
        <div className="row"><span>WhatsApp cap aaj</span><b>{sentToday} / 10</b></div>
        <div className={`bar ${capFull?"full":""}`}><i style={{width:Math.min(100,sentToday*10)+"%"}}/></div>
        {capFull&&<div className="muted" style={{marginTop:8}}>Cap full — baqi leads Hold me daalo.</div>}
      </div>
    </aside>

    <main className="main">
      <div className="topbar">
        <div><div className="h1">{title}</div><p className="sub">Kis ko kab msg kiya, kis ka reply aya — sab ek jagah.</p></div>
        <div className="actions">
          <button className="btn2" onClick={()=>setSettings("lists")}>+ Country / Niche</button>
          <button className="btn2" onClick={()=>setSettings("data")}>Backup & export</button>
          <button className="btn" onClick={()=>setEditing(emptyLead())}>+ New lead</button>
        </div>
      </div>

      <div className="mobile-nav">
        {views.map(v=>(<button key={v.id} className={`navbtn ${view===v.id?"active":""}`} onClick={()=>setView(v.id)}>{v.label}{v.count!==null&&<span className="count">{v.count}</span>}</button>))}
      </div>

      <section className="stats">
        <div className="stat"><span>Total leads</span><b>{leads.length}</b><small>{uniq(leads.map(l=>l.country)).length} countries</small></div>
        <div className="stat"><span>Messages sent</span><b>{sent}</b><small>{sentToday} aaj</small></div>
        <div className="stat"><span>Replies</span><b>{replies}</b><small>{sent?Math.round(replies/Math.max(sent,1)*100):0}% reply rate</small></div>
        <div className="stat"><span>Follow-up due</span><b>{due.length}</b><small>{hot.length} hot leads</small></div>
      </section>

      <div className="panel">
        <div className="toolbar">
          <input className="search" placeholder="Search naam, number, city, niche…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="sel" value={fc} onChange={e=>setFc(e.target.value)}>
            <option value="All">All countries</option>
            {allCountries.map(c=>{ const n=leads.filter(l=>l.country===c).length; return <option key={c} value={c}>{c}{n?` (${n})`:""}</option>; })}
          </select>
          <select className="sel" value={fn} onChange={e=>setFn(e.target.value)}>
            <option value="All">All niches</option>
            {allNiches.map(c=>{ const n=leads.filter(l=>l.niche===c).length; return <option key={c} value={c}>{c}{n?` (${n})`:""}</option>; })}
          </select>
          {view!=="kanban"&&view!=="reports"&&<select className="sel" value={fs} onChange={e=>setFs(e.target.value)}><option value="All">All stages</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select>}
          {view!=="kanban"&&view!=="reports"&&<select className="sel" value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Sort: default</option><option value="followup">Sort: follow-up date</option><option value="sent">Sort: latest sent</option><option value="name">Sort: name A–Z</option></select>}
        </div>

        {view==="reports" ? <Reports leads={filtered} /> : view==="kanban" ? (
          <div className="kanban">{STAGES.filter(s=>filtered.some(l=>l.stage===s)).map(stage=>{ const col=filtered.filter(l=>l.stage===stage); return (
            <div className="kcol" key={stage}><h4>{stage}<span>{col.length}</span></h4>
              {col.map(l=>(<div className="kcard" key={l.id} onClick={()=>setDetail(l)}><b>{l.business}</b><div className="muted">{l.city} · {l.country}</div>{l.price&&<div className="muted num" style={{marginTop:4}}>{l.price}</div>}</div>))}
            </div>); })}
          </div>
        ) : filtered.length===0 ? <div className="empty">Is filter me koi lead nahi mila.</div> : (
          <div style={{overflowX:"auto"}}>
          <table className="table">
            <thead><tr><th>Lead</th><th>Stage</th><th className="hide-sm">Status</th><th className="hide-md hide-lg">Sent</th><th className="hide-md">Reply</th><th className="hide-sm">Next follow-up</th><th className="hide-md">Price</th><th></th></tr></thead>
            <tbody>{filtered.map(l=>{ const h=heat(l); return (
              <tr key={l.id} onClick={()=>setDetail(l)}>
                <td className="name"><b>{l.business}</b><small>{[l.person,l.city,l.country].filter(Boolean).join(" · ")}</small></td>
                <td><span className="pill stage">{l.stage}</span></td>
                <td className="hide-sm"><span className={`pill ${h}`}><i className="dot"/>{heatLabel[h]}</span></td>
                <td className="hide-md hide-lg num muted">{l.dateSent||"—"}</td>
                <td className="hide-md">{l.reply==="Yes"?<span className="pill done">Replied</span>:<span className="muted">—</span>}</td>
                <td className={`hide-sm num ${isDue(l)?"overdue":"muted"}`}>{l.nextFollowUp||"—"}</td>
                <td className="hide-md num price" title={l.price}>{l.price||<span className="muted">—</span>}</td>
                <td className="rowact" onClick={e=>e.stopPropagation()}>
                  <button className="mini wa" disabled={!waNumber(l.phone)} title={waNumber(l.phone)?"WhatsApp par bhejo":"WhatsApp number nahi hai"} onClick={()=>setSendFor(l)}>Send</button>
                  <button className="mini" onClick={()=>setReplyFor(l)}>Reply aya</button>
                </td>
              </tr>); })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </main>

    {dl && (
      <div className="overlay" onClick={()=>setDetail(null)}><div className="drawer" onClick={e=>e.stopPropagation()}>
        <div className="drawer-head">
          <div><h2>{dl.business}</h2>
            <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}><select className="stagesel" value={dl.stage} onChange={e=>setStage(dl.id,e.target.value)} title="Stage badlo">{STAGES.map(s=><option key={s}>{s}</option>)}</select><span className={`pill ${heat(dl)}`}><i className="dot"/>{heatLabel[heat(dl)]}</span>{isDue(dl)&&<span className="pill hot">Follow-up due</span>}</div>
          </div>
          <button className="close" onClick={()=>setDetail(null)} aria-label="Close">×</button>
        </div>
        <div className="drawer-body">
          <div className="section"><h3>Contact</h3><dl className="kv">
            <dt>Person</dt><dd>{dl.person||"—"}</dd>
            <dt>Phone</dt><dd className="num">{dl.phone||"—"}</dd>
            <dt>Location</dt><dd>{[dl.city,dl.country].filter(Boolean).join(", ")||"—"}</dd>
            <dt>Niche</dt><dd>{dl.niche}</dd>
            <dt>Source</dt><dd>{dl.source||"—"}</dd>
            <dt>Website / GMB</dt><dd>{dl.website} / {dl.gmb}</dd>
          </dl>{dl.gap&&<div className="quote">{dl.gap}</div>}</div>

          <div className="section"><h3>Outreach</h3><dl className="kv">
            <dt>Sent</dt><dd>{dl.dateSent||"—"} · {dl.channel} · Variant {dl.variant||"—"}</dd>
            <dt>Message</dt><dd>{dl.messageSent||"—"}</dd>
            <dt>Reply</dt><dd>{dl.reply==="Yes"?`${dl.replyDate||""} ${dl.replyType?"· "+dl.replyType:""}`:"Koi reply nahi"}</dd>
          </dl>{dl.replyText&&<div className="quote">“{dl.replyText}”</div>}</div>

          <div className="section"><h3>Demo & deal</h3><dl className="kv">
            <dt>Demo</dt><dd>{dl.demoStatus} · Personalized: {dl.demoPersonalized}</dd>
            <dt>Link</dt><dd>{dl.demoLink? <a href={dl.demoLink} target="_blank">{dl.demoLink}</a>:"—"}</dd>
            <dt>Price</dt><dd>{dl.price||"—"}</dd>
            <dt>Price clear?</dt><dd>{dl.priceClearWithDemo}</dd>
            <dt>Closing Q</dt><dd>{dl.closingQuestion||"—"}</dd>
          </dl></div>

          <div className="section"><h3>Next step</h3><dl className="kv">
            <dt>Follow-up</dt><dd className={isDue(dl)?"overdue":""}>{dl.nextFollowUp||"—"} <span className="muted">({dl.followUps} done)</span></dd>
            <dt>Action</dt><dd>{dl.nextAction||"—"}</dd>
            <dt>Notes</dt><dd>{dl.notes||"—"}</dd>
          </dl></div>

          {(dl.history||[]).length>0&&<div className="section"><h3>Timeline</h3>
            <div className="timeline">{dl.history.map((h,i)=><div key={i}><b>{h.date}</b>{h.event}</div>)}</div></div>}
        </div>
        <div className="drawer-foot">
          <button className="btn2" onClick={()=>{setEditing(dl);setDetail(null);}}>Edit</button>
          {waNumber(dl.phone)&&<button className="btn btn-wa" onClick={()=>setSendFor(dl)}>WhatsApp par bhejo</button>}
          <button className="btn2" onClick={()=>setReplyFor(dl)}>Reply aya</button>
          <button className="btn-ghost" style={{marginLeft:"auto"}} onClick={()=>remove(dl.id)}>Delete</button>
        </div>
      </div></div>
    )}

    {sendFor && <SendModal lead={sendFor} sentToday={sentToday} onClose={()=>setSendFor(null)} onSend={logSend} />}
    {replyFor && <ReplyModal lead={replyFor} onClose={()=>setReplyFor(null)} onSave={logReply} />}
    {editing && <LeadForm lead={editing} leads={leads} countries={allCountries} niches={allNiches} onAddOption={addOption} onClose={()=>setEditing(null)} onSave={save} />}
    {settings && <SettingsModal tab={settings} setTab={setSettings} leads={leads} opts={opts} countries={allCountries} niches={allNiches} onAdd={addOption} onRemove={removeOption}
      onCsv={exportCsv} onBackup={backup} onRestore={restore} onReset={resetSeed} onClose={()=>setSettings(null)} />}
  </div>);
}

function LeadForm({lead,leads,countries,niches,onAddOption,onClose,onSave}){
  const [f,setF]=useState({...lead});
  const upd=(k,v)=>setF(prev=>({...prev,[k]:v}));
  const submit=()=>{ if(!f.business.trim()) return alert("Business name lazmi hai");
    const dg=digits(f.phone); const dup=dg.length>=8 && leads.find(x=>x.id!==f.id && digits(x.phone)===dg);
    if(dup && !confirm(`Ye number pehle se "${dup.business}" ke naam se save hai. Phir bhi save karna hai?`)) return; const hist=[...(f.history||[])]; if(f.dateSent && !hist.some(h=>h.event.includes("Pitch"))) hist.push({date:f.dateSent,event:"Record updated in dashboard"}); onSave({...f, history:hist}); };
  const F=({label,k,type="input",opts,full})=>(
    <div key={k} className={`field ${full?"full":""}`}><label>{label}</label>
      {type==="select"? <select value={f[k]||""} onChange={e=>upd(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
      : type==="addable"? <select value={f[k]||""} onChange={e=>{ const v=e.target.value; if(v!=="__new") return upd(k,v);
          const name=prompt(k==="country"?"Naye country ka naam:":"Nayi niche ka naam:"); if(!name||!name.trim()) return;
          onAddOption(k==="country"?"countries":"niches",name); upd(k,name.trim()); }}>
          {opts.map(o=><option key={o}>{o}</option>)}<option value="__new">+ Naya add karo…</option></select>
      : type==="area"? <textarea rows={2} value={f[k]||""} onChange={e=>upd(k,e.target.value)} />
      : <input type={type==="date"?"date":type==="number"?"number":"text"} value={f[k]??""} onChange={e=>upd(k, type==="number"? Number(e.target.value): e.target.value)} />}
    </div>);
  const Sec=(t,children)=>(<div className="section"><h3>{t}</h3><div className="form">{children}</div></div>);
  return (<div className="modalbg"><div className="modal">
    <div className="modal-head"><h2>{lead.business? "Edit lead":"New lead"}</h2><button className="close" onClick={onClose} aria-label="Close">×</button></div>
    <div className="modal-body">
      {Sec("Business",[F({label:"Business name *",k:"business",full:true}),F({label:"Contact person",k:"person"}),F({label:"WhatsApp / phone",k:"phone"}),
        F({label:"City",k:"city"}),F({label:"Country",k:"country",type:"addable",opts:countries}),F({label:"Niche",k:"niche",type:"addable",opts:niches}),F({label:"Source",k:"source"}),
        F({label:"Website status",k:"website"}),F({label:"GMB status",k:"gmb"}),F({label:"Gap / observation",k:"gap",type:"area",full:true})])}
      {Sec("Outreach",[F({label:"Stage",k:"stage",type:"select",opts:STAGES}),F({label:"Channel",k:"channel",type:"select",opts:CHANNELS}),
        F({label:"Date sent",k:"dateSent",type:"date"}),F({label:"Template variant",k:"variant",type:"select",opts:["A","B",""]}),F({label:"Message sent",k:"messageSent",type:"area",full:true})])}
      {Sec("Reply",[F({label:"Reply aya?",k:"reply",type:"select",opts:["No","Yes"]}),F({label:"Reply date",k:"replyDate",type:"date"}),F({label:"Reply type",k:"replyType"}),F({label:"Lead ne kya kaha (exact)",k:"replyText",type:"area",full:true})])}
      {Sec("Demo & deal",[F({label:"Demo status",k:"demoStatus",type:"select",opts:["Not Started","Built","Built — unpublished","Built — not deployed","Live","Sent"]}),F({label:"Demo link",k:"demoLink"}),
        F({label:"Demo personalized?",k:"demoPersonalized",type:"select",opts:["No","Yes"]}),F({label:"Price quoted",k:"price"}),
        F({label:"Price demo ke sath clear?",k:"priceClearWithDemo",type:"select",opts:["No","Yes","Pending — link ke sath bhejna hai"]}),F({label:"Closing question",k:"closingQuestion"})])}
      {Sec("Follow-up",[F({label:"Next follow-up date",k:"nextFollowUp",type:"date"}),F({label:"Follow-ups count",k:"followUps",type:"number"}),F({label:"Next action",k:"nextAction",type:"area",full:true}),F({label:"Notes",k:"notes",type:"area",full:true})])}
    </div>
    <div className="modal-foot"><button className="btn2" onClick={onClose}>Cancel</button><button className="btn" onClick={submit}>Save lead</button></div>
  </div></div>);
}

function SendModal({lead,sentToday,onClose,onSend}){
  const firstSent=!!lead.dateSent;
  const [isFollow,setIsFollow]=useState(firstSent);
  const [variant,setVariant]=useState(lead.variant==="B"?"B":"A");
  const [tpl,setTpl]=useState(()=>loadTpl());
  const tplKey=isFollow?"followup":variant;
  const [text,setText]=useState("");
  useEffect(()=>{ setText(tpl[tplKey]||""); },[tplKey]); // eslint-disable-line
  const num=waNumber(lead.phone);
  const capHit=!isFollow && sentToday>=10;
  const go=()=>{
    if(!text.trim()) return alert("Message likho");
    if(capHit && !confirm("Aaj ka 10 nayi chats ka cap poora ho chuka hai. Phir bhi bhejna hai?")) return;
    const t={...tpl,[tplKey]:text}; saveTpl(t); setTpl(t);
    const msg=fill(text,lead);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
    onSend(lead,{text:msg,variant,isFollow});
  };
  return (<div className="modalbg" onClick={onClose}><div className="modal small" onClick={e=>e.stopPropagation()}>
    <div className="modal-head"><div><h2>WhatsApp par bhejo</h2><p className="muted">{lead.business} · {lead.phone}</p></div><button className="close" onClick={onClose} aria-label="Close">×</button></div>
    <div className="modal-body"><div className="section"><div className="form">
      <div className="field"><label>Message type</label>
        <select value={isFollow?"f":"p"} onChange={e=>setIsFollow(e.target.value==="f")}><option value="p">Pehla pitch</option><option value="f">Follow-up</option></select></div>
      {!isFollow&&<div className="field"><label>Template variant</label><select value={variant} onChange={e=>setVariant(e.target.value)}><option>A</option><option>B</option></select></div>}
      <div className="field full"><label>Message</label>
        <textarea rows={7} value={text} onChange={e=>setText(e.target.value)} placeholder="Hi {name}, I came across {business}…" />
        <p className="muted" style={{marginTop:6}}>{"{name}"} aur {"{business}"} khud bhar jayenge. Ye text {isFollow?"follow-up":`Variant ${variant}`} template ke taur par yaad rahega.</p></div>
      {text.trim()&&<div className="field full"><label>Preview</label><div className="quote" style={{whiteSpace:"pre-wrap",marginTop:0}}>{fill(text,lead)}</div></div>}
      {capHit&&<div className="field full"><div className="warnbox">Aaj ka cap (10 nayi chats) poora ho chuka hai — number ki safety ke liye is lead ko kal bhejna behtar hai.</div></div>}
    </div></div></div>
    <div className="modal-foot"><span className="muted" style={{marginRight:"auto"}}>WhatsApp khulega — wahan Send dabana hai. Dashboard khud update ho jayega.</span><button className="btn2" onClick={onClose}>Cancel</button><button className="btn btn-wa" onClick={go}>WhatsApp kholo & save</button></div>
  </div></div>);
}

function ReplyModal({lead,onClose,onSave}){
  const [text,setText]=useState(""); const [type,setType]=useState("Interested"); const [date,setDate]=useState(today());
  const go=()=>{ if(!text.trim()) return alert("Reply paste karo"); onSave(lead,{text:text.trim(),type,date}); };
  return (<div className="modalbg" onClick={onClose}><div className="modal small" onClick={e=>e.stopPropagation()}>
    <div className="modal-head"><div><h2>Reply aya</h2><p className="muted">{lead.business}</p></div><button className="close" onClick={onClose} aria-label="Close">×</button></div>
    <div className="modal-body"><div className="section"><div className="form">
      <div className="field full"><label>Lead ne kya kaha (paste karo)</label><textarea rows={4} autoFocus value={text} onChange={e=>setText(e.target.value)} /></div>
      <div className="field"><label>Reply type</label><select value={type} onChange={e=>setType(e.target.value)}>{REPLY_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
      <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
    </div></div></div>
    <div className="modal-foot"><button className="btn2" onClick={onClose}>Cancel</button><button className="btn" onClick={go}>Save reply</button></div>
  </div></div>);
}

function OptionList({title,kind,items,builtIn,leads,field,onAdd,onRemove}){
  const [v,setV]=useState("");
  const add=()=>{ if(!v.trim()) return; if(!onAdd(kind,v)) return alert("Ye pehle se list me hai."); setV(""); };
  return (<div className="section"><h3>{title}</h3>
    <div className="chips">{items.map(x=>{ const n=leads.filter(l=>l[field]===x).length; const custom=!builtIn.includes(x);
      return <span key={x} className="chip">{x}<small>{n}</small>{custom&&n===0&&<button onClick={()=>onRemove(kind,x)} title="Remove" aria-label={`Remove ${x}`}>×</button>}</span>; })}</div>
    <div className="addrow"><input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={kind==="countries"?"e.g. Canada, Qatar…":"e.g. Restaurants, Gyms…"} /><button className="btn" onClick={add}>Add</button></div>
  </div>);
}

function SettingsModal({tab,setTab,leads,countries,niches,onAdd,onRemove,onCsv,onBackup,onRestore,onReset,onClose}){
  return (<div className="modalbg" onClick={onClose}><div className="modal small" onClick={e=>e.stopPropagation()}>
    <div className="modal-head"><div className="tabs"><button className={tab==="lists"?"on":""} onClick={()=>setTab("lists")}>Countries & niches</button><button className={tab==="data"?"on":""} onClick={()=>setTab("data")}>Backup & export</button></div><button className="close" onClick={onClose} aria-label="Close">×</button></div>
    <div className="modal-body">
      {tab==="lists" ? (<>
        <OptionList title="Countries" kind="countries" field="country" items={countries} builtIn={COUNTRIES} leads={leads} onAdd={onAdd} onRemove={onRemove} />
        <OptionList title="Niches" kind="niches" field="niche" items={niches} builtIn={NICHES} leads={leads} onAdd={onAdd} onRemove={onRemove} />
        <p className="muted" style={{padding:"0 0 12px"}}>Number = kitni leads us me hain. Apni add ki hui cheez tab hi hat sakti hai jab us me koi lead na ho.</p>
      </>) : (<>
        <div className="section"><h3>Backup</h3><p className="muted" style={{marginBottom:10}}>Data sirf isi browser me save hai. Hafte me ek dafa backup download kar lein — naye phone/laptop par Restore se wapas aa jayega.</p>
          <div className="actions"><button className="btn" onClick={onBackup}>Backup download (.json)</button>
          <label className="btn2" style={{cursor:"pointer"}}>Restore backup<input type="file" accept=".json,application/json" hidden onChange={e=>e.target.files[0]&&onRestore(e.target.files[0])} /></label></div></div>
        <div className="section"><h3>Export</h3><div className="actions"><button className="btn2" onClick={onCsv}>Export CSV (Excel / Sheets)</button></div></div>
        <div className="section"><h3>Reset</h3><p className="muted" style={{marginBottom:10}}>Sab changes hata ke asal seed data wapas le aata hai.</p><button className="btn-ghost" style={{paddingLeft:0}} onClick={onReset}>Seed data reset karo</button></div>
      </>)}
    </div>
  </div></div>);
}

function Reports({leads}){
  const group=(key,label,only)=>{ const m={}; leads.filter(only||(()=>true)).forEach(l=>{ const k=(typeof key==="function"?key(l):l[key])||"—"; (m[k]=m[k]||[]).push(l); });
    const rows=Object.entries(m).map(([k,ls])=>{ const sent=ls.filter(l=>l.dateSent).length, rep=ls.filter(l=>l.reply==="Yes").length, won=ls.filter(l=>["Deal Closed","Delivered"].includes(l.stage)).length; return {k,total:ls.length,sent,rep,won,rate:pct(rep,sent)}; }).sort((a,b)=>b.sent-a.sent||b.total-a.total);
    return (<div className="rcard"><h3>{label}</h3><table className="table rtable"><thead><tr><th></th><th>Leads</th><th>Sent</th><th>Replies</th><th>Reply rate</th><th className="hide-sm">Closed</th></tr></thead>
      <tbody>{rows.map(r=>(<tr key={r.k}><td><b>{r.k}</b></td><td className="num">{r.total}</td><td className="num">{r.sent}</td><td className="num">{r.rep}</td>
        <td><div className="rate"><div className="rbar"><i style={{width:r.rate+"%"}}/></div><span className="num">{r.sent?r.rate+"%":"—"}</span></div></td><td className="num hide-sm">{r.won}</td></tr>))}</tbody></table></div>);
  };
  const funnel=[["Leads",leads.length],["Sent",leads.filter(l=>l.dateSent).length],["Replied",leads.filter(l=>l.reply==="Yes").length],
    ["Demo sent",leads.filter(l=>["Demo Sent","Negotiation","Deal Closed","Delivered"].includes(l.stage)).length],["Closed",leads.filter(l=>["Deal Closed","Delivered"].includes(l.stage)).length]];
  const max=Math.max(1,funnel[0][1]);
  return (<div className="reports">
    <div className="rcard"><h3>Funnel</h3><div className="funnel">{funnel.map(([k,v],i)=>(<div key={k} className="frow"><span>{k}</span><div className="fbar"><i style={{width:(v/max*100)+"%"}}/></div><b className="num">{v}</b><small className="muted">{i>0?pct(v,funnel[i-1][1])+"%":""}</small></div>))}</div></div>
    {group(l=>l.variant?"Variant "+l.variant:"Variant set nahi","A/B template (sirf bheji gayi leads)",l=>l.dateSent)}
    {group("niche","Niche")}
    {group("country","Country")}
    {group(l=>l.source||"—","Source")}
  </div>);
}
