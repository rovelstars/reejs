/* esm.sh - esbuild bundle(es-module-lexer@1.0.3) node production */
var s=new Uint8Array(new Uint16Array([1]).buffer)[0]===1;function F(Q,D="@"){if(!A)return l.then(()=>F(Q));let E=Q.length+1,B=(A.__heap_base.value||A.__heap_base)+4*E-A.memory.buffer.byteLength;B>0&&A.memory.grow(Math.ceil(B/65536));let w=A.sa(E-1);if((s?p:Y)(Q,new Uint16Array(A.memory.buffer,w,E)),!A.parse())throw Object.assign(new Error(`Parse error ${D}:${Q.slice(0,A.e()).split(`
`).length}:${A.e()-Q.lastIndexOf(`
`,A.e()-1)}`),{idx:A.e()});let U=[],N=[];for(;A.ri();){let C=A.is(),g=A.ie(),J=A.ai(),o=A.id(),K=A.ss(),k=A.se(),I;A.ip()&&(I=i(Q.slice(o===-1?C-1:C,o===-1?g+1:g))),U.push({n:I,s:C,e:g,ss:K,se:k,d:o,a:J})}for(;A.re();){let C=A.es(),g=A.ee(),J=A.els(),o=A.ele(),K=Q.slice(C,g),k=K[0],I=J<0?void 0:Q.slice(J,o),a=I?I[0]:"";N.push({s:C,e:g,ls:J,le:o,n:k==='"'||k==="'"?i(K):K,ln:a==='"'||a==="'"?i(I):I})}function i(C){try{return(0,eval)(C)}catch{}}return[U,N,!!A.f()]}function Y(Q,D){let E=Q.length,B=0;for(;B<E;){let w=Q.charCodeAt(B);D[B++]=(255&w)<<8|w>>>8}}function p(Q,D){let E=Q.length,B=0;for(;B<E;)D[B]=Q.charCodeAt(B++)}var A,l=WebAssembly.compile((L="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lApBACgC4AkhAkEBECYhAwJAAkACQEEAKAKUCiIEIAFHDQAgAxAlRQ0BCwJAAkACQAJAIANBKkYNACADQfsARw0BQQAgBEECajYClApBARAmIQRBACgClAohAQNAAkACQCAEQf//A3EiA0EiRg0AIANBJ0YNACADECgaQQAoApQKIQMMAQsgAxAYQQBBACgClApBAmoiAzYClAoLQQEQJhoCQCABIAMQKSIEQSxHDQBBAEEAKAKUCkECajYClApBARAmIQQLQQAoApQKIQMgBEH9AEYNAyADIAFGDQYgAyEBIANBACgCmApNDQAMBgsLQQAgBEECajYClApBARAmGkEAKAKUCiIDIAMQKRoMAgtBAEEAOgD4CQJAAkACQAJAAkACQCADQZ9/ag4MAggEAQgDCAgICAgFAAsgA0H2AEYNBAwHCyAEIARBDmpBAEEAEAIPC0EAIARBCmo2ApQKQQEQJhpBACgClAohBAtBACAEQRBqNgKUCgJAQQEQJiIEQSpHDQBBAEEAKAKUCkECajYClApBARAmIQQLQQAoApQKIQMgBBAoGiADQQAoApQKIgQgAyAEEAJBAEEAKAKUCkF+ajYClAoPCwJAIAQpAAJC7ICEg7COwDlSDQAgBC8BChAeRQ0AQQAgBEEKajYClApBARAmIQRBACgClAohAyAEECgaIANBACgClAoiBCADIAQQAkEAQQAoApQKQX5qNgKUCg8LQQAgBEEEaiIENgKUCgtBACAEQQRqIgM2ApQKQQBBADoA+AkCQANAQQAgA0ECajYClApBARAmIQRBACgClAohAyAEEChBIHJB+wBGDQFBACgClAoiBCADRg0EIAMgBCADIAQQAkEBECZBLEcNAUEAKAKUCiEDDAALC0EAQQAoApQKQX5qNgKUCg8LQQAgA0ECajYClAoLQQEQJiEEQQAoApQKIQMCQCAEQeYARw0AIANBAmpBnghBBhArDQBBACADQQhqNgKUCiAAQQEQJhAnIAJBEGpBzAkgAhshAwNAIAMoAgAiA0UNAiADQgA3AgggA0EQaiEDDAALC0EAIANBfmo2ApQKCw8LECILvgYBBH9BAEEAKAKUCiIAQQxqIgE2ApQKAkACQAJAAkACQAJAAkACQAJAAkBBARAmIgJBWWoOCAQCAQQBAQEDAAsgAkEiRg0DIAJB+wBGDQQLQQAoApQKIAFHDQJBACAAQQpqNgKUCg8LQQAoAogKQQAvAfwJIgJBA3RqIgFBACgClAo2AgRBACACQQFqOwH8CSABQQU2AgBBACgCgAovAQBBLkYNA0EAQQAoApQKIgFBAmo2ApQKQQEQJiECIABBACgClApBACABEAFBAEEALwH6CSIBQQFqOwH6CUEAKAKMCiABQQJ0akEAKALYCTYCAAJAIAJBIkYNACACQSdGDQBBAEEAKAKUCkF+ajYClAoPCyACEBhBAEEAKAKUCkECaiICNgKUCgJAAkACQEEBECZBV2oOBAECAgACC0EAQQAoApQKQQJqNgKUCkEBECYaQQAoAtgJIgEgAjYCBCABQQE6ABggAUEAKAKUCiICNgIQQQAgAkF+ajYClAoPC0EAKALYCSIBIAI2AgQgAUEBOgAYQQBBAC8B/AlBf2o7AfwJIAFBACgClApBAmo2AgxBAEEALwH6CUF/ajsB+gkPC0EAQQAoApQKQX5qNgKUCg8LQQBBACgClApBAmo2ApQKQQEQJkHtAEcNAkEAKAKUCiICQQJqQZYIQQYQKw0CQQAoAoAKLwEAQS5GDQIgACAAIAJBCGpBACgCvAkQAQ8LQQAvAfwJDQJBACgClAohAkEAKAKYCiEDA0AgAiADTw0FAkACQCACLwEAIgFBJ0YNACABQSJHDQELIAAgARAnDwtBACACQQJqIgI2ApQKDAALC0EAKAKUCiECQQAvAfwJDQICQANAAkACQAJAIAJBACgCmApPDQBBARAmIgJBIkYNASACQSdGDQEgAkH9AEcNAkEAQQAoApQKQQJqNgKUCgtBARAmGkEAKAKUCiICKQAAQuaAyIPwjcA2Ug0HQQAgAkEIajYClApBARAmIgJBIkYNAyACQSdGDQMMBwsgAhAYC0EAQQAoApQKQQJqIgI2ApQKDAALCyAAIAIQJwsPC0EAQQAoApQKQX5qNgKUCg8LQQAgAkF+ajYClAoPCxAiC0cBA39BACgClApBAmohAEEAKAKYCiEBAkADQCAAIgJBfmogAU8NASACQQJqIQAgAi8BAEF2ag4EAQAAAQALC0EAIAI2ApQKC5gBAQN/QQBBACgClAoiAUECajYClAogAUEGaiEBQQAoApgKIQIDQAJAAkACQCABQXxqIAJPDQAgAUF+ai8BACEDAkACQCAADQAgA0EqRg0BIANBdmoOBAIEBAIECyADQSpHDQMLIAEvAQBBL0cNAkEAIAFBfmo2ApQKDAELIAFBfmohAQtBACABNgKUCg8LIAFBAmohAQwACwuIAQEEf0EAKAKUCiEBQQAoApgKIQICQAJAA0AgASIDQQJqIQEgAyACTw0BIAEvAQAiBCAARg0CAkAgBEHcAEYNACAEQXZqDgQCAQECAQsgA0EEaiEBIAMvAQRBDUcNACADQQZqIAEgAy8BBkEKRhshAQwACwtBACABNgKUChAiDwtBACABNgKUCgtsAQF/AkACQCAAQV9qIgFBBUsNAEEBIAF0QTFxDQELIABBRmpB//8DcUEGSQ0AIABBKUcgAEFYakH//wNxQQdJcQ0AAkAgAEGlf2oOBAEAAAEACyAAQf0ARyAAQYV/akH//wNxQQRJcQ8LQQELLgEBf0EBIQECQCAAQYoJQQUQIw0AIABBlAlBAxAjDQAgAEGaCUECECMhAQsgAQuDAQECf0EBIQECQAJAAkACQAJAAkAgAC8BACICQUVqDgQFBAQBAAsCQCACQZt/ag4EAwQEAgALIAJBKUYNBCACQfkARw0DIABBfmpBpglBBhAjDwsgAEF+ai8BAEE9Rg8LIABBfmpBnglBBBAjDwsgAEF+akGyCUEDECMPC0EAIQELIAEL3gEBBH9BACgClAohAEEAKAKYCiEBAkACQAJAA0AgACICQQJqIQAgAiABTw0BAkACQAJAIAAvAQAiA0Gkf2oOBQIDAwMBAAsgA0EkRw0CIAIvAQRB+wBHDQJBACACQQRqIgA2ApQKQQBBAC8B/AkiAkEBajsB/AlBACgCiAogAkEDdGoiAkEENgIAIAIgADYCBA8LQQAgADYClApBAEEALwH8CUF/aiIAOwH8CUEAKAKICiAAQf//A3FBA3RqKAIAQQNHDQMMBAsgAkEEaiEADAALC0EAIAA2ApQKCxAiCwu0AwECf0EAIQECQAJAAkACQAJAAkACQAJAAkACQCAALwEAQZx/ag4UAAECCQkJCQMJCQQFCQkGCQcJCQgJCwJAAkAgAEF+ai8BAEGXf2oOBAAKCgEKCyAAQXxqQa4IQQIQIw8LIABBfGpBsghBAxAjDwsCQAJAAkAgAEF+ai8BAEGNf2oOAwABAgoLAkAgAEF8ai8BACICQeEARg0AIAJB7ABHDQogAEF6akHlABAkDwsgAEF6akHjABAkDwsgAEF8akG4CEEEECMPCyAAQXxqQcAIQQYQIw8LIABBfmovAQBB7wBHDQYgAEF8ai8BAEHlAEcNBgJAIABBemovAQAiAkHwAEYNACACQeMARw0HIABBeGpBzAhBBhAjDwsgAEF4akHYCEECECMPCyAAQX5qQdwIQQQQIw8LQQEhASAAQX5qIgBB6QAQJA0EIABB5AhBBRAjDwsgAEF+akHkABAkDwsgAEF+akHuCEEHECMPCyAAQX5qQfwIQQQQIw8LAkAgAEF+ai8BACICQe8ARg0AIAJB5QBHDQEgAEF8akHuABAkDwsgAEF8akGECUEDECMhAQsgAQs0AQF/QQEhAQJAIABBd2pB//8DcUEFSQ0AIABBgAFyQaABRg0AIABBLkcgABAlcSEBCyABCzABAX8CQAJAIABBd2oiAUEXSw0AQQEgAXRBjYCABHENAQsgAEGgAUYNAEEADwtBAQtOAQJ/QQAhAQJAAkAgAC8BACICQeUARg0AIAJB6wBHDQEgAEF+akHcCEEEECMPCyAAQX5qLwEAQfUARw0AIABBfGpBwAhBBhAjIQELIAELcAECfwJAAkADQEEAQQAoApQKIgBBAmoiATYClAogAEEAKAKYCk8NAQJAAkACQCABLwEAIgFBpX9qDgIBAgALAkAgAUF2ag4EBAMDBAALIAFBL0cNAgwECxAqGgwBC0EAIABBBGo2ApQKDAALCxAiCws1AQF/QQBBAToA5AlBACgClAohAEEAQQAoApgKQQJqNgKUCkEAIABBACgCxAlrQQF1NgL0CQtJAQN/QQAhAwJAIAAgAkEBdCICayIEQQJqIgBBACgCxAkiBUkNACAAIAEgAhArDQACQCAAIAVHDQBBAQ8LIAQvAQAQHiEDCyADCz0BAn9BACECAkBBACgCxAkiAyAASw0AIAAvAQAgAUcNAAJAIAMgAEcNAEEBDwsgAEF+ai8BABAeIQILIAILaAECf0EBIQECQAJAIABBX2oiAkEFSw0AQQEgAnRBMXENAQsgAEH4/wNxQShGDQAgAEFGakH//wNxQQZJDQACQCAAQaV/aiICQQNLDQAgAkEBRw0BCyAAQYV/akH//wNxQQRJIQELIAELnAEBA39BACgClAohAQJAA0ACQAJAIAEvAQAiAkEvRw0AAkAgAS8BAiIBQSpGDQAgAUEvRw0EEBYMAgsgABAXDAELAkACQCAARQ0AIAJBd2oiAUEXSw0BQQEgAXRBn4CABHFFDQEMAgsgAhAfRQ0DDAELIAJBoAFHDQILQQBBACgClAoiA0ECaiIBNgKUCiADQQAoApgKSQ0ACwsgAgvCAwEBfwJAIAFBIkYNACABQSdGDQAQIg8LQQAoApQKIQIgARAYIAAgAkECakEAKAKUCkEAKAK4CRABQQBBACgClApBAmo2ApQKQQAQJiEAQQAoApQKIQECQAJAIABB4QBHDQAgAUECakGkCEEKECtFDQELQQAgAUF+ajYClAoPC0EAIAFBDGo2ApQKAkBBARAmQfsARg0AQQAgATYClAoPC0EAKAKUCiICIQADQEEAIABBAmo2ApQKAkACQAJAQQEQJiIAQSJGDQAgAEEnRw0BQScQGEEAQQAoApQKQQJqNgKUCkEBECYhAAwCC0EiEBhBAEEAKAKUCkECajYClApBARAmIQAMAQsgABAoIQALAkAgAEE6Rg0AQQAgATYClAoPC0EAQQAoApQKQQJqNgKUCgJAQQEQJiIAQSJGDQAgAEEnRg0AQQAgATYClAoPCyAAEBhBAEEAKAKUCkECajYClAoCQAJAQQEQJiIAQSxGDQAgAEH9AEYNAUEAIAE2ApQKDwtBAEEAKAKUCkECajYClApBARAmQf0ARg0AQQAoApQKIQAMAQsLQQAoAtgJIgEgAjYCECABQQAoApQKQQJqNgIMC20BAn8CQAJAA0ACQCAAQf//A3EiAUF3aiICQRdLDQBBASACdEGfgIAEcQ0CCyABQaABRg0BIAAhAiABECUNAkEAIQJBAEEAKAKUCiIAQQJqNgKUCiAALwECIgANAAwCCwsgACECCyACQf//A3ELqwEBBH8CQAJAQQAoApQKIgIvAQAiA0HhAEYNACABIQQgACEFDAELQQAgAkEEajYClApBARAmIQJBACgClAohBQJAAkAgAkEiRg0AIAJBJ0YNACACECgaQQAoApQKIQQMAQsgAhAYQQBBACgClApBAmoiBDYClAoLQQEQJiEDQQAoApQKIQILAkAgAiAFRg0AIAUgBEEAIAAgACABRiICG0EAIAEgAhsQAgsgAwtyAQR/QQAoApQKIQBBACgCmAohAQJAAkADQCAAQQJqIQIgACABTw0BAkACQCACLwEAIgNBpH9qDgIBBAALIAIhACADQXZqDgQCAQECAQsgAEEEaiEADAALC0EAIAI2ApQKECJBAA8LQQAgAjYClApB3QALSQEDf0EAIQMCQCACRQ0AAkADQCAALQAAIgQgAS0AACIFRw0BIAFBAWohASAAQQFqIQAgAkF/aiICDQAMAgsLIAQgBWshAwsgAwsL1gECAEGACAu4AQAAeABwAG8AcgB0AG0AcABvAHIAdABlAHQAYQBmAHIAbwBtAHMAcwBlAHIAdAB2AG8AeQBpAGUAZABlAGwAZQBjAG8AbgB0AGkAbgBpAG4AcwB0AGEAbgB0AHkAYgByAGUAYQByAGUAdAB1AHIAZABlAGIAdQBnAGcAZQBhAHcAYQBpAHQAaAByAHcAaABpAGwAZQBmAG8AcgBpAGYAYwBhAHQAYwBmAGkAbgBhAGwAbABlAGwAcwAAQbgJCxABAAAAAgAAAAAEAAAgOQAA",typeof Buffer<"u"?Buffer.from(L,"base64"):Uint8Array.from(atob(L),Q=>Q.charCodeAt(0)))).then(WebAssembly.instantiate).then(({exports:Q})=>{A=Q}),L;export{l as init,F as parse};