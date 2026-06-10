// ─────────────────────────────────────────────────────────────
//  CHRIS & LOUISA TECH STORE  –  app.js  v3
// ─────────────────────────────────────────────────────────────

const CONFIGURED = firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE";

let db, storage;
if (CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  db      = firebase.firestore();
  storage = firebase.storage();
}

const STORE = {
  name:        "Chris & Louisa Tech Store",
  phone:       "233547472867",
  email:       "nasiruchristiantalamah@gmail.com",
  location:    "Shiashi, Accra, Ghana",
  currency:    "GHS",
  deliveryFee: 30,
};

let products       = [];
let cart           = JSON.parse(localStorage.getItem('clts_cart') || '[]');
let activeCategory = 'all';
let editingId      = null;
let pendingImageUrl = null;

const DEMO = [
  {name:"MacBook Air M2 13\"",     category:"Laptops",     price:6800, origPrice:7500, icon:"💻", badge:"hot",  desc:"Apple M2 chip, 8GB RAM, 256GB SSD. Ultra-thin, all-day battery. Perfect for students and professionals.", stock:5,  sold:false, imageUrl:null},
  {name:"Dell XPS 15 Touch",        category:"Laptops",     price:9200, origPrice:null, icon:"💻", badge:"new",  desc:"Intel Core i7, 16GB RAM, 512GB SSD, OLED touchscreen display. Premium performance.", stock:3,  sold:false, imageUrl:null},
  {name:"HP Pavilion Gaming 15",    category:"Laptops",     price:5500, origPrice:6000, icon:"💻", badge:"sale", desc:"AMD Ryzen 5, GTX 1650, 8GB RAM, 512GB SSD. Best budget gaming laptop.", stock:8,  sold:false, imageUrl:null},
  {name:"Samsung Galaxy S24",       category:"Phones",      price:5200, origPrice:5800, icon:"📱", badge:"new",  desc:"6.2\" Dynamic AMOLED, 50MP camera, Snapdragon 8 Gen 3, 256GB storage.", stock:12, sold:false, imageUrl:null},
  {name:"iPhone 15 Pro",            category:"Phones",      price:8900, origPrice:null, icon:"📱", badge:"hot",  desc:"Titanium design, A17 Pro chip, ProRes 4K video, USB-C connector. 256GB.", stock:6,  sold:false, imageUrl:null},
  {name:"Samsung Galaxy A55",       category:"Phones",      price:2800, origPrice:3200, icon:"📱", badge:"sale", desc:"6.6\" Super AMOLED, 50MP camera, 8GB RAM, 256GB. Best value mid-range.", stock:20, sold:false, imageUrl:null},
  {name:"iPhone 14",                category:"Phones",      price:6200, origPrice:7000, icon:"📱", badge:"sale", desc:"6.1\" Super Retina XDR, A15 Bionic chip, 12MP dual camera system. 128GB.", stock:4,  sold:false, imageUrl:null},
  {name:"PS5 DualSense Controller", category:"Gaming",      price:950,  origPrice:null, icon:"🎮", badge:"",     desc:"Haptic feedback, adaptive triggers, built-in microphone. Works with PS5 and PC.", stock:15, sold:false, imageUrl:null},
  {name:"Razer DeathAdder V3",      category:"Gaming",      price:650,  origPrice:750,  icon:"🖱️", badge:"",     desc:"Professional optical sensor, 30,000 DPI, lightweight ergonomic design.", stock:10, sold:false, imageUrl:null},
  {name:"Xbox Wireless Controller", category:"Gaming",      price:780,  origPrice:null, icon:"🎮", badge:"new",  desc:"Bluetooth, 3.5mm audio, textured grip. Compatible with Xbox and PC.", stock:8,  sold:false, imageUrl:null},
  {name:"AirPods Pro 2nd Gen",      category:"Audio",       price:2200, origPrice:2500, icon:"🎧", badge:"hot",  desc:"Active Noise Cancellation, Adaptive Transparency, Spatial Audio. 30hr total battery.", stock:18, sold:false, imageUrl:null},
  {name:"Sony WH-1000XM5",         category:"Audio",       price:2800, origPrice:null, icon:"🎧", badge:"",     desc:"Industry-leading noise cancellation, 30hr battery, multipoint Bluetooth connection.", stock:7,  sold:false, imageUrl:null},
  {name:"JBL Flip 6",               category:"Audio",       price:680,  origPrice:780,  icon:"🔊", badge:"sale", desc:"IP67 waterproof, 12hr battery, bold JBL Original Pro Sound. Portable.", stock:14, sold:false, imageUrl:null},
  {name:"USB-C Hub 7-in-1",         category:"Accessories", price:320,  origPrice:null, icon:"🔌", badge:"",     desc:"4K HDMI, 3× USB-A 3.0, SD/microSD card, USB-C PD 100W passthrough.", stock:30, sold:false, imageUrl:null},
  {name:"27\" 4K IPS Monitor",      category:"Accessories", price:3200, origPrice:3800, icon:"🖥️", badge:"sale", desc:"3840×2160 IPS, 144Hz, HDR400, 1ms MPRT. Ideal for gaming and design.", stock:4,  sold:false, imageUrl:null},
  {name:"RGB Mechanical Keyboard",  category:"Accessories", price:850,  origPrice:null, icon:"⌨️", badge:"new",  desc:"Cherry MX Blue switches, per-key RGB, full-size layout, detachable USB-C cable.", stock:12, sold:false, imageUrl:null},
  {name:"Samsung 1TB SSD",          category:"Storage",     price:880,  origPrice:1000, icon:"💾", badge:"sale", desc:"870 EVO SATA, 560MB/s sequential read, V-NAND 3-bit MLC. 5-year warranty.", stock:15, sold:false, imageUrl:null},
  {name:"WD 2TB Passport HDD",      category:"Storage",     price:680,  origPrice:null, icon:"🗄️", badge:"",     desc:"USB 3.0, slim portable design, hardware encryption, compatible with PC and Mac.", stock:20, sold:false, imageUrl:null},
  {name:"TP-Link WiFi 6 Router",    category:"Networking",  price:1200, origPrice:null, icon:"📡", badge:"new",  desc:"AX3000, dual-band WiFi 6, 4 antennas, covers 250m². Gigabit WAN/LAN ports.", stock:9,  sold:false, imageUrl:null},
  {name:"Laptop Cooling Pad",       category:"Accessories", price:220,  origPrice:280,  icon:"💨", badge:"",     desc:"Dual fans, 5 height settings, USB-powered, fits up to 17\" laptops. LED lighting.", stock:35, sold:false, imageUrl:null},
];

// ── LOAD ──────────────────────────────────────────────────────
async function loadProducts() {
  if (!CONFIGURED) {
    products = DEMO.map((p,i) => ({id:'d'+i,...p,ts:Date.now()-i*1000}));
    renderProducts(); updateStats(); return;
  }
  try {
    const snap = await db.collection('products').orderBy('ts','desc').get();
    if (snap.empty) {
      for (const p of DEMO) {
        const ref = await db.collection('products').add({...p, ts:firebase.firestore.FieldValue.serverTimestamp()});
        products.unshift({id:ref.id,...p,ts:Date.now()});
      }
    } else {
      products = snap.docs.map(d=>({id:d.id,...d.data()}));
    }
    renderProducts(); updateStats(); renderAdminList();
  } catch(e) {
    products = DEMO.map((p,i) => ({id:'d'+i,...p}));
    renderProducts(); updateStats();
  }
}

// ── RENDER PRODUCTS ───────────────────────────────────────────
function renderProducts() {
  const q   = document.getElementById('searchInput').value.toLowerCase().trim();
  const srt = document.getElementById('sortSel').value;
  let list  = [...products];

  if (activeCategory !== 'all') list = list.filter(p => p.category===activeCategory);
  if (q) list = list.filter(p => (p.name+' '+(p.desc||'')+' '+p.category).toLowerCase().includes(q));

  if      (srt==='price-low')  list.sort((a,b)=>a.price-b.price);
  else if (srt==='price-high') list.sort((a,b)=>b.price-a.price);
  else if (srt==='name')       list.sort((a,b)=>a.name.localeCompare(b.name));
  else list.sort((a,b)=>(b.ts||0)-(a.ts||0));

  const grid = document.getElementById('productsGrid');
  document.getElementById('rinfo').textContent =
    list.length + ' product'+(list.length!==1?'s':'')+' found';

  if (!list.length) {
    grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text3)">
      <div style="font-size:36px;margin-bottom:.75rem;opacity:.4">🔍</div>
      <div style="font-size:15px;color:var(--text2);font-weight:500">No products found</div>
      <div style="font-size:13px;margin-top:.4rem">Try a different search or category.</div>
    </div>`; return;
  }

  grid.innerHTML = list.map(p => {
    const saving = p.origPrice ? Math.round((p.origPrice-p.price)/p.origPrice*100) : 0;
    return `<div class="pcard${p.sold?' sold-out':''}">
      ${p.sold ? '<div class="sold-banner">SOLD OUT</div>' : ''}
      ${p.badge&&!p.sold ? `<span class="badge badge-${p.badge}">${p.badge.toUpperCase()}</span>` : ''}
      <div class="pcard-img">
        ${p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${esc(p.name)}"/>`
          : `<span class="emoji-icon">${p.icon||'📦'}</span>`}
      </div>
      <div class="pcard-body">
        <div class="pcard-cat">
          ${p.category}
          ${p.stock>0&&p.stock<=3&&!p.sold ? `<span class="low-stock">Only ${p.stock} left</span>` : ''}
        </div>
        <div class="pcard-name">${esc(p.name)}</div>
        <div class="pcard-desc">${esc(p.desc||'')}</div>
        <div class="pcard-price">
          <span class="price-main">GHS ${fmt(p.price)}</span>
          ${p.origPrice ? `<span class="price-orig">GHS ${fmt(p.origPrice)}</span>
            <span class="price-save">Save ${saving}%</span>` : ''}
        </div>
        ${p.sold
          ? `<div style="font-size:12px;color:var(--text3);font-weight:500;padding:8px 0">Currently unavailable</div>`
          : `<div class="pcard-actions">
               <button class="add-btn" onclick="addToCart('${p.id}')"
                 ${p.stock===0?'disabled':''}>
                 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                 ${p.stock===0 ? 'Out of Stock' : 'Add to Cart'}
               </button>
               <button class="wa-btn" onclick="waProduct('${p.id}')" title="Order via WhatsApp">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
               </button>
             </div>`}
      </div>
    </div>`;
  }).join('');
}

function setCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts();
  document.getElementById('products').scrollIntoView({behavior:'smooth'});
}

// ── CART ──────────────────────────────────────────────────────
function addToCart(id) {
  const p = products.find(x=>x.id===id);
  if (!p||p.sold||p.stock===0) return;
  const ex = cart.find(x=>x.id===id);
  if (ex) {
    if (ex.qty>=p.stock){toast('Maximum available quantity reached','err');return;}
    ex.qty++;
  } else {
    cart.push({id:p.id,name:p.name,price:p.price,icon:p.icon||'📦',imageUrl:p.imageUrl||null,qty:1,maxStock:p.stock});
  }
  saveCart(); updateCartUI(); toast('Added to cart — '+p.name,'ok');
}

function removeFromCart(id) {
  cart=cart.filter(x=>x.id!==id); saveCart(); updateCartUI(); renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find(x=>x.id===id); if(!item) return;
  const nq = item.qty+delta;
  if (nq<1){removeFromCart(id);return;}
  if (item.maxStock&&nq>item.maxStock){toast('Maximum available: '+item.maxStock,'err');return;}
  item.qty=nq; saveCart(); updateCartUI(); renderCartItems();
}

function saveCart() { localStorage.setItem('clts_cart',JSON.stringify(cart)); }
function cartSum()  { return cart.reduce((s,i)=>s+i.price*i.qty,0); }

function updateCartUI() {
  const n = cart.reduce((s,i)=>s+i.qty,0);
  const b = document.getElementById('cartBadge');
  b.textContent=n; b.style.display=n>0?'flex':'none';
}

function renderCartItems() {
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  if (!cart.length) {
    body.innerHTML=`<div class="cart-empty-state">
      <div class="icon">🛒</div>
      <div style="font-size:14px;font-weight:500;color:var(--text2);margin-bottom:.3rem">Your cart is empty</div>
      <div style="font-size:13px">Add some products to get started</div>
    </div>`;
    foot.style.display='none'; return;
  }
  foot.style.display='block';
  body.innerHTML = cart.map(item=>`
    <div class="cart-item">
      <div class="ci-img">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${esc(item.name)}"/>` : item.icon}
      </div>
      <div class="ci-info">
        <div class="ci-name">${esc(item.name)}</div>
        <div class="ci-price">GHS ${fmt(item.price*item.qty)}</div>
        <div class="ci-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
          <span class="qty-n">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
          <button class="ci-rm" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>`).join('');
  const total = cartSum();
  document.getElementById('cartSubtotal').textContent = 'GHS '+fmt(total);
  document.getElementById('cartTotal').textContent    = 'GHS '+fmt(total);
}

function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartPanel').classList.add('open');
  renderCartItems();
}
function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartPanel').classList.remove('open');
}

// ── CHECKOUT ─────────────────────────────────────────────────
function openCheckout() {
  closeCart();
  if (!cart.length){toast('Your cart is empty','err');return;}
  document.getElementById('checkoutOv').classList.add('open');
  renderForm();
}
function closeCheckout() { document.getElementById('checkoutOv').classList.remove('open'); }

function renderForm() {
  const sub = cartSum();
  document.getElementById('checkoutBody').innerHTML = `
    <div class="form-row">
      <div class="fg"><label>Full Name *</label><input type="text" id="co-name" placeholder="Your full name"/></div>
      <div class="fg"><label>Phone Number *</label><input type="tel" id="co-phone" placeholder="+233 XXX XXX XXX"/></div>
    </div>
    <div class="fg" style="margin-bottom:.75rem"><label>Email Address *</label>
      <input type="email" id="co-email" placeholder="your@email.com"/></div>
    <div class="fg" style="margin-bottom:.75rem"><label>Delivery Address *</label>
      <input type="text" id="co-addr" placeholder="Street, area, city"/></div>
    <div class="fg" style="margin-bottom:.75rem"><label>Additional Notes</label>
      <textarea id="co-notes" placeholder="Any special instructions…"></textarea></div>
    <div style="font-size:12px;font-weight:600;color:var(--grey-600);margin-bottom:.5rem">Delivery Method</div>
    <div class="delivery-grid">
      <label class="del-opt sel" id="opt-pickup" onclick="pickDelivery('pickup')">
        <input type="radio" name="del" value="pickup" checked/>
        <span class="d-icon">🏪</span>
        <span class="d-label">Store Pickup</span>
        <span class="d-sub">Free · Shiashi, Accra</span>
      </label>
      <label class="del-opt" id="opt-delivery" onclick="pickDelivery('delivery')">
        <input type="radio" name="del" value="delivery"/>
        <span class="d-icon">🚚</span>
        <span class="d-label">Home Delivery</span>
        <span class="d-sub">GHS ${STORE.deliveryFee} · Accra</span>
      </label>
    </div>
    <div class="order-box">
      <h4>Order Summary</h4>
      ${cart.map(i=>`<div class="oitem"><span>${esc(i.name)} ×${i.qty}</span><span>GHS ${fmt(i.price*i.qty)}</span></div>`).join('')}
      <div class="oitem"><span>Subtotal</span><span>GHS ${fmt(sub)}</span></div>
      <div class="oitem" id="del-line"><span>Delivery</span><span>Free (Pickup)</span></div>
      <div class="ototal"><span>Total</span><span id="co-total">GHS ${fmt(sub)}</span></div>
    </div>
    <button class="place-btn" id="placeBtn" onclick="placeOrder()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      Place Order
    </button>
  `;
}

function pickDelivery(type) {
  document.querySelectorAll('.del-opt').forEach(o=>o.classList.remove('sel'));
  document.getElementById('opt-'+type).classList.add('sel');
  const fee = type==='delivery' ? STORE.deliveryFee : 0;
  document.getElementById('co-total').textContent = 'GHS '+fmt(cartSum()+fee);
  document.getElementById('del-line').innerHTML =
    `<span>Delivery</span><span>${fee ? 'GHS '+fee : 'Free (Pickup)'}</span>`;
}

async function placeOrder() {
  const name  = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const email = document.getElementById('co-email').value.trim();
  const addr  = document.getElementById('co-addr').value.trim();
  const notes = document.getElementById('co-notes').value.trim();
  const del   = document.querySelector('input[name="del"]:checked')?.value||'pickup';

  if (!name||!phone||!email||!addr){toast('Please fill in all required fields','err');return;}

  const btn = document.getElementById('placeBtn');
  btn.disabled=true; btn.textContent='Placing order…';

  const sub  = cartSum();
  const fee  = del==='delivery' ? STORE.deliveryFee : 0;
  const tot  = sub+fee;
  const oid  = 'CLTS-'+Date.now().toString().slice(-6);

  const order = {
    orderId:oid, name, phone, email, addr, notes,
    delivery:del, deliveryFee:fee, subtotal:sub, total:tot,
    items: cart.map(i=>({name:i.name,qty:i.qty,price:i.price})),
    status:'pending',
    ts: CONFIGURED ? firebase.firestore.FieldValue.serverTimestamp() : Date.now(),
  };

  // Deduct stock
  for (const item of cart) {
    const p = products.find(x=>x.id===item.id);
    if (p&&p.stock>0) {
      p.stock=Math.max(0,p.stock-item.qty);
      if(p.stock===0) p.sold=true;
      if(CONFIGURED&&!p.id.startsWith('d'))
        await db.collection('products').doc(p.id).update({stock:p.stock,sold:p.sold||false}).catch(()=>{});
    }
  }

  if (CONFIGURED) {
    try { await db.collection('orders').add(order); } catch(e){}
  }

  sendWA(order);

  document.getElementById('checkoutBody').innerHTML = `
    <div class="success-wrap">
      <div class="check-circle">✅</div>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you, <strong>${esc(name)}</strong>. Your order <strong>${oid}</strong> has been received.</p>
      <p style="font-size:1rem;font-weight:700;color:var(--navy);margin:.5rem 0">Total: GHS ${fmt(tot)}</p>
      <p>A WhatsApp message has been sent to our team. We will confirm your order and contact you on <strong>${esc(phone)}</strong> within 30 minutes.</p>
      <div class="success-btns">
        <button class="btn-primary" onclick="closeCheckout()">Continue Shopping</button>
        <a class="btn-secondary" style="background:var(--green);border-color:var(--green);color:#fff;padding:12px 20px;border-radius:var(--radius);font-size:14px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:7px"
          href="https://wa.me/${STORE.phone}" target="_blank">
          💬 Chat on WhatsApp
        </a>
      </div>
    </div>`;

  cart=[]; saveCart(); updateCartUI(); renderProducts();
}

function sendWA(order) {
  const items = order.items.map(i=>`  • ${i.name} ×${i.qty} — GHS ${fmt(i.price)}`).join('\n');
  const msg = encodeURIComponent(
    `🛒 *NEW ORDER — ${order.orderId}*\n\n`+
    `*Name:* ${order.name}\n`+
    `*Phone:* ${order.phone}\n`+
    `*Email:* ${order.email}\n`+
    `*Address:* ${order.addr}\n`+
    `*Delivery:* ${order.delivery==='delivery'?'Home Delivery':'Store Pickup'}\n\n`+
    `*Items:*\n${items}\n\n`+
    `*Subtotal:* GHS ${fmt(order.subtotal)}\n`+
    `*Delivery fee:* GHS ${order.deliveryFee}\n`+
    `*TOTAL: GHS ${fmt(order.total)}*\n\n`+
    `*Notes:* ${order.notes||'None'}`
  );
  window.open(`https://wa.me/${STORE.phone}?text=${msg}`, '_blank');
}

function waProduct(id) {
  const p = products.find(x=>x.id===id); if(!p) return;
  const msg = encodeURIComponent(
    `Hello Chris & Louisa Tech Store,\n\nI'd like to order:\n\n*${p.name}*\nPrice: GHS ${fmt(p.price)}\n\nKindly confirm availability and payment details. Thank you!`
  );
  window.open(`https://wa.me/${STORE.phone}?text=${msg}`, '_blank');
}

// ── ADMIN ─────────────────────────────────────────────────────
function openAdmin()  { document.getElementById('adminOv').classList.add('open'); renderAdminList(); }
function closeAdmin() { document.getElementById('adminOv').classList.remove('open'); resetForm(); }

function switchTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-pane').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
  if (tab==='manage') renderAdminList();
}

function renderAdminList() {
  document.getElementById('prodCount').textContent = products.length;
  const list = document.getElementById('adminList');
  if (!products.length) {
    list.innerHTML='<p style="font-size:12px;color:var(--text3)">No products yet. Add some in the Add Product tab.</p>'; return;
  }
  list.innerHTML = products.map(p=>`
    <div class="pai${p.sold?' is-sold':''}">
      <div class="pai-thumb">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${esc(p.name)}"/>` : p.icon||'📦'}
      </div>
      <div class="pai-info">
        <div class="pai-name">${esc(p.name)}</div>
        <div class="pai-meta">
          <span class="price">GHS ${fmt(p.price)}</span>
          <span>· ${p.category}</span>
          <span class="${p.sold?'stock-zero':p.stock<=3?'stock-low':'stock-ok'}">
            · ${p.sold?'SOLD OUT':p.stock+' in stock'}
          </span>
        </div>
      </div>
      <div class="pai-btns">
        <button class="pai-btn" onclick="startEdit('${p.id}')" title="Edit">✏️</button>
        <button class="pai-btn" onclick="toggleSold('${p.id}')" title="${p.sold?'Mark available':'Mark sold out'}">
          ${p.sold?'✅':'🚫'}
        </button>
        <button class="pai-btn del" onclick="delProduct('${p.id}')" title="Delete">🗑</button>
      </div>
    </div>`).join('');
}

function startEdit(id) {
  const p = products.find(x=>x.id===id); if(!p) return;
  editingId=id; pendingImageUrl=p.imageUrl||null;
  document.getElementById('ap-name').value  = p.name;
  document.getElementById('ap-price').value = p.price;
  document.getElementById('ap-orig').value  = p.origPrice||'';
  document.getElementById('ap-cat').value   = p.category;
  document.getElementById('ap-desc').value  = p.desc||'';
  document.getElementById('ap-icon').value  = p.icon||'';
  document.getElementById('ap-badge').value = p.badge||'';
  document.getElementById('ap-stock').value = p.stock||0;
  if (p.imageUrl) {
    const box = document.getElementById('imgPreview');
    document.getElementById('imgPreviewImg').src = p.imageUrl;
    box.style.display = 'block';
  }
  document.getElementById('saveProdBtn').textContent = '💾 Save Changes';
  document.getElementById('cancelEditBtn').style.display = 'block';
  switchTab('add', document.querySelector('.admin-tab'));
  document.getElementById('ap-name').focus();
  toast('Editing: '+p.name);
}

function resetForm() {
  editingId=null; pendingImageUrl=null;
  ['ap-name','ap-price','ap-orig','ap-desc','ap-icon','ap-stock']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const badge=document.getElementById('ap-badge'); if(badge) badge.value='';
  const cat=document.getElementById('ap-cat'); if(cat) cat.value='Laptops';
  const img=document.getElementById('ap-image'); if(img) img.value='';
  const box=document.getElementById('imgPreview'); if(box) box.style.display='none';
  const btn=document.getElementById('saveProdBtn'); if(btn) btn.textContent='+ Add to Store';
  const can=document.getElementById('cancelEditBtn'); if(can) can.style.display='none';
}

// Image upload
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('ap-image');
  if (!inp) return;
  inp.addEventListener('change', async function() {
    const file = this.files[0]; if(!file) return;
    if (file.size > 5*1024*1024){ toast('Image must be under 5MB','err'); return; }

    const reader = new FileReader();
    reader.onload = e => {
      const box = document.getElementById('imgPreview');
      document.getElementById('imgPreviewImg').src = e.target.result;
      box.style.display = 'block';
    };
    reader.readAsDataURL(file);

    if (CONFIGURED && storage) {
      toast('Uploading photo…');
      try {
        const path = 'products/'+Date.now()+'_'+file.name;
        await storage.ref(path).put(file);
        pendingImageUrl = await storage.ref(path).getDownloadURL();
        toast('Photo uploaded ✓','ok');
      } catch(e) {
        const r2=new FileReader();
        r2.onload=ev=>{pendingImageUrl=ev.target.result;};
        r2.readAsDataURL(file);
      }
    } else {
      const r2=new FileReader();
      r2.onload=ev=>{pendingImageUrl=ev.target.result;};
      r2.readAsDataURL(file);
    }
  });
});

async function saveProduct() {
  const name  = document.getElementById('ap-name').value.trim();
  const price = parseFloat(document.getElementById('ap-price').value);
  const orig  = parseFloat(document.getElementById('ap-orig').value)||null;
  const cat   = document.getElementById('ap-cat').value;
  const desc  = document.getElementById('ap-desc').value.trim();
  const icon  = document.getElementById('ap-icon').value.trim()||'📦';
  const badge = document.getElementById('ap-badge').value;
  const stock = parseInt(document.getElementById('ap-stock').value)||0;

  if (!name||!price){toast('Name and price are required','err');return;}

  const btn = document.getElementById('saveProdBtn');
  btn.disabled=true; btn.textContent='Saving…';

  const data = { name, price, origPrice:orig, category:cat, desc, icon, badge, stock,
                 imageUrl:pendingImageUrl||null, sold:stock===0 };

  try {
    if (editingId) {
      if (CONFIGURED&&!editingId.startsWith('d'))
        await db.collection('products').doc(editingId).update(data);
      const idx=products.findIndex(p=>p.id===editingId);
      if(idx!==-1) products[idx]={...products[idx],...data};
      toast('✓ '+name+' updated','ok');
    } else {
      const nd={...data, ts:CONFIGURED?firebase.firestore.FieldValue.serverTimestamp():Date.now()};
      if (CONFIGURED) {
        const ref=await db.collection('products').add(nd);
        products.unshift({id:ref.id,...data,ts:Date.now()});
      } else {
        products.unshift({id:'l'+Date.now(),...data,ts:Date.now()});
      }
      toast('✓ '+name+' added to store','ok');
    }
  } catch(e) {
    toast('Save failed: '+e.message,'err');
    btn.disabled=false; btn.textContent=editingId?'💾 Save Changes':'+ Add to Store'; return;
  }

  resetForm();
  btn.disabled=false; btn.textContent='+ Add to Store';
  renderAdminList(); renderProducts(); updateStats();
}

async function toggleSold(id) {
  const p=products.find(x=>x.id===id); if(!p) return;
  p.sold=!p.sold;
  if(!p.sold&&p.stock===0) p.stock=1;
  if(CONFIGURED&&!id.startsWith('d'))
    await db.collection('products').doc(id).update({sold:p.sold,stock:p.stock}).catch(()=>{});
  renderAdminList(); renderProducts();
  toast(p.sold ? p.name+' marked as SOLD OUT' : p.name+' is now AVAILABLE');
}

async function delProduct(id) {
  const p=products.find(x=>x.id===id); if(!p) return;
  if(!confirm(`Delete "${p.name}"?\n\nThis cannot be undone.`)) return;
  if(CONFIGURED&&p.imageUrl&&p.imageUrl.includes('firebase'))
    storage.refFromURL(p.imageUrl).delete().catch(()=>{});
  if(CONFIGURED&&!id.startsWith('d'))
    await db.collection('products').doc(id).delete().catch(()=>{});
  products=products.filter(x=>x.id!==id);
  cart=cart.filter(x=>x.id!==id); saveCart(); updateCartUI();
  renderAdminList(); renderProducts(); updateStats();
  toast(p.name+' deleted');
}

function updateStats() {
  const avail = products.filter(p=>!p.sold).length;
  document.getElementById('heroStatProds').textContent = avail+'+';
}

function fmt(n) {
  return Number(n).toLocaleString('en-GH',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function esc(s) {
  return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function toast(msg, type='') {
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(type?' '+type:'');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3500);
}

updateCartUI();
loadProducts();
