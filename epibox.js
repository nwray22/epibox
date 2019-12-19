console.log('epibox.js loaded')

epibox=async function(){
    console.log(`epibox ini at ${Date()}`)
    epibox.readParms()
    epibox.getOauth()
    epibox.login()
}

epibox.login=async function(){
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
            epibox.msg(`> logged in session started at ${new Date(epibox.oauth.token.created_at)}`,'green')
            // is this a stale session?
            if(Date.now()-(epibox.oauth.token.created_at+epibox.oauth.token.expires_in*1000)>0){
                console.log('stale session, refreshing it')
                //delete localStorage.epiboxtoken
                epibox.refreshToken()
            }
            else{
                epibox.oauth.t=setInterval(epibox.refreshToken,parseInt(epibox.oauth.token.expires_in*900)) // refresh when 90% of the validity is gone        
            }
        }
    }
            
}

epibox.refreshToken=async function(){
    console.log('refreshing token at '+Date())
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
    return `session refreshed at ${new Date(epibox.oauth.token.created_at)}`
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

epibox.msg=function(hm,color="blue",dt=20){
    console.log(hm)
    let msg = document.getElementById('msg')
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