'use client';
import {useState} from 'react';
import {requests,filterRequests,type Status} from '../lib/requests';
const labels={pending:'Pendiente',active:'En curso',done:'Completada'};
export default function Home(){
 const [query,setQuery]=useState('');const [status,setStatus]=useState<Status|'all'>('all');const rows=filterRequests(requests,query,status);
 return <main><header><h1>Panel de solicitudes</h1><p>Demostración con datos ficticios. No ejecuta tareas reales.</p></header>
 <section className="filters" aria-label="Filtros de solicitudes"><label>Buscar<input value={query} onChange={e=>setQuery(e.target.value)} type="search"/></label><label>Estado<select value={status} onChange={e=>setStatus(e.target.value as Status|'all')}><option value="all">Todos</option><option value="pending">Pendiente</option><option value="active">En curso</option><option value="done">Completada</option></select></label><button onClick={()=>{setQuery('');setStatus('all');}}>Restablecer</button></section>
 <div className="table-wrap"><table><caption className="sr-only">Solicitudes ficticias</caption><thead><tr><th scope="col">Solicitud</th><th scope="col">Tipo</th><th scope="col">Estado</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.title}</td><td>{row.kind}</td><td><span className={'status '+row.status}>{labels[row.status]}</span></td></tr>)}{rows.length===0&&<tr><td colSpan={3}>No hay solicitudes que coincidan. Probá otro filtro.</td></tr>}</tbody></table></div><footer role="status" aria-live="polite">{rows.length} {rows.length===1?'resultado':'resultados'}</footer></main>;
}
