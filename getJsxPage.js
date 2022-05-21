export default async function f(link) {
  let isComponent = false;
  if (link.startsWith("/components/")) isComponent = true;
  let r = await fetch("/jsx" + link);
  r = await r.text();
  if(isComponent) {
    return r;
  }
  else{
      for(let c of jsx.components){
          if(r.includes(`<${c}`)){
              let cc = await f(`/components/${c}.jsx`);
              r = r.replaceAll(`<${c} />`, cc);
              return eval(`html\`${r}\``);
          }
      }
  }
}