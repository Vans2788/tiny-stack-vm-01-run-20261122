import {readFileSync as R,writeFileSync as W,mkdirSync as M,readdirSync as L} from"node:fs";
import {join as J} from"node:path";
const ID=process.env.MAKEFUN_INPUT_DIR||"/input",OD=process.env.MAKEFUN_OUTPUT_DIR||"/output";
// Per-opcode [immediate bytes, pops, pushes], indexed by opcode byte (-1 = unknown).
const IM=new Int8Array(256).fill(-1),PO=new Int8Array(256),PU=new Int8Array(256);
for(const [o,i,p,q] of [[0,0,0,0],[1,1,0,1],[2,4,0,1],[3,0,1,0],[4,0,1,2],[5,0,2,2],[6,0,2,3],[7,0,3,3],[16,0,2,1],[17,0,2,1],[18,0,2,1],[19,0,2,1],[20,0,2,1],[21,0,2,1],[22,0,2,1],[23,0,1,1],[24,0,2,1],[25,0,2,1],[26,0,2,1],[27,0,1,1],[28,0,2,1],[29,0,2,1],[30,0,2,1],[32,0,2,1],[33,0,2,1],[34,0,2,1],[48,2,0,0],[49,2,1,0],[50,2,1,0],[51,2,0,0],[52,0,0,0],[64,0,1,1],[65,0,2,0],[80,0,1,0],[81,0,1,0],[82,0,0,1],[83,0,1,0]] as const){IM[o]=i;PO[o]=p;PU[o]=q;}
function run(P:Buffer,I:Buffer):{o:Buffer,e:number}{
 const n=P.length,D=new Int32Array(256);let s=0;
 const C=new Int32Array(64);let c=0;
 const Mm=new Int32Array(256),out=new Uint8Array(65536);
 let pc=0,st=0,ip=0,ol=0;
 const done=(e:number)=>({o:Buffer.from(out.subarray(0,ol)),e});
 for(;;){
  if(st===1e6)return done(10);
  if(pc<0||pc>=n)return done(9);
  const op=P[pc],im=IM[op];
  if(im<0)return done(5);
  if(pc+im>=n)return done(9);
  st++;
  if(s<PO[op])return done(2);
  if(s-PO[op]+PU[op]>256)return done(3);
  const nx=pc+1+im;pc=nx;
  switch(op){
   case 0:return done(0);
   case 1:D[s++]=(P[nx-1]<<24)>>24;break;
   case 2:D[s++]=P[nx-4]|P[nx-3]<<8|P[nx-2]<<16|P[nx-1]<<24;break;
   case 3:s--;break;
   case 4:D[s]=D[s-1];s++;break;
   case 5:{const t=D[s-1];D[s-1]=D[s-2];D[s-2]=t;break;}
   case 6:D[s]=D[s-2];s++;break;
   case 7:{const a=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=a;break;}
   case 23:D[s-1]=-D[s-1]|0;break;
   case 27:D[s-1]=~D[s-1];break;
   case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{
    const b=D[s-1],a=D[s-2];let r=0;
    switch(op){
     case 16:r=(a+b)|0;break;
     case 17:r=(a-b)|0;break;
     case 18:r=Math.imul(a,b);break;
     case 19:if(b===0)return done(4);r=a===-2147483648&&b===-1?a:(a/b)|0;break;
     case 20:if(b===0)return done(4);r=b===-1?0:a%b;break;
     case 21:if(b===0)return done(4);r=Math.floor((a>>>0)/(b>>>0))|0;break;
     case 22:if(b===0)return done(4);r=(a>>>0)%(b>>>0)|0;break;
     case 24:r=a&b;break;
     case 25:r=a|b;break;
     case 26:r=a^b;break;
     case 28:r=a<<(b&31);break;
     case 29:r=a>>(b&31);break;
     case 30:r=(a>>>(b&31))|0;break;
     case 32:r=a===b?1:0;break;
     case 33:r=a<b?1:0;break;
     case 34:r=(a>>>0)<(b>>>0)?1:0;break;
    }
    s-=2;D[s++]=r;break;}
   case 48:case 49:case 50:{
    const rel=((P[nx-2]|P[nx-1]<<8)<<16)>>16;
    let take=true;
    if(op!==48){const v=D[--s];take=op===49?v===0:v!==0;}
    if(take)pc=nx+rel;break;}
   case 51:if(c===64)return done(7);C[c++]=nx;pc=P[nx-2]|P[nx-1]<<8;break;
   case 52:if(c===0)return done(8);pc=C[--c];break;
   case 64:{const a=D[s-1];if(a<0||a>255)return done(6);D[s-1]=Mm[a];break;}
   case 65:{const a=D[s-1],v=D[s-2];if(a<0||a>255)return done(6);s-=2;Mm[a]=v;break;}
   case 80:{const v=D[s-1];let u=v<0?(~v+1)>>>0:v,n=0;const t=new Uint8Array(10);
    if(u===0)t[n++]=48;else{let m=u;while(m>0){t[n++]=48+m%10;m=Math.floor(m/10);}}
    const len=n+(v<0?1:0);if(ol+len>65536)return done(11);s--;
    if(v<0)out[ol++]=45;while(n>0)out[ol++]=t[--n];break;}
   case 81:if(ol+1>65536)return done(11);out[ol++]=D[--s]&255;break;
   case 82:D[s++]=ip<I.length?I[ip++]:-1;break;
   case 83:return done(D[--s]&255);
  }
 }
}
for(const id of L(ID).sort()){
 const d=J(ID,id);let P:Buffer,I:Buffer;
 try{P=R(J(d,"program.bin"))}catch{continue}
 try{I=R(J(d,"input.bin"))}catch{I=Buffer.alloc(0)}
 const {o,e}=run(P,I),od=J(OD,id);
 M(od,{recursive:true});
 W(J(od,"stdout.bin"),o);
 W(J(od,"exit.txt"),e+"\n");
}
