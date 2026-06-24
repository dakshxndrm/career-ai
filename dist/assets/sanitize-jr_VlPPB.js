function t(r,i=500){if(r==null)return"";let e=String(r);return e=e.replace(/```+/g,"").replace(/`/g,"'"),e=e.replace(/^\s*(system|assistant|user|developer)\s*:/gim,""),e=e.replace(/\b(ignore|disregard|forget)\b[^.\n]*\b(previous|above|earlier|prior|all)\b[^.\n]*\b(instruction|prompt|rule|context|message)s?\b/gi,"[removed]"),e=e.replace(/\byou are now\b/gi,"[removed]"),e=e.replace(/\bnew instructions?\b/gi,"[removed]"),e=e.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g," "),e=e.replace(/\n{3,}/g,`

`).replace(/[ \t]{2,}/g," ").trim(),e.length>i&&(e=e.slice(0,i)+"…"),e}export{t as s};
