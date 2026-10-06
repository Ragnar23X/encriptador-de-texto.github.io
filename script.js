'use strict';
const VERSION = 'VAULT1';
function encode64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decode64(text) {
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) throw new Error('Formato inválido.');
  const bytes = Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4)), c => c.charCodeAt(0));
  if (encode64(bytes) !== text) throw new Error('Formato inválido.');
  return bytes;
}
function requireCrypto() {
  if (!globalThis.crypto?.subtle) throw new Error('El cifrado requiere HTTPS o un entorno local seguro.');
}
async function encryptMessage(message) {
  requireCrypto();
  const key = await crypto.subtle.generateKey({name:'AES-GCM',length:256}, true, ['encrypt','decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(VERSION),tagLength:128},key,new TextEncoder().encode(message));
  return {message:`${VERSION}.${encode64(iv)}.${encode64(new Uint8Array(ciphertext))}`,key:encode64(new Uint8Array(await crypto.subtle.exportKey('raw',key)))};
}
async function decryptMessage(message, secret) {
  requireCrypto();
  const parts = message.trim().split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) throw new Error('El mensaje no tiene un formato VAULT válido.');
  const iv = decode64(parts[1]), ciphertext = decode64(parts[2]), rawKey = decode64(secret.trim());
  if (iv.length !== 12 || ciphertext.length < 16 || rawKey.length !== 32) throw new Error('El mensaje o la clave tienen un formato inválido.');
  const key = await crypto.subtle.importKey('raw',rawKey,'AES-GCM',false,['decrypt']);
  try {
    const plaintext = await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(VERSION),tagLength:128},key,ciphertext);
    return new TextDecoder('utf-8',{fatal:true}).decode(plaintext);
  } catch { throw new Error('No se pudo descifrar: la clave es incorrecta o el mensaje fue alterado.'); }
}
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let mode = 'encrypt';
  const tabs = [$('encrypt-tab'),$('decrypt-tab')];
  function status(message, error = false) { $('status').textContent = message; $('status').dataset.error = String(error); }
  function switchMode(next) {
    mode = next;
    tabs.forEach((tab,i)=>{const active = (i===0)===(mode==='encrypt');tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    $('editor').setAttribute('aria-labelledby',mode==='encrypt'?'encrypt-tab':'decrypt-tab');
    $('key-input-field').hidden = mode==='encrypt'; $('decrypt-key').required = mode==='decrypt';
    $('message-label').textContent = mode==='encrypt'?'Tu mensaje':'Mensaje cifrado';
    $('message').placeholder = mode==='encrypt'?'Escribe algo que solo esa persona debería leer…':'Pega aquí el mensaje VAULT1…';
    $('submit').textContent = mode==='encrypt'?'Cifrar y generar clave ↗':'Descifrar mensaje ↗';
    $('result').hidden=true; $('output').value=''; $('generated-key').value=''; status('');
  }
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>switchMode(i===0?'encrypt':'decrypt'));tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?1:1-i;switchMode(target===0?'encrypt':'decrypt');tabs[target].focus();}});});
  $('message').addEventListener('input',()=>{$('count').textContent=`${$('message').value.length.toLocaleString('es')} caracteres`;});
  $('editor').addEventListener('submit',async event=>{
    event.preventDefault();
    if (!$('message').value.trim()) {status('Escribe un mensaje para continuar.',true);return;}
    const operation = mode;
    $('submit').disabled=true; tabs.forEach(tab=>tab.disabled=true); $('result').hidden=true; $('output').value=''; $('generated-key').value=''; status('Procesando de forma segura…');
    try {
      if(operation==='encrypt') {
        const result=await encryptMessage($('message').value);
        $('output').value=result.message; $('generated-key').value=result.key;
      } else { $('output').value=await decryptMessage($('message').value,$('decrypt-key').value); }
      $('result-label').textContent=operation==='encrypt'?'Mensaje cifrado':'Mensaje descifrado';
      $('generated-key-field').hidden=operation!=='encrypt'; $('result').hidden=false;
      status(operation==='encrypt'?'Mensaje cifrado. Guarda tu clave antes de cerrar esta página.':'Mensaje descifrado correctamente.');
    } catch(error) {status(error.message || 'No se pudo completar la operación.',true);}
    finally {$('submit').disabled=false;tabs.forEach(tab=>tab.disabled=false);}
  });
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const field=$(button.dataset.copy);
    try {await navigator.clipboard.writeText(field.value);status(button.dataset.copy==='generated-key'?'Clave copiada. Guárdala en un lugar seguro.':'Mensaje copiado.');}
    catch {field.focus();field.select();status('Seleccionamos el texto. Usa la opción de copiar de tu dispositivo.',true);}
  }));
  if (!globalThis.crypto?.subtle) {status('Abre esta página mediante HTTPS para habilitar el cifrado.',true);$('submit').disabled=true;}
}
if (typeof module !== 'undefined') module.exports={encryptMessage,decryptMessage};
