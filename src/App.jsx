import { useState, useEffect, useRef, useCallback } from "react";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://pvdnvfpfvatrzfocuopg.supabase.co";
const SB_KEY = "sb_publishable_agiL_8c1_FLJkXujdk0Ypg_QD_Jxyso";

const sbFetch = async (path, options={}) => {
  const res = await fetch(`${SB_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const db = {
  // STOCK
  getStock:    ()          => sbFetch("/stock?order=id.asc"),
  insertStock: (row)       => sbFetch("/stock", {method:"POST", body:JSON.stringify(row)}),
  updateStock: (id, row)   => sbFetch(`/stock?id=eq.${id}`, {method:"PATCH", body:JSON.stringify(row)}),
  deleteStock: (id)        => sbFetch(`/stock?id=eq.${id}`, {method:"DELETE", prefer:""}),
  // ORDERS
  getOrders:   ()          => sbFetch("/orders?order=created_at.desc"),
  insertOrder: (row)       => sbFetch("/orders", {method:"POST", body:JSON.stringify(row)}),
  updateOrder: (id, row)   => sbFetch(`/orders?id=eq.${id}`, {method:"PATCH", body:JSON.stringify(row)}),
  deleteOrder: (id)        => sbFetch(`/orders?id=eq.${id}`, {method:"DELETE", prefer:""}),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_KEY   = "ck-role";

const ADMIN_PASS  = "samurai2026";
const VIEWER_PASS = "kitchen123";

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const CATS    = ["Wagyu","Beverages","SKU CK","Gas","Others"];
const OUTLETS = ["Samurai Neo","Samurai Ryoiki","Samurai Evo","Samurai Hattori (KLTS)","AAH Samurai","Samurai Sora","Samurai Puchong","Samurai Bayan Baru","Samurai Seberang Jaya","Konoha Buffet KB","Samurai Hattori (Bachok)"];

const DEFAULT_STOCK = [
  {id:1, name:"Chuck Roll",         cat:"Wagyu",     unit:"pack", qty:142, minQty:20, lastUpdate:"2026-04-10", photo:null},
  {id:2, name:"Wagyu Shabu",        cat:"Wagyu",     unit:"pack", qty:98,  minQty:20, lastUpdate:"2026-04-10", photo:null},
  {id:3, name:"Top Round",          cat:"Wagyu",     unit:"pack", qty:0,   minQty:10, lastUpdate:"2026-04-10", photo:null},
  {id:4, name:"Mini Skewer",        cat:"Wagyu",     unit:"pcs",  qty:140, minQty:30, lastUpdate:"2026-04-10", photo:null},
  {id:5, name:"Lemak Wagyu",        cat:"Wagyu",     unit:"kg",   qty:27.57,minQty:5, lastUpdate:"2026-04-10", photo:null},
  {id:6, name:"Saikoro",            cat:"Wagyu",     unit:"pack", qty:21,  minQty:10, lastUpdate:"2026-04-10", photo:null},
  {id:7, name:"Short Rib Yakiniku", cat:"Wagyu",     unit:"pack", qty:59,  minQty:10, lastUpdate:"2026-04-10", photo:null},
  {id:8, name:"Chocolate",          cat:"Beverages", unit:"ctn",  qty:8,   minQty:3,  lastUpdate:"2026-04-10", photo:null},
  {id:9, name:"Lemon Tea",          cat:"Beverages", unit:"ctn",  qty:18,  minQty:3,  lastUpdate:"2026-04-10", photo:null},
  {id:10,name:"Cappuccino",         cat:"Beverages", unit:"ctn",  qty:7,   minQty:3,  lastUpdate:"2026-04-10", photo:null},
  {id:11,name:"White Coffee",       cat:"Beverages", unit:"ctn",  qty:5,   minQty:3,  lastUpdate:"2026-04-10", photo:null},
  {id:12,name:"Teh Tarik",          cat:"Beverages", unit:"ctn",  qty:8,   minQty:3,  lastUpdate:"2026-04-10", photo:null},
  {id:13,name:"Mocha",              cat:"Beverages", unit:"ctn",  qty:6,   minQty:3,  lastUpdate:"2026-04-10", photo:null},
  {id:14,name:"Marinated Lamb",     cat:"SKU CK",    unit:"pack", qty:63,  minQty:10, lastUpdate:"2026-04-10", photo:null},
  {id:15,name:"Yakitori",           cat:"SKU CK",    unit:"pack", qty:0,   minQty:10, lastUpdate:"2026-04-10", photo:null},
  {id:16,name:"Karaage",            cat:"SKU CK",    unit:"pack", qty:0,   minQty:10, lastUpdate:"2026-04-10", photo:null},
  {id:17,name:"Gas Butane",         cat:"Gas",       unit:"ctn",  qty:10,  minQty:5,  lastUpdate:"2026-04-10", photo:null},
];

// Compute pending quantity per item name from non-completed orders
const getPendingMap = (orders) => {
  const map = {};
  orders.filter(o => o.status !== "Completed").forEach(o => {
    o.items.filter(i => !i.delivered).forEach(i => {
      const key = i.name.toLowerCase().trim();
      map[key] = (map[key] || 0) + (parseFloat(i.qty) || 0);
    });
  });
  return map;
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#ffffff",
  surface:  "#f5f5f7",
  border:   "#e5e5ea",
  text:     "#1d1d1f",
  sub:      "#86868b",
  accent:   "#0071e3",
  danger:   "#ff3b30",
  warning:  "#ff9500",
  success:  "#34c759",
  purple:   "#5856d6",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const T = {
  h1: { fontSize:28, fontWeight:700, letterSpacing:-.5, color:C.text, margin:0 },
  h2: { fontSize:20, fontWeight:600, letterSpacing:-.3, color:C.text, margin:0 },
  h3: { fontSize:15, fontWeight:600, color:C.text, margin:0 },
  body: { fontSize:14, color:C.text },
  caption: { fontSize:12, color:C.sub },
  label: { fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:.8 },
};

const Card = ({children, style={}}) => (
  <div style={{background:C.bg, borderRadius:16, border:`1px solid ${C.border}`, ...style}}>{children}</div>
);

const Pill = ({label, active, color=C.accent, onClick}) => (
  <button onClick={onClick} style={{
    padding:"6px 14px", borderRadius:99, border:"none", cursor:"pointer",
    fontSize:13, fontWeight:500, transition:"all .15s",
    background: active ? color : C.surface,
    color: active ? "#fff" : C.sub,
  }}>{label}</button>
);

const Toast = ({msg, type}) => {
  const bg = type==="err" ? C.danger : type==="warn" ? C.warning : C.success;
  return (
    <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,
      background:bg,color:"#fff",padding:"12px 22px",borderRadius:12,fontWeight:600,fontSize:14,
      boxShadow:"0 8px 40px rgba(0,0,0,.18)",animation:"toastIn .2s ease",whiteSpace:"nowrap",maxWidth:"90vw",textAlign:"center"}}>{msg}</div>
  );
};

const Modal = ({onClose, children, width=480}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()}
    style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:2000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
    <div style={{background:C.bg,borderRadius:20,padding:28,width:"100%",maxWidth:width,
      maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,.2)"}}>{children}</div>
  </div>
);

const Inp = ({label, value, onChange, type="text", placeholder, hint, min, step, readOnly}) => (
  <div style={{marginBottom:16}}>
    {label && <div style={{...T.label, marginBottom:6}}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      min={min} step={step} readOnly={readOnly}
      style={{width:"100%", boxSizing:"border-box", background: readOnly ? C.surface : C.bg,
        border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px",
        color:C.text, fontSize:14, outline:"none", fontFamily:"inherit"}}/>
    {hint && <div style={{...T.caption, marginTop:4}}>{hint}</div>}
  </div>
);

const Sel = ({label, value, onChange, options}) => (
  <div style={{marginBottom:16}}>
    {label && <div style={{...T.label, marginBottom:6}}>{label}</div>}
    <select value={value} onChange={onChange}
      style={{width:"100%", background:C.bg, border:`1px solid ${C.border}`,
        borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14,
        outline:"none", fontFamily:"inherit"}}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({onClick, children, variant="primary", color, style={}, disabled, full}) => {
  const bg = variant==="primary" ? (color||C.accent) : "transparent";
  const border = variant==="outline" ? `1.5px solid ${color||C.border}` : "none";
  const clr = variant==="primary" ? "#fff" : (color||C.sub);
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"11px 20px", borderRadius:10, border, background:bg, color:clr,
      fontWeight:600, fontSize:14, cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?.45:1, fontFamily:"inherit", width:full?"100%":"auto", ...style
    }}>{children}</button>
  );
};

const Divider = () => <div style={{height:1, background:C.border, margin:"8px 0"}}/>;

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({onLogin}) {
  const [mode, setMode] = useState(null); // null | "admin" | "viewer" | "outlet"
  const [pass, setPass] = useState("");
  const [outlet, setOutlet] = useState(OUTLETS[0]);
  const [err, setErr] = useState("");

  const submit = () => {
    if (mode === "outlet") { onLogin("outlet", outlet); return; }
    if (mode === "admin"  && pass === ADMIN_PASS)  { onLogin("admin");  return; }
    if (mode === "viewer" && pass === VIEWER_PASS) { onLogin("viewer"); return; }
    setErr("Incorrect password. Please try again.");
  };

  return (
    <div style={{minHeight:"100vh", background:C.surface, display:"flex", alignItems:"center",
      justifyContent:"center", padding:24, fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{width:"100%", maxWidth:380}}>
        <div style={{textAlign:"center", marginBottom:40}}>
          <div style={{fontSize:48, marginBottom:12}}>🥩</div>
          <div style={{...T.h1, fontSize:24}}>Central Kitchen</div>
          <div style={{...T.caption, marginTop:4}}>Samurai Yakiniku — Stock Management</div>
        </div>

        {!mode && (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {[
              {k:"admin",  label:"Admin",        sub:"Full access · Edit & manage everything", icon:"🔐"},
              {k:"viewer", label:"View Only",     sub:"See stock & orders · No editing",        icon:"👁"},
              {k:"outlet", label:"Submit Order",  sub:"Place a weekly order request",           icon:"📋"},
            ].map(r=>(
              <button key={r.k} onClick={()=>{setMode(r.k);setPass("");setErr("")}} style={{
                background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px",
                cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"box-shadow .15s",
              }} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
                 onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <span style={{fontSize:22}}>{r.icon}</span>
                  <div>
                    <div style={{...T.h3}}>{r.label}</div>
                    <div style={{...T.caption, marginTop:2}}>{r.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {mode && mode !== "outlet" && (
          <Card style={{padding:24}}>
            <button onClick={()=>{setMode(null);setErr("")}} style={{background:"none",border:"none",
              color:C.accent,cursor:"pointer",fontSize:14,fontWeight:500,padding:0,marginBottom:20,fontFamily:"inherit"}}>
              ← Back
            </button>
            <div style={{...T.h2, marginBottom:4}}>{mode==="admin"?"Admin Login":"View Only Login"}</div>
            <div style={{...T.caption, marginBottom:20}}>Enter your password to continue</div>
            <Inp label="Password" type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("")}}
              placeholder="Enter password"/>
            {err && <div style={{color:C.danger, fontSize:13, marginBottom:12}}>{err}</div>}
            <Btn onClick={submit} full>Continue</Btn>
          </Card>
        )}

        {mode === "outlet" && (
          <Card style={{padding:24}}>
            <button onClick={()=>{setMode(null);setErr("")}} style={{background:"none",border:"none",
              color:C.accent,cursor:"pointer",fontSize:14,fontWeight:500,padding:0,marginBottom:20,fontFamily:"inherit"}}>
              ← Back
            </button>
            <div style={{...T.h2, marginBottom:4}}>Submit an Order</div>
            <div style={{...T.caption, marginBottom:20}}>Select your outlet to continue</div>
            <Sel label="Your Outlet" value={outlet} options={OUTLETS} onChange={e=>setOutlet(e.target.value)}/>
            <Btn onClick={submit} full>Continue</Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTLET ORDER SUBMIT SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function OutletScreen({outlet, onLogout, notify}) {
  const [stock, setStock]   = useState(DEFAULT_STOCK);

  useEffect(()=>{
    db.getStock().then(s=>{
      if(s&&s.length>0) setStock(s.map(r=>({
        id:r.id,name:r.name,cat:r.cat,unit:r.unit,
        qty:parseFloat(r.qty)||0,minQty:parseFloat(r.min_qty)||0,
        lastUpdate:r.last_update,photo:r.photo
      })));
    }).catch(()=>{});
  },[]);
  const [note, setNote]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const availableCats = CATS.filter(c => stock.some(s => s.cat === c));
  const defaultCat    = availableCats[0] || CATS[0];
  const defaultItem   = stock.find(s => s.cat === defaultCat);

  const [items, setItems] = useState([{id:1, cat:defaultCat, name:defaultItem?.name||"", qty:"", unit:defaultItem?.unit||""}]);

  const itemsForCat = cat => stock.filter(s => s.cat === cat);

  const addItem = () => {
    const first = stock.find(s => s.cat === defaultCat);
    setItems(p => [...p, {id:Date.now(), cat:defaultCat, name:first?.name||"", qty:"", unit:first?.unit||""}]);
  };

  const removeItem = id => setItems(p => p.filter(i => i.id !== id));

  const updateCat = (id, cat) => {
    const first = stock.find(s => s.cat === cat);
    setItems(p => p.map(i => i.id === id ? {...i, cat, name:first?.name||"", unit:first?.unit||""} : i));
  };

  const updateName = (id, name) => {
    const si = stock.find(s => s.name === name);
    setItems(p => p.map(i => i.id === id ? {...i, name, unit:si?.unit||i.unit} : i));
  };

  const submit = async () => {
    const valid = items.filter(i => i.name.trim() && i.qty);
    if (!valid.length) return notify("Please select at least one item and enter a quantity.", "err");
    const orderItems = valid.map(i => ({...i, id:crypto.randomUUID(), delivered:false, deliveredQty:0, photo:null}));
    try {
      await db.insertOrder({
        title:`${outlet} — ${new Date().toLocaleDateString("en-GB")}`,
        outlet, note, source:"outlet", status:"Pending",
        items: JSON.stringify(orderItems)
      });
      setSubmitted(true);
    } catch(e) { notify("Failed to submit. Please try again.","err"); }
  };

  if (submitted) return (
    <div style={{minHeight:"100vh",background:C.surface,display:"flex",alignItems:"center",
      justifyContent:"center",padding:24,fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",maxWidth:340}}>
        <div style={{fontSize:56,marginBottom:16}}>✅</div>
        <div style={{...T.h1,fontSize:22,marginBottom:8}}>Order Submitted!</div>
        <div style={{...T.body,color:C.sub,marginBottom:8}}>Your order from <strong>{outlet}</strong> has been sent to Central Kitchen.</div>
        <div style={{...T.caption,marginBottom:32}}>They will process it shortly.</div>
        <Btn onClick={()=>{
          const fi = stock.find(s => s.cat === defaultCat);
          setItems([{id:1, cat:defaultCat, name:fi?.name||"", qty:"", unit:fi?.unit||""}]);
          setNote(""); setSubmitted(false);
        }}>Submit Another Order</Btn>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.surface,fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"16px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{...T.h3}}>Weekly Order Request</div>
          <div style={{...T.caption,marginTop:2}}>🏪 {outlet}</div>
        </div>
        <button onClick={onLogout} style={{background:"none",border:"none",color:C.accent,
          cursor:"pointer",fontSize:14,fontWeight:500,fontFamily:"inherit"}}>Sign Out</button>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px"}}>
        <Card style={{padding:24,marginBottom:16}}>
          <div style={{...T.h3,marginBottom:4}}>Items to Order</div>
          <div style={{...T.caption,marginBottom:16}}>Select a category, then choose the item.</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {items.map((item, idx) => {
              const catItems = itemsForCat(item.cat);
              return (
                <div key={item.id} style={{background:C.surface,borderRadius:12,padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{...T.label}}>Item {idx+1}</div>
                    {items.length > 1 && (
                      <button onClick={()=>removeItem(item.id)} style={{background:"none",border:"none",
                        color:C.danger,cursor:"pointer",fontSize:20,padding:0,lineHeight:1}}>×</button>
                    )}
                  </div>

                  {/* Category pills */}
                  <div style={{...T.label,marginBottom:8}}>Category</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                    {availableCats.map(c => (
                      <button key={c} onClick={()=>updateCat(item.id, c)} style={{
                        padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",
                        fontSize:13,fontWeight:500,fontFamily:"inherit",transition:"all .15s",
                        background: item.cat===c ? C.accent : C.bg,
                        color: item.cat===c ? "#fff" : C.sub,
                      }}>{c}</button>
                    ))}
                  </div>

                  {/* Item dropdown */}
                  <div style={{...T.label,marginBottom:6}}>Item</div>
                  <select value={item.name} onChange={e=>updateName(item.id, e.target.value)}
                    style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,
                      borderRadius:10,padding:"10px 14px",color:item.name?C.text:C.sub,
                      fontSize:14,outline:"none",fontFamily:"inherit",marginBottom:10}}>
                    <option value="" disabled>Select an item...</option>
                    {catItems.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>

                  {/* Qty + unit */}
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
                    <div>
                      <div style={{...T.label,marginBottom:6}}>Quantity</div>
                      <input type="number" min="1" value={item.qty}
                        onChange={e=>setItems(p=>p.map(i=>i.id===item.id?{...i,qty:e.target.value}:i))}
                        placeholder="e.g. 10"
                        style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,
                          borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,
                          outline:"none",fontFamily:"inherit"}}/>
                    </div>
                    <div>
                      <div style={{...T.label,marginBottom:6}}>Unit</div>
                      <input value={item.unit} readOnly
                        style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,
                          borderRadius:10,padding:"10px 14px",color:C.sub,fontSize:14,
                          outline:"none",fontFamily:"inherit"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={addItem} style={{width:"100%",marginTop:12,padding:"11px",background:"none",
            border:`1.5px dashed ${C.border}`,borderRadius:10,color:C.accent,fontWeight:600,
            cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>+ Add Another Item</button>
        </Card>

        <Card style={{padding:24,marginBottom:24}}>
          <Inp label="Notes (Optional)" value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Any special instructions or notes..."/>
        </Card>

        <Btn onClick={submit} full color={C.accent}>Submit Order</Btn>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP (Admin / Viewer)
// ═══════════════════════════════════════════════════════════════════════════════
function MainApp({role, onLogout}) {
  const [tab, setTab]       = useState("stock");
  const [stock, setStock]   = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);

  const isAdmin = role === "admin";

  const notify = (msg,type="ok") => {setToast({msg,type});setTimeout(()=>setToast(null),3500)};

  // Load data from Supabase on mount + poll every 30s
  const loadData = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([db.getStock(), db.getOrders()]);
      if (s) setStock(s.map(r=>({
        id:r.id, name:r.name, cat:r.cat, unit:r.unit,
        qty:parseFloat(r.qty)||0, minQty:parseFloat(r.min_qty)||0,
        lastUpdate:r.last_update, photo:r.photo
      })));
      if (o) setOrders(o.map(r=>({
        id:r.id, title:r.title, outlet:r.outlet, note:r.note,
        source:r.source, status:r.status,
        createdAt:r.created_at?.split("T")[0],
        completedAt:r.completed_at,
        deliveryPhoto:r.delivery_photo,
        receiptPhoto:r.receipt_photo,
        items: typeof r.items === "string" ? JSON.parse(r.items) : (r.items||[])
      })));
    } catch(e) {
      notify("Connection error. Retrying...","warn");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{
    loadData();
    // Seed default stock if empty
    const seedStock = async () => {
      try {
        const s = await db.getStock();
        if (s && s.length === 0) {
          for (const item of DEFAULT_STOCK) {
            await db.insertStock({
              name:item.name, cat:item.cat, unit:item.unit,
              qty:item.qty, min_qty:item.minQty, last_update:item.lastUpdate, photo:null
            });
          }
          loadData();
        }
      } catch(e) {}
    };
    seedStock();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const pendingMap = getPendingMap(orders);

  const tabs = [
    {k:"stock",  l:"Stock"},
    {k:"orders", l:"Orders"},
  ];

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.surface,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:16}}>🥩</div>
        <div style={{fontSize:16,color:C.sub,fontWeight:500}}>Loading Central Kitchen...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.surface,fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        body{margin:0}
        ::-webkit-scrollbar{width:4px;background:transparent}
        ::-webkit-scrollbar-thumb{background:#c7c7cc;border-radius:9px}
        button,input,select{font-family:inherit}
        input:focus,select:focus{outline:none;border-color:${C.accent}!important;box-shadow:0 0 0 3px rgba(0,113,227,.15)!important}
        button:hover:not(:disabled){filter:brightness(.96)}
      `}</style>

      {toast && <Toast {...toast}/>}

      {/* NAV */}
      <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🥩</span>
            <span style={{fontWeight:700,fontSize:16,letterSpacing:-.3}}>Central Kitchen</span>
            <span style={{...T.caption,marginLeft:4,background:isAdmin?"#0071e322":"#34c75922",
              color:isAdmin?C.accent:C.success,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:600}}>
              {isAdmin?"Admin":"View Only"}
            </span>
          </div>
          <div style={{display:"flex",gap:2}}>
            {tabs.map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} style={{
                padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:500,
                background:tab===t.k?C.surface:"transparent",color:tab===t.k?C.text:C.sub
              }}>{t.l}</button>
            ))}
          </div>
          <button onClick={onLogout} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:500}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
        {tab==="stock"  && <StockTab  stock={stock} setStock={setStock} orders={orders} pendingMap={pendingMap} notify={notify} isAdmin={isAdmin} reload={loadData}/>}
        {tab==="orders" && <OrdersTab orders={orders} setOrders={setOrders} notify={notify} isAdmin={isAdmin} reload={loadData}/>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StockTab({stock, setStock, orders, pendingMap, notify, isAdmin, reload}) {
  const [cat,    setCat]   = useState("All");
  const [search, setSearch]= useState("");
  const [modal,  setModal] = useState(null);
  const [sel,    setSel]   = useState(null);
  const [form,   setForm]  = useState({});
  const [adjQty, setAdjQty]= useState("");
  const [adjType,setAdjType]=useState("in");
  const [adjNote,setAdjNote]=useState("");
  const [adjPhoto,setAdjPhoto]=useState(null);
  const fileRef = useRef();

  const allCats = ["All", ...CATS];
  const filtered = stock.filter(i=>
    (cat==="All"||i.cat===cat) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const empty = stock.filter(i=>i.qty===0);
  const low   = stock.filter(i=>i.qty>0&&i.qty<=i.minQty);

  // Net = current stock minus pending orders for that item
  const getNet = item => {
    const pending = pendingMap[item.name.toLowerCase().trim()] || 0;
    return Math.max(0, item.qty - pending);
  };
  const getPending = item => pendingMap[item.name.toLowerCase().trim()] || 0;

  const openAdjust = item => { setSel(item);setAdjQty("");setAdjType("in");setAdjNote("");setAdjPhoto(null);setModal("adjust"); };
  const openEdit   = item => { setSel(item);setForm({...item});setModal("edit"); };
  const openAdd    = ()   => { setForm({name:"",cat:"Wagyu",unit:"pack",qty:0,minQty:0});setModal("add"); };
  const handlePhoto= e   => { const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAdjPhoto(ev.target.result);r.readAsDataURL(f); };

  const saveAdjust = async () => {
    const n = parseFloat(adjQty);
    if (!n||n<=0) return notify("Please enter a valid quantity.","err");
    const newQty = adjType==="in" ? sel.qty+n : Math.max(0,sel.qty-n);
    try {
      await db.updateStock(sel.id, {qty:newQty, last_update:today(), photo:adjPhoto||sel.photo||null});
      await reload();
      notify(adjType==="in"?`+${n} ${sel.unit} added to stock.`:`-${n} ${sel.unit} removed from stock.`);
      setModal(null);
    } catch(e) { notify("Failed to update. Try again.","err"); }
  };

  const saveItem = async () => {
    if (!form.name?.trim()) return notify("Item name is required.","err");
    try {
      if (modal==="add") {
        await db.insertStock({name:form.name,cat:form.cat,unit:form.unit,qty:+form.qty||0,min_qty:+form.minQty||0,last_update:today(),photo:null});
        notify("Item added.");
      } else {
        await db.updateStock(sel.id, {name:form.name,cat:form.cat,unit:form.unit,qty:+form.qty||0,min_qty:+form.minQty||0,last_update:today()});
        notify("Item updated.");
      }
      await reload();
      setModal(null);
    } catch(e) { notify("Failed to save. Try again.","err"); }
  };

  const deleteItem = async id => {
    if (!confirm("Delete this item?")) return;
    try {
      await db.deleteStock(id);
      await reload();
      notify("Item deleted.","warn");
    } catch(e) { notify("Failed to delete.","err"); }
  };

  return (
    <div style={{animation:"fadeUp .25s ease"}}>

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
        {[
          {l:"Total Items",  v:stock.length,  c:C.text},
          {l:"Out of Stock", v:empty.length,  c:C.danger},
          {l:"Low Stock",    v:low.length,    c:C.warning},
          {l:"Pending Orders",v:orders.filter(o=>o.status!=="Completed").length, c:C.purple},
        ].map(s=>(
          <Card key={s.l} style={{padding:"16px 18px"}}>
            <div style={{...T.caption,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.c}}>{s.v}</div>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {(empty.length>0||low.length>0)&&(
        <div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#856404"}}>
          ⚠️ <strong>Attention:</strong>
          {empty.length>0&&<span> Out of stock: {empty.map(i=>i.name).join(", ")}.</span>}
          {low.length>0&&<span> Low stock: {low.map(i=>i.name).join(", ")}.</span>}
        </div>
      )}

      {/* Controls */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items..."
          style={{flex:1,minWidth:180,background:C.bg,border:`1px solid ${C.border}`,
            borderRadius:10,padding:"9px 14px",color:C.text,fontSize:14,outline:"none"}}/>
        {isAdmin && <Btn onClick={openAdd}>+ Add Item</Btn>}
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        {allCats.map(c=><Pill key={c} label={c} active={cat===c} onClick={()=>setCat(c)}/>)}
      </div>

      {/* Column headers */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:0,
        padding:"8px 16px",marginBottom:4}}>
        {["Item","Category","In Stock","Pending","Net Available"].map((h,i)=>(
          <div key={h} style={{...T.label,textAlign:i>1?"center":"left"}}>{h}</div>
        ))}
      </div>

      {/* Stock rows */}
      <Card>
        {filtered.map((item,idx)=>{
          const isEmpty  = item.qty===0;
          const isLow    = !isEmpty && item.qty<=item.minQty;
          const pending  = getPending(item);
          const net      = getNet(item);
          const isShort  = net < item.minQty;
          return (
            <div key={item.id}>
              {idx>0 && <Divider/>}
              <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:0}}>
                <div style={{flex:2,display:"flex",alignItems:"center",gap:10}}>
                  {item.photo&&(
                    <img src={item.photo} alt="" style={{width:36,height:36,borderRadius:8,objectFit:"cover",cursor:"pointer",flexShrink:0}}
                      onClick={()=>{setSel(item);setModal("photo")}}/>
                  )}
                  <div>
                    <div style={{...T.h3,fontSize:14}}>{item.name}</div>
                    <div style={{...T.caption,marginTop:1}}>Updated {fmtDate(item.lastUpdate)}</div>
                  </div>
                </div>
                <div style={{flex:1,textAlign:"center"}}>
                  <span style={{fontSize:12,background:C.surface,color:C.sub,borderRadius:6,padding:"2px 8px"}}>{item.cat}</span>
                </div>
                <div style={{flex:1,textAlign:"center"}}>
                  <span style={{fontSize:18,fontWeight:700,color:isEmpty?C.danger:isLow?C.warning:C.text}}>{item.qty}</span>
                  <span style={{...T.caption,marginLeft:4}}>{item.unit}</span>
                  {isEmpty&&<div style={{fontSize:11,color:C.danger,fontWeight:600}}>Out of stock</div>}
                  {isLow&&!isEmpty&&<div style={{fontSize:11,color:C.warning,fontWeight:600}}>Low stock</div>}
                </div>
                <div style={{flex:1,textAlign:"center"}}>
                  {pending>0
                    ? <span style={{fontSize:16,fontWeight:600,color:C.purple}}>−{pending}</span>
                    : <span style={{...T.caption}}>—</span>}
                </div>
                <div style={{flex:1,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <span style={{fontSize:18,fontWeight:700,color:isShort?C.danger:C.success}}>{net}</span>
                  <span style={{...T.caption}}>{item.unit}</span>
                  {isShort&&pending>0&&<span style={{fontSize:10,background:"#ff3b3018",color:C.danger,borderRadius:6,padding:"2px 6px",fontWeight:700}}>SHORT</span>}
                </div>
                {isAdmin&&(
                  <div style={{display:"flex",gap:6,marginLeft:12}}>
                    <button onClick={()=>openAdjust(item)} style={{padding:"6px 12px",background:C.surface,
                      color:C.accent,border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Adjust</button>
                    <button onClick={()=>openEdit(item)} style={{padding:"6px 10px",background:C.surface,
                      color:C.sub,border:"none",borderRadius:8,cursor:"pointer",fontSize:13}}>✏️</button>
                    <button onClick={()=>deleteItem(item.id)} style={{padding:"6px 10px",background:"none",
                      color:C.danger,border:"none",borderRadius:8,cursor:"pointer",fontSize:13}}>🗑</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:48,color:C.sub}}>No items found.</div>}
      </Card>

      {/* ADJUST MODAL */}
      {modal==="adjust"&&(
        <Modal onClose={()=>setModal(null)}>
          <div style={{...T.h2,marginBottom:4}}>Adjust Stock</div>
          <div style={{...T.caption,marginBottom:20}}>{sel?.name} · Current stock: <strong style={{color:C.text}}>{sel?.qty} {sel?.unit}</strong></div>
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {[["in","Stock In"],["out","Stock Out"]].map(([t,l])=>(
              <button key={t} onClick={()=>setAdjType(t)} style={{flex:1,padding:"11px",borderRadius:10,
                border:`1.5px solid ${adjType===t?(t==="in"?C.success:C.danger):C.border}`,cursor:"pointer",
                fontWeight:600,fontSize:14,fontFamily:"inherit",
                background:adjType===t?(t==="in"?"#34c75912":"#ff3b3012"):"transparent",
                color:adjType===t?(t==="in"?C.success:C.danger):C.sub}}>
                {t==="in"?"↑ Stock In":"↓ Stock Out"}</button>
            ))}
          </div>
          <Inp label="Quantity" type="number" min="0" step="0.01" value={adjQty} onChange={e=>setAdjQty(e.target.value)} placeholder="e.g. 30"/>
          <Inp label="Note (Optional)" value={adjNote} onChange={e=>setAdjNote(e.target.value)} placeholder="e.g. Received from supplier"/>
          <div style={{marginBottom:20}}>
            <div style={{...T.label,marginBottom:8}}>Proof Photo (Optional)</div>
            {adjPhoto
              ?<div style={{position:"relative"}}>
                <img src={adjPhoto} alt="" style={{width:"100%",borderRadius:10,maxHeight:160,objectFit:"cover"}}/>
                <button onClick={()=>setAdjPhoto(null)} style={{position:"absolute",top:8,right:8,background:C.danger,
                  color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:600}}>Remove</button>
              </div>
              :<div onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${C.border}`,borderRadius:10,
                padding:"24px",textAlign:"center",color:C.sub,cursor:"pointer",fontSize:13,transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                📸 Click to upload photo
              </div>}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={()=>setModal(null)} variant="outline" style={{flex:1}}>Cancel</Btn>
            <Btn onClick={saveAdjust} style={{flex:2}}>Save</Btn>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT MODAL */}
      {(modal==="add"||modal==="edit")&&(
        <Modal onClose={()=>setModal(null)}>
          <div style={{...T.h2,marginBottom:20}}>{modal==="add"?"Add New Item":"Edit Item"}</div>
          <Inp label="Item Name" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Chuck Roll"/>
          <Sel label="Category" value={form.cat||"Wagyu"} options={CATS} onChange={e=>setForm(p=>({...p,cat:e.target.value}))}/>
          <Inp label="Unit" value={form.unit||""} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} placeholder="pack / kg / ctn / pcs"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label="Current Quantity" type="number" min="0" step="0.01" value={form.qty||0} onChange={e=>setForm(p=>({...p,qty:e.target.value}))}/>
            <Inp label="Min Stock Alert" type="number" min="0" value={form.minQty||0} onChange={e=>setForm(p=>({...p,minQty:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <Btn onClick={()=>setModal(null)} variant="outline" style={{flex:1}}>Cancel</Btn>
            <Btn onClick={saveItem} style={{flex:2}}>Save Item</Btn>
          </div>
        </Modal>
      )}

      {/* PHOTO MODAL */}
      {modal==="photo"&&sel?.photo&&(
        <Modal onClose={()=>setModal(null)} width={580}>
          <div style={{...T.h3,marginBottom:12}}>{sel.name}</div>
          <img src={sel.photo} alt="" style={{width:"100%",borderRadius:12,maxHeight:400,objectFit:"contain"}}/>
          <div style={{textAlign:"right",marginTop:16}}><Btn onClick={()=>setModal(null)} variant="outline">Close</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OrdersTab({orders, setOrders, notify, isAdmin, reload}) {
  const [filter,     setFilter]    = useState("All");
  const [timeFilter, setTimeFilter]= useState("All Time");
  const [modal,      setModal]     = useState(null);
  const [sel,        setSel]       = useState(null);
  const [deliveredQtys, setDeliveredQtys] = useState({});
  const [newOrder,   setNewOrder]  = useState({title:"",outlet:OUTLETS[0],note:"",items:[]});
  const [newItem,    setNewItem]   = useState({name:"",cat:"Wagyu",unit:"pack",qty:""});

  const statusColor = s => s==="Completed"?"#34c759":s==="Partial"?"#ff9500":"#5856d6";
  const statusBg    = s => s==="Completed"?"#34c75912":s==="Partial"?"#ff950012":"#5856d612";

  // Time filter logic
  const now = new Date();
  const isInPeriod = (dateStr, period) => {
    if (period === "All Time") return true;
    const d = new Date(dateStr);
    if (period === "Today") {
      return d.toDateString() === now.toDateString();
    }
    if (period === "This Week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      return d >= startOfWeek;
    }
    if (period === "This Month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filtered = orders.filter(o =>
    (filter === "All" || o.status === filter) &&
    (filter !== "Completed" || isInPeriod(o.createdAt, timeFilter))
  );

  const createOrder = async () => {
    if (!newOrder.title.trim()) return notify("Order title is required.", "err");
    if (!newOrder.items.length) return notify("Add at least one item.", "err");
    const items = newOrder.items.map(i=>({...i,id:crypto.randomUUID(),delivered:false,deliveredQty:0,photo:null}));
    try {
      await db.insertOrder({title:newOrder.title,outlet:newOrder.outlet,note:newOrder.note,
        source:"manual",status:"Pending",items:JSON.stringify(items)});
      await reload();
      notify("Order created.");
      setModal(null);
      setNewOrder({title:"",outlet:OUTLETS[0],note:"",items:[]});
    } catch(e) { notify("Failed to create order.","err"); }
  };

  const addItem = () => {
    if (!newItem.name.trim()||!newItem.qty) return notify("Enter item name and quantity.","err");
    setNewOrder(p=>({...p,items:[...p.items,{...newItem,id:Date.now()}]}));
    setNewItem({name:"",cat:"Wagyu",unit:"pack",qty:""});
  };

  const markAllDelivered = async (orderId) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order) return;
    const items = order.items.map(i => {
      const dQty = parseFloat(deliveredQtys[`${orderId}-${i.id}`] ?? i.qty) || 0;
      return {...i, delivered:true, deliveredQty:dQty};
    });
    const allFull = items.every(i => i.deliveredQty >= parseFloat(i.qty));
    const status  = allFull ? "Completed" : "Partial";
    try {
      await db.updateOrder(orderId, {items:JSON.stringify(items), status, completed_at:new Date().toISOString()});
      await reload();
      notify("Order marked as delivered.");
    } catch(e) { notify("Failed to update.","err"); }
  };

  const unmarkDelivered = async (orderId) => {
    const order = orders.find(o=>o.id===orderId);
    if (!order) return;
    const items = order.items.map(i=>({...i,delivered:false,deliveredQty:0}));
    try {
      await db.updateOrder(orderId, {items:JSON.stringify(items), status:"Pending", completed_at:null});
      await reload();
      notify("Order reset to Pending.","warn");
    } catch(e) { notify("Failed to update.","err"); }
  };

  const uploadOrderPhoto = (e, orderId, field) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      const dbField = field==="deliveryPhoto"?"delivery_photo":"receipt_photo";
      try {
        await db.updateOrder(orderId, {[dbField]:ev.target.result});
        await reload();
        notify(field==="deliveryPhoto"?"Delivery photo saved.":"Receipt saved.");
      } catch(e) { notify("Failed to save photo.","err"); }
    };
    r.readAsDataURL(f);
  };

  const setDQty = (orderId, itemId, val) => {
    setDeliveredQtys(p=>({...p,[`${orderId}-${itemId}`]:val}));
  };

  useEffect(()=>{
    if (sel) setSel(orders.find(o=>o.id===sel.id)||null);
  },[orders]);

  return (
    <div style={{animation:"fadeUp .25s ease"}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:24}}>
        {[{l:"Total",v:orders.length,c:C.text},{l:"Pending",v:orders.filter(o=>o.status==="Pending").length,c:C.purple},
          {l:"Partial",v:orders.filter(o=>o.status==="Partial").length,c:C.warning},
          {l:"Completed",v:orders.filter(o=>o.status==="Completed").length,c:C.success}].map(s=>(
          <Card key={s.l} style={{padding:"16px 18px"}}>
            <div style={{...T.caption,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20,alignItems:"center"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
          {["All","Pending","Partial","Completed"].map(s=>(
            <Pill key={s} label={s} active={filter===s}
              color={s==="Completed"?C.success:s==="Partial"?C.warning:C.purple}
              onClick={()=>setFilter(s)}/>
          ))}
        </div>
        {isAdmin&&<Btn onClick={()=>{setNewOrder({title:`Order ${new Date().toLocaleDateString("en-GB")}`,outlet:OUTLETS[0],note:"",items:[]});setModal("new")}}>+ New Order</Btn>}
      </div>

      {/* Time filter — only show when viewing Completed */}
      {filter==="Completed"&&(
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{...T.caption,marginRight:4}}>Show:</span>
          {["Today","This Week","This Month","All Time"].map(t=>(
            <button key={t} onClick={()=>setTimeFilter(t)} style={{
              padding:"5px 14px",borderRadius:99,border:`1px solid ${timeFilter===t?C.accent:C.border}`,
              background:timeFilter===t?`${C.accent}12`:"transparent",
              color:timeFilter===t?C.accent:C.sub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"
            }}>{t}</button>
          ))}
        </div>
      )}

      {/* Order list */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.length===0&&(
          <Card style={{padding:60,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>📋</div>
            <div style={{color:C.sub}}>No orders found.</div>
          </Card>
        )}
        {filtered.map(order=>{
          const done    = order.items.filter(i=>i.delivered).length;
          const pct     = order.items.length ? Math.round(done/order.items.length*100) : 0;
          const hasShort= order.items.some(i=>i.delivered && i.deliveredQty < i.qty);
          return(
            <Card key={order.id} style={{padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                    <div style={{...T.h3}}>{order.title}</div>
                    <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:99,
                      background:statusBg(order.status),color:statusColor(order.status),textTransform:"uppercase",letterSpacing:.6}}>
                      {order.status}</span>
                    {hasShort&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:99,
                      background:`${C.warning}18`,color:C.warning,fontWeight:600}}>⚠ Short Delivered</span>}
                    {order.source==="outlet"&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:99,background:`${C.purple}12`,color:C.purple,fontWeight:600}}>Outlet</span>}
                    {order.source==="gsheet"&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:99,background:`${C.success}12`,color:C.success,fontWeight:600}}>Google Form</span>}
                  </div>
                  {order.outlet&&<div style={{...T.caption,marginBottom:2}}>🏪 {order.outlet}</div>}
                  <div style={{...T.caption}}>{fmtDate(order.createdAt)} · {done}/{order.items.length} items delivered</div>
                  <div style={{marginTop:10,background:C.surface,borderRadius:99,height:4,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:pct===100?C.success:C.accent,borderRadius:99,transition:"width .4s"}}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setSel(order);setModal("view")}} style={{padding:"8px 14px",background:C.surface,
                    color:C.accent,border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer"}}>View</button>
                  {isAdmin&&<button onClick={async()=>{if(!confirm("Delete this order?"))return;try{await db.deleteOrder(order.id);await reload();notify("Order deleted.","warn")}catch(e){notify("Failed.","err")}}}
                    style={{padding:"8px 10px",background:"none",color:C.danger,border:"none",borderRadius:9,cursor:"pointer",fontSize:14}}>🗑</button>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* NEW ORDER MODAL */}
      {modal==="new"&&(
        <Modal onClose={()=>setModal(null)} width={540}>
          <div style={{...T.h2,marginBottom:20}}>New Order</div>
          <Inp label="Order Title" value={newOrder.title} onChange={e=>setNewOrder(p=>({...p,title:e.target.value}))} placeholder="e.g. Weekly Order 28/04"/>
          <Sel label="Outlet" value={newOrder.outlet} options={OUTLETS} onChange={e=>setNewOrder(p=>({...p,outlet:e.target.value}))}/>
          <Inp label="Notes (Optional)" value={newOrder.note} onChange={e=>setNewOrder(p=>({...p,note:e.target.value}))} placeholder="Any special instructions..."/>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:4}}>
            <div style={{...T.h3,marginBottom:12}}>Order Items</div>
            {newOrder.items.length>0&&(
              <div style={{marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
                {newOrder.items.map(item=>(
                  <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surface,borderRadius:10,padding:"10px 14px"}}>
                    <div><span style={{fontWeight:600,fontSize:14}}>{item.name}</span><span style={{color:C.sub,fontSize:12,marginLeft:8}}>{item.cat}</span></div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontWeight:600,color:C.accent,fontSize:13}}>{item.qty} {item.unit}</span>
                      <button onClick={()=>setNewOrder(p=>({...p,items:p.items.filter(i=>i.id!==item.id)}))} style={{background:"none",border:"none",color:C.danger,cursor:"pointer",fontSize:18,padding:0}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{background:C.surface,borderRadius:12,padding:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <Inp value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Item name"/>
                <Sel value={newItem.cat} options={CATS} onChange={e=>setNewItem(p=>({...p,cat:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <Inp type="number" min="0" value={newItem.qty} onChange={e=>setNewItem(p=>({...p,qty:e.target.value}))} placeholder="Quantity"/>
                <Inp value={newItem.unit} onChange={e=>setNewItem(p=>({...p,unit:e.target.value}))} placeholder="pack / kg / ctn"/>
              </div>
              <button onClick={addItem} style={{width:"100%",padding:"9px",background:C.bg,color:C.accent,
                border:`1px solid ${C.border}`,borderRadius:8,fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>+ Add Item</button>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <Btn onClick={()=>setModal(null)} variant="outline" style={{flex:1}}>Cancel</Btn>
            <Btn onClick={createOrder} style={{flex:2}}>Create Order</Btn>
          </div>
        </Modal>
      )}

      {/* VIEW ORDER MODAL */}
      {modal==="view"&&sel&&(()=>{
        const isDelivered = sel.status==="Completed"||sel.status==="Partial";
        const PhotoSlot = ({field, label, icon}) => {
          const photo = sel[field];
          return (
            <div style={{flex:1}}>
              <div style={{...T.label,marginBottom:8}}>{icon} {label}</div>
              {photo ? (
                <div style={{position:"relative"}}>
                  <img src={photo} alt={label}
                    style={{width:"100%",height:120,objectFit:"cover",borderRadius:10,cursor:"pointer",display:"block"}}
                    onClick={()=>window.open(photo,"_blank")}/>
                  {isAdmin&&(
                    <button onClick={async()=>{const dbf=field==="deliveryPhoto"?"delivery_photo":"receipt_photo";await db.updateOrder(sel.id,{[dbf]:null});await reload();}}
                      style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.55)",color:"#fff",
                        border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                      Remove
                    </button>
                  )}
                </div>
              ) : isAdmin ? (
                <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  height:100,border:`2px dashed ${C.border}`,borderRadius:10,cursor:"pointer",
                  color:C.sub,fontSize:13,gap:6,transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <span style={{fontSize:22}}>{icon}</span>
                  <span>Upload {label}</span>
                  <input type="file" accept="image/*,application/pdf" style={{display:"none"}}
                    onChange={e=>uploadOrderPhoto(e,sel.id,field)}/>
                </label>
              ) : (
                <div style={{height:80,border:`1px solid ${C.border}`,borderRadius:10,
                  display:"flex",alignItems:"center",justifyContent:"center",color:C.sub,fontSize:13}}>
                  Not uploaded
                </div>
              )}
            </div>
          );
        };

        return (
          <Modal onClose={()=>setModal(null)} width={600}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,flexWrap:"wrap",gap:8}}>
              <div style={{...T.h2}}>{sel.title}</div>
              <span style={{fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:99,
                background:statusBg(sel.status),color:statusColor(sel.status),textTransform:"uppercase",letterSpacing:.6}}>{sel.status}</span>
            </div>
            {sel.outlet&&<div style={{...T.caption,marginBottom:2}}>🏪 {sel.outlet}</div>}
            <div style={{...T.caption,marginBottom:sel.note?10:16}}>Created {fmtDate(sel.createdAt)}</div>
            {sel.note&&<div style={{fontSize:13,color:C.sub,marginBottom:16,background:C.surface,borderRadius:10,padding:"10px 14px"}}>{sel.note}</div>}

            {/* Column labels */}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,padding:"0 2px",marginBottom:8}}>
              <div style={{...T.label}}>Item</div>
              <div style={{...T.label,textAlign:"center"}}>Ordered</div>
              <div style={{...T.label,textAlign:"center"}}>Delivered</div>
            </div>

            {/* Items */}
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {sel.items.map(item=>{
                const dQtyKey  = `${sel.id}-${item.id}`;
                const dQtyVal  = deliveredQtys[dQtyKey] ?? (item.deliveredQty||"");
                const ordered  = parseFloat(item.qty)||0;
                const delivered= parseFloat(item.deliveredQty)||0;
                const isShort  = item.delivered && delivered < ordered;
                const isFull   = item.delivered && delivered >= ordered;
                return (
                  <div key={item.id} style={{
                    background: isFull?`${C.success}08`:isShort?`${C.warning}08`:C.surface,
                    border:`1px solid ${isFull?C.success+"30":isShort?C.warning+"40":C.border}`,
                    borderRadius:12,padding:"12px 14px"
                  }}>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:8,alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:C.text}}>{item.name}</div>
                        <div style={{...T.caption}}>{item.cat}</div>
                        {isShort&&<div style={{fontSize:11,color:C.warning,fontWeight:600,marginTop:2}}>⚠ Short by {ordered-delivered} {item.unit}</div>}
                        {isFull&&<div style={{fontSize:11,color:C.success,fontWeight:600,marginTop:2}}>✓ Fully delivered</div>}
                      </div>
                      <div style={{textAlign:"center"}}>
                        <span style={{fontWeight:700,fontSize:16}}>{item.qty}</span>
                        <span style={{...T.caption,marginLeft:3}}>{item.unit}</span>
                      </div>
                      <div style={{textAlign:"center"}}>
                        {isAdmin&&!isDelivered ? (
                          <input type="number" min="0" value={dQtyVal}
                            onChange={e=>setDQty(sel.id,item.id,e.target.value)}
                            placeholder={String(item.qty)}
                            style={{width:"100%",textAlign:"center",background:C.bg,border:`1px solid ${C.border}`,
                              borderRadius:8,padding:"7px 8px",fontSize:14,fontWeight:600,
                              color:C.text,outline:"none",fontFamily:"inherit"}}/>
                        ):(
                          <div>
                            <span style={{fontWeight:700,fontSize:16,color:isFull?C.success:isShort?C.warning:C.sub}}>
                              {item.delivered ? item.deliveredQty : "—"}
                            </span>
                            {item.delivered&&<span style={{...T.caption,marginLeft:3}}>{item.unit}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Photos & Receipt — 1 per order */}
            {(isDelivered||isAdmin)&&(
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:20}}>
                <div style={{...T.h3,marginBottom:14}}>Attachments</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <PhotoSlot field="deliveryPhoto" label="Delivery Photo" icon="📦"/>
                  <PhotoSlot field="receiptPhoto"  label="Lalamove Receipt" icon="🧾"/>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {isAdmin&&(
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,display:"flex",gap:10,flexWrap:"wrap"}}>
                {!isDelivered ? (
                  <Btn onClick={()=>markAllDelivered(sel.id)} style={{flex:2}}>✓ Mark All as Delivered</Btn>
                ) : (
                  <Btn onClick={()=>unmarkDelivered(sel.id)} variant="outline" color={C.warning} style={{flex:2}}>↩ Reset to Pending</Btn>
                )}
                <Btn onClick={()=>setModal(null)} variant="outline" style={{flex:1}}>Close</Btn>
              </div>
            )}
            {!isAdmin&&(
              <div style={{textAlign:"right"}}>
                <Btn onClick={()=>setModal(null)} variant="outline">Close</Btn>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// SETUP TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SetupTab({orders, setOrders, notify, isAdmin}) {
  const [sheetUrl,  setSheetUrl] = useState(()=>localStorage.getItem(SHEET_KEY)||"");
  const [loading,   setLoading]  = useState(false);
  const [lastSync,  setLastSync] = useState(null);
  const [newCount,  setNewCount] = useState(null);

  const saveUrl = () => { localStorage.setItem(SHEET_KEY,sheetUrl); notify("URL saved."); };

  const toCsvUrl = url => {
    try { const m=url.match(/\/d\/([a-zA-Z0-9-_]+)/); if(!m)return null;
      return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=0`; }
    catch { return null; }
  };

  const syncFromSheet = async () => {
    const csvUrl = toCsvUrl(sheetUrl);
    if (!csvUrl) return notify("Invalid URL. Please paste the correct Google Sheet URL.","err");
    setLoading(true);
    try {
      const res  = await fetch(csvUrl);
      if (!res.ok) throw new Error();
      const text = await res.text();
      const rows = text.trim().split("\n").map(r=>{
        const result=[];let cur="",inQ=false;
        for(let c of r){if(c==='"'){inQ=!inQ}else if(c===","&&!inQ){result.push(cur.trim());cur=""}else cur+=c}
        result.push(cur.trim());return result;
      });
      const dataRows = rows.slice(1).filter(r=>r.length>=5&&r[2]?.trim());
      const grouped  = {};
      dataRows.forEach(row=>{
        const [ts,outlet,item,cat,qty,unit,note]=[row[0],row[1],row[2],row[3],row[4],row[5]||"unit",row[6]||""];
        const key=`${outlet}__${ts}`;
        if(!grouped[key])grouped[key]={outlet,ts,note,items:[]};
        grouped[key].items.push({id:`${Date.now()}-${Math.random()}`,name:item,cat:cat||"Others",qty:+qty||0,unit,delivered:false,photo:null});
      });
      const incoming = Object.entries(grouped).map(([key,g])=>({
        id:key, title:`${g.outlet} — ${(g.ts||"").split(" ")[0]||g.ts}`,
        outlet:g.outlet, note:g.note, source:"gsheet", createdAt:g.ts||today(), status:"Pending", items:g.items
      }));
      setOrders(prev=>{
        const existing=new Set(prev.map(o=>String(o.id)));
        const fresh=incoming.filter(o=>!existing.has(String(o.id)));
        setNewCount(fresh.length);
        if(fresh.length>0){notify(`${fresh.length} new order(s) imported.`);return[...fresh,...prev]}
        else{notify("No new orders — all up to date.","warn");return prev}
      });
      setLastSync(new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));
    } catch { notify("Sync failed. Make sure the Sheet is published to the web.","err"); }
    setLoading(false);
  };

  const Step = ({num,title,children}) => (
    <div style={{display:"flex",gap:16,marginBottom:24}}>
      <div style={{width:28,height:28,minWidth:28,borderRadius:99,background:C.accent,
        display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:"#fff"}}>{num}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:15,marginBottom:6,color:C.text}}>{title}</div>
        <div style={{fontSize:13,color:C.sub,lineHeight:1.8}}>{children}</div>
      </div>
    </div>
  );

  const CodeSpan = ({children}) => (
    <span style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,
      padding:"1px 7px",fontFamily:"monospace",fontSize:12,color:C.accent}}>{children}</span>
  );

  return (
    <div style={{animation:"fadeUp .25s ease",maxWidth:660}}>
      <div style={{marginBottom:28}}>
        <div style={{...T.h1,fontSize:22,marginBottom:6}}>Google Form Integration</div>
        <div style={{...T.caption,fontSize:14,lineHeight:1.6}}>
          Outlet staff fill in a Google Form → responses flow into your Orders tab automatically.
        </div>
      </div>

      {/* Flow */}
      <Card style={{padding:20,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          {[["📱","Outlet Staff"],["→",null],["📋","Google Form"],["→",null],["📊","Google Sheet"],["→",null],["🔄","Sync"],["→",null],["✅","Orders Tab"]].map(([icon,label],i)=>(
            label===null
              ?<div key={i} style={{color:C.border,fontSize:18}}>→</div>
              :<div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:20}}>{icon}</div>
                <div style={{...T.caption,marginTop:2,whiteSpace:"nowrap"}}>{label}</div>
              </div>
          ))}
        </div>
      </Card>

      {/* Steps */}
      <Card style={{padding:24,marginBottom:16}}>
        <div style={{fontWeight:600,fontSize:16,marginBottom:20,color:C.accent}}>Setup Guide (one-time)</div>
        <Step num="1" title="Create a Google Form">
          Go to <strong style={{color:C.text}}>forms.google.com</strong> → create a new form.<br/>
          Add these questions <strong style={{color:C.text}}>in this exact order</strong>:
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
            {[["Outlet","Dropdown — list your outlet names"],["Item","Short answer — item name"],
              ["Category","Dropdown — Wagyu / Beverages / SKU CK / Gas / Others"],
              ["Quantity","Short answer — numbers only"],["Unit","Short answer — pack / kg / ctn / pcs"],
              ["Notes","Paragraph — optional"]].map(([f,h])=>(
              <div key={f} style={{background:C.surface,borderRadius:8,padding:"8px 12px",display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                <CodeSpan>{f}</CodeSpan>
                <div style={{fontSize:12,color:C.sub,flex:1}}>{h}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,background:"#5856d608",border:`1px solid ${C.purple}30`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.purple}}>
            💡 If an order has multiple items, the outlet staff submits the form once per item. The system groups them automatically.
          </div>
        </Step>
        <Step num="2" title="Link Form to Google Sheet">
          In Google Form → click the <strong style={{color:C.text}}>Responses</strong> tab → click the <strong style={{color:C.text}}>Google Sheets icon</strong>.<br/>
          A spreadsheet will be created automatically to store all responses.
        </Step>
        <Step num="3" title="Publish the Sheet to the web (Required)">
          In Google Sheet: <strong style={{color:C.text}}>File → Share → Publish to web</strong><br/>
          → Select <CodeSpan>Sheet1</CodeSpan> → Select <CodeSpan>Comma-separated values (.csv)</CodeSpan> → Click <strong style={{color:C.text}}>Publish</strong>.<br/>
          <span style={{color:C.warning}}>⚠️ Don't copy the link from here</span> — use the normal Sheet URL from the address bar instead.
        </Step>
        <Step num="4" title="Copy the Google Sheet URL">
          From the Google Sheet tab, copy the URL from your browser's address bar and paste it below.
        </Step>
        <Step num="5" title="Paste URL & Sync">
          Paste the URL below → Save → click <strong style={{color:C.text}}>Sync Now</strong>.<br/>
          Repeat the sync whenever you want to pull in new orders.
        </Step>
      </Card>

      {/* Sync panel */}
      {isAdmin && (
        <Card style={{padding:24,marginBottom:16}}>
          <div style={{fontWeight:600,fontSize:16,marginBottom:16}}>Sync from Google Sheet</div>
          <Inp label="Google Sheet URL" value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            hint="Paste the URL of the Google Sheet linked to your form."/>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={saveUrl} variant="outline" style={{flex:1}}>Save URL</Btn>
            <Btn onClick={syncFromSheet} disabled={loading||!sheetUrl.trim()} style={{flex:2}}>
              {loading?"Syncing...":"🔄 Sync Now"}</Btn>
          </div>
          {lastSync&&(
            <div style={{...T.caption,marginTop:12}}>
              ✓ Last synced at {lastSync}{newCount!==null&&` · ${newCount>0?`${newCount} new order(s)`:"No new orders"}`}
            </div>
          )}
        </Card>
      )}

      {/* Share */}
      <Card style={{padding:24}}>
        <div style={{fontWeight:600,fontSize:16,marginBottom:10}}>Share the Form Link</div>
        <div style={{fontSize:13,color:C.sub,lineHeight:1.8}}>
          Once the form is ready, share the <strong style={{color:C.text}}>form link</strong> (not the Sheet link) with outlet staff via WhatsApp.<br/>
          <strong style={{color:C.text}}>Google Form → Send button → Link tab → Copy</strong><br/><br/>
          Staff can fill it in from any phone — no app required. ✅
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth] = useState(()=>{
    try { return JSON.parse(sessionStorage.getItem(ROLE_KEY)); } catch { return null; }
  });
  const [toast, setToast] = useState(null);
  const notify = (msg,type="ok") => {setToast({msg,type});setTimeout(()=>setToast(null),3000)};

  const login = (role, outlet=null) => {
    const session = {role, outlet};
    sessionStorage.setItem(ROLE_KEY, JSON.stringify(session));
    setAuth(session);
  };

  const logout = () => {
    sessionStorage.removeItem(ROLE_KEY);
    setAuth(null);
  };

  if (!auth) return <LoginScreen onLogin={login}/>;

  if (auth.role==="outlet") return (
    <>
      {toast&&<Toast {...toast}/>}
      <OutletScreen outlet={auth.outlet} onLogout={logout} notify={notify}/>
    </>
  );

  return <MainApp role={auth.role} onLogout={logout}/>;
}
