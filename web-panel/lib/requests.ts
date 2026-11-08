export type Status='pending'|'active'|'done';
export type RequestItem={id:string;title:string;kind:string;status:Status};
export const requests:RequestItem[]=[{id:'demo-1',title:'Revisar catálogo',kind:'Revisión',status:'pending'},{id:'demo-2',title:'Generar informe',kind:'Informe',status:'active'},{id:'demo-3',title:'Validar integración',kind:'Integración',status:'done'},{id:'demo-4',title:'Documentar API',kind:'Revisión',status:'pending'}];
export function filterRequests(items:RequestItem[],query:string,status:Status|'all'):RequestItem[]{const q=query.trim().toLocaleLowerCase('es');return items.filter(item=>(status==='all'||item.status===status)&&item.title.toLocaleLowerCase('es').includes(q));}
