import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const LIMIT=16_384;
export function createApi(path='requests.sqlite') {
  const db=new DatabaseSync(path);
  db.exec('CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, payload TEXT NOT NULL, created TEXT NOT NULL)');
  function send(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
  function record(row){return {id:row.id,...JSON.parse(row.payload),status:'queued',createdAt:row.created};}
  const server=createServer(async(req,res)=>{
    try {
      if(req.method==='GET' && /^\/requests\/[a-f0-9-]{36}$/.test(req.url??'')) {
        const row=db.prepare('SELECT * FROM requests WHERE id=?').get(req.url.slice(10));
        return send(res,row?200:404,row?record(row):{error:'not_found'});
      }
      if(req.method!=='POST'||req.url!=='/requests')return send(res,404,{error:'not_found'});
      if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')return send(res,415,{error:'json_required'});
      let size=0, chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>LIMIT){send(res,413,{error:'body_too_large'});req.resume();return;}chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(res,400,{error:'invalid_json'});}
      const key=req.headers['idempotency-key'];
      if(typeof key!=='string'||! /^[A-Za-z0-9_-]{1,80}$/.test(key))return send(res,400,{error:'invalid_idempotency_key'});
      if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).some(k=>!['title','kind'].includes(k))||typeof body.title!=='string'||body.title.trim().length<1||body.title.trim().length>120||!['report','integration','review'].includes(body.kind))return send(res,400,{error:'invalid_request'});
      const payload=JSON.stringify({title:body.title.trim(),kind:body.kind});
      // Synchronous transaction-free pair is atomic within this single Node process.
      // The UNIQUE key also prevents duplicate rows at database level.
      const existing=db.prepare('SELECT * FROM requests WHERE key=?').get(key);
      if(existing)return send(res,existing.payload===payload?200:409,existing.payload===payload?record(existing):{error:'idempotency_conflict'});
      const row={id:randomUUID(),key,payload,created:new Date().toISOString()};
      db.prepare('INSERT INTO requests VALUES (?,?,?,?)').run(row.id,key,payload,row.created);
      return send(res,201,record(row));
    }catch(error){if(!res.headersSent)send(res,500,{error:'internal_error'});else res.end();}
  });
  server.requestTimeout=10_000;server.headersTimeout=10_000;
  return {get url(){return `http://127.0.0.1:${server.address().port}`;},listen(port=0){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});},close(){return new Promise(resolve=>server.close(()=>{db.close();resolve();}));}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const api=createApi();await api.listen(8787);console.log(`Demo API: ${api.url} (local only)`);process.once('SIGINT',async()=>{await api.close();process.exit(0);});}
