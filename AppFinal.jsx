import { useMemo, useState } from "react";

const C={bg:"#080a0d",card:"#10141a",surface:"#151b23",border:"#25303c",text:"#f5f7fa",muted:"#8b97a6",accent:"#f5b400",green:"#3dd68c",blue:"#4ea8ff",red:"#e05c2e",purple:"#a855f7"};
const LS="atletaos_final_";
const today=()=>new Date().toISOString().slice(0,10);
const uid=p=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(LS+k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem(LS+k,JSON.stringify(v));
const oldLogs=()=>{try{return JSON.parse(localStorage.getItem("rt_logs"))||[]}catch{return[]}};
const dateObj=d=>new Date(`${d}T12:00:00`);
const fmt=d=>d?dateObj(d).toLocaleDateString("pt-BR"):"—";
const kmOf=x=>Number(String(x?.km??"").replace(",","."))||0;
const daysAgo=d=>Math.round((new Date(today())-dateObj(d))/86400000);
const input={width:"100%",padding:"11px 12px",borderRadius:9,border:`1px solid ${C.border}`,background:C.surface,color:C.text,outline:"none"};
const card={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:12};
const btn=(bg=C.accent,color="#050505")=>({border:0,borderRadius:9,padding:"10px 14px",background:bg,color,fontWeight:800,cursor:"pointer"});
function Field({label,children}){return <label style={{display:"block",marginBottom:11}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{label}</div>{children}</label>}
function Section({title,children}){return <section style={card}><div style={{fontSize:12,fontWeight:900,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{title}</div>{children}</section>}
function Stat({label,value,color=C.accent}){return <div style={card}><div style={{fontSize:25,fontWeight:900,color,fontFamily:"monospace"}}>{value}</div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>{label}</div></div>}

function Onboarding({done}){const[n,setN]=useState("");const[f,setF]=useState("5km");return <main style={shell}><div style={{...card,maxWidth:560,margin:"10vh auto"}}><b style={{color:C.accent,letterSpacing:2}}>ATLETAOS</b><h1>Comece pelo seu perfil</h1><p style={{color:C.muted,lineHeight:1.6}}>As provas começam vazias. Os treinos podem aproveitar o histórico já existente no aplicativo, enquanto novos registros ficam salvos para alimentar as sugestões.</p><Field label="Nome"><input style={input} value={n} onChange={e=>setN(e.target.value)} placeholder="Nome do atleta"/></Field><Field label="Foco"><select style={input} value={f} onChange={e=>setF(e.target.value)}>{["5km","10km","15km","21km","42km"].map(x=><option key={x}>{x}</option>)}</select></Field><button disabled={!n.trim()} style={{...btn(),width:"100%",opacity:n.trim()?1:.45}} onClick={()=>{save("profile",{name:n,focus:f});done()}}>ENTRAR</button></div></main>}

function buildWeek(logs,races){
 const now=new Date(); const start=new Date(now); start.setDate(now.getDate()-6); start.setHours(0,0,0,0);
 const week=logs.filter(x=>{const d=dateObj(x.date);return d>=start&&d<=now});
 const volume=week.reduce((s,x)=>s+kmOf(x),0);
 const avgRpe=week.length?week.reduce((s,x)=>s+(Number(x.rpe)||0),0)/week.length:0;
 const hard=week.filter(x=>x.intensity==="forte"||Number(x.rpe)>=8).length;
 const heavy=week.filter(x=>["pesada","travada"].includes(x.pernas)).length;
 const recentRace=races.filter(r=>r.resultTime).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const raceDays=recentRace?daysAgo(recentRace.date):999;
 const review=recentRace?.review||{};
 let mode="CONSTRUÇÃO CONTROLADA", note="A sugestão usa o treino anterior, volume da semana e a resposta registrada. Ela não substitui a prescrição do professor.";
 if(raceDays<=2){mode="RECUPERAÇÃO PÓS-PROVA";note="Há prova muito recente: priorizar recuperação e observação da resposta antes de acrescentar estímulos fortes."}
 else if(raceDays<=7){mode="RETOMADA PÓS-PROVA";note="A semana ainda está próxima da prova. A qualidade volta de forma progressiva conforme pernas, sono e RPE."}
 else if(heavy>=2||avgRpe>=7.5||hard>=3){mode="CONTROLE DE CARGA";note="A carga recente está elevada. A sugestão reduz a concentração de estímulos fortes e preserva corrida leve, Core e recuperação."}
 const base=[
  {day:"SEG",type:"Corrida leve + técnica",desc:"Corrida confortável, educativos e mobilidade. Use a sensação das pernas para decidir a intensidade.",tag:"AERÓBIO"},
  {day:"TER",type:"Qualidade de corrida",desc:"Sessão específica sugerida a partir do último treino de qualidade; manter qualidade sem empilhar esforço quando a carga recente estiver alta.",tag:"QUALIDADE"},
  {day:"QUA",type:"Corrida regenerativa",desc:"Corrida fácil ou recuperação ativa. Se houver pernas pesadas, manter apenas o componente regenerativo.",tag:"RECUPERAÇÃO"},
  {day:"QUI",type:"Corrida específica",desc:"Estímulo de ritmo/limiar ou progressivo, escolhido conforme a resposta da semana e a última prova.",tag:"ESPECÍFICO"},
  {day:"SEX",type:"Core + força",desc:"Core como trabalho complementar: prancha, anti-rotação, estabilidade pélvica, cadeia posterior e controle do tronco. Força sem buscar fadiga desnecessária.",tag:"CORE"},
  {day:"SÁB",type:"Endurance / longão",desc:"Rodagem mais longa para sustentar a capacidade aeróbia, ajustada ao volume já acumulado na semana.",tag:"VOLUME"},
  {day:"DOM",type:"Descanso / recuperação",desc:"Descanso ou recuperação ativa conforme a resposta acumulada.",tag:"RECUPERAÇÃO"}
 ];
 if(mode.includes("PÓS-PROVA")){base[1]={day:"TER",type:"Corrida de recuperação",desc:"Retomar movimento com baixa exigência; sem estímulo forte automático após a prova.",tag:"RECUPERAÇÃO"};base[3]={day:"QUI",type:"Corrida leve + técnica",desc:"Voltar à técnica e à fluidez somente se a resposta pós-prova estiver boa.",tag:"RETOMADA"};base[5]={day:"SÁB",type:"Endurance controlado",desc:"Manter corrida aeróbia sem buscar compensar a prova com volume extra.",tag:"CONTROLE"};}
 if(mode==="CONTROLE DE CARGA"){base[1]={day:"TER",type:"Qualidade reduzida",desc:"Manter o gesto específico com menor concentração de esforço; evitar novo pico de carga sobre a semana já pesada.",tag:"CARGA"};base[3]={day:"QUI",type:"Corrida leve + técnica",desc:"Priorizar fluidez e recuperação em vez de adicionar outro treino forte.",tag:"RECUPERAÇÃO"};}
 if(review.pacing==="Quebrei no final")base[3].desc="Priorizar distribuição de ritmo e controle do esforço, usando o relato da última prova como sinal para revisar a sessão específica.";
 if(review.pain&&review.pain.toLowerCase()!=="sem dor")base[5].desc="Manter o componente aeróbio conservador e registrar o sinal físico; não usar esta sugestão para aumentar carga enquanto o sinal não estiver esclarecido.";
 const last=logs.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
 return {week,volume,avgRpe,hard,heavy,mode,note,base,last,recentRace};
}

function Week({logs,races}){const w=useMemo(()=>buildWeek(logs,races),[logs,races]);return <div style={page}><div style={hero}><div><div style={{color:C.blue,fontSize:11,letterSpacing:2}}>TREINO DA SEMANA</div><h1>Sugestão inteligente</h1><p style={{color:C.muted,maxWidth:760}}>A semana é organizada a partir do treino anterior, volume acumulado, intensidade/RPE e resultado + relato da última prova.</p></div><span style={{...tag(w.mode===`CONTROLE DE CARGA`?C.accent:C.green)}}>{w.mode}</span></div><div style={grid4}><Stat label="Volume últimos 7 dias" value={`${w.volume.toFixed(1)} km`} color={C.blue}/><Stat label="Treinos fortes" value={w.hard} color={w.hard>=3?C.red:C.accent}/><Stat label="RPE médio" value={w.avgRpe?w.avgRpe.toFixed(1):"—"} color={w.avgRpe>=7.5?C.red:C.green}/><Stat label="Última prova" value={w.recentRace?.resultTime||"—"} color={C.green}/></div><Section title="Como o ATLETAOS chegou a esta sugestão"><p style={{color:C.muted,lineHeight:1.6,margin:0}}>{w.note}</p>{w.last&&<div style={{marginTop:12,fontSize:12}}>Último treino registrado: <b>{w.last.type}</b> · {fmt(w.last.date)} · {w.last.km?`${w.last.km} km`:"sem distância"} · RPE {w.last.rpe||"—"}</div>}</Section><div style={weekGrid}>{w.base.map((x,i)=><div key={i} style={{...card,borderLeft:`3px solid ${x.tag==="CORE"?C.purple:x.tag==="QUALIDADE"||x.tag==="ESPECÍFICO"?C.accent:C.blue}`}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{x.day}</b><span style={{fontSize:9,color:C.muted,letterSpacing:1}}>{x.tag}</span></div><h3 style={{margin:"8px 0 5px"}}>{x.type}</h3><p style={{color:C.muted,fontSize:12,lineHeight:1.55,margin:0}}>{x.desc}</p></div>)}</div><Section title="Regra de evolução"><div style={{color:C.muted,fontSize:12,lineHeight:1.7}}>O sistema não aumenta carga apenas porque o resultado melhorou. Ele compara resposta da prova, treino anterior, volume semanal, RPE, pernas, sono e sinais do relato. A recomendação é um <b style={{color:C.text}}>apoio de decisão</b>; a prescrição final continua com o professor.</div></Section></div>}

function Races({races,setRaces}){const[edit,setEdit]=useState(null);const[selected,setSelected]=useState(null);const[tab,setTab]=useState("dados");const blank={name:"",date:today(),distance:"5km",location:"",goal:"",resultTime:"",resultDistance:""};const[form,setForm]=useState(blank);const[review,setReview]=useState({effort:"",legs:"",sleep:"",pacing:"",nutrition:"",weather:"",course:"",difficulty:"",pain:"",positive:"",notes:""});const current=races.find(r=>r.id===selected);function saveRace(){if(!form.name.trim())return;const r={...form,id:edit==="new"?uid("race"):edit};const n=edit==="new"?[...races,r]:races.map(x=>x.id===edit?r:x);setRaces(n);save("races",n);setEdit(null);setSelected(r.id)}function del(id){const n=races.filter(r=>r.id!==id);setRaces(n);save("races",n);setSelected(null)}function saveReview(){const n=races.map(r=>r.id===current.id?{...r,review}:{...r});setRaces(n);save("races",n)}return <div style={page}><div style={hero}><div><div style={{color:C.purple,fontSize:11,letterSpacing:2}}>PROVAS</div><h1>Seu calendário</h1><p style={{color:C.muted}}>Nenhuma prova vem pré-cadastrada. Você decide o que entra no seu calendário.</p></div><button style={btn(C.purple,"#fff")} onClick={()=>{setEdit("new");setForm(blank);setSelected(null)}}>+ NOVA PROVA</button></div>{edit&&<Section title={edit==="new"?"Cadastrar prova":"Editar prova"}><div style={grid2}><Field label="Prova"><input style={input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Data"><input type="date" style={input} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Distância"><select style={input} value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})}>{["5km","10km","15km","21km","42km","Outra"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Local"><input style={input} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></Field></div><Field label="Objetivo"><input style={input} value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}/></Field><div style={grid2}><Field label="Resultado"><input style={input} value={form.resultTime} onChange={e=>setForm({...form,resultTime:e.target.value})} placeholder="Preencher depois da prova"/></Field><Field label="Distância realizada"><input style={input} value={form.resultDistance} onChange={e=>setForm({...form,resultDistance:e.target.value})}/></Field></div><button style={btn()} onClick={saveRace}>SALVAR</button> <button style={btn(C.surface,C.text)} onClick={()=>setEdit(null)}>CANCELAR</button></Section>}{!races.length&&!edit?<Section title="Calendário vazio"><p style={{color:C.muted}}>Cadastre a primeira prova quando quiser.</p></Section>:races.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=><div key={r.id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><b>{r.name}</b><div style={{fontSize:11,color:C.accent,marginTop:5}}>{fmt(r.date)} · {r.distance}{r.location?` · ${r.location}`:""}</div></div><b style={{color:r.resultTime?C.green:C.purple}}>{r.resultTime||"PLANEJADA"}</b></div><div style={{marginTop:10,display:"flex",gap:7,flexWrap:"wrap"}}><button style={btn(C.surface,C.text)} onClick={()=>{setSelected(r.id);setReview(r.review||{});setTab("dados")}}>Abrir</button><button style={btn(C.surface,C.blue)} onClick={()=>{setEdit(r.id);setForm({...blank,...r})}}>Editar</button><button style={btn("#2a1513",C.red)} onClick={()=>del(r.id)}>Excluir</button></div></div>)}{current&&<Section title={`${current.name} · ${fmt(current.date)}`}><div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:14}}>{[["dados","Dados"],["resultado","Resultado"],["relato","Relato pós-prova"]].map(x=><button key={x[0]} style={btn(tab===x[0]?C.accent:C.surface,tab===x[0]?"#000":C.text)} onClick={()=>setTab(x[0])}>{x[1]}</button>)}</div>{tab==="dados"&&<div><p>Objetivo: <b>{current.goal||"não definido"}</b></p><p>Local: <b>{current.location||"não informado"}</b></p></div>}{tab==="resultado"&&<div><h2 style={{fontFamily:"monospace"}}>{current.resultTime||"Ainda não registrado"}</h2>{!current.resultTime&&<button style={btn()} onClick={()=>{setEdit(current.id);setForm({...blank,...current})}}>REGISTRAR RESULTADO</button>}</div>}{tab==="relato"&&<Review review={review} setReview={setReview} save={saveReview}/>}</Section>}</div>}
function Review({review,setReview,save}){const set=(k,v)=>setReview(x=>({...x,[k]:v}));return <div><div style={{background:C.blue+"12",padding:12,borderRadius:10,color:C.muted,fontSize:12,marginBottom:14}}>Este relato alimenta a análise da próxima semana. Ele não muda automaticamente a prescrição.</div><div style={grid2}><Field label="Esforço"><select style={input} value={review.effort||""} onChange={e=>set("effort",e.target.value)}><option value="">Selecione</option>{["Muito fácil","Fácil","Moderado","Forte","Muito forte","Máximo"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Pernas"><select style={input} value={review.legs||""} onChange={e=>set("legs",e.target.value)}><option value="">Selecione</option>{["Soltas","Normais","Pesadas","Travadas"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Sono"><select style={input} value={review.sleep||""} onChange={e=>set("sleep",e.target.value)}><option value="">Selecione</option>{["Bom","Regular","Ruim"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Ritmo"><select style={input} value={review.pacing||""} onChange={e=>set("pacing",e.target.value)}><option value="">Selecione</option>{["Bem distribuído","Saí forte","Terminei forte","Quebrei no final","Oscilei"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Nutrição/hidratação"><input style={input} value={review.nutrition||""} onChange={e=>set("nutrition",e.target.value)}/></Field><Field label="Clima"><input style={input} value={review.weather||""} onChange={e=>set("weather",e.target.value)}/></Field><Field label="Percurso"><input style={input} value={review.course||""} onChange={e=>set("course",e.target.value)}/></Field><Field label="Dificuldade"><input style={input} value={review.difficulty||""} onChange={e=>set("difficulty",e.target.value)}/></Field><Field label="Dor/sinal físico"><input style={input} value={review.pain||""} onChange={e=>set("pain",e.target.value)} placeholder="Sem dor / descreva"/></Field></div><Field label="O que funcionou"><textarea style={{...input,minHeight:70}} value={review.positive||""} onChange={e=>set("positive",e.target.value)}/></Field><Field label="Como foi a prova"><textarea style={{...input,minHeight:110}} value={review.notes||""} onChange={e=>set("notes",e.target.value)}/></Field><button style={btn(C.green,"#04130b")} onClick={save}>SALVAR RELATO</button></div>}

function App(){const[profile,setProfile]=useState(()=>load("profile",null));const[logs,setLogs]=useState(()=>{const saved=load("logs",null);if(saved)return saved;const migrated=oldLogs();save("logs",migrated);return migrated});const[races,setRaces]=useState(()=>load("races",[]));const[screen,setScreen]=useState("inicio");if(!profile)return <Onboarding done={()=>setProfile(load("profile",null))}/>;const addLog=(x)=>{const n=[...logs,{...x,id:uid("log")}];setLogs(n);save("logs",n)};return <div style={app}><header style={header}><b><span style={{color:C.accent}}>ATLETA</span>OS</b><span style={{color:C.muted,fontSize:12}}>{profile.name}</span></header>{screen==="inicio"&&<Home profile={profile} logs={logs} races={races} setScreen={setScreen}/>} {screen==="semana"&&<Week logs={logs} races={races}/>} {screen==="treinos"&&<Trainings logs={logs} addLog={addLog}/>} {screen==="recuperacao"&&<Recovery logs={logs} races={races}/>} {screen==="coach"&&<Coach logs={logs} races={races} setScreen={setScreen}/>} {screen==="provas"&&<Races races={races} setRaces={setRaces}/>}<nav style={nav}>{[["inicio","⌂","Início"],["semana","📅","Semana"],["treinos","🏃","Treinos"],["provas","🏁","Provas"]].map(x=><button key={x[0]} onClick={()=>setScreen(x[0])} style={{...navBtn,color:screen===x[0]?C.accent:C.muted}}><div>{x[1]}</div><small>{x[2]}</small></button>)}</nav></div>}

function calcReadiness(logs,races){
 const recent=logs.filter(x=>daysAgo(x.date)<=6);
 const avg=recent.length?recent.reduce((s,x)=>s+(Number(x.rpe)||0),0)/recent.length:0;
 const heavy=recent.filter(x=>["pesada","travada"].includes(x.pernas)).length;
 const poor=recent.filter(x=>x.sono==="ruim").length;
 const race=races.filter(x=>x.resultTime).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const postRace=race&&daysAgo(race.date)<=2;
 let score=86-Math.max(0,(avg-5)*7)-heavy*5-poor*5-(postRace?15:0);
 score=Math.round(Math.max(35,Math.min(96,score)));
 return {score,state:score>=75?"READY":score>=55?"MODERATE":"RECOVER",recovery:Math.max(35,Math.min(96,score+2)),sleep:Math.max(45,100-poor*18),stress:Math.min(85,25+(avg>7?20:0)+heavy*8)};
}
function Ring({value,size=150,color=C.accent,children}){
 const r=58,circ=2*Math.PI*r,offset=circ*(1-value/100);
 return <div style={{width:size,height:size,position:"relative",display:"grid",placeItems:"center"}}>
  <svg width={size} height={size} viewBox="0 0 140 140" style={{position:"absolute",inset:0}}>
   <circle cx="70" cy="70" r={r} fill="none" stroke="#ffffff0d" strokeWidth="10"/>
   <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 70 70)"/>
  </svg>
  <div style={{textAlign:"center"}}>{children}</div>
 </div>
}
function MiniMetric({label,value,color,icon}){
 return <div style={{display:"flex",gap:10,alignItems:"center"}}>
  <div style={{width:32,height:32,borderRadius:9,background:"#ffffff08",display:"grid",placeItems:"center"}}>{icon}</div>
  <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:C.muted}}>{label}</span><b>{value}</b></div><div style={{height:5,marginTop:4,borderRadius:99,background:"#ffffff0b"}}><div style={{height:"100%",width:value+"%",background:color,borderRadius:99}}/></div></div>
 </div>
}

function Home({profile,logs,races,setScreen}){
 const w=useMemo(()=>buildWeek(logs,races),[logs,races]);
 const rd=useMemo(()=>calcReadiness(logs,races),[logs,races]);
 const upcoming=races.filter(r=>r.date>=today()).sort((a,b)=>a.date.localeCompare(b.date))[0];
 const last=logs.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
 const recent=logs.filter(x=>daysAgo(x.date)<=6);
 const loadScore=Math.min(100,Math.round((recent.reduce((s,x)=>s+(Number(x.rpe)||0),0)/Math.max(1,recent.length))*10));
 return <div style={page}>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,marginBottom:18}}>
   <div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</div><h1 style={{margin:"4px 0 0",fontSize:28}}>Bom dia, <span style={{color:C.accent}}>{profile.name}</span></h1></div>
   <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#f5b400,#ff7a00)",display:"grid",placeItems:"center",fontWeight:950,color:"#111"}}>{profile.name?.[0]?.toUpperCase()||"A"}</div>
  </header>
  <section style={{...card,padding:20,position:"relative",overflow:"hidden"}}>
   <div style={{position:"absolute",right:-50,top:-70,width:190,height:190,borderRadius:"50%",background:C.accent+"14",filter:"blur(30px)"}}/>
   <div style={{display:"flex",alignItems:"center",gap:22,position:"relative",flexWrap:"wrap"}}>
    <Ring value={rd.score} color={rd.state==="READY"?C.green:rd.state==="MODERATE"?C.accent:C.red}>
     <div style={{fontSize:9,color:C.muted,letterSpacing:2}}>READINESS</div><div style={{fontSize:38,fontWeight:950}}>{rd.score}</div>
     <span style={{fontSize:9,fontWeight:900,letterSpacing:1,padding:"5px 8px",borderRadius:99,background:(rd.state==="READY"?C.green:rd.state==="MODERATE"?C.accent:C.red)+"22",color:rd.state==="READY"?C.green:rd.state==="MODERATE"?C.accent:C.red}}>{rd.state}</span>
    </Ring>
    <div style={{flex:1,minWidth:230,display:"grid",gap:10}}>
     <div style={{fontSize:12,color:C.muted}}>Prontidão calculada a partir do histórico real.</div>
     <MiniMetric label="Recovery" value={rd.recovery} color={C.green} icon="♥"/>
     <MiniMetric label="Sono" value={rd.sleep} color={C.blue} icon="◐"/>
     <MiniMetric label="Stress" value={rd.stress} color={C.accent} icon="⚡"/>
    </div>
   </div>
  </section>
  <div style={grid4}>
   <Stat label="Training Load" value={Math.round(w.volume*(w.avgRpe||1)*10)} color={C.accent}/>
   <Stat label="Distância 7d" value={w.volume.toFixed(1)+" km"} color={C.blue}/>
   <Stat label="Treinos" value={logs.length} color={C.green}/>
   <Stat label="Provas" value={races.length} color={C.purple}/>
  </div>
  <Section title="Treino recomendado" subtitle={w.mode} icon="✦">
   <div style={{display:"flex",gap:12,alignItems:"center"}}>
    <div style={{width:46,height:46,borderRadius:14,background:C.accent+"18",display:"grid",placeItems:"center",fontSize:22}}>🏃</div>
    <div style={{flex:1}}><b>{w.base[0].type}</b><p style={{margin:"4px 0",fontSize:12,color:C.muted}}>{w.note}</p></div>
    <button style={btn(C.surface,C.text)} onClick={()=>setScreen("semana")}>VER</button>
   </div>
  </Section>
  <div style={grid2}>
   <Section title="Último treino" icon="●">{last?<><b>{last.type}</b><div style={{fontSize:12,color:C.muted,marginTop:5}}>{fmt(last.date)} · {last.km||0} km · RPE {last.rpe||"—"}</div></>:<span style={{color:C.muted}}>Nenhum treino registrado.</span>}</Section>
   <Section title="Próxima prova" icon="🏁">{upcoming?<><b>{upcoming.name}</b><div style={{fontSize:12,color:C.accent,marginTop:5}}>{fmt(upcoming.date)} · {upcoming.distance}</div></>:<span style={{color:C.muted}}>Nenhuma prova cadastrada.</span>}</Section>
  </div>
  <Section title="Carga recente" subtitle="Leitura simples do esforço registrado" icon="↗"><div style={{fontSize:30,fontWeight:950,color:loadScore>=75?C.red:C.blue}}>{loadScore}<span style={{fontSize:12,color:C.muted}}> / 100</span></div><div style={{height:6,background:"#ffffff0b",borderRadius:99,marginTop:8}}><div style={{height:"100%",width:loadScore+"%",background:loadScore>=75?C.red:C.blue,borderRadius:99}}/></div></Section>
 </div>
}

function Recovery({logs,races}){const rd=useMemo(()=>calcReadiness(logs,races),[logs,races]);return <div style={page}><div style={hero}><div><div style={{color:C.green,fontSize:10,letterSpacing:2}}>BODY STATUS</div><h1>Recuperação</h1><p style={{color:C.muted}}>Indicadores derivados do que foi registrado.</p></div></div><Section title="Prontidão"><div style={{display:"flex",justifyContent:"center"}}><Ring value={rd.score} size={205} color={rd.state==="READY"?C.green:rd.state==="MODERATE"?C.accent:C.red}><div style={{fontSize:10,color:C.muted,letterSpacing:2}}>READINESS</div><div style={{fontSize:48,fontWeight:950}}>{rd.score}</div><div style={{fontSize:10,color:C.muted}}>{rd.state}</div></Ring></div></Section><div style={grid2}><Stat label="Recovery" value={rd.recovery} color={C.green}/><Stat label="Sono" value={rd.sleep} color={C.blue}/><Stat label="Stress" value={rd.stress} color={C.accent}/><Stat label="Carga recente" value={Math.round((logs.slice(-7).reduce((s,x)=>s+(Number(x.rpe)||0),0)/Math.max(1,logs.slice(-7).length))*10)} color={C.purple}/></div><Section title="Interpretação"><p style={{fontSize:12,color:C.muted,lineHeight:1.7,margin:0}}>O painel usa sinais registrados pelo atleta como apoio. Ele não substitui dados de relógio, avaliação ou a decisão do treinador.</p></Section></div>}
function Coach({logs,races,setScreen}){const w=useMemo(()=>buildWeek(logs,races),[logs,races]),rd=useMemo(()=>calcReadiness(logs,races),[logs,races]);return <div style={page}><div style={hero}><div><div style={{color:C.purple,fontSize:10,letterSpacing:2}}>INTELIGÊNCIA</div><h1>IA Coach</h1><p style={{color:C.muted}}>Leitura dos dados reais do seu ciclo.</p></div></div><Section title="Recomendação de hoje" icon="✦"><b>{w.base[0].type}</b><p style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{w.note}</p><button style={btn()} onClick={()=>setScreen("semana")}>ABRIR SEMANA</button></Section><Section title="Insights"><div style={{display:"grid",gap:10}}><div style={card}><b>Readiness {rd.score}</b><p style={{margin:"5px 0 0",fontSize:12,color:C.muted}}>Estado atual derivado do histórico.</p></div><div style={card}><b>Volume 7 dias: {w.volume.toFixed(1)} km</b><p style={{margin:"5px 0 0",fontSize:12,color:C.muted}}>Use o volume acumulado antes de acrescentar carga.</p></div><div style={card}><b>RPE médio: {w.avgRpe?w.avgRpe.toFixed(1):"—"}</b><p style={{margin:"5px 0 0",fontSize:12,color:C.muted}}>A percepção de esforço ajuda a controlar a concentração de estímulos.</p></div></div></Section></div>}

function Trainings({logs,addLog}){const[f,setF]=useState({date:today(),type:"Corrida",km:"",rpe:5,description:"",pernas:"normal",sono:"bom",intensity:"leve"});return <div style={page}><div style={hero}><div><div style={{color:C.blue,fontSize:11,letterSpacing:2}}>HISTÓRICO</div><h1>Treinos</h1><p style={{color:C.muted}}>Registre o que realmente foi feito. O histórico alimenta a sugestão da semana.</p></div></div><Section title="Novo treino"><div style={grid2}><Field label="Data"><input type="date" style={input} value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></Field><Field label="Tipo"><select style={input} value={f.type} onChange={e=>setF({...f,type:e.target.value})}>{["Corrida","Tiros","Longão","Progressivo","Força","Core","Pliometria","Mobilidade","Descanso","Outro"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Distância km"><input type="number" step=".01" style={input} value={f.km} onChange={e=>setF({...f,km:e.target.value})}/></Field><Field label="RPE"><input type="number" min="1" max="10" style={input} value={f.rpe} onChange={e=>setF({...f,rpe:e.target.value})}/></Field><Field label="Pernas"><select style={input} value={f.pernas} onChange={e=>setF({...f,pernas:e.target.value})}>{["leve","normal","pesada","travada"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Sono"><select style={input} value={f.sono} onChange={e=>setF({...f,sono:e.target.value})}>{["bom","medio","ruim"].map(x=><option key={x}>{x}</option>)}</select></Field></div><Field label="Descrição"><textarea style={{...input,minHeight:80}} value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></Field><button style={btn(C.blue,"#fff")} onClick={()=>{addLog(f);setF({...f,date:today(),km:"",description:""})}}>SALVAR TREINO</button></Section>{logs.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20).map(x=><div key={x.id} style={card}><div style={{display:"flex",justifyContent:"space-between"}}><b>{x.type}</b><span style={{fontSize:11,color:C.muted}}>{fmt(x.date)}</span></div><div style={{fontSize:12,color:C.muted,marginTop:5}}>{x.description||x.desc||"Sem descrição"} · {x.km||0} km · RPE {x.rpe||"—"}</div></div>)}</div>}
const app={minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Inter,system-ui,sans-serif",paddingBottom:76};
const shell={minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Inter,system-ui,sans-serif",padding:16};
const page={width:"100%",maxWidth:1240,margin:"0 auto",padding:"26px 20px"};
const hero={display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,marginBottom:18,flexWrap:"wrap"};
const grid2={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12};
const grid4={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:12};
const weekGrid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10};
const header={position:"sticky",top:0,zIndex:20,display:"flex",justifyContent:"space-between",padding:"13px max(16px,calc((100vw - 1180px)/2))",background:"rgba(8,10,13,.96)",borderBottom:`1px solid ${C.border}`};
const nav={position:"fixed",bottom:0,left:0,right:0,zIndex:30,display:"flex",justifyContent:"center",background:"rgba(8,10,13,.98)",borderTop:`1px solid ${C.border}`};
const navBtn={flex:"1 1 120px",maxWidth:180,padding:"8px 4px 10px",background:"transparent",border:0,cursor:"pointer",fontWeight:800};
const tag=c=>({fontSize:9,fontWeight:900,letterSpacing:1,padding:"5px 7px",borderRadius:6,background:c+"22",color:c});

export default App;
