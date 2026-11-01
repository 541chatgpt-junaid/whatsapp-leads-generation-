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
function isDue(l){ return l.nextFollowUp && l.nextFollowUp <= today() && !["Deal Closed","Delivered","Declined"].includes(l.stage); }

export default function Page(){
  const [leads,setLeads]=useState(SEED_LEADS);
  const [view,setView]=useState("all"); // all | kanban | due | hot
  const [q,setQ]=useState(""); const [fc,setFc]=useState("All"); const [fs,setFs]=useState("All");
  const [editing,setEditing]=useState(null); const [detail,setDetail]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{ try{ const raw=localStorage.getItem(KEY); if(raw) setLeads(JSON.parse(raw)); }catch(e){} setLoaded(true); },[]);
  useEffect(()=>{ if(loaded) localStorage.setItem(KEY, JSON.stringify(leads)); },[leads,loaded]);

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
    const s=(l.business+" "+l.person+" "+l.phone+" "+l.city+" "+l.niche).toLowerCase();
    return s.includes(q.toLowerCase());
  }),[leads,q,fc,fs,view]);

  const save = (lead)=>{ setLeads(prev=>{ const ex=prev.some(x=>x.id===lead.id); return ex? prev.map(x=>x.id===lead.id?lead:x) : [lead,...prev]; }); setEditing(null); };
  const remove = (id)=>{ if(confirm("Ye lead delete kar dein?")) setLeads(prev=>prev.filter(x=>x.id!==id)); setDetail(null); };
  const exportCsv = ()=>{
    const cols=["business","person","phone","city","country","niche","stage","channel","dateSent","reply","replyDate","replyText","demoStatus","demoLink","price","nextFollowUp","nextAction","notes"];
    const csv=[cols.join(","), ...leads.map(l=>cols.map(c=>`"${String(l[c]??"").replaceAll('"','""')}"`).join(","))].join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="jm-leads.csv"; a.click();
  };
  const resetSeed = ()=>{ if(confirm("Seed data wapas load kar dein? Aapki changes khatam ho jayengi.")){ setLeads(SEED_LEADS); localStorage.removeItem(KEY);} };

  const heatLabel = { hot:"Hot", warm:"Warm", done:"Closed", cold:"Cold" };
  const views = [
    { id:"all", label:"All leads", count:leads.length },
    { id:"kanban", label:"Pipeline", count:null },
    { id:"due", label:"Follow-up due", count:due.length },
    { id:"hot", label:"Hot leads", count:hot.length },
  ];
  const title = { all:"All leads", kanban:"Pipeline", due:"Follow-up due", hot:"Hot leads" }[view];
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
          <button className="btn2" onClick={exportCsv}>Export CSV</button>
          <button className="btn2" onClick={resetSeed}>Reset</button>
          <button className="btn" onClick={()=>setEditing(emptyLead())}>+ New lead</button>
        </div>
      </div>

      <div className="mobile-nav">
        {views.map(v=>(<button key={v.id} className={`navbtn ${view===v.id?"active":""}`} onClick={()=>setView(v.id)}>{v.label}{v.count!==null&&<span className="count">{v.count}</span>}</button>))}
      </div>

      <section className="stats">
        <div className="stat"><span>Total leads</span><b>{leads.length}</b><small>{COUNTRIES.filter(c=>leads.some(l=>l.country===c)).length} countries</small></div>
        <div className="stat"><span>Messages sent</span><b>{sent}</b><small>{sentToday} aaj</small></div>
        <div className="stat"><span>Replies</span><b>{replies}</b><small>{sent?Math.round(replies/Math.max(sent,1)*100):0}% reply rate</small></div>
        <div className="stat"><span>Follow-up due</span><b>{due.length}</b><small>{hot.length} hot leads</small></div>
      </section>

      <div className="panel">
        <div className="toolbar">
          <input className="search" placeholder="Search naam, number, city, niche…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="sel" value={fc} onChange={e=>setFc(e.target.value)}>
            <option value="All">All countries</option>
            {COUNTRIES.map(c=>{ const n=leads.filter(l=>l.country===c).length; return <option key={c} value={c}>{c}{n?` (${n})`:""}</option>; })}
          </select>
          {view!=="kanban"&&<select className="sel" value={fs} onChange={e=>setFs(e.target.value)}><option value="All">All stages</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select>}
        </div>

        {view==="kanban" ? (
          <div className="kanban">{STAGES.filter(s=>filtered.some(l=>l.stage===s)).map(stage=>{ const col=filtered.filter(l=>l.stage===stage); return (
            <div className="kcol" key={stage}><h4>{stage}<span>{col.length}</span></h4>
              {col.map(l=>(<div className="kcard" key={l.id} onClick={()=>setDetail(l)}><b>{l.business}</b><div className="muted">{l.city} · {l.country}</div>{l.price&&<div className="muted num" style={{marginTop:4}}>{l.price}</div>}</div>))}
            </div>); })}
          </div>
        ) : filtered.length===0 ? <div className="empty">Is filter me koi lead nahi mila.</div> : (
          <div style={{overflowX:"auto"}}>
          <table className="table">
            <thead><tr><th>Lead</th><th>Stage</th><th className="hide-sm">Status</th><th className="hide-md">Sent</th><th className="hide-md">Reply</th><th className="hide-sm">Next follow-up</th><th className="hide-md">Price</th></tr></thead>
            <tbody>{filtered.map(l=>{ const h=heat(l); return (
              <tr key={l.id} onClick={()=>setDetail(l)}>
                <td className="name"><b>{l.business}</b><small>{[l.person,l.city,l.country].filter(Boolean).join(" · ")}</small></td>
                <td><span className="pill stage">{l.stage}</span></td>
                <td className="hide-sm"><span className={`pill ${h}`}><i className="dot"/>{heatLabel[h]}</span></td>
                <td className="hide-md num muted">{l.dateSent||"—"}</td>
                <td className="hide-md">{l.reply==="Yes"?<span className="pill done">Replied</span>:<span className="muted">—</span>}</td>
                <td className={`hide-sm num ${isDue(l)?"overdue":"muted"}`}>{l.nextFollowUp||"—"}</td>
                <td className="hide-md num">{l.price||<span className="muted">—</span>}</td>
              </tr>); })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </main>

    {detail && (
      <div className="overlay" onClick={()=>setDetail(null)}><div className="drawer" onClick={e=>e.stopPropagation()}>
        <div className="drawer-head">
          <div><h2>{detail.business}</h2>
            <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}><span className="pill stage">{detail.stage}</span><span className={`pill ${heat(detail)}`}><i className="dot"/>{heatLabel[heat(detail)]}</span>{isDue(detail)&&<span className="pill hot">Follow-up due</span>}</div>
          </div>
          <button className="close" onClick={()=>setDetail(null)} aria-label="Close">×</button>
        </div>
        <div className="drawer-body">
          <div className="section"><h3>Contact</h3><dl className="kv">
            <dt>Person</dt><dd>{detail.person||"—"}</dd>
            <dt>Phone</dt><dd className="num">{detail.phone||"—"}</dd>
            <dt>Location</dt><dd>{[detail.city,detail.country].filter(Boolean).join(", ")||"—"}</dd>
            <dt>Niche</dt><dd>{detail.niche}</dd>
            <dt>Source</dt><dd>{detail.source||"—"}</dd>
            <dt>Website / GMB</dt><dd>{detail.website} / {detail.gmb}</dd>
          </dl>{detail.gap&&<div className="quote">{detail.gap}</div>}</div>

          <div className="section"><h3>Outreach</h3><dl className="kv">
            <dt>Sent</dt><dd>{detail.dateSent||"—"} · {detail.channel} · Variant {detail.variant||"—"}</dd>
            <dt>Message</dt><dd>{detail.messageSent||"—"}</dd>
            <dt>Reply</dt><dd>{detail.reply==="Yes"?`${detail.replyDate||""} ${detail.replyType?"· "+detail.replyType:""}`:"Koi reply nahi"}</dd>
          </dl>{detail.replyText&&<div className="quote">“{detail.replyText}”</div>}</div>

          <div className="section"><h3>Demo & deal</h3><dl className="kv">
            <dt>Demo</dt><dd>{detail.demoStatus} · Personalized: {detail.demoPersonalized}</dd>
            <dt>Link</dt><dd>{detail.demoLink? <a href={detail.demoLink} target="_blank">{detail.demoLink}</a>:"—"}</dd>
            <dt>Price</dt><dd>{detail.price||"—"}</dd>
            <dt>Price clear?</dt><dd>{detail.priceClearWithDemo}</dd>
            <dt>Closing Q</dt><dd>{detail.closingQuestion||"—"}</dd>
          </dl></div>

          <div className="section"><h3>Next step</h3><dl className="kv">
            <dt>Follow-up</dt><dd className={isDue(detail)?"overdue":""}>{detail.nextFollowUp||"—"} <span className="muted">({detail.followUps} done)</span></dd>
            <dt>Action</dt><dd>{detail.nextAction||"—"}</dd>
            <dt>Notes</dt><dd>{detail.notes||"—"}</dd>
          </dl></div>

          {(detail.history||[]).length>0&&<div className="section"><h3>Timeline</h3>
            <div className="timeline">{detail.history.map((h,i)=><div key={i}><b>{h.date}</b>{h.event}</div>)}</div></div>}
        </div>
        <div className="drawer-foot">
          <button className="btn" onClick={()=>{setEditing(detail);setDetail(null);}}>Edit</button>
          {detail.phone&&detail.phone.includes("+")&&<a className="btn2" target="_blank" href={`https://wa.me/${detail.phone.replace(/[^0-9]/g,"")}`}>Open WhatsApp</a>}
          <button className="btn-ghost" style={{marginLeft:"auto"}} onClick={()=>remove(detail.id)}>Delete</button>
        </div>
      </div></div>
    )}

    {editing && <LeadForm lead={editing} onClose={()=>setEditing(null)} onSave={save} />}
  </div>);
}

function LeadForm({lead,onClose,onSave}){
  const [f,setF]=useState({...lead});
  const upd=(k,v)=>setF(prev=>({...prev,[k]:v}));
  const submit=()=>{ if(!f.business.trim()) return alert("Business name lazmi hai"); const hist=[...(f.history||[])]; if(f.dateSent && !hist.some(h=>h.event.includes("Pitch"))) hist.push({date:f.dateSent,event:"Record updated in dashboard"}); onSave({...f, history:hist}); };
  const F=({label,k,type="input",opts,full})=>(
    <div key={k} className={`field ${full?"full":""}`}><label>{label}</label>
      {type==="select"? <select value={f[k]||""} onChange={e=>upd(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
      : type==="area"? <textarea rows={2} value={f[k]||""} onChange={e=>upd(k,e.target.value)} />
      : <input type={type==="date"?"date":type==="number"?"number":"text"} value={f[k]??""} onChange={e=>upd(k, type==="number"? Number(e.target.value): e.target.value)} />}
    </div>);
  const Sec=(t,children)=>(<div className="section"><h3>{t}</h3><div className="form">{children}</div></div>);
  return (<div className="modalbg"><div className="modal">
    <div className="modal-head"><h2>{lead.business? "Edit lead":"New lead"}</h2><button className="close" onClick={onClose} aria-label="Close">×</button></div>
    <div className="modal-body">
      {Sec("Business",[F({label:"Business name *",k:"business",full:true}),F({label:"Contact person",k:"person"}),F({label:"WhatsApp / phone",k:"phone"}),
        F({label:"City",k:"city"}),F({label:"Country",k:"country",type:"select",opts:COUNTRIES}),F({label:"Niche",k:"niche",type:"select",opts:NICHES}),F({label:"Source",k:"source"}),
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
