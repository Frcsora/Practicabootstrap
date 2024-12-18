let turno = 1;
let turnos = [];
const fechaInicio = new Date().toLocaleString("es-ES");

function enviarInfoAlServidor(partida){
    fetch("ddbbsaving.php",{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(partida)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta el servidor: ", data)
    })
    .catch(error => {
        console.error('Error al enviar los datos: ', error);
    });
}
function generarObjeto(fechaFinal) {
    return {
        fecha: fechaInicio,
        fechaFinal: fechaFinal,
        listaTurnos: turnos,
        ganador: player ? "negro" : "blanco"
    }
}
function generarTurno(casillaOrigen, casillaDestino){
    let [x,y] = tomarCoordenadas(casillaOrigen)
    let [a,b] = tomarCoordenadas(casillaDestino)
    const letras =['a','b','c','d','e','f','g','h' ]
    const piece = buscarTipo(casillaOrigen)
    const piezaMap = {
        "peon": 'p',
        "alfil": 'a',
        "reina": 'r',
        "rey": 'R',
        "torre": 't',
        "caballo": 'c'
    }
    x = letras[x]
    a = letras[a]
    const turnoObj = {
        numero: turno,
        color: turno % 2 != 0 ? "blanco" : "negro",
        movimiento: piezaMap[piece] + "" + x + "" + (y + 1) + "" + a + "" + (b + 1)
    }
    turnos.push(turnoObj);
}
let fin = false;
let player = true;
const dimension = 8;
let casillaSeleccionada = undefined;
contador = 0 ;
document.getElementById("tablero").addEventListener("click", (event) => {
    let seleccion = event.target;
    if(seleccion.parentNode && (seleccion.parentNode.classList.contains("blanco") || seleccion.parentNode.classList.contains("negro"))){
        seleccion = seleccion.parentNode;
    }
    if(seleccion.parentNode && seleccion.parentNode.classList.contains("casillas")){
        seleccion = seleccion.parentNode;
    }
    if(seleccion.classList.contains("casillas") && !fin){

        if(casillaSeleccionada === undefined && seleccion.hasChildNodes() && seleccion.firstChild.classList.contains(player ? "blanco" : "negro")){
            seleccion.classList.add("active");
            casillaSeleccionada = seleccion;
        }else if(casillaSeleccionada !== undefined){
            if(seleccion.id === casillaSeleccionada.id){
                casillaSeleccionada.classList.remove("active");
                casillaSeleccionada = undefined;
                turno--;
            }else if(casillaSeleccionada.firstChild.classList.contains("rey")
                && (seleccion.hasChildNodes() && seleccion.firstChild.classList.contains("torre")) && validarEnroque(casillaSeleccionada, seleccion)){
                enroque(casillaSeleccionada, seleccion);
                generarTurno(casillaSeleccionada, seleccion);
            }else if(esFinalCamino(casillaSeleccionada, seleccion)){
                peonBecomesQueen(casillaSeleccionada, seleccion);
                generarTurno(casillaSeleccionada, seleccion);
                player = !player;
                casillaSeleccionada = undefined;
            }else if(seleccion.hasChildNodes() && seleccion.firstChild.classList.contains(player ? "blanco" : "negro")){
                casillaSeleccionada.classList.remove("active");
                seleccion.classList.add("active");
                turno--;
                casillaSeleccionada = seleccion;
            }else if(probarMovimiento(casillaSeleccionada, seleccion, casillaSeleccionada) && (!seleccion.hasChildNodes() || (seleccion.hasChildNodes() && seleccion.firstChild.classList.contains(!player ? "blanco" : "negro")))){
                generarTurno(casillaSeleccionada,seleccion)
                mover(casillaSeleccionada, seleccion);
                player = !player;
            }else{
                casillaSeleccionada.classList.remove("active");
                casillaSeleccionada = undefined;
                turno--;
            }
            if(jaquemate()){
                const jugador = player ? "negras" : "blancas";
                alert(`ganador fichas ${jugador}`);
                fin = true;
                const fechaFinal = new Date().toLocaleString("es-ES");
            }
            turno++;
        }
    }else{
        //asi no saltan errores xD
    }
})

function tomarCoordenadas(casilla) {
    const coords = casilla.id.slice(7);
    const x = parseInt(coords.charAt(0));
    const y = parseInt(coords.charAt(1));
    return [x, y];
}
function mover(casillaOrigen, casillaDestino){

    if(casillaDestino.hasChildNodes()){
        casillaDestino.removeChild(casillaDestino.firstChild);
    }

    const copia = casillaOrigen.firstChild.cloneNode(true);
    casillaDestino.appendChild(copia);
    casillaOrigen.removeChild(casillaOrigen.firstChild);
    casillaOrigen.classList.remove("active");
    casillaSeleccionada = undefined;
}
function buscarTipo(casilla){
    if (casilla === null) return ""
    for(let i = 0 ; i < piezas.length ; i++){
        if(casilla.hasChildNodes() && casilla.firstChild.classList.contains(piezas[i].tipo)){ return piezas[i].tipo }
    }
    return ""
}
function validar(casillaOrigen, casillaDestino, tipo){
    //llamamos a la validación según el tipo de pieza
    //si es la reina tendrá que pasar por la validación de alfil y de torre
    //el rey tiene también la validación del enroque
    if(tipo === "peon"){
        if(validarPeon(casillaOrigen, casillaDestino)){
            return true
        }
    }
    if(tipo === "caballo"){

        if(validarCaballo(casillaOrigen, casillaDestino)){
            return true
        }
    }
    if(tipo === "alfil" || tipo === "reina"){
        if (validarAlfil(casillaOrigen, casillaDestino)) {
            return true
        }
    }
    if(tipo === "torre" || tipo === "reina"){
        if (validarTorre(casillaOrigen, casillaDestino)) {
            return true
        }
    }
    if(tipo === "rey"){
        if(validarRey(casillaOrigen, casillaDestino || validarEnroque(casillaOrigen, casillaDestino))){
            return true
        }
    }
    return false
}
function validarRey(casillaOrigen, casillaDestino){

    const [x, y] = tomarCoordenadas(casillaOrigen)
    const [a, b] = tomarCoordenadas(casillaDestino)
    //La diferencia en ambos ejes debe ser 0 o 1
    if(Math.abs(x - a) <= 1 && Math.abs(y - b) <=1){
        return true
    }
    return false
}
function validarPeon(casillaOrigen, casillaDestino, esPeon = false){
    const [x, y] = tomarCoordenadas(casillaOrigen);
    const [a, b] = tomarCoordenadas(casillaDestino);

    const valor = player ? -1 : 1;//blancas mueven hacia -1(arriba) negras +1(abajo)
    const inicio = player ? 6 : 1;//fila inicial de los peones
    if(!esPeon){
        let siguienteCasilla = document.getElementById("casilla" + (x + valor) + "" + y)
        if((((x + valor === a && y === b) || (x === inicio && x + (valor * 2) === a && y === b)) && !siguienteCasilla.hasChildNodes() && !casillaDestino.hasChildNodes())
            || (x + valor === a && (y + valor === b || y + (valor * -1) === b) && casillaDestino.hasChildNodes())){
            /**Condiciones para que los peones se muevan
             * 1. que solo cambie el eje x en 1 hacia el lado que toque segun quien
             * sea el jugador y no la casilla de destino este vacia
             * 2. que la posición sea la inicial y el cambio sea en 2 en el eje X
             * si no tienen ocupado la casilla enfrente y la casilla de destino este vacia
             * 3.que el cambio sea de 1 sobre el eje X en la direccion correcta
             * y de 1 en el Y, estando ocupada la casilla de destino
             */
            return true
        }
    }

    if(esPeon){
        /**Este caso esta reservado para la comprobacion del jaquemate,
         * en que se comprueban los posibles movimientos de ambos equipos
         * por eso le doy la vuelta al valor multiplicando * -1 porque
         * al llamarse esta función en el momento de comprobar el jaquemate tiene
         * el turno el equipo rival*/
        if(x + (valor * -1) === a && (y + valor === b || y + (valor * -1) === b) && casillaDestino.hasChildNodes()){
            return true
        }

    }
    return false
}
function validarCaballo(casillaOrigen, casillaDestino){

    const [x, y] = tomarCoordenadas(casillaOrigen)
    const [a, b] = tomarCoordenadas(casillaDestino)

    const d1 = Math.abs(x - a)
    const d2 = Math.abs(y - b)
    //El valor absoluto debe cambiar en 1 sobre un eje y 2 sobre el otro
    if((d1 == 1 && d2 == 2) || (d1 == 2 && d2 == 1)){
        return true
    }
    return false
}
function validarAlfil(casillaOrigen, casillaDestino){
    const [x, y] = tomarCoordenadas(casillaOrigen)
    const [a, b] = tomarCoordenadas(casillaDestino)
    /**
     * El valor absoluto de la diferencia sobre un eje debe ser igual al valor
     * absoluto de la diferencia sobre el otro
     */
    if(Math.abs(x - a) == Math.abs(y - b)){
        /**Comprobamos hacia donde nos tenemos que mover sobre cada eje para
         * comprobar
         */
        const dx = (a > x) ? 1 : -1;
        const dy = (b > y) ? 1 : -1;
        let c = x + dx;
        let c2 = y + dy;

        while (c !== a && c2 !== b) {
            /**Comprobamos todas las casillas que hay por enmedio, moviendo
             * en las direcciones preestablecidas
             */
            const casilla = document.getElementById("casilla" + c + "" + c2);
            if (casilla.hasChildNodes()) {
                return false
            }
            c += dx;
            c2 += dy;
        }
        return true
    }
    return false
}

function validarTorre(antiguo, casillaDestino) {
    let [x, y] = tomarCoordenadas(antiguo);
    let [a, b] = tomarCoordenadas(casillaDestino);

    if ((x == a || y == b)) {
        let obstaculo = false;
        if (x != a) {
            let c = Math.min(x, a);
            let d = Math.max(x, a);
            for (let i = c + 1; i < d; i++) {
                let casilla = document.getElementById("casilla" + i + b);
                if (casilla.hasChildNodes()) {
                    obstaculo = true;
                    break;
                }
            }
        } else {
            let c = Math.min(y, b);
            let d = Math.max(y, b);
            for (let i = c + 1; i < d; i++) {
                let casilla = document.getElementById("casilla" + a + i);
                if (casilla.hasChildNodes()) {
                    obstaculo = true;
                    break;
                }
            }
        }
        if (!obstaculo) {
            return true
        }
    }
    return false
}
function validarEnroque(rey, torre){

    let [x,y] = tomarCoordenadas(rey)
    let [a,b] = tomarCoordenadas(torre)
    //tomamos coordenadas de la posicion de rey y de torre

    const comprobacion = y < b ? 1 : -1

    //si y(coordenada horizontal del rey) es menor que b(coordinada horizontal de la torre), significa que la torre esta a la derecha del rey
    //en ese caso el movimiento del rey sera hacia la derecha por tanto, aumentara el valor de la coordenada, mientras que para la torre disminuira
    //en caso contrario sera alreves, ese cambio lo guardo en los valores cambioRey y cambioTorre
    //Por otra parte, para comprobar si las casillas de enmedio esta vacia, tendre que comprobar hacia la derecha(en positivo) o hacia la izquierda(en negativo)
    //por eso guardo ese cambio en comprobacion
    if((b == 0 || b==7) && ((rey.id == "casilla04" || rey.id == "casilla74") && a == x)){

        for(let i = y + comprobacion ; y < b ? i < b : i > b ; i += comprobacion){
            //empezamos desde i + comprobacion, que puede ser y + 1 O y + (-1) por tanto, empezaria por la casilla inmediatamente a la izquierda o a la derecha del rey
            //lo mismo pasa con el incremente, se ira haciendo i + 1 O i + (-1)a cada iteracion
            //la condicion de salida comprueba tambien que torre es, si la torre es la de la izquierda, como ira incrementando el valor de i hay que hacerlo
            //mientras sea menor que b, asi comprobaremos las casillas desde la derecha del rey hasta la izquierda de la torre
            //en caso contrario hay que hacerlo mientras i > b, ya que ira decreciendo
            let casilla = document.getElementById("casilla" + x + "" + i)

            if(casilla.hasChildNodes()){

                return false;
            }

        }

        return true

    }
    return false

}
function encontrarRey(){

    for(let a = 0; a <= 7; a++){
        for(let b = 0; b <= 7; b++){
            const currentCasilla = document.getElementById("casilla" + a + b);
            if(currentCasilla.hasChildNodes() && currentCasilla.firstChild.classList.contains("rey") &&
                currentCasilla.firstChild.classList.contains(player ? "blanco" : "negro")){
                return currentCasilla;
            }
        }
    }
    return ""
}
function jaque(){
    let casillaDestino = encontrarRey()

    for(let i = 0 ; i < 8 ; i++){
        for(let j = 0 ; j < 8 ; j++){

            const casillaOrigen = document.getElementById("casilla" + i + "" + j)
            esPeon = buscarTipo(casillaOrigen) == "peon" ? true : false
            if(!casillaOrigen.hasChildNodes() || casillaOrigen.firstChild.classList.contains(player ? "blanco" : "negro")){
                continue
            }
            if(casillaOrigen.hasChildNodes()
                && casillaOrigen.firstChild.classList.contains(player ? "negro" : "blanco")
                && validar(casillaOrigen, casillaDestino, buscarTipo(casillaOrigen))){
                esPeon = false
                return true
            }
        }
    }

    esPeon = false
    return false
}
function jaquemate(){
    if(contador >= 25){

        return true
    }
    for(let i = 0 ; i < 8 ; i++){
        for(let j = 0 ; j < 8 ; j++){

            const casillaOrigen = document.getElementById("casilla" + i + "" + j)
            if(!casillaOrigen.hasChildNodes() || casillaOrigen.firstChild.classList.contains(player ? "negro" : "blanco")){

                continue;
            }

            for(let k = 0 ; k < 8 ; k++){
                for(let l = 0 ; l < 8 ; l++){
                    const casillaDestino = document.getElementById("casilla" + k + "" + l)

                    if(probarMovimiento(casillaOrigen, casillaDestino, casillaSeleccionada)){
                        return false
                    }

                }
            }

        }
    }

    return true
}
function probarMovimiento(casillaOrigen, casillaDestino, seleccionada) {
    const piezaDestino = casillaDestino.firstChild ? casillaDestino.firstChild.cloneNode(true) : null;

    let esMovimientoValido = false;
    if (!casillaDestino.hasChildNodes()
        || casillaDestino.firstChild.classList.contains(player ? "negro" : "blanco")){
        if(validar(casillaOrigen, casillaDestino, buscarTipo(casillaOrigen))){
            mover(casillaOrigen, casillaDestino);

            if(!jaque()) {
                esMovimientoValido = true;
            }

            casillaSeleccionada = casillaOrigen;
            mover(casillaDestino, casillaOrigen);
            if (piezaDestino) {
                casillaDestino.appendChild(piezaDestino);
            }
        }

    }

    casillaSeleccionada = seleccionada;
    return esMovimientoValido;

}
function cuantasQuedan(){
    let cuenta = 0
    for(let i = 0 ; i < 8 ; i++){
        for(let j = 0 ; j < 8 ; j++){
            const casilla = document.getElementById("casilla" + i + "" + j)
            if(casilla.hasChildNodes() && casilla.firstChild.classList.contains(player ? "blanca" : "negra")){
                cuenta++
            }
        }
    }
    return cuenta;
}
function esFinalCamino(casillaOrigen, casillaDestino){
    const [a,b] = tomarCoordenadas(casillaDestino)
    if(buscarTipo(casillaOrigen) === "peon" && ((player && a == 0) || (!player && a == 7))){
        return true
    }
    return false
}
function peonBecomesQueen(casillaOrigen, casillaDestino){

    const [a,b] = tomarCoordenadas(casillaDestino)
    mover(casillaOrigen, casillaDestino)
    casillaDestino.removeChild(casillaDestino.firstChild)
    crearPieza(player ? piezas[8].tipo : piezas[9].tipo,
        player ? piezas[8].color : piezas[9].color,
        player ? piezas[8].imagen : piezas[9].imagen,
        a, b);
}
function empate(){
    if(contador >= 25){
        return true
    }
    return !jaque()
}

function enroque(rey, torre){
    const [x,y] = tomarCoordenadas(rey)
    const [a,b] = tomarCoordenadas(torre)

    let cambioRey = y < b ? 2 : -3
    let cambioTorre = y < b ? -2 : 2
    let casilla1 = document.getElementById("casilla" + x + "" + (b + cambioTorre));
    let casilla2 = document.getElementById("casilla" + x + "" + (y + cambioRey));

    casillaSeleccionada.classList.remove("active");
    mover(rey, casilla2);
    mover(torre, casilla1);
    player = !player;
}
function crearPieza(tipo, color, imagen, i, j) {
    const casilla = document.getElementById(`casilla${i}${j}`);
    casilla.innerHTML = imagen;
    const ficha = casilla.firstChild;
    ficha.classList.add(tipo, color);
}
addEventListener('DOMContentLoaded', () => inicializarTablero());
