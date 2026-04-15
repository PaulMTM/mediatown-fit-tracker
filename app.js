
const KEY="mt_fit_tracker_data";

function load(){
const data=JSON.parse(localStorage.getItem(KEY)||"{}");

Object.keys(data).forEach(k=>{
const el=document.getElementById(k);
if(!el)return;

if(el.type==="checkbox"){
el.checked=data[k];
}else{
el.value=data[k];
}
});
}

function save(){
const fields=["workout","walk","protein","cutoff","water","steps","sleep","waist","notes"];
let data={};

fields.forEach(f=>{
const el=document.getElementById(f);
if(el.type==="checkbox"){
data[f]=el.checked;
}else{
data[f]=el.value;
}
});

localStorage.setItem(KEY,JSON.stringify(data));

document.getElementById("status").innerText="Saved.";
}

window.onload=load;
