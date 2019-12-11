console.log('epibox.js loaded')

epibox=async function(){
    console.log(`epibox ini at ${Date()}`)
    epibox.readParms()
    epibox.getOauth()
}

epibox.login=function(){
    
}

epibox.getOauth=function(uri=location.origin){
    console.log(`oauth for ${location.origin}`)
    switch(uri){
        case 'http://localhost:8000':
            epibox.oauth={
                id:'52zad6jrv5v52mn1hfy1vsjtr9jn5o1w',
                token:'2rHTqzJumz8s9bAjmKMV83WHX1ooN4kT'
            }
            break
        case 'https://episphere.github.io':
            epibox.oauth={
                id:'1n44fu5yu1l547f2n2fgcw7vhps7kvuw',
                token:'2ZYzmHXGyzBcjZ9d1Ttsc1d258LiGGVd'
            }
            break
        default:
            Error(`no auth found for ${location.origin}`)
    }
}

epibox.readParms=function(str=location.hash+location.search){
    str=str.replace(/[\?\#]/g,'&').replace(/^\&/,'')
    epibox.parms={}
    str.split('&').forEach(aa=>{
        aa = aa.split('=')
        epibox.parms[aa[0]]=aa[1]
    })
}