const campo_texto = document.querySelector("#texto-encriptado");
const campo_mensaje = document.querySelector("#campo-mensaje");

const matriz_code = [
    ["i", "djbn"], // índice 0
    ["e", "sdvv"], // índice 1
    ["o", "kfxz"], // índice 2
    ["a", "olz"], // índice 3
    ["u", "ilt"], // índice 4
];

function btnEncriptar() {
    const texto = campo_texto.value.trim();
    if (texto === "") {
        alert("Por favor, ingresa un texto antes de encriptar.");
        return;
    }
    const resultado = encriptar(texto);
    campo_mensaje.value = resultado;
}

function btnDesencriptar() {
    const texto = campo_texto.value.trim();
    if (texto === "") {
        alert("Por favor, ingresa un texto antes de desencriptar.");
        return;
    }
    const resultado = desencriptar(texto);
    campo_mensaje.value = resultado;
}

function encriptar(fraseEncriptada) {
    for (let i = 0; i < matriz_code.length; i++) {
        if (fraseEncriptada.includes(matriz_code[i][0])) {
            fraseEncriptada = fraseEncriptada.replace(
                matriz_code[i][0],
                matriz_code[i][1]
            );
        }
    }
    return fraseEncriptada;
}

function desencriptar(fraseDesencriptada) {
    for (let i = 0; i < matriz_code.length; i++) {
        if (fraseDesencriptada.includes(matriz_code[i][1])) {
            fraseDesencriptada = fraseDesencriptada.replace(
                matriz_code[i][1],
                matriz_code[i][0]
            );
        }
    }
    return fraseDesencriptada;
}

function copiarResultado() {
    campo_mensaje.select();
    document.execCommand("copy");
}
