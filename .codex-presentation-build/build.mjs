import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const root = 'D:\\duAnCaNhan\\Sign_Light_Web';
const build = path.join(root, '.codex-presentation-build');
const output = path.join(root, 'deliverables', 'SignLight_EXE201_Outcome1_IV_V.pptx');
const skill = 'C:\\Users\\LaptopK1\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.909.12148\\skills\\presentations';
const { finalizePresentation } = await import(pathToFileURL(path.join(skill, 'container_tools', 'artifact_tool_utils.mjs')).href);

const C = { navy:'#131B2E', navy2:'#203148', teal:'#14979F', teal2:'#08737C', cream:'#FBF8F1', white:'#FFFFFF', ink:'#1A2535', muted:'#546474', light:'#E2EBEA', amber:'#DCAA3C', green:'#0B8E68', rose:'#B45353' };
const FONT = 'Arial';
const ppt = Presentation.create({slideSize:{width:1280,height:720}});
const cover = new Uint8Array(await fs.readFile(path.join(build,'cover.png')));
const logo = new Uint8Array(await fs.readFile(path.join(root,'src','frontend','public','logo.png')));

function shape(s,x,y,w,h,fill='none',line='none',radius){
  return s.shapes.add({geometry:radius?'roundRect':'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:line==='none'?0:1},...(radius?{borderRadius:radius}:{})});
}
function txt(s,text,x,y,w,h,size=26,color=C.ink,bold=false,align='left'){
  const q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  q.text=text;
  q.text.style={typeface:FONT,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',autoFit:'shrinkText',wrap:true};
  return q;
}
function base(title,num,kicker){
  const s=ppt.slides.add(); s.background.fill=C.cream;
  shape(s,0,0,1280,13,C.teal);
  txt(s,title,68,45,1135,73,41,C.navy,true);
  if(kicker) txt(s,kicker.toUpperCase(),70,121,1090,28,15,C.teal2,true);
  shape(s,68,656,1144,1,C.light);
  txt(s,'SignLight  •  EXE201 Outcome 1',70,666,550,24,16,C.muted);
  txt(s,String(num).padStart(2,'0'),1153,665,55,24,16,C.muted,true,'right');
  return s;
}
function notes(s,text){s.speakerNotes.textFrame.setText(text);}
function line(s,x,y,w,color=C.light,h=2){shape(s,x,y,w,h,color);}
function label(s,text,x,y,w,color=C.teal2){txt(s,text.toUpperCase(),x,y,w,28,17,color,true);}

// 1 — Cover
{
 const s=ppt.slides.add(); s.background.fill=C.navy;
 s.images.add({blob:cover,contentType:'image/png',alt:'Illustration of a learner practicing sign language at a laptop',fit:'cover',position:{left:0,top:0,width:1280,height:720}});
 s.images.add({blob:logo,contentType:'image/png',alt:'SignLight logo',fit:'contain',position:{left:70,top:65,width:74,height:74}});
 txt(s,'SignLight',70,187,560,72,58,C.white,true);
 txt(s,'Learn Vietnamese Sign Language\nwith camera-based AI feedback',72,271,588,130,32,C.white,true);
 txt(s,'EXE201  •  Outcome 1  •  Product and MVP demo',73,562,600,35,21,'#BCE5E3');
 txt(s,'sightlight1.vercel.app',73,610,520,31,20,C.white);
 notes(s,'Opening: introduce SignLight and the core promise. The deck is designed for a 20–25 minute presentation. Source: EXE201 Outcome 1 guideline and current SignLight repository. The cover is an illustration, not a screenshot of the product.');
}
// 2 — flow & timing
{
 const s=base('Today’s presentation',2,'20–25 minutes including a live product demo');
 const items=[['02 min','Team and responsibilities'],['05 min','Product, users and proposed plans'],['08 min','Live MVP demonstration'],['08 min','Roadmap, sales plan and media plan'],['02 min','Questions and discussion']];
 let y=177; for(const [time,name] of items){
   txt(s,time,75,y,145,56,29,C.teal2,true); txt(s,name,230,y,845,56,28,C.ink); line(s,74,y+65,1100); y+=91;
 }
 notes(s,'Keep the live demonstration at approximately eight minutes. The guideline requires English slides and a 20–25 minute presentation.');
}
// 3 — problem & solution
{
 const s=base('The learning problem',3,'A learner needs feedback while practicing alone');
 txt(s,'Video shows the sign.',77,198,470,60,36,C.navy,true);
 txt(s,'It cannot tell the learner\nwhat their hands actually did.',77,273,502,136,32,C.muted);
 line(s,614,205,2,C.light,330);
 label(s,'SignLight’s response',672,202,455);
 txt(s,'Watch a model sign',672,250,510,50,31,C.ink,true);
 txt(s,'Practice in front of the camera',672,329,530,75,31,C.ink,true);
 txt(s,'Receive a recognized label and guidance',672,431,520,100,31,C.ink,true);
 notes(s,'Explain the gap in self-study: learners can imitate a video but lack immediate correction. The current product combines sign video, webcam capture and AI feedback. This is a product rationale, not a market-size claim. Source: repository README.md and src/frontend/app/luyen-ai/page.tsx.');
}
// 4 — MVP
{
 const s=base('Published MVP: what users can access',4,'Current deployed web application');
 txt(s,'https://sightlight1.vercel.app/',77,174,1100,58,34,C.teal2,true);
 const cols=[
  ['Learning','Learning path, lesson video and progress'],
  ['Practice','Camera-based sign capture and AI response'],
  ['Lookup','Searchable VSL sign dictionary'],
  ['Plans','Free entry and Premium purchase flow']
 ];
 let y=271; for(const [head,body] of cols){
   txt(s,head,78,y,220,55,29,C.navy,true); txt(s,body,307,y,815,55,27,C.ink); line(s,77,y+64,1086); y+=86;
 }
 notes(s,'The Vercel URL was supplied by the project owner and opened successfully on 23 Sep 2026. The AI practice route requires login. Published UI availability is verified; full end-to-end AI accuracy and payment completion are not verified by this deck. Source: live site and repository routes.');
}
// 5 — team
{
 const s=base('Team roles and deliverables',5,'Clear ownership for content, business and technology');
 const rows=[
  ['Lê Tùng Dương','Learning content, quizzes and teaching videos'],
  ['Phạm Việt Hoàng','Finance, business model and marketing'],
  ['Hoàng Xuân Thọ','Finance, business model and marketing'],
  ['Nguyễn Thế Duy','Landing page, backend and product interface'],
  ['Phan Bùi Bá Đạt','AI model training and camera AI function']
 ];
 let y=174; for(const [name,role] of rows){
   txt(s,name,77,y,364,52,28,C.navy,true); txt(s,role,449,y,728,52,26,C.ink); line(s,76,y+61,1103); y+=91;
 }
 notes(s,'The responsibilities on this slide were supplied directly by the project owner. Pause here for each person to speak briefly about their own deliverable if the team presentation format allows it.');
}
// 6 — catalog
{
 const s=base('Product catalog and proposed prices',6,'Pricing currently represented in the product code');
 const x=[75,347,690,924];
 const plans=[
   {name:'Free',price:'₫0',desc:'First learning unit; limited daily AI practice'},
   {name:'Premium 1 month',price:'₫99,000',desc:'Full course and unlimited AI practice'},
   {name:'Premium 6 months',price:'₫499,000',desc:'Full course and unlimited AI practice'},
   {name:'Premium 1 year',price:'₫899,000',desc:'Full course and unlimited AI practice'}
 ];
 plans.forEach((p,i)=>{
   const w=i===0?252:i===1?324:i===2?214:262;
   txt(s,p.name,x[i],207,w,46,27,C.navy,true);
   txt(s,p.price,x[i],275,w,64,37,C.teal2,true);
   txt(s,p.desc,x[i],363,w-8,126,23,C.ink);
   if(i<3) line(s,x[i]+w+6,212,1,C.light,300);
 });
 txt(s,'Prices are proposed for EXE201 and may be revised after user and cost validation.',77,565,1100,45,21,C.muted);
 notes(s,'Source: src/backend/src/main/resources/db/migration/V3__integrate_exe101_features.sql and src/frontend/app/nang-cap/page.tsx. The listed Premium prices are present in code. Treat them as proposed prices for the EXE201 presentation; no sales or payment results are claimed. Free account AI quota is documented in src/README.md.');
}
// 7 — architecture
{
 const s=base('How the camera practice works',7,'Current implementation and privacy boundary');
 const steps=[
  ['01','Watch a VSL video','Learner sees the target sign'],
  ['02','Capture movement','Browser reads webcam frames'],
  ['03','Extract and infer','Landmarks become a 64 × 327 tensor; ONNX runs in the browser'],
  ['04','Record the attempt','Backend tracks result and daily quota']
 ];
 let y=174; for(const [n,h,d] of steps){
   txt(s,n,77,y,70,58,31,C.teal2,true); txt(s,h,157,y,320,55,29,C.navy,true); txt(s,d,493,y,682,72,24,C.ink); line(s,76,y+77,1104); y+=110;
 }
 txt(s,'Camera pixels stay on the learner’s device.',77,604,1090,39,25,C.green,true);
 notes(s,'Source: src/frontend/app/luyen-ai/page.tsx, src/frontend/lib/holistic/extractor.ts, src/frontend/lib/ai/localRecognizer.ts and src/README.md. Browser extracts numeric features and performs local WASM inference. The frontend also sends the numeric tensor to the backend for attempt/quota tracking. The backend AI service currently lacks ONNX weights in src/ai/runs, so its server response can be stubbed; real-world accuracy remains unvalidated.');
}
// 8 — live demo handoff
{
 const s=base('Live demo: one learner journey',8,'Open the published product');
 txt(s,'sightlight1.vercel.app',75,177,1035,76,49,C.teal2,true);
 const demo=[['1','Sign in and open the learning path'],['2','Play a lesson video'],['3','Perform a sign in Camera AI'],['4','Read the feedback and look up a sign']];
 let y=292; for(const [n,a] of demo){txt(s,n,79,y,60,45,29,C.teal2,true); txt(s,a,150,y,934,52,30,C.navy,true); y+=77;}
 notes(s,'Allow approximately eight minutes for the live product. Pre-demo preparation: create and test a demo account, sign in, check API availability, verify camera permission, choose a sign with a working local video, and avoid any real payment. If live inference fails, explain the visible error and show the prepared UI flow honestly. The camera route requires authentication on the deployed site.');
}
// 9 — demo learning
{
 const s=base('Demo 1: lesson and learning path',9,'Show what the learner can do before turning on the camera');
 txt(s,'/hoc',80,174,283,74,49,C.teal2,true);
 txt(s,'Browse the course and open an available lesson.',80,255,1092,62,31,C.navy,true);
 line(s,78,347,1100);
 txt(s,'During the demo',80,372,300,43,23,C.muted,true);
 txt(s,'Play the sign video • answer a lesson question • show saved progress',80,432,1070,100,28,C.ink);
 txt(s,'Presenter: Nguyễn Thế Duy  +  Lê Tùng Dương',80,575,1078,43,22,C.teal2,true);
 notes(s,'Live navigation: https://sightlight1.vercel.app/hoc . Show a real available lesson, its video and one question. Do not claim all lesson content is complete; the content owner is still preparing lessons, quizzes and teaching videos. Source: user-provided team allocation and repository src/frontend/app/hoc.');
}
// 10 — demo camera
{
 const s=base('Demo 2: Camera AI',10,'The main product demonstration');
 txt(s,'/luyen-ai',78,166,533,75,49,C.teal2,true);
 const a=[
  'Choose a target sign and watch the model video',
  'Allow camera access and complete one full movement',
  'Show the predicted sign, confidence and top 3',
  'Explain retry guidance and the free daily limit'
 ];
 let y=263; a.forEach((v,i)=>{txt(s,String(i+1).padStart(2,'0'),80,y,70,55,30,C.teal2,true);txt(s,v,159,y,1015,69,28,C.navy);line(s,79,y+71,1095);y+=91;});
 notes(s,'Live navigation: https://sightlight1.vercel.app/luyen-ai . This route requires authentication. Camera permission must be granted by the presenter, not by the audience. Use a working webcam and adequate lighting. The frontend has local ONNX weights, but the backend model files in src/ai/runs are absent. If the page displays a stub warning, state that server-side model output is simulated; do not present this as a measured accuracy test. Source: src/frontend/app/luyen-ai/page.tsx and src/ai/app/recognizer.py.');
}
// 11 — demo dictionary
{
 const s=base('Demo 3: dictionary and upgrade path',11,'Close the journey with another reason to return');
 txt(s,'/tu-dien',76,182,387,72,44,C.teal2,true);
 txt(s,'Search a Vietnamese term with or without diacritics; open its sign video.',76,265,1115,105,31,C.navy);
 line(s,76,400,1110);
 txt(s,'/nang-cap',76,426,387,70,44,C.teal2,true);
 txt(s,'Show available plans and pricing. Stop before placing a payment order.',76,512,1115,78,30,C.navy);
 notes(s,'Live navigation: https://sightlight1.vercel.app/tu-dien and https://sightlight1.vercel.app/nang-cap . Search and show one real result. The payOS checkout code exists, but no end-to-end real payment is claimed or needed for this presentation. Source: src/frontend/app/tu-dien/page.tsx and src/frontend/app/nang-cap/page.tsx.');
}
// 12 — status
{
 const s=base('MVP readiness: live versus next to verify',12,'Use evidence rather than assumptions');
 label(s,'Available now',77,173,480,C.green);
 txt(s,'Published landing page\nLearning and dictionary routes\nCamera AI UI and browser model\nPremium plan UI',77,217,510,260,29,C.ink);
 line(s,633,179,2,C.light,383);
 label(s,'Before the Outcome 1 demo',684,173,520,C.rose);
 txt(s,'Prepare a demo account\nConfirm API and camera flow\nValidate webcam accuracy\nInstall Google Analytics 4',684,217,519,260,29,C.ink);
 txt(s,'Current server AI files are missing model weights; accuracy is not yet established.',77,559,1125,72,22,C.rose,true);
 notes(s,'Verified on 23 Sep 2026: published Vercel landing page opens and /luyen-ai requires login. Repository search found no GA4 integration. src/ai/runs contains config and labels but no ONNX weights. The frontend does contain browser ONNX model files. Existing PROJECT_STATE.md explicitly marks webcam accuracy validation as outstanding. This slide distinguishes UI/deployment from test evidence.');
}
// 13 — seven-week plan
{
 const s=base('Seven-week development plan',13,'Three phases aligned to W3, W6 and W8');
 const blocks=[
  {week:'W2–W3',name:'Version 1.0 · Stable MVP',body:'Demo account, camera/API smoke test, lesson content pass, GA4 page and event tracking'},
  {week:'W4–W6',name:'Version 2.0 · Learning depth',body:'Quizzes, stronger feedback, payment QA, real webcam evaluation across people and lighting'},
  {week:'W6–W8',name:'Version 3.0 · Launch and refine',body:'Public launch in W6–W7, improve retention flows, polish content and fix measured issues'}
 ];
 let y=179; for(const b of blocks){
   txt(s,b.week,80,y,180,51,31,C.teal2,true); txt(s,b.name,258,y,870,53,29,C.navy,true);
   txt(s,b.body,259,y+57,896,76,24,C.ink); line(s,78,y+143,1095);y+=156;
 }
 notes(s,'The guideline asks for a seven-week plan, ideally phased at W3, W6 and W8, with the final version or collection launched in week 6–7. This is a proposed schedule, not a committed delivery claim. The scope follows current gaps observed in code and project state.');
}
// 14 — function list
{
 const s=base('Function list by version',14,'Scope is prioritized by urgency and complexity');
 const heads=[['V1.0 · W3','Essential to demo'],['V2.0 · W6','Learning and validation'],['V3.0 · W8','Release quality']];
 const body=[
  ['Login and profile','Course path and lessons','Dictionary and Camera AI','GA4 instrumentation'],
  ['Quiz and review flow','Better AI guidance','PayOS checkout validation','Webcam accuracy tests'],
  ['Content quality review','Accessibility and privacy QA','Stability and performance','Release checklist']
 ];
 const xx=[76,470,862];
 for(let i=0;i<3;i++){
  txt(s,heads[i][0],xx[i],182,347,50,30,C.teal2,true);
  txt(s,heads[i][1],xx[i],245,347,40,21,C.muted);
  let y=313; for(const f of body[i]){txt(s,'• '+f,xx[i],y,343,55,24,C.navy);y+=67;}
 }
 notes(s,'This is the requested function list with a timeline. V1.0 is a hardening phase for existing functionality. V2.0 and V3.0 are proposed additions and validation tasks. The Vercel site is already published; the W6–W7 milestone is the validated public launch of the fuller product, not the first time a page goes online.');
}
// 15 — sales plan and B2B kit
{
 const s=base('Sales plan and B2B kit',15,'Part IV · Draft materials and proposed outreach');
 label(s,'B2B sales kit to prepare',78,177,500);
 const kit=[
  'Company brochure and LMS product catalog',
  'Tiered LMS quote · proposed 30–50% education discount',
  'ESG / CSR proposal with impact measures',
  'Service agreement and SLA · 99.9% uptime target'
 ];
 let y=224; for(const item of kit){txt(s,'• '+item,79,y,578,72,23,C.ink);y+=87;}
 line(s,680,180,2,C.light,407);
 label(s,'Sales actions',712,177,454);
 txt(s,'B2C Early Bird',712,226,456,42,28,C.navy,true);
 txt(s,'Proposed lifetime offer: ₫199,000 for the first 100 buyers; not yet a live price.',712,275,480,104,23,C.ink);
 txt(s,'B2B direct pitching',712,410,456,42,28,C.navy,true);
 txt(s,'W4–W6 target: contact 15 inclusive education centers and 10 F&B / retail chains.',712,459,484,113,23,C.ink);
 txt(s,'Offers, discount and SLA require finance, legal and technical review.',78,606,1100,35,19,C.rose,true);
 notes(s,'Source: Part IV of the user-supplied Outcome 1 document. Present the listed items as proposed sales materials and actions, not completed or signed. The 199,000 VND lifetime Early Bird proposal differs from monthly/6-month/annual pricing currently in the product code, so clearly say it is not a live offer. The 30–50% education discount and 99.9% uptime SLA are drafts pending finance, legal and infrastructure review. Hoàng and Thọ own the business and marketing work; Duy presents this slide.');
}
// 16 — media master plan
{
 const s=base('Media master plan',16,'Part V · W1–W8 activities and target outcomes');
 const rows=[
  ['W1–W2','Fanpage + beta survey','65+ valid surveys; 18 interviews'],
  ['W3–W4','“Silent Dinner” short videos + free VSL dictionary','2,000+ visits; 300+ sign-ups'],
  ['W5–W6','Light Ambassador + V2 / B2B launch campaign','1,000+ sign-ups; 1–2 B2B MOUs'],
  ['W7–W8','Impact report + partner case studies','5,000+ visitors; revenue KPI']
 ];
 let y=185; for(const [week,activity,target] of rows){
  txt(s,week,77,y,166,66,27,C.teal2,true);
  txt(s,activity,258,y,530,70,23,C.navy,true);
  txt(s,target,832,y,366,70,22,C.ink);
  line(s,77,y+82,1121);y+=106;
 }
 txt(s,'Targets from the plan; confirm outcomes using GA4 and backend records once tracking is live.',78,604,1115,44,19,C.rose,true);
 notes(s,'Source: Part V of the user-supplied Outcome 1 document. W1–W2 is labeled completed there, but the numerical survey and interview results were not independently verified here. Treat all listed counts as targets until evidence is supplied. W3–W8 campaigns and V2/B2B launch remain planned. Google Analytics 4 is not yet confirmed in the current frontend. Hoàng and Thọ own marketing; Duy presents this slide.');
}
// 17 — close
{
 const s=ppt.slides.add();s.background.fill=C.navy;
 s.images.add({blob:logo,contentType:'image/png',alt:'SignLight logo',fit:'contain',position:{left:81,top:79,width:89,height:89}});
 txt(s,'SignLight',79,206,710,85,65,C.white,true);
 txt(s,'From watching signs to practicing them with feedback.',81,309,996,121,38,C.white,true);
 txt(s,'Live MVP  •  sightlight1.vercel.app',82,516,790,47,27,'#BCE5E3');
 txt(s,'Questions?',81,596,400,49,30,C.white,true);
 notes(s,'Conclude with the distinction between what is live now and what the team will validate across the remaining seven weeks. Invite questions. Do not imply that on-screen marketing metrics have been independently verified.');
}

await fs.mkdir(path.dirname(output),{recursive:true});
const staging=path.join(build,'finalizer-iv-v');await fs.mkdir(staging,{recursive:true});
const candidate=path.join(staging,'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidate);
for(let i=0;i<ppt.slides.length;i++){
 const slide=ppt.slides.get(i);
 const png=await ppt.export({slide,format:'png',scale:0.8});
 await fs.writeFile(path.join(build,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
const result=await finalizePresentation({
 workspaceDir:root,candidatePath:candidate,finalPath:output,
 pythonExecutable:'C:\\Users\\LaptopK1\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
 integrityValidatorPath:path.join(skill,'container_tools','inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools','inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
 requiredNativeTableOwnerSlides:[],
 fontPolicy:{basis:'design',families:[FONT]},
 verifyArtifactToolImport:true,
 receiptPath:path.join(staging,'validation.json')
});
console.log(JSON.stringify({output,result},null,2));
