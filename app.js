import*as F from"./firebase.js";
const months=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
let role="",uid="",eid="",sub,reqSub,selected="",currentUserData=null;
months.forEach((x,i)=>month.innerHTML+=`<option value="${i}">${x}</option>`);month.value=new Date().getMonth();year.value=new Date().getFullYear();
loginBtn.onclick=async()=>{msg.textContent="";try{await F.signInWithEmailAndPassword(F.auth,email.value.trim(),password.value)}catch(e){msg.textContent="Login gagal: "+friendlyError(e)}};
logout.onclick=()=>F.signOut(F.auth);cancel.onclick=()=>modal.classList.add("hidden");month.onchange=load;year.onchange=load;search.oninput=load;
function friendlyError(e){if(e?.code==="auth/invalid-credential"||e?.code==="auth/wrong-password"||e?.code==="auth/user-not-found")return"Email atau password salah.";if(e?.code==="auth/too-many-requests")return"Terlalu banyak percobaan. Coba lagi nanti.";return e?.message||"Terjadi kesalahan."}
F.onAuthStateChanged(F.auth,async u=>{
  if(!u){login.classList.remove("hidden");app.classList.add("hidden");return}
  try{
    const s=await F.getDoc(F.doc(F.db,"users",u.uid));
    if(!s.exists()){login.classList.remove("hidden");app.classList.add("hidden");msg.textContent="Login berhasil, tetapi akun ini belum memiliki dokumen users/{UID} di Firestore. Buat dokumen tersebut terlebih dahulu.";await F.signOut(F.auth);return}
    currentUserData=s.data();role=currentUserData.role;uid=u.uid;eid=currentUserData.employeeId||"";
    if(role!=="admin"&&role!=="employee"){msg.textContent="Role akun tidak valid. Gunakan role admin atau employee.";await F.signOut(F.auth);return}
    login.classList.add("hidden");app.classList.remove("hidden");who.textContent=role==="admin"?"ADMIN":(currentUserData.name||eid||"Karyawan");adminPanel.classList.toggle("hidden",role!=="admin");notice.textContent=role==="admin"?"Admin: ubah IN/OFF/Ijin/Cuti/Sakit.":"Klik tanggal Anda untuk mengajukan OFF/Ijin/Cuti/Sakit.";load();listenRequests();
  }catch(e){msg.textContent="Gagal membaca data pengguna: "+(e?.message||e);await F.signOut(F.auth)}
});
async function load(){
  try{
    let em=[];
    if(role==="admin"){
      let us=await F.getDocs(F.collection(F.db,"users"));
      em=us.docs.map(x=>({id:x.id,...x.data()})).filter(x=>x.role==="employee");
      let q=search.value.toLowerCase();em=em.filter(x=>(x.name+" "+x.employeeId).toLowerCase().includes(q));
    }else{
      em=[{id:uid,...currentUserData,employeeId:eid}];
    }
    let qs=F.query(F.collection(F.db,"schedules"),F.where("year","==",+year.value),F.where("month","==",+month.value));
    if(sub)sub();sub=F.onSnapshot(qs,s=>draw(em,s.docs.map(x=>({id:x.id,...x.data()}))));
  }catch(e){notice.textContent="Gagal memuat jadwal: "+(e?.message||e)}
}
function draw(em,rows){
  let n=new Date(+year.value,+month.value+1,0).getDate(),h="<tr><th class=name>Karyawan</th>";
  for(let d=1;d<=n;d++)h+=`<th>${d}</th>`;h+="</tr>";
  for(let e of em){h+=`<tr><td class=name><b>${e.name||"-"}</b><br>NIK ${e.employeeId||"-"}</td>`;
    for(let d=1;d<=n;d++){let k=`${e.employeeId}_${year.value}_${String(+month.value+1).padStart(2,"0")}_${String(d).padStart(2,"0")}`,x=rows.find(r=>r.id===k),c=x?.status||"IN";
      if(role==="admin")h+=`<td><select data-k="${k}" data-e="${e.employeeId}" data-d="${d}"><option ${c==="IN"?"selected":""}>IN</option><option ${c==="OFF"?"selected":""}>OFF</option><option ${c==="Ijin"?"selected":""}>Ijin</option><option ${c==="Cuti"?"selected":""}>Cuti</option><option ${c==="Sakit"?"selected":""}>Sakit</option></select></td>`;
      else h+=`<td onclick="requestDay(${d})"><span class="badge ${c}">${c}</span></td>`;
    }h+="</tr>";
  }
  schedule.innerHTML=h;
  if(role==="admin")document.querySelectorAll("#schedule select").forEach(x=>x.onchange=async()=>{try{await F.setDoc(F.doc(F.db,"schedules",x.dataset.k),{employeeId:x.dataset.e,year:+year.value,month:+month.value,date:+x.dataset.d,status:x.value,updatedBy:uid,updatedAt:F.serverTimestamp()})}catch(e){alert("Gagal menyimpan: "+(e?.message||e))}})
}
window.requestDay=d=>{selected=`${year.value}-${String(+month.value+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;reqDate.textContent="Tanggal: "+selected;reason.value="";modal.classList.remove("hidden")};
send.onclick=async()=>{try{if(!eid){alert("Employee ID belum diatur pada users/{UID}.");return}await F.addDoc(F.collection(F.db,"requests"),{employeeId:eid,date:selected,type:reqType.value,reason:reason.value.trim(),status:"Pending",createdBy:uid,createdAt:F.serverTimestamp()});modal.classList.add("hidden");alert("Request terkirim")}catch(e){alert("Gagal mengirim request: "+(e?.message||e))}};
function listenRequests(){if(role!=="admin")return;let q=F.query(F.collection(F.db,"requests"),F.where("status","==","Pending"));if(reqSub)reqSub();reqSub=F.onSnapshot(q,s=>{requests.innerHTML=s.empty?"Belum ada request.":s.docs.map(x=>{let d=x.data();return`<div class=req><b>${d.employeeId}</b> · ${d.date} · ${d.type}<br>${d.reason||"-"}<br><button class=green onclick="decide('${x.id}',1)">Setujui</button> <button class=red onclick="decide('${x.id}',0)">Tolak</button></div>`}).join("")})}
window.decide=async(id,ok)=>{try{let r=await F.getDoc(F.doc(F.db,"requests",id)),x=r.data();await F.updateDoc(F.doc(F.db,"requests",id),{status:ok?"Disetujui":"Ditolak",processedBy:uid,processedAt:F.serverTimestamp()});if(ok){let [Y,M,D]=x.date.split("-"),k=`${x.employeeId}_${Y}_${M}_${D}`;await F.setDoc(F.doc(F.db,"schedules",k),{employeeId:x.employeeId,year:+Y,month:+M-1,date:+D,status:x.type,updatedBy:uid,updatedAt:F.serverTimestamp()})}}catch(e){alert("Gagal memproses request: "+(e?.message||e))}};
