import { useState, useEffect, useRef } from "react";

// ─── Shared storage helpers ───────────────────────────────────────────────────
const STOCK_KEY   = "ck-stock-v2";
const ORDERS_KEY  = "ck-orders-v2";

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => d ? new Date(d).toLocaleDateString("ms-MY",{day:"2-digit",month:"short",year:"numeric"}) : "-";

const CATS = ["Wagyu","Beverages","SKU CK","Gas","Lain-lain"];

const DEFAULT_STOCK = [
  {id:1,name:"Chuck Roll",cat:"Wagyu",unit:"pack",qty:142,minQty:20,lastUpdate:"2026-04-10",photo:null},
  {id:2,name:"Wagyu Shabu",cat:"Wagyu",unit:"pack",qty:98,minQty:20,lastUpdate:"2026-04-10",photo:null},
  {id:3,name:"Top Round",cat:"Wagyu",unit:"pack",qty:0,minQty:10,lastUpdate:"2026-04-10",photo:null},
  {id:4,name:"Mini Skewer",cat:"Wagyu",unit:"pcs",qty:140,minQty:30,lastUpdate:"2026-04-10",photo:null},
  {id:5,name:"Lemak Wagyu",cat:"Wagyu",unit:"kg",qty:27.57,minQty:5,lastUpdate:"2026-04-10",photo:null},
  {id:6,name:"Saikoro",cat:"Wagyu",unit:"pack",qty:21,minQty:10,lastUpdate:"2026-04-10",photo:null},
  {id:7,name:"Short Rib Yakiniku",cat:"Wagyu",unit:"pack",qty:59,minQty:10,lastUpdate:"2026-04-10",photo:null},
  {id:8,name:"Chocolate",cat:"Beverages",unit:"ctn",qty:8,minQty:3,lastUpdate:"2026-04-10",photo:null},
  {id:9,name:"Lemon Tea",cat:"Beverages",unit:"ctn",qty:18,minQty:3,lastUpdate:"2026-04-10",photo:null},
  {id:10,name:"Cappuccino",cat:"Beverages",unit:"ctn",qty:7,minQty:3,lastUpdate:"2026-04-10",photo:null},
  {id:11,name:"White Coffee",cat:"Beverages",unit:"ctn",qty:5,minQty:3,lastUpdate:"2026-04-10",photo:null},
  {id:12,name:"Teh Tarik",cat:"Beverages",unit:"ctn",qty:8,minQty:3,lastUpdate:"2026-04-10",photo:null},
  {id:13,name:"Mocha",cat:"Beverages",unit:"ctn",qty:6,minQty:3,lastUpdate:"2026-04-10",photo:null},
  {id:14,name:"Marinated Lamb",cat:"SKU CK",unit:"pack",qty:63,minQty:10,lastUpdate:"2026-04-10",photo:null},
  {id:15,name:"Yakitori",cat:"SKU CK",unit:"pack",qty:0,minQty:10,lastUpdate:"2026-04-10",photo:null},
  {id:16,name:"Karaage",cat:"SKU CK",unit:"pack",qty:0,minQty:10,lastUpdate:"2026-04-10",photo:null},
  {id:17,name:"Gas Butane",cat:"Gas",unit:"ctn",qty:10,minQty:5,lastUpdate:"2026-04-10",photo:null},
];

// ─── Pill ─────────────────────────────────────────────────────────────────────
const Pill = ({label,active,color,onClick}) => (
  <button onClick={onClick} style={{
    padding:"7px 16px",borderRadius:99,border:"1.5px solid",cursor:"pointer",
    fontSize:13,fontWeight:600,transition:"all .18s",
    borderColor: active ? color : "#2a2d3e",
    background: active ? color+"22" : "transparent",
    color: active ? color : "#636880",
  }}>{label}</button>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({msg,type}) => (
  <div style={{
    position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",zIndex:9999,
    background: type==="err"?"#ff4d4d": type==="warn"?"#ffaa00":"#00c896",
    color:"#fff",padding:"11px 24px",borderRadius:12,fontWeight:700,fontSize:14,
    boxShadow:"0 8px 32px #0008",animation:"toastIn .25s ease",whiteSpace:"nowrap"
  }}>{msg}</div>
);

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({onClose,children,width=480}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
    position:"fixed",inset:0,background:"#000b",zIndex:2000,
    display:"flex",alignItems:"center",justifyContent:"center",padding:16
  }}>
    <div style={{
      background:"#181b2a",borderRadius:18,border:"1px solid #2a2d3e",
      padding:28,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",
      boxShadow:"0 40px 100px #0009"
    }}>{children}</div>
  </div>
);

const Inp = ({label,value,onChange,type="text",min,step,placeholder}) => (
  <div style={{marginBottom:14}}>
    {label && <div style={{fontSize:11,color:"#636880",textTransform:"uppercase",letterSpacing:.9,marginBottom:5,fontWeight:600}}>{label}</div>}
    <input type={type} value={value} onChange={onChange} min={min} step={step} placeholder={placeholder}
      style={{width:"100%",boxSizing:"border-box",background:"#10121d",border:"1px solid #2a2d3e",
        borderRadius:9,padding:"10px 13px",color:"#e4e6f0",fontSize:14,outline:"none"}}/>
  </div>
);

const Sel = ({label,value,onChange,options}) => (
  <div style={{marginBottom:14}}>
    {label && <div style={{fontSize:11,color:"#636880",textTransform:"uppercase",letterSpacing:.9,marginBottom:5,fontWeight:600}}>{label}</div>}
    <select value={value} onChange={onChange} style={{width:"100%",background:"#10121d",border:"1px solid #2a2d3e",
      borderRadius:9,padding:"10px 13px",color:"#e4e6f0",fontSize:14,outline:"none"}}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({onClick,children,color="#00c896",outline,style={}}) => (
  <button onClick={onClick} style={{
    padding:"11px 20px",borderRadius:10,border: outline?"1.5px solid "+color:"none",
    background: outline?"transparent":color,
    color: outline?color:"#10121d",fontWeight:700,fontSize:14,cursor:"pointer",
    ...style
  }}>{children}</button>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("stok");
  const [stock, setStock] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STOCK_KEY)) || DEFAULT_STOCK; } catch { return DEFAULT_STOCK; }
  });
  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; }
  });
  const [toast, setToast] = useState(null);

  useEffect(()=>{ localStorage.setItem(STOCK_KEY, JSON.stringify(stock)); },[stock]);
  useEffect(()=>{ localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); },[orders]);

  const notify = (msg, type="ok") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),2800);
  };

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",minHeight:"100vh",background:"#10121d",color:"#e4e6f0"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar{width:5px;background:#181b2a}
        ::-webkit-scrollbar-thumb{background:#2a2d3e;border-radius:9px}
        button{transition:opacity .15s,filter .15s}
        button:hover{opacity:.88}
        input:focus,select:focus{border-color:#00c896!important;box-shadow:0 0 0 3px #00c89622}
      `}</style>

      {toast && <Toast {...toast}/>}

      {/* ── HEADER ── */}
      <div style={{background:"#181b2a",borderBottom:"1px solid #2a2d3e",padding:"18px 24px 0"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#00c896,#007a5e)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🥩</div>
            <div>
              <div style={{fontWeight:800,fontSize:20,letterSpacing:-.5}}>Central Kitchen</div>
              <div style={{fontSize:12,color:"#636880"}}>Samurai Yakiniku — Sistem Stok & Order</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4}}>
            {[["stok","📦 Stok Harian"],["order","📋 Weekly Order"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:"10px 22px",borderRadius:"10px 10px 0 0",border:"none",cursor:"pointer",
                background: tab===k?"#10121d":"transparent",
                color: tab===k?"#00c896":"#636880",fontWeight:700,fontSize:14,
                borderBottom: tab===k?"2px solid #00c896":"2px solid transparent"
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 16px"}}>
        {tab==="stok"
          ? <StokTab stock={stock} setStock={setStock} notify={notify}/>
          : <OrderTab orders={orders} setOrders={setOrders} stock={stock} notify={notify}/>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOK TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StokTab({stock,setStock,notify}) {
  const [cat, setCat] = useState("Semua");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "add"|"edit"|"adjust"|"photo"
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});
  const [adjQty, setAdjQty] = useState("");
  const [adjType, setAdjType] = useState("masuk");
  const [adjNote, setAdjNote] = useState("");
  const [adjPhoto, setAdjPhoto] = useState(null);
  const fileRef = useRef();

  const cats = ["Semua",...CATS];
  const filtered = stock.filter(i =>
    (cat==="Semua"||i.cat===cat) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const low = stock.filter(i=>i.qty<=i.minQty && i.minQty>0);

  const openAdjust = item => { setSel(item); setAdjQty(""); setAdjType("masuk"); setAdjNote(""); setAdjPhoto(null); setModal("adjust"); };
  const openEdit   = item => { setSel(item); setForm({...item}); setModal("edit"); };
  const openAdd    = ()   => { setForm({name:"",cat:"Wagyu",unit:"pack",qty:0,minQty:0}); setModal("add"); };
  const openPhoto  = item => { setSel(item); setModal("photo"); };

  const handlePhotoUpload = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setAdjPhoto(ev.target.result);
    reader.readAsDataURL(f);
  };

  const saveAdjust = () => {
    const n = parseFloat(adjQty);
    if (!n||n<=0) return notify("Masukkan kuantiti yang betul","err");
    setStock(prev=>prev.map(i=>{
      if (i.id!==sel.id) return i;
      const nq = adjType==="masuk" ? i.qty+n : Math.max(0,i.qty-n);
      return {...i, qty:nq, lastUpdate:today(), photo: adjPhoto||i.photo};
    }));
    notify(adjType==="masuk"?`+${n} direkod masuk ✓`:`-${n} direkod keluar ✓`);
    setModal(null);
  };

  const saveItem = () => {
    if (!form.name?.trim()) return notify("Nama item wajib diisi","err");
    const d = today();
    if (modal==="add") {
      setStock(prev=>[...prev,{...form,id:Date.now(),qty:+form.qty||0,minQty:+form.minQty||0,lastUpdate:d,photo:null}]);
      notify("Item berjaya ditambah ✓");
    } else {
      setStock(prev=>prev.map(i=>i.id===sel.id?{...form,id:sel.id,qty:+form.qty||0,minQty:+form.minQty||0,lastUpdate:d,photo:sel.photo}:i));
      notify("Item dikemaskini ✓");
    }
    setModal(null);
  };

  const delItem = id => {
    if (!confirm("Padam item ini?")) return;
    setStock(prev=>prev.filter(i=>i.id!==id));
    notify("Item dipadam","warn");
  };

  const totalItems = stock.length;
  const emptyItems = stock.filter(i=>i.qty===0).length;

  return (
    <div style={{animation:"fadeUp .3s ease"}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[
          {l:"Jumlah Item",v:totalItems,c:"#7b8cff"},
          {l:"Stok Habis 🚫",v:emptyItems,c:"#ff4d4d"},
          {l:"Stok Rendah ⚠️",v:low.length,c:"#ffaa00"},
        ].map(s=>(
          <div key={s.l} style={{background:"#181b2a",borderRadius:12,padding:"14px 16px",border:"1px solid #2a2d3e"}}>
            <div style={{fontSize:10,color:"#636880",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600}}>{s.l}</div>
            <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Low stock banner */}
      {low.length>0 && (
        <div style={{background:"#ffaa0012",border:"1px solid #ffaa0040",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#ffaa00"}}>
          ⚠️ <strong>Stok rendah:</strong> {low.map(i=>`${i.name} (${i.qty} ${i.unit})`).join(" · ")}
        </div>
      )}

      {/* Controls */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari item..."
          style={{flex:1,minWidth:180,background:"#181b2a",border:"1px solid #2a2d3e",borderRadius:9,
            padding:"9px 14px",color:"#e4e6f0",fontSize:14,outline:"none"}}/>
        <Btn onClick={openAdd} style={{whiteSpace:"nowrap"}}>＋ Tambah Item</Btn>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
        {cats.map(c=><Pill key={c} label={c} active={cat===c} color="#00c896" onClick={()=>setCat(c)}/>)}
      </div>

      {/* Cards grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {filtered.map(item=>{
          const isLow = item.qty>0 && item.qty<=item.minQty;
          const isEmpty = item.qty===0;
          const accent = isEmpty?"#ff4d4d":isLow?"#ffaa00":"#00c896";
          return (
            <div key={item.id} style={{background:"#181b2a",borderRadius:14,border:`1px solid`,
              borderColor: isEmpty?"#ff4d4d44":isLow?"#ffaa0044":"#2a2d3e",overflow:"hidden"}}>
              {/* Photo strip */}
              {item.photo && (
                <div style={{height:120,overflow:"hidden",cursor:"pointer"}} onClick={()=>openPhoto(item)}>
                  <img src={item.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
              )}
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{item.name}</div>
                    <div style={{fontSize:11,color:"#636880",textTransform:"uppercase",letterSpacing:.8}}>{item.cat}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:26,fontWeight:800,color:accent,lineHeight:1}}>{item.qty}</div>
                    <div style={{fontSize:11,color:"#636880"}}>{item.unit}</div>
                  </div>
                </div>
                {isEmpty && <div style={{marginTop:8,fontSize:12,background:"#ff4d4d18",color:"#ff4d4d",
                  borderRadius:6,padding:"4px 10px",display:"inline-block",fontWeight:700}}>🚫 HABIS</div>}
                {isLow && !isEmpty && <div style={{marginTop:8,fontSize:12,background:"#ffaa0018",color:"#ffaa00",
                  borderRadius:6,padding:"4px 10px",display:"inline-block",fontWeight:700}}>⚠️ Rendah</div>}
                <div style={{fontSize:11,color:"#636880",marginTop:8}}>Dikemaskini: {fmtDate(item.lastUpdate)}</div>
                <div style={{display:"flex",gap:6,marginTop:12}}>
                  <button onClick={()=>openAdjust(item)} style={{flex:1,padding:"8px",background:"#00c89618",
                    color:"#00c896",border:"1px solid #00c89640",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    ± Adjust
                  </button>
                  <button onClick={()=>openEdit(item)} style={{padding:"8px 10px",background:"#7b8cff18",
                    color:"#7b8cff",border:"1px solid #7b8cff40",borderRadius:8,fontSize:13,cursor:"pointer"}}>✏️</button>
                  <button onClick={()=>delItem(item.id)} style={{padding:"8px 10px",background:"#ff4d4d15",
                    color:"#ff4d4d",border:"1px solid #ff4d4d30",borderRadius:8,fontSize:13,cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length===0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:50,color:"#636880"}}>Tiada item</div>
        )}
      </div>

      {/* ── ADJUST MODAL ── */}
      {modal==="adjust" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>Adjust Stok</div>
          <div style={{color:"#636880",fontSize:13,marginBottom:20}}>
            {sel?.name} — Semasa: <span style={{color:"#00c896",fontWeight:700}}>{sel?.qty} {sel?.unit}</span>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {["masuk","keluar"].map(t=>(
              <button key={t} onClick={()=>setAdjType(t)} style={{
                flex:1,padding:"11px",borderRadius:9,border:"1.5px solid",cursor:"pointer",fontWeight:700,fontSize:14,
                borderColor: adjType===t?(t==="masuk"?"#00c896":"#ff4d4d"):"#2a2d3e",
                background: adjType===t?(t==="masuk"?"#00c89620":"#ff4d4d20"):"transparent",
                color: adjType===t?(t==="masuk"?"#00c896":"#ff4d4d"):"#636880",
              }}>{t==="masuk"?"📥 Stok Masuk":"📤 Stok Keluar"}</button>
            ))}
          </div>

          <Inp label="Kuantiti" type="number" min="0" step="0.01" value={adjQty}
            onChange={e=>setAdjQty(e.target.value)} placeholder="cth: 30"/>
          <Inp label="Nota (optional)" value={adjNote} onChange={e=>setAdjNote(e.target.value)}
            placeholder="cth: Dari supplier SYP"/>

          {/* Photo upload */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,color:"#636880",textTransform:"uppercase",letterSpacing:.9,marginBottom:8,fontWeight:600}}>
              📸 Gambar Bukti (optional)
            </div>
            {adjPhoto ? (
              <div style={{position:"relative"}}>
                <img src={adjPhoto} alt="" style={{width:"100%",borderRadius:10,maxHeight:180,objectFit:"cover"}}/>
                <button onClick={()=>setAdjPhoto(null)} style={{position:"absolute",top:8,right:8,background:"#ff4d4d",
                  color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontWeight:700}}>✕</button>
              </div>
            ) : (
              <div onClick={()=>fileRef.current.click()} style={{
                border:"2px dashed #2a2d3e",borderRadius:10,padding:"24px",textAlign:"center",
                color:"#636880",cursor:"pointer",fontSize:13,transition:"border-color .2s"
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#00c896"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#2a2d3e"}>
                📸 Klik untuk upload gambar
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn onClick={()=>setModal(null)} outline color="#636880" style={{flex:1}}>Batal</Btn>
            <Btn onClick={saveAdjust} style={{flex:2}}>Simpan</Btn>
          </div>
        </Modal>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {(modal==="add"||modal==="edit") && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:20,marginBottom:20}}>{modal==="add"?"Tambah Item Baru":"Edit Item"}</div>
          <Inp label="Nama Item" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
          <Sel label="Kategori" value={form.cat||"Wagyu"} options={CATS} onChange={e=>setForm(p=>({...p,cat:e.target.value}))}/>
          <Inp label="Unit (cth: pack, kg, ctn, pcs)" value={form.unit||""} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/>
          <Inp label="Kuantiti Semasa" type="number" min="0" step="0.01" value={form.qty||0} onChange={e=>setForm(p=>({...p,qty:e.target.value}))}/>
          <Inp label="Min Stok (alert bila bawah ni)" type="number" min="0" value={form.minQty||0} onChange={e=>setForm(p=>({...p,minQty:e.target.value}))}/>
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <Btn onClick={()=>setModal(null)} outline color="#636880" style={{flex:1}}>Batal</Btn>
            <Btn onClick={saveItem} style={{flex:2}}>Simpan</Btn>
          </div>
        </Modal>
      )}

      {/* ── PHOTO MODAL ── */}
      {modal==="photo" && sel?.photo && (
        <Modal onClose={()=>setModal(null)} width={600}>
          <div style={{fontWeight:700,marginBottom:12}}>{sel.name} — Gambar Bukti</div>
          <img src={sel.photo} alt="" style={{width:"100%",borderRadius:10,maxHeight:400,objectFit:"contain"}}/>
          <div style={{textAlign:"right",marginTop:12}}>
            <Btn onClick={()=>setModal(null)} outline color="#636880">Tutup</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDER TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OrderTab({orders,setOrders,stock,notify}) {
  const [modal, setModal] = useState(null); // "new"|"view"
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("Semua");
  const [newOrder, setNewOrder] = useState({title:"",note:"",items:[]});
  const [newItem, setNewItem] = useState({name:"",cat:"Wagyu",unit:"pack",qty:""});
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const fileRef = useRef();

  const statuses = ["Semua","Pending","Sebahagian","Selesai"];
  const filtered = orders.filter(o=>filter==="Semua"||o.status===filter);

  const statusColor = s => s==="Selesai"?"#00c896":s==="Sebahagian"?"#ffaa00":"#7b8cff";
  const statusBg    = s => s==="Selesai"?"#00c89618":s==="Sebahagian"?"#ffaa0018":"#7b8cff18";

  const createOrder = () => {
    if (!newOrder.title.trim()) return notify("Masukkan tajuk order","err");
    if (newOrder.items.length===0) return notify("Tambah sekurang-kurangnya 1 item","err");
    const order = {
      id:Date.now(), title:newOrder.title, note:newOrder.note,
      createdAt:today(), status:"Pending",
      items: newOrder.items.map(i=>({...i,delivered:false,deliveredQty:0,photo:null}))
    };
    setOrders(prev=>[order,...prev]);
    notify("Order berjaya dicipta ✓");
    setModal(null);
    setNewOrder({title:"",note:"",items:[]});
  };

  const addItemToOrder = () => {
    if (!newItem.name.trim()||!newItem.qty) return notify("Isi nama & kuantiti item","err");
    setNewOrder(p=>({...p,items:[...p.items,{...newItem,id:Date.now()}]}));
    setNewItem({name:"",cat:"Wagyu",unit:"pack",qty:""});
  };

  const removeItemFromOrder = id => setNewOrder(p=>({...p,items:p.items.filter(i=>i.id!==id)}));

  const toggleDelivered = (orderId, itemId, photo=null) => {
    setOrders(prev=>prev.map(o=>{
      if (o.id!==orderId) return o;
      const items = o.items.map(i=>i.id===itemId?{...i,delivered:!i.delivered,photo:photo||i.photo}:i);
      const done = items.filter(i=>i.delivered).length;
      const status = done===0?"Pending":done===items.length?"Selesai":"Sebahagian";
      return {...o,items,status};
    }));
  };

  const handleDeliveryPhoto = (e,orderId,itemId) => {
    const f = e.target.files[0]; if(!f)return;
    const reader = new FileReader();
    reader.onload = ev => {
      toggleDelivered(orderId,itemId,ev.target.result);
      notify("Gambar bukti berjaya disimpan 📸");
    };
    reader.readAsDataURL(f);
  };

  const deleteOrder = id => {
    if(!confirm("Padam order ini?")) return;
    setOrders(prev=>prev.filter(o=>o.id!==id));
    notify("Order dipadam","warn");
  };

  return (
    <div style={{animation:"fadeUp .3s ease"}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
        {[
          {l:"Jumlah Order",v:orders.length,c:"#7b8cff"},
          {l:"Pending",v:orders.filter(o=>o.status==="Pending").length,c:"#7b8cff"},
          {l:"Sebahagian",v:orders.filter(o=>o.status==="Sebahagian").length,c:"#ffaa00"},
          {l:"Selesai ✓",v:orders.filter(o=>o.status==="Selesai").length,c:"#00c896"},
        ].map(s=>(
          <div key={s.l} style={{background:"#181b2a",borderRadius:12,padding:"12px 14px",border:"1px solid #2a2d3e"}}>
            <div style={{fontSize:10,color:"#636880",textTransform:"uppercase",letterSpacing:.9,marginBottom:6,fontWeight:600}}>{s.l}</div>
            <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
          {statuses.map(s=><Pill key={s} label={s} active={filter===s} color={statusColor(s==="Semua"?"x":s)||"#00c896"} onClick={()=>setFilter(s)}/>)}
        </div>
        <Btn onClick={()=>{setNewOrder({title:`Order Minggu ${new Date().toLocaleDateString("ms-MY")}`,note:"",items:[]});setModal("new");}}>
          ＋ Order Baru
        </Btn>
      </div>

      {/* Order cards */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {filtered.length===0 && (
          <div style={{textAlign:"center",padding:60,color:"#636880",background:"#181b2a",borderRadius:14,border:"1px solid #2a2d3e"}}>
            <div style={{fontSize:36,marginBottom:12}}>📋</div>
            Tiada order lagi. Buat order pertama!
          </div>
        )}
        {filtered.map(order=>{
          const done = order.items.filter(i=>i.delivered).length;
          const pct  = order.items.length ? Math.round(done/order.items.length*100) : 0;
          return (
            <div key={order.id} style={{background:"#181b2a",borderRadius:14,border:"1px solid #2a2d3e",overflow:"hidden"}}>
              <div style={{padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
                    <div style={{fontWeight:800,fontSize:16}}>{order.title}</div>
                    <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,
                      background:statusBg(order.status),color:statusColor(order.status),textTransform:"uppercase",letterSpacing:.8}}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:"#636880"}}>
                    Dicipta: {fmtDate(order.createdAt)} · {done}/{order.items.length} item dihantar
                  </div>
                  {order.note && <div style={{fontSize:13,color:"#8890a8",marginTop:4}}>{order.note}</div>}
                  {/* Progress bar */}
                  <div style={{marginTop:10,background:"#10121d",borderRadius:99,height:6,overflow:"hidden"}}>
                    <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,#00c896,#007a5e)",
                      borderRadius:99,transition:"width .4s ease"}}/>
                  </div>
                  <div style={{fontSize:11,color:"#636880",marginTop:4}}>{pct}% selesai</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setSel(order);setModal("view");}} style={{
                    padding:"8px 14px",background:"#7b8cff18",color:"#7b8cff",
                    border:"1px solid #7b8cff40",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    Lihat
                  </button>
                  <button onClick={()=>deleteOrder(order.id)} style={{
                    padding:"8px 10px",background:"#ff4d4d15",color:"#ff4d4d",
                    border:"1px solid #ff4d4d30",borderRadius:9,fontSize:13,cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── NEW ORDER MODAL ── */}
      {modal==="new" && (
        <Modal onClose={()=>setModal(null)} width={540}>
          <div style={{fontWeight:800,fontSize:20,marginBottom:20}}>📋 Buat Order Baru</div>
          <Inp label="Tajuk Order" value={newOrder.title} onChange={e=>setNewOrder(p=>({...p,title:e.target.value}))}
            placeholder="cth: Order Minggu 28/04/2026"/>
          <Inp label="Nota (optional)" value={newOrder.note} onChange={e=>setNewOrder(p=>({...p,note:e.target.value}))}
            placeholder="cth: Untuk outlet SYP & SYSJ"/>

          <div style={{borderTop:"1px solid #2a2d3e",paddingTop:16,marginTop:4,marginBottom:12}}>
            <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Senarai Item</div>

            {newOrder.items.length>0 && (
              <div style={{marginBottom:14,display:"flex",flexDirection:"column",gap:8}}>
                {newOrder.items.map(item=>(
                  <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                    background:"#10121d",borderRadius:8,padding:"10px 14px"}}>
                    <div>
                      <span style={{fontWeight:600}}>{item.name}</span>
                      <span style={{color:"#636880",fontSize:12,marginLeft:8}}>{item.cat}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontWeight:700,color:"#00c896"}}>{item.qty} {item.unit}</span>
                      <button onClick={()=>removeItemFromOrder(item.id)} style={{
                        background:"none",border:"none",color:"#ff4d4d",cursor:"pointer",fontSize:16,padding:0}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add from stock */}
            <div style={{background:"#10121d",borderRadius:10,padding:14}}>
              <div style={{fontSize:11,color:"#636880",fontWeight:600,textTransform:"uppercase",letterSpacing:.9,marginBottom:10}}>Tambah Item</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <Inp value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Nama item"/>
                <Sel value={newItem.cat} options={CATS} onChange={e=>setNewItem(p=>({...p,cat:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <Inp value={newItem.qty} onChange={e=>setNewItem(p=>({...p,qty:e.target.value}))} type="number" min="0" placeholder="Kuantiti"/>
                <Inp value={newItem.unit} onChange={e=>setNewItem(p=>({...p,unit:e.target.value}))} placeholder="Unit (pack,kg,ctn)"/>
              </div>
              <button onClick={addItemToOrder} style={{width:"100%",padding:"9px",background:"#00c89620",
                color:"#00c896",border:"1px solid #00c89640",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14}}>
                ＋ Tambah ke Senarai
              </button>
            </div>
          </div>

          <div style={{display:"flex",gap:10,marginTop:6}}>
            <Btn onClick={()=>setModal(null)} outline color="#636880" style={{flex:1}}>Batal</Btn>
            <Btn onClick={createOrder} style={{flex:2}}>Cipta Order</Btn>
          </div>
        </Modal>
      )}

      {/* ── VIEW ORDER MODAL ── */}
      {modal==="view" && sel && (
        <Modal onClose={()=>{setModal(null);setOrders(prev=>prev);}} width={560}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{fontWeight:800,fontSize:20}}>{sel.title}</div>
            <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,
              background:statusBg(sel.status),color:statusColor(sel.status),textTransform:"uppercase",letterSpacing:.8}}>
              {sel.status}
            </span>
          </div>
          <div style={{fontSize:12,color:"#636880",marginBottom:sel.note?6:16}}>Dicipta: {fmtDate(sel.createdAt)}</div>
          {sel.note && <div style={{fontSize:13,color:"#8890a8",marginBottom:16,background:"#10121d",borderRadius:8,padding:"8px 12px"}}>{sel.note}</div>}

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sel.items.map(item=>(
              <div key={item.id} style={{
                background: item.delivered?"#00c89610":"#10121d",
                border:"1px solid",borderColor:item.delivered?"#00c89640":"#2a2d3e",
                borderRadius:12,padding:"12px 14px"
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,textDecoration:item.delivered?"line-through":"none",
                      color:item.delivered?"#636880":"#e4e6f0"}}>{item.name}</div>
                    <div style={{fontSize:12,color:"#636880"}}>{item.cat} · {item.qty} {item.unit}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {item.photo && (
                      <img src={item.photo} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover",cursor:"pointer"}}
                        onClick={()=>window.open(item.photo,"_blank")}/>
                    )}
                    <label style={{
                      padding:"7px 12px",borderRadius:8,border:"1px solid",cursor:"pointer",fontSize:12,fontWeight:700,
                      borderColor:item.delivered?"#ff4d4d40":"#00c89640",
                      background:item.delivered?"#ff4d4d15":"#00c89615",
                      color:item.delivered?"#ff4d4d":"#00c896",whiteSpace:"nowrap"
                    }}>
                      {item.delivered?"✓ Diterima":"Tandai Terima"}
                      <input type="file" accept="image/*" style={{display:"none"}}
                        onChange={e=>handleDeliveryPhoto(e,sel.id,item.id)}
                        onClick={e=>{if(item.delivered){e.preventDefault();toggleDelivered(sel.id,item.id);}}}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:20,textAlign:"right"}}>
            <Btn onClick={()=>setModal(null)} outline color="#636880">Tutup</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
