# Vault — Cifrado privado

Aplicación estática en español para cifrar y descifrar mensajes en el navegador, sin enviar el texto ni las claves a un servidor. Interfaz adaptable con navegación por teclado y respeto a la preferencia de movimiento reducido.

## Uso

1. Escribe un mensaje y pulsa **Cifrar y generar clave**.
2. Guarda el mensaje cifrado y su clave. Comparte la clave mediante un canal diferente al del mensaje.
3. En **Descifrar mensaje**, introduce ambos para recuperar el texto exacto.

Cada cifrado genera una clave AES de 256 bits y un IV aleatorio de 96 bits mediante Web Crypto. AES-GCM usa una etiqueta de autenticación de 128 bits para detectar alteraciones. El formato es `VAULT1.<iv base64url>.<contenido cifrado y etiqueta base64url>`; la versión también se autentica. La clave se exporta en base64url y no se incluye en el mensaje.

Las claves son aleatorias criptográficamente; una repetición es extremadamente improbable, pero no existe una garantía matemática de unicidad. No se declara una certificación de «grado militar». Quien tenga la clave puede leer el mensaje. No hay recuperación de claves ni protección frente a un dispositivo o navegador comprometido. Los mensajes antiguos basados en sustitución de vocales no son compatibles.

## Desarrollo

No hay dependencias ni compilación. Usa HTTPS en producción (GitHub Pages lo proporciona), o un servidor local seguro para Web Crypto:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Con Node.js 22 o posterior, ejecuta las pruebas:

```sh
node --test tests/crypto.test.js
```

Las pruebas comprueban el texto recuperado, claves nuevas y rechazo de claves incorrectas, alteraciones y formatos inválidos. La copia al portapapeles depende de los permisos del navegador; si no está disponible, el texto queda seleccionado para copiarlo manualmente. La aplicación no almacena claves ni mensajes en almacenamiento persistente; se pierden al recargar o cerrar la página.
