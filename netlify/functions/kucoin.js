// Same-origin proxy for public KuCoin Futures market data.
// No user credentials and no order placement.
exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return {statusCode:405,body:'Method not allowed'};
  const headers={'Content-Type':'application/json','Cache-Control':'public, max-age=10'};
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8500);
  try {
    const paths=['/api/v1/contracts/active','/api/v1/allTickers'];
    const response=await Promise.all(paths.map(async path=>{
      const r=await fetch('https://api-futures.kucoin.com'+path,{signal:controller.signal,headers:{'Accept':'application/json'}});
      if(!r.ok)throw Error('KuCoin '+path+' HTTP '+r.status);
      const json=await r.json();
      if(json.code!=='200000'||!Array.isArray(json.data))throw Error('Invalid KuCoin response at '+path);
      return json.data;
    }));
    return {statusCode:200,headers,body:JSON.stringify({ok:true,source:'KuCoin Futures',at:Date.now(),contracts:response[0],tickers:response[1]})};
  }catch(e){
    return {statusCode:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({ok:false,error:e.name==='AbortError'?'KuCoin upstream timeout':String(e.message)})};
  }finally{clearTimeout(timeout)}
};