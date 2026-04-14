
const KEY="mediatown_fit_tracker_v2";

function getStore(){
return JSON.parse(localStorage.getItem(KEY)||"{}");
}

function save(){
let store=getStore();
let today=new Date().toISOString().slice(0,10);

store[today]={
workout:document.getElementById("workout").checked,
walk:document.getElementById("walk").checked,
protein:document.getElementById("protein").checked,
cutoff:document.getElementById("cutoff").checked,
water:document.getElementById("water").value,
steps:document.getElementById("steps").value,
sleep:document.getElementById("sleep").value,
waist:document.getElementById("waist").value,
notes:document.getElementById("notes").value
};

localStorage.setItem(KEY,JSON.stringify(store));
document.getElementById("status").innerText="Saved.";
}

if("serviceWorker" in navigator){
navigator.serviceWorker.register("sw.js");
}
