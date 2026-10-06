'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {encryptMessage,decryptMessage}=require('../script.js');
test('round trip preserves Unicode, repeated vowels, whitespace and empty text',async()=>{
  for(const text of ['aa ee ii oo uu','  Hola 🔐\n日本語 café  ','']) {
    const encrypted=await encryptMessage(text);
    assert.equal(await decryptMessage(encrypted.message,encrypted.key),text);
    assert.equal(Buffer.from(encrypted.key,'base64url').length,32);
    assert.ok(!encrypted.message.includes(encrypted.key));
  }
});
test('same plaintext gets fresh keys and ciphertext',async()=>{
  const results=await Promise.all(Array.from({length:32},()=>encryptMessage('Mensaje privado')));
  assert.equal(new Set(results.map(r=>r.key)).size,32);
  assert.equal(new Set(results.map(r=>r.message)).size,32);
});
test('wrong keys and altered ciphertext or IV are rejected',async()=>{
  const a=await encryptMessage('Secreto'),b=await encryptMessage('Secreto');
  await assert.rejects(decryptMessage(a.message,b.key),/incorrecta|alterado/);
  for(const index of [1,2]) {
    const parts=a.message.split('.');
    const bytes=Buffer.from(parts[index],'base64url');bytes[0]^=1;parts[index]=bytes.toString('base64url');
    await assert.rejects(decryptMessage(parts.join('.'),a.key),/incorrecta|alterado/);
  }
});
test('malformed payloads, versions and keys are rejected',async()=>{
  const a=await encryptMessage('Mensaje');
  for(const message of ['texto','VAULT2.a.b','VAULT1.!.!','VAULT1.a.b',a.message+'.extra']) await assert.rejects(decryptMessage(message,a.key));
  for(const key of ['','abc','!'.repeat(43)]) await assert.rejects(decryptMessage(a.message,key));
});
