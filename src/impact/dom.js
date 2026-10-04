/* IMPACT-EDIT: safe DOM builders replacing innerHTML with dynamic content (AGENTS.md rule).
   They build the same elements, classes and inline styles the legacy HTML strings produced. */
function appendAll(el,children){
  for(var i=0;i<children.length;i++){
    var c=children[i];
    if(c===null||c===undefined||c===false)continue;
    el.appendChild(typeof c==='object'?c:document.createTextNode(String(c)));
  }
}
export function h(tag,opts,children){
  var el=document.createElement(tag);
  if(opts&&opts.cls)el.className=opts.cls;
  if(opts&&opts.style)el.setAttribute('style',opts.style);
  if(children)appendAll(el,children);
  return el;
}
export function setChildren(el,children){
  el.textContent='';
  appendAll(el,children);
}
export function cloneAll(children){
  return children.map(function(c){return c&&typeof c==='object'?c.cloneNode(true):c;});
}
