import * as F from "./firebase.js";

const $ = (id) => document.getElementById(id);
const loginEl=$("login"), appEl=$("app"), emailEl=$("email"), passwordEl=$("password"), loginBtnEl=$("loginBtn"), msgEl=$("msg");
const logoutEl=$("logout"), cancelEl=$("cancel"), sendEl=$("send"), monthEl=$("month"), yearEl=$("year"), searchEl=$("search");
const modalEl=$("modal"), reqDateEl=$("reqDate"), reqTypeEl=$("reqType"), reasonEl=$("reason"), whoEl=$("who"), adminPanelEl=$("adminPanel"), noticeEl=$("notice"), scheduleEl=$("schedule"), requestsEl=$("requests");

const months=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let role="",uid="",eid="",sub=null,reqSub=null,selected="",currentUserData=null,userCollection="users";

months.forEach((x,i)=>monthEl.insertAdjacentHTML("beforeend",`<option value="${i}">${x}</option>`));
monthEl.value=new Date().getMonth(); yearEl.value=new Date().getFullYear();

loginBtnEl.onclick=async()=>{
  msgEl.textContent=""; loginBtnEl.disabled=true; loginBtnEl.textContent="Memproses...";
  try{await F.signInWithEmailAndPassword(F.auth,emailEl.value.trim(),passwordEl.value)}
  catch(e){msgEl.textContent="Login gagal: "+friendlyError(e)}
  finally{loginBtnEl.disabled=false;loginBtnEl.textContent="Masuk"}
};
logoutEl.onclick=()=>F.signOut(F.auth);
cancelEl.onclick=()=>modalEl.classList.add("hidden");
monthEl.onchange=load; yearEl.onchange=load; searchEl.oninput=load;

function friendlyError(e){
  if(e?.code==="auth/invalid-credential"||e?.code==="auth/wrong-password"||e?.code==="auth/user-not-found")return"Email atau password salah.";
  if(e?.code==="auth/too-many-requests")return"Terlalu banyak percobaan. Coba lagi nanti.";
  return e?.message||"Terjadi kesalahan.";
}

function makeEmployeeId(u){
  // ID stabil, unik, dan tidak bergantung pada email yang bisa berubah.
  return `EMP-${u.uid.slice(-6).toUpperCase()}`;
}

async function getUserDoc(u){
  for(const col of ["users","pengguna"]){
    const s=await F.getDoc(F.doc(F.db,col,u.uid));
    if(s.exists()) return {s,col};
  }

  // Akun Firebase Auth baru otomatis dibuat sebagai karyawan.
  const employeeId=makeEmployeeId(u);
  const data={
    role:"employee",
    employeeId,
    name:u.displayName || (u.email ? u.email.split("@")[0] : "Karyawan"),
    email:u.email || "",
    createdAt:F.serverTimestamp()
  };
  await F.setDoc(F.doc(F.db,"users",u.uid),data);
  return {s:await F.getDoc(F.doc(F.db,"users",u.uid)),col:"users"};
}

async function ensureEmployeeId(u,col,data){
  let employeeId=data.employeeId||data.NIK||"";
  if(employeeId) return { ...data, employeeId };

  employeeId=makeEmployeeId(u);
  // Hanya melengkapi ID; data role/nama yang sudah ada tidak ditimpa.
  await F.setDoc(F.doc(F.db,col,u.uid),{employeeId}, {merge:true});
  return { ...data, employeeId };
}

F.onAuthStateChanged(F.auth,async u=>{
  if(!u){loginEl.classList.remove("hidden");appEl.classList.add("hidden");return}
  try{
    const {s,col}=await getUserDoc(u);
    if(!s){loginEl.classList.remove("hidden");appEl.classList.add("hidden");msgEl.textContent="Login berhasil, tetapi data pengguna belum ditemukan. Buat dokumen dengan Document ID yang sama dengan UID akun di Authentication.";await F.signOut(F.auth);return}
    userCollection=col; currentUserData=await ensureEmployeeId(u,col,s.data());
    role=currentUserData.role || (currentUserData.Admin ? "admin" : ""); uid=u.uid; eid=currentUserData.employeeId||currentUserData.NIK||"";
    if(role!=="admin"&&role!=="employee"){msgEl.textContent="Role akun tidak valid. Gunakan role admin atau employee.";await F.signOut(F.auth);return}
    loginEl.classList.add("hidden");appEl.classList.remove("hidden");
    whoEl.textContent=role==="admin"?"ADMIN":(currentUserData.name||eid||"Karyawan");
    adminPanelEl.classList.toggle("hidden",role!=="admin");
    noticeEl.textContent=role==="admin"?"Admin: ubah IN/OFF/Ijin/Cuti/Sakit.":"Klik tanggal Anda untuk mengajukan OFF/Ijin/Cuti/Sakit.";
    await load(); listenRequests();
  }catch(e){msgEl.textContent="Gagal membaca data pengguna: "+(e?.message||e);await F.signOut(F.auth)}
});

async function load(){
  try{
    let em=[];
    if(role==="admin"){
      const lists=await Promise.all(["users","pengguna"].map(c=>F.getDocs(F.collection(F.db,c))));
      const map=new Map(); lists.forEach(us=>us.docs.forEach(x=>map.set(x.id,{id:x.id,...x.data()})));
      em=[...map.values()].filter(x=>(x.role||"")==="employee");
      const q=searchEl.value.toLowerCase(); em=em.filter(x=>(`${x.name||""} ${x.employeeId||x.NIK||""}`).toLowerCase().includes(q));
    }else em=[{id:uid,...currentUserData,employeeId:eid}];
    const qs=F.query(F.collection(F.db,"schedules"),F.where("year","==",+yearEl.value),F.where("month","==",+monthEl.value));
    if(sub)sub(); sub=F.onSnapshot(qs,s=>draw(em,s.docs.map(x=>({id:x.id,...x.data()}))),e=>noticeEl.textContent="Gagal memuat jadwal: "+e.message);
  }catch(e){noticeEl.textContent="Gagal memuat jadwal: "+(e?.message||e)}
}

function draw(em,rows){
  let n=new Date(+yearEl.value,+monthEl.value+1,0).getDate(),h="<tr><th class=name>Karyawan</th>";
  for(let d=1;d<=n;d++)h+=`<th>${d}</th>`; h+="</tr>";
  for(const e of em){
    const empId=e.employeeId||e.NIK||""; h+=`<tr><td class=name><b>${e.name||e.Admin||"-"}</b><br>NIK ${empId||"-"}</td>`;
    for(let d=1;d<=n;d++){
      const k=`${empId}_${yearEl.value}_${String(+monthEl.value+1).padStart(2,"0")}_${String(d).padStart(2,"0")}`;
      const x=rows.find(r=>r.id===k),c=x?.status||"IN";
      if(role==="admin")h+=`<td><select data-k="${k}" data-e="${empId}" data-d="${d}"><option ${c==="IN"?"selected":""}>IN</option><option ${c==="OFF"?"selected":""}>OFF</option><option ${c==="Ijin"?"selected":""}>Ijin</option><option ${c==="Cuti"?"selected":""}>Cuti</option><option ${c==="Sakit"?"selected":""}>Sakit</option></select></td>`;
      else h+=`<td onclick="requestDay(${d})"><span class="badge ${c}">${c}</span></td>`;
    }h+="</tr>";
  }
  scheduleEl.innerHTML=h;
  if(role==="admin")document.querySelectorAll("#schedule select").forEach(x=>x.onchange=async()=>{try{await F.setDoc(F.doc(F.db,"schedules",x.dataset.k),{employeeId:x.dataset.e,year:+yearEl.value,month:+monthEl.value,date:+x.dataset.d,status:x.value,updatedBy:uid,updatedAt:F.serverTimestamp()})}catch(e){alert("Gagal menyimpan: "+e.message)}});
}

window.requestDay=(d)=>{selected=`${yearEl.value}-${String(+monthEl.value+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;reqDateEl.textContent="Tanggal: "+selected;reasonEl.value="";modalEl.classList.remove("hidden")};

sendEl.onclick=async()=>{
  if(sendEl.disabled)return;
  try{
    if(!uid||role!=="employee"){alert("Hanya akun karyawan yang dapat mengajukan request.");return}
    if(!eid){alert("Employee ID belum diatur pada data pengguna.");return}
    if(!selected){alert("Tanggal request belum dipilih.");return}
    sendEl.disabled=true;sendEl.textContent="Mengirim...";
    await F.addDoc(F.collection(F.db,"requests"),{employeeId:eid,date:selected,type:reqTypeEl.value,reason:reasonEl.value.trim(),status:"Pending",createdBy:uid,createdAt:F.serverTimestamp()});
    modalEl.classList.add("hidden"); reasonEl.value=""; alert("Request berhasil terkirim.");
  }catch(e){alert("Gagal mengirim request: "+(e?.message||e))}
  finally{sendEl.disabled=false;sendEl.textContent="Kirim"}
};

function listenRequests(){
  if(role!=="admin")return;
  const q=F.query(F.collection(F.db,"requests"),F.where("status","==","Pending")); if(reqSub)reqSub();
  reqSub=F.onSnapshot(q,s=>{requestsEl.innerHTML=s.empty?"Belum ada request.":s.docs.map(x=>{const d=x.data();return`<div class=req><b>${d.employeeId}</b> · ${d.date} · ${d.type}<br>${d.reason||"-"}<br><button class=green onclick="decide('${x.id}',1)">Setujui</button> <button class=red onclick="decide('${x.id}',0)">Tolak</button></div>`}).join("")},e=>requestsEl.innerHTML=`Gagal memuat request: ${e.message}`);
}
window.decide=async(id,ok)=>{try{const r=await F.getDoc(F.doc(F.db,"requests",id));const x=r.data();await F.updateDoc(F.doc(F.db,"requests",id),{status:ok?"Disetujui":"Ditolak",processedBy:uid,processedAt:F.serverTimestamp()});if(ok){const [Y,M,D]=x.date.split("-"),k=`${x.employeeId}_${Y}_${M}_${D}`;await F.setDoc(F.doc(F.db,"schedules",k),{employeeId:x.employeeId,year:+Y,month:+M-1,date:+D,status:x.type,updatedBy:uid,updatedAt:F.serverTimestamp()})}}catch(e){alert("Gagal memproses request: "+e.message)}};
