console.log('epibox.js loaded')

epibox=async function(){
    console.log(`epibox ini at ${Date()}`)
    epibox.readParms()
    //epibox.getOauth()
    epibox.login()
}

epibox.login=async function(){
    epibox.getOauth()
    // look for token infoin localStorage
    if(localStorage.epiboxtoken){epibox.oauth.token=JSON.parse(localStorage.epiboxtoken)} // remove if localStorage persistence undesirable
    if(epibox.parms.code){ // dance first step taken
        epibox.oauth.token = await (await fetch('https://api.box.com/oauth2/token',{
            method:"POST",
            body:`grant_type=authorization_code&code=${epibox.parms.code}&client_id=${epibox.oauth.client_id}&client_secret=${epibox.oauth.client_secret}`
        })).json()
        epibox.oauth.token.initiated_at=epibox.oauth.token.created_at=Date.now()
        epibox.oauth.token.client_id=epibox.oauth.client_id
        epibox.oauth.token.client_secret=epibox.oauth.client_secret
    }
    if(!epibox.oauth.token){ // start dance
        location.href=`https://account.box.com/api/oauth2/authorize?client_id=${epibox.oauth.client_id}&response_type=code&redirect_uri=${location.origin+location.pathname}`
    }else{ // clean url code
        if(location.search.length>2){
            localStorage.epiboxtoken=JSON.stringify(epibox.oauth.token)
            location.href=location.origin+location.pathname
        }else{
            //delete localStorage.epiboxtoken
            //alert('logged in')
            epibox.msg(`> logged in session last updated at ${new Date(epibox.oauth.token.created_at)}`,'green')
        }
    }
            
}

epibox.logout=async function(){
    let res = fetch('https://api.box.com/oauth2/revoke',{
        method:"POST",
        mode:"no-cors",
        body:`client_id=${epibox.oauth.client_id}&client_secret=${epibox.oauth.client_secret}&token=${epibox.oauth.token.access_token}`
    }).then(function(){
        localStorage.removeItem('epiboxtoken')
        delete epibox.oauth
        epibox.msg('> logged out of session, please make sure all epibox applications are closed','red')
    })
    return res
}

epibox.refreshToken=async function(){
    epibox.msg('refreshing token ...')
    let token = await (await fetch('https://api.box.com/oauth2/token',{
        method:"POST",
        body:`grant_type=refresh_token&refresh_token=${epibox.oauth.token.refresh_token}&client_id=${epibox.oauth.client_id}&client_secret=${epibox.oauth.client_secret}`
    })).json()
    token.created_at=Date.now()
    token.initiated_at=epibox.oauth.token.initiated_at
    token.client_id=epibox.oauth.client_id
    token.client_secret=epibox.oauth.client_secret
    epibox.oauth.token=token
    localStorage.epiboxtoken=JSON.stringify(epibox.oauth.token)
    let msg = `> session refreshed at ${new Date(epibox.oauth.token.created_at)}`
    if(token.error){
        msg = `> ${token.error} caused by ${token.error_description}`
        epibox.msg(msg,'red')
    }else{epibox.msg(msg,'green')}
    return msg
}

epibox.getOauth=function(uri=location.origin){
    //console.log(`oauth for ${location.origin}`)
    switch(uri){
        case 'http://localhost:8000':
            epibox.oauth={
                client_id:'52zad6jrv5v52mn1hfy1vsjtr9jn5o1w',
                client_secret:'2rHTqzJumz8s9bAjmKMV83WHX1ooN4kT'
            }
            break
        case 'https://episphere.github.io':
            epibox.oauth={
                client_id:'1n44fu5yu1l547f2n2fgcw7vhps7kvuw',
                client_secret:'2ZYzmHXGyzBcjZ9d1Ttsc1d258LiGGVd'
            }
            break
        default:
            epibox.msg(`> no auth found for ${location.origin}`,'red')
            //Error(`no auth found for ${location.origin}`)
    }
}

epibox.checkToken= async function(){ // check token, refresh if needed
    if(!epibox.oauth){ // this is being used from a non epbox context
        let token=undefined
        if(localStorage.epiboxtoken){
            token = JSON.parse(localStorage.epiboxtoken)
        }     
        if(!token){
            epibox.msg(`> you don't have an active epibox session, please <a href="${location.origin}/epibox" target="_blank">start one here</a>.`,'red')
        }else{
            epibox.oauth={
                client_id:token.client_id,
                client_secret:token.client_secret,
                token:token
            }
            if(Date.now()-(epibox.oauth.token.created_at+epibox.oauth.token.expires_in*1000-10000)>0){ // refresh at 10secs before expiration
                await epibox.refreshToken()
            }
        }
    }
    if(epibox.oauth){
        epibox.oauth.token.initiated_at=epibox.oauth.token.initiated_at||epibox.oauth.token.created_at
        epibox.msg(`> oauth session active,\n initiated at ${new Date(epibox.oauth.token.initiated_at)},\n last refreshed at ${new Date(epibox.oauth.token.created_at)}.`)
    }
}

epibox.readParms=function(str=location.search){ // by default reads search only, for hash as well one could do (location.hash+location.search)
    str=str.replace(/[\?\#]/g,'&').replace(/^\&/,'')
    //epibox.parms=JSON.parse(localStorage.epibox||'{}')
    epibox.parms={}
    str.split('&').forEach(aa=>{
        aa = aa.split('=')
        epibox.parms[aa[0]]=aa[1]
    })
    //localStorage.epibox=JSON.stringify(epibox.parms)
}

epibox.msg=function(hm,color="blue",dt=1){ // default is as fast as possible
    console.log(hm)
    let msg = document.getElementById('epibox_msg')
    if(msg){
        msg.style.color=color
        msg.innerHTML=''
        if(epibox.msg.t){clearInterval(epibox.msg.t)} // interrupt previous message if not completed
        let i=0
        epibox.msg.t=setInterval(_=>{
            //msg.innerHTML+=hm[i]
            msg.innerHTML=hm.slice(0,i)
            i++
            if(i>hm.length){clearInterval(epibox.msg.t)}
        },dt)
    }
}