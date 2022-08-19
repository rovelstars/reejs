let { h } = await Import("preact");
let htm = await Import('htm');
if(!htm.bind) htm.bind = htm.default.b;
let html = htm.bind(h);
export default "hmm";