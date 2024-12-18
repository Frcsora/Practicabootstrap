const menuBoton = document.getElementById("menuBoton")
const menu = document.getElementById("menu")
menuBoton.addEventListener('click', ()=>{
    if(menu.classList.contains("d-none")){
        menu.classList.remove("d-none");
        menu.classList.add("d-flex")
    }else{
        menu.classList.remove("d-flex");
        menu.classList.add("d-none");
    }
})