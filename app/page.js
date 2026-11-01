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

  return (
  <div className="wrap">
    <aside className="sidebar">
      <div><div className="logo">JM Lead Dashboard</div><div className="tagline">JM Digital Marketing<br/>Smart Solutions. Real Results.</div></div>
      <button className={`navbtn ${view==="all"?"active":""}`} onClick={()=>setView("all")}>📊 All Leads ({leads.length})</button>
      <button className={`navbtn ${view==="kanban"?"active":""}`} onClick={()=>setView("kanban")}>🗂️ Pipeline / Kanban</button>
      <button className={`navbtn ${view==="due"?"active":""}`} onClick={()=>setView("due")}>⏰ Follow-up Due ({due.length})</button>
      <button className={`navbtn ${view==="hot"?"active":""}`} onClick={()=>setView("hot")}>🔥 Hot Leads ({hot.length})</button>
      <button className="btn" style={{marginTop:14}} onClick={()=>setEditing(emptyLead())}>+ New Lead Add Karo</button>
      <button className="btn2" onClick={exportCsv}>⬇ Export CSV</button>
      <button className="btn2" onClick={resetSeed}>↺ Seed Data Reset</button>
      <div className="capbox"><b>Today's WhatsApp Cap</b><div className="bar"><i style={{width:Math.min(100,sentToday*10)+"%"}}/></div><span style={{color:"var(--muted)",fontSize:13}}>{sentToday} / 10 nayi chats aaj</span><div style={{fontSize:12,color:"var(--muted)",marginTop:8}}>Cap full ho to baqi leads kal ke liye Hold me daalo.</div></div>
    </aside>

    <main className="main">
      <div className="h1">Kis ko kab msg kiya, kis ka reply aya — sab ek jagah ✦</div>
      <p className="sub">Card par click karo to us lead ki puri history, demo, price aur next action nazar ayega. Sab data isi browser me auto-save hota hai.</p>

      <section className="stats">
        <div className="stat"><b>{leads.length}</b><span>Total Leads</span></div>
        <div className="stat"><b>{sent}</b><span>Msg Bheje Gaye</span></div>
        <div className="stat"><b>{replies} {sent?`(${Math.round(replies/Math.max(sent,1)*100)}%)`:""}</b><span>Replies Aye</span></div>
        <div className="stat"><b>{due.length} due · {hot.length} hot</b><span>Aaj Follow-up / Garam Leads</span></div>
      </section>

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {COUNTRIES.map(c=>{ const n=leads.filter(l=>l.country===c).length; return n? <span key={c} className="pill stage">{c}: {n} leads · {leads.filter(l=>l.country===c&&l.reply==="Yes").length} replies</span>:null; })}
      </div>

      <div className="toolbar">
        <input className="search" placeholder="🔍 Naam, number, city ya niche search karo..." value={q} onChange={e=>setQ(e.target.value)} />
        <select className="sel" value={fc} onChange={e=>setFc(e.target.value)}><option>All</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select>
        <select className="sel" value={fs} onChange={e=>setFs(e.target.value)}><option>All</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
      </div>

      {view==="kanban" ? (
        <div className="kanban">{STAGES.filter(s=>leads.some(l=>l.stage===s)).map(stage=>(
          <div className="kcol" key={stage}><h4>{stage} · {leads.filter(l=>l.stage===stage).length}</h4>
            {leads.filter(l=>l.stage===stage).map(l=>(<div className="kcard" key={l.id} onClick={()=>setDetail(l)}><b>{l.business}</b><div className="meta">{l.city} · {l.country}<br/>{l.price||"—"}</div></div>))}
          </div>))}
        </div>
      ) : filtered.length===0 ? <div className="empty">Is filter me koi lead nahi mila. New Lead add karo ya filter badlo.</div> : (
        <div className="grid">{filtered.map(l=>(
          <article className="card" key={l.id} onClick={()=>setDetail(l)} style={{cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8}}><h3>{l.business}</h3><span className={`pill ${heat(l)}`}>{heat(l)==="hot"?"🔥 HOT":heat(l)==="warm"?"WARM":heat(l)==="done"?"DONE":"LEAD"}</span></div>
            <div className="meta">👤 {l.person||"—"} · 📱 {l.phone||"—"}<br/>📍 {l.city} · {l.country} · {l.niche}<br/>🌐 {l.website} · Maps: {l.gmb}</div>
            <p className="meta" style={{color:"#ddd6fe"}}>{l.gap}</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}><span className="pill stage">{l.stage}</span>{l.dateSent&&<span className="pill cold">Sent: {l.dateSent}</span>}{l.reply==="Yes"&&<span className="pill done">Reply: {l.replyDate||"Yes"}</span>}{isDue(l)&&<span className="pill due">⏰ Follow-up Due</span>}</div>
            {l.replyText&&<p className="meta" style={{marginTop:10}}>💬 “{l.replyText}”</p>}
            <div className="meta" style={{marginTop:8}}><b style={{color:"#fff"}}>Next:</b> {l.nextAction||"—"}<br/>💰 {l.price||"Price set nahi"} · Demo: {l.demoStatus}</div>
          </article>))}
        </div>
      )}
    </main>

    {detail && (
      <div className="modalbg" onClick={()=>setDetail(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><h2 style={{fontSize:24}}>{detail.business}</h2><p className="meta">{detail.person} · {detail.phone} · {detail.city}, {detail.country} · {detail.niche} · Source: {detail.source}</p></div><span className={`pill ${heat(detail)}`}>{detail.stage}</span></div>
        <div className="form">
          <div className="field"><label>Gap / Observation</label><p>{detail.gap||"—"}</p></div>
          <div className="field"><label>Website / GMB</label><p>{detail.website} / {detail.gmb}</p></div>
          <div className="field"><label>Msg Kab / Channel / Variant</label><p>{detail.dateSent||"—"} · {detail.channel} · Variant {detail.variant||"—"}<br/>{detail.messageSent}</p></div>
          <div className="field"><label>Reply</label><p>{detail.reply==="Yes"?`${detail.replyDate||""} — ${detail.replyType}`:"Koi reply nahi"}<br/>“{detail.replyText||""}”</p></div>
          <div className="field"><label>Demo</label><p>Status: {detail.demoStatus} · Personalized: {detail.demoPersonalized}<br/>{detail.demoLink? <a href={detail.demoLink} target="_blank">{detail.demoLink}</a>:"Link nahi"}</p></div>
          <div className="field"><label>Price / Deal</label><p>{detail.price||"—"}<br/>Price demo ke sath clear: {detail.priceClearWithDemo}<br/>Closing Q: {detail.closingQuestion||"—"}</p></div>
          <div className="field full"><label>Next Action · Follow-up: {detail.nextFollowUp||"—"} · Count: {detail.followUps}</label><p>{detail.nextAction||"—"}</p></div>
          <div className="field full"><label>Notes</label><p>{detail.notes||"—"}</p></div>
        </div>
        <h3 style={{marginTop:20}}>🕘 Puri History / Timeline</h3>
        <div className="timeline">{(detail.history||[]).map((h,i)=><div key={i}><b>{h.date}</b> — {h.event}</div>)}</div>
        <div style={{display:"flex",gap:10,marginTop:22,flexWrap:"wrap"}}><button className="btn" onClick={()=>{setEditing(detail);setDetail(null);}}>✏ Edit Karo</button>{detail.phone&&detail.phone.includes("+")&&<a className="btn2" style={{textDecoration:"none"}} target="_blank" href={`https://wa.me/${detail.phone.replace(/[^0-9]/g,"")}`}>WhatsApp Kholain</a>}<button className="btn2" onClick={()=>remove(detail.id)}>Delete</button><button className="btn2" onClick={()=>setDetail(null)}>Band Karo</button></div>
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
    <div className={`field ${full?"full":""}`}><label>{label}</label>
      {type==="select"? <select value={f[k]||""} onChange={e=>upd(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
      : type==="area"? <textarea rows={3} value={f[k]||""} onChange={e=>upd(k,e.target.value)} />
      : <input type={type==="date"?"date":"text"} value={f[k]||""} onChange={e=>upd(k, type==="number"? Number(e.target.value): e.target.value)} />}
    </div>);
  return (<div className="modalbg"><div className="modal"><h2>{f.business? "Lead Edit Karo":"New Lead"}</h2>
    <div className="form">
      <F label="Business Name *" k="business" full/><F label="Contact Person" k="person"/><F label="WhatsApp / Phone" k="phone"/>
      <F label="City" k="city"/><F label="Country" k="country" type="select" opts={COUNTRIES}/><F label="Niche" k="niche" type="select" opts={NICHES}/><F label="Source" k="source"/>
      <F label="Website Status" k="website"/><F label="GMB Status" k="gmb"/><F label="Stage" k="stage" type="select" opts={STAGES}/><F label="Channel" k="channel" type="select" opts={CHANNELS}/>
      <F label="Gap / Observation" k="gap" type="area" full/>
      <F label="Date Sent" k="dateSent" type="date"/><F label="Template Variant" k="variant" type="select" opts={["A","B",""]}/><F label="Message Sent" k="messageSent" type="area" full/>
      <F label="Reply Aya?" k="reply" type="select" opts={["No","Yes"]}/><F label="Reply Date" k="replyDate" type="date"/><F label="Reply Type" k="replyType"/><F label="Lead Ne Kya Kaha (exact)" k="replyText" type="area" full/>
      <F label="Demo Status" k="demoStatus" type="select" opts={["Not Started","Built","Built — unpublished","Built — not deployed","Live","Sent"]}/><F label="Demo Link" k="demoLink"/><F label="Demo Personalized?" k="demoPersonalized" type="select" opts={["No","Yes"]}/><F label="Price Quoted" k="price"/>
      <F label="Price Demo Ke Sath Clear?" k="priceClearWithDemo" type="select" opts={["No","Yes","Pending — link ke sath bhejna hai"]}/><F label="Closing Question" k="closingQuestion"/>
      <F label="Next Follow-up Date" k="nextFollowUp" type="date"/><F label="Follow-ups Count" k="followUps" type="number"/><F label="Next Action" k="nextAction" type="area" full/><F label="Notes" k="notes" type="area" full/>
    </div>
    <div style={{display:"flex",gap:10,marginTop:20}}><button className="btn" onClick={submit}>💾 Save Karo</button><button className="btn2" onClick={onClose}>Cancel</button></div>
  </div></div>);
}
