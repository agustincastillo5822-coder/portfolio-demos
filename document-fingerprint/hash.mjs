import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function fingerprint(path){
  if(!(await stat(path)).isFile())throw new Error('Expected a regular file');
  const hash=createHash('sha256');
  for await(const chunk of createReadStream(path))hash.update(chunk);
  return hash.digest('hex');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const [path,expected,...extra]=process.argv.slice(2);
    if(!path||extra.length||expected!==undefined&&!/^[a-fA-F0-9]{64}$/.test(expected))throw new Error('Usage: node hash.mjs FILE [EXPECTED_SHA256]');
    const sha256=await fingerprint(path);
    const matches=expected===undefined?null:sha256===expected.toLowerCase();
    console.log(JSON.stringify({sha256,matches}));
    process.exitCode=matches===false?1:0;
  }catch(error){console.error(error.message);process.exitCode=2;}
}
