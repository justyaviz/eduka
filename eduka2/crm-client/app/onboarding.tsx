'use client';
import Link from 'next/link';
import {CheckCircle2,ChevronRight} from 'lucide-react';
import {CRMRecord} from '@/lib/domain';

export default function Onboarding({records,role}:{records:CRMRecord[];role:string}) {
 if(!['owner','director','admin'].includes(role.toLowerCase()))return null;
 const active=records.filter(r=>!r.deleted);
 const has=(entity:string)=>active.some(r=>r.entity===entity);
 const settings=active.find(r=>r.entity==='settings'&&r.data.section==='system')?.data;
 const steps=[
  {title:'Markaz ma’lumotlari',description:'Nomi, telefon raqami va manzilini kiriting.',href:'/settings/system',done:!!(settings?.centerName&&settings?.centerPhone&&settings?.centerAddress)},
  {title:'Birinchi filial',description:'O‘quv markazingiz joylashgan filialni qo‘shing.',href:'/branches',done:has('branches')},
  {title:'Xonalar',description:'Xona nomi va o‘quvchi sig‘imini belgilang.',href:'/group/rooms',done:has('rooms')},
  {title:'Kurslar',description:'O‘qitiladigan kurs va uning narxini kiriting.',href:'/course/courses',done:has('courses')},
  {title:'Kassa',description:'To‘lovlarni hisobga olish uchun kassa oching.',href:'/finance/cash',done:has('cash')},
  {title:'Birinchi o‘quvchi',description:'O‘quvchi ma’lumotlarini ro‘yxatga qo‘shing.',href:'/students/student-list',done:has('students')},
 ];
 const completed=steps.filter(s=>s.done).length;
 if(completed===steps.length)return null;
 return <section className="panel" aria-label="Dastlabki sozlash" style={{padding:20,marginBottom:20}}>
  <div className="section-heading"><div><h2>EDUKA’ga xush kelibsiz</h2><p>Markazingizni ishga tayyorlash uchun quyidagi bosqichlarni bajaring.</p></div><strong aria-live="polite">{completed}/{steps.length}</strong></div>
  <progress value={completed} max={steps.length} aria-label="Sozlash jarayoni" style={{width:'100%',accentColor:'#1847FF',margin:'12px 0'}}/>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>{steps.map(step=><Link key={step.href} href={step.href} style={{display:'flex',alignItems:'center',gap:12,padding:14,border:'1px solid #E4E7EC',borderRadius:12}}>
   <CheckCircle2 size={22} aria-hidden="true" color={step.done?'#12B76A':'#667085'}/><div style={{flex:1}}><strong>{step.title}</strong><p style={{fontSize:12,marginTop:4}}>{step.done?'Bajarildi':step.description}</p></div><ChevronRight size={16}/>
  </Link>)}</div>
 </section>;
}
