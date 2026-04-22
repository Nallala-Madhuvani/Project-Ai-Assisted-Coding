/* #Create city database mapping Telangana cities to parking locations and define ALL_LOCS array with MAX_SLOTS constant for capacity control :contentReference[oaicite:0]{index=0} */
/* #Setup local storage by initializing bookings array from localStorage, define currentAdminLoc and create saveBookings() for persistence */
/* #Create Utility functions including genBookingId() for unique IDs, showMsg() for message display with auto-hide and statusBadge() for colored status labels */
/* #Implement Navigation using hideAll() to hide sections, goHome() to reset app and showPage() to switch between pages */
/* #Create Admin Controls with switchAdmin() for tab switching and togglePassword() for show/hide password functionality */
/* #Handle Location Dropdown using loadLocs() to populate locations based on city and checkSlots() to display available parking slots */
/* #Implement Booking Logic using book() with validation, duplicate check, booking object creation, save to localStorage and show ticket */
/* #Manage Ticket Modal with showTicket() to display details, closeTicket() to hide, printTicket() for printing and closeTicketOpenPay() for quick action */
/* #Handle Payment Flow using openPayModal(), closePayModal() and payAction() to validate booking, calculate amount, update status and save data */
/* #Handle Cancel Flow using openCancelModal(), closeCancelModal() and cancelAction() to find booking, update status and save changes */
/* #Implement Admin Login using handleLogin() with main admin credentials and location admin access control with role-based navigation */
/* #Render Main Dashboard using renderMainDash() to calculate stats, generate slot grid dynamically and call table rendering */
/* #Render MainTable using renderMainTable() to filter bookings, display data in table and apply status badges */
/* #Render LocationDashboard using renderLocDash() to filter data by location, show stats and generate slot usage chip */
/* #Render LocationTable using renderLocTable() to display location-specific bookings with search filtering and status display */

const cityDB = {
    "Hyderabad":  ["Hitech City","Gachibowli","Banjara Hills","Secunderabad","Kukatpally"],
    "Warangal":   ["Asian Mall","Kazipet Junction","Hanamkonda","Warangal Fort","Subedari"],
    "Karimnagar": ["Bus Stand Circle","Tower Circle","Collectorate Area","Godavari Khani","Vavilalapally"],
    "Nizamabad":  ["Railway Station","Shivaji Chowk","Barkatpura","Armoor Road","Vinayak Nagar"]
};
const ALL_LOCS = Object.values(cityDB).flat();
const MAX_SLOTS = 50;
 
let bookings = JSON.parse(localStorage.getItem("parkData")) || [];
let currentAdminLoc = null;
 
function saveBookings() { localStorage.setItem("parkData", JSON.stringify(bookings)); }
 
function genBookingId() {
    let id;
    do { id = "PS-" + Math.floor(1000 + Math.random() * 9000); }
    while (bookings.find(b => b.bookingId === id));
    return id;
}
 
function showMsg(id, type, text) {
    const el = document.getElementById(id);
    el.className = 'msg-box ' + type + ' show';
    el.textContent = text;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.className = 'msg-box'; el.textContent = ''; }, 6000);
}
 
function statusBadge(s) {
    if (s === "ACTIVE")    return `<span class="badge badge-active">Active</span>`;
    if (s === "PAID")      return `<span class="badge badge-paid">Paid</span>`;
    if (s === "CANCELLED") return `<span class="badge badge-cancelled">Cancelled</span>`;
    return s;
}
 
function hideAll() {
    ['landing','customer','adminLogin','mainDash','locDash'].forEach(id =>
        document.getElementById(id).classList.add('hidden'));
}
 
function goHome() {
    currentAdminLoc = null;
    document.getElementById('city').value = "";
    document.getElementById('loc').innerHTML = '<option value="">Select Location</option>';
    document.getElementById('veh').value = "";
    document.getElementById('type').value = "Car";
    document.getElementById('custMsg').className = 'msg-box';
    document.getElementById('adminUser').value = "";
    document.getElementById('adminPass').value = "";
    document.getElementById('adminPass').type = "password";
    document.getElementById('eyeBtn').textContent = "👁️";
    document.getElementById('adminMsg').className = 'msg-box';
    document.getElementById('mainSearch').value = "";
    document.getElementById('locSearch').value = "";
    switchAdmin('MAIN');
    const sel = document.getElementById('adminLocSelect');
    sel.innerHTML = '<option value="">-- Choose Location --</option>';
    ALL_LOCS.sort().forEach(l => sel.innerHTML += `<option value="${l}">${l}</option>`);
    hideAll();
    document.getElementById('landing').classList.remove('hidden');
    return false;
}
 
function showPage(pageId) {
    hideAll();
    document.getElementById(pageId).classList.remove('hidden');
    if (pageId === 'adminLogin') {
        document.getElementById('adminUser').value = "";
        document.getElementById('adminPass').value = "";
        document.getElementById('adminPass').type = "password";
        document.getElementById('eyeBtn').textContent = "👁️";
        switchAdmin('MAIN');
        const sel = document.getElementById('adminLocSelect');
        sel.innerHTML = '<option value="">-- Choose Location --</option>';
        ALL_LOCS.sort().forEach(l => sel.innerHTML += `<option value="${l}">${l}</option>`);
    }
}
 
function switchAdmin(mode) {
    document.getElementById('tabMain').classList.toggle('active', mode === 'MAIN');
    document.getElementById('tabLoc').classList.toggle('active',  mode === 'LOC');
    document.getElementById('mainAdminFields').classList.toggle('hidden', mode === 'LOC');
    document.getElementById('locAdminFields').classList.toggle('hidden',  mode === 'MAIN');
}
 
function togglePassword() {
    const p = document.getElementById('adminPass'), e = document.getElementById('eyeBtn');
    if (p.type === "password") { p.type = "text"; e.textContent = "🙈"; }
    else { p.type = "password"; e.textContent = "👁️"; }
}
 
function loadLocs() {
    const city = document.getElementById('city').value;
    const sel  = document.getElementById('loc');
    sel.innerHTML = '<option value="">Select Location</option>';
    if (cityDB[city]) cityDB[city].forEach(l => sel.innerHTML += `<option value="${l}">${l}</option>`);
}
 
function checkSlots() {
    const l = document.getElementById('loc').value;
    if (!l) return showMsg('custMsg','error','⚠️ Please select a location first.');
    const count = bookings.filter(b => b.loc === l && b.status === "ACTIVE").length;
    showMsg('custMsg','info',`🅿️ Available Slots at ${l}: ${MAX_SLOTS - count} / ${MAX_SLOTS}`);
}
 
function book() {
    const v = document.getElementById('veh').value.trim();
    const l = document.getElementById('loc').value;
    const t = document.getElementById('type').value;
    if (!v || !l) return showMsg('custMsg','error','⚠️ Please fill in all details before confirming.');
    const already = bookings.find(x => x.veh === v && x.status === "ACTIVE");
    if (already) return showMsg('custMsg','error',`⚠️ ${v} already has active booking ${already.bookingId}.`);
    const now = new Date();
    const entry = {
        bookingId: genBookingId(), id: Date.now(), veh: v, loc: l, status: "ACTIVE", type: t,
        date: now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
        time: now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
        rate: t === "Car" ? 50 : 20, revenue: 0
    };
    bookings.push(entry);
    saveBookings();
    showTicket(entry);
}
 
function showTicket(b) {
    document.getElementById('t-id').textContent   = b.bookingId;
    document.getElementById('t-veh').textContent  = b.veh;
    document.getElementById('t-type').textContent = b.type;
    document.getElementById('t-loc').textContent  = b.loc;
    document.getElementById('t-date').textContent = b.date;
    document.getElementById('t-time').textContent = b.time;
    document.getElementById('t-rate').textContent = `₹${b.rate}/hr`;
    document.getElementById('ticketModal').classList.remove('hidden');
}
function closeTicket() { document.getElementById('ticketModal').classList.add('hidden'); }
function printTicket() { window.print(); }
function closeTicketOpenPay() { closeTicket(); openPayModal(); }
 
function openPayModal() {
    document.getElementById('payId').value  = "";
    document.getElementById('payHrs').value = "";
    document.getElementById('payBill').className = 'msg-box';
    document.getElementById('payModal').classList.remove('hidden');
}
function closePayModal() { document.getElementById('payModal').classList.add('hidden'); }
function payAction() {
    const id  = document.getElementById('payId').value.trim().toUpperCase();
    const hrs = parseFloat(document.getElementById('payHrs').value);
    if (!id) return showMsg('payBill','error','⚠️ Please enter your Booking ID.');
    if (!hrs || hrs <= 0) return showMsg('payBill','error','⚠️ Please enter valid hours.');
    const b = bookings.find(x => x.bookingId === id && x.status === "ACTIVE");
    if (!b) return showMsg('payBill','error',`❌ No active booking found for ID: ${id}`);
    const total = hrs * b.rate;
    b.status  = "PAID";
    b.revenue = total;
    b.hours   = hrs;
    saveBookings();
    showMsg('payBill','success',`✅ Payment done for ${b.veh}!\n${hrs} hr(s) × ₹${b.rate} = ₹${total}. Safe drive!`);
    setTimeout(() => closePayModal(), 4000);
}
 
function openCancelModal() {
    document.getElementById('cancelId').value = "";
    document.getElementById('cancelMsg').className = 'msg-box';
    document.getElementById('cancelModal').classList.remove('hidden');
}
function closeCancelModal() { document.getElementById('cancelModal').classList.add('hidden'); }
function cancelAction() {
    const id = document.getElementById('cancelId').value.trim().toUpperCase();
    if (!id) return showMsg('cancelMsg','error','⚠️ Please enter your Booking ID.');
    const b = bookings.find(x => x.bookingId === id && x.status === "ACTIVE");
    if (!b) return showMsg('cancelMsg','error',`❌ No active booking found for ID: ${id}`);
    b.status = "CANCELLED";
    saveBookings();
    showMsg('cancelMsg','success',`✅ Booking ${id} for ${b.veh} cancelled successfully.`);
    setTimeout(() => closeCancelModal(), 3500);
}
 
function handleLogin() {
    const isMain = document.getElementById('tabMain').classList.contains('active');
    const pass   = document.getElementById('adminPass').value;
    if (isMain) {
        const user = document.getElementById('adminUser').value;
        if (user === "madhu" && pass === "madhu@123") {
            hideAll();
            renderMainDash();
            document.getElementById('mainDash').classList.remove('hidden');
        } else {
            showMsg('adminMsg','error','❌ Invalid username or password.');
        }
    } else {
        const loc = document.getElementById('adminLocSelect').value;
        if (loc && pass === "123") {
            currentAdminLoc = loc;
            hideAll();
            renderLocDash();
            document.getElementById('locDash').classList.remove('hidden');
        } else {
            showMsg('adminMsg','error','❌ Please select a location and enter the correct password.');
        }
    }
}
 
function renderMainDash() {
    bookings = JSON.parse(localStorage.getItem("parkData")) || [];
    const total     = bookings.length;
    const active    = bookings.filter(b => b.status === "ACTIVE").length;
    const paid      = bookings.filter(b => b.status === "PAID").length;
    const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
    const revenue   = bookings.reduce((s,b) => s + (b.revenue || 0), 0);
    document.getElementById('d-total').textContent     = total;
    document.getElementById('d-active').textContent    = active;
    document.getElementById('d-paid').textContent      = paid;
    document.getElementById('d-cancelled').textContent = cancelled;
    document.getElementById('d-revenue').textContent   = `₹${revenue}`;
    const grid = document.getElementById('slotsGrid');
    grid.innerHTML = '';
    ALL_LOCS.sort().forEach(loc => {
        const booked = bookings.filter(b => b.loc === loc && b.status === "ACTIVE").length;
        const pct    = Math.round((booked / MAX_SLOTS) * 100);
        const isFull = booked >= MAX_SLOTS;
        grid.innerHTML += `
        <div class="slot-chip${isFull?' full':''}">
            <div>
                <div class="sc-name">${loc}</div>
                <div class="sc-count">${booked} / ${MAX_SLOTS} booked</div>
            </div>
            <div class="sc-bar-wrap">
                <div class="sc-bar-bg"><div class="sc-bar-fill" style="width:${pct}%"></div></div>
                <div style="font-size:0.62rem;color:#94a3b8;text-align:right;margin-top:2px;">${pct}%</div>
            </div>
        </div>`;
    });
    renderMainTable();
}
 
function renderMainTable() {
    const q    = (document.getElementById('mainSearch').value || "").trim().toLowerCase();
    const data = q ? bookings.filter(b => b.veh.toLowerCase().includes(q)) : bookings;
    const tbody = document.getElementById('mainTableBody');
    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data">No bookings found.</td></tr>`;
        return;
    }
    tbody.innerHTML = [...data].reverse().map(b => `
        <tr>
            <td><strong>${b.bookingId}</strong></td>
            <td>${b.veh}</td>
            <td>${b.type}</td>
            <td>${b.loc}</td>
            <td>${b.date || '—'}</td>
            <td>${b.time || '—'}</td>
            <td>₹${b.rate}/hr${b.revenue ? ` · ₹${b.revenue}` : ''}</td>
            <td>${statusBadge(b.status)}</td>
        </tr>`).join('');
}
 
function renderLocDash() {
    bookings = JSON.parse(localStorage.getItem("parkData")) || [];
    const loc  = currentAdminLoc;
    const data = bookings.filter(b => b.loc === loc);
    document.getElementById('locDashSubtitle').textContent = `📍 ${loc}`;
    document.getElementById('ld-total').textContent   = data.length;
    document.getElementById('ld-active').textContent  = data.filter(b => b.status === "ACTIVE").length;
    document.getElementById('ld-avail').textContent   = MAX_SLOTS - data.filter(b => b.status === "ACTIVE").length;
    document.getElementById('ld-revenue').textContent = `₹${data.reduce((s,b) => s + (b.revenue||0), 0)}`;
    const booked = data.filter(b => b.status === "ACTIVE").length;
    const pct    = Math.round((booked / MAX_SLOTS) * 100);
    document.getElementById('locSlotChip').innerHTML = `
        <div class="slot-chip${booked>=MAX_SLOTS?' full':''}">
            <div>
                <div class="sc-name">${loc}</div>
                <div class="sc-count">${booked} / ${MAX_SLOTS} booked</div>
            </div>
            <div class="sc-bar-wrap">
                <div class="sc-bar-bg"><div class="sc-bar-fill" style="width:${pct}%"></div></div>
                <div style="font-size:0.62rem;color:#94a3b8;text-align:right;margin-top:2px;">${pct}%</div>
            </div>
        </div>`;
    renderLocTable();
}
 
function renderLocTable() {
    const q    = (document.getElementById('locSearch').value || "").trim().toLowerCase();
    const data = bookings.filter(b => b.loc === currentAdminLoc && (!q || b.veh.toLowerCase().includes(q)));
    const tbody = document.getElementById('locTableBody');
    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">No bookings found for this location.</td></tr>`;
        return;
    }
    tbody.innerHTML = [...data].reverse().map(b => `
        <tr>
            <td><strong>${b.bookingId}</strong></td>
            <td>${b.veh}</td>
            <td>${b.type}</td>
            <td>${b.date || '—'}</td>
            <td>${b.time || '—'}</td>
            <td>₹${b.rate}/hr${b.revenue ? ` · ₹${b.revenue}` : ''}</td>
            <td>${statusBadge(b.status)}</td>
        </tr>`).join('');
}