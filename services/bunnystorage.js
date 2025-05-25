// services/bunnyStorage.js
require('dotenv').config();
const { URL } = require('url');

const zone = process.env.BUNNY_STORAGE_ZONE;
const key = process.env.BUNNY_STORAGE_PASSWORD;
const host = process.env.BUNNY_STORAGE_HOST;
const proto = process.env.BUNNY_STORAGE_PROTOCOL || 'https';

async function uploadToBunny(buffer, folder, name) {
    // Validaciones básicas
    if (!Buffer.isBuffer(buffer)) {
        throw new TypeError('El archivo debe ser un buffer');
    }
    if (!name || typeof name !== 'string') {
        throw new TypeError('El nombre de archivo es obligatorio');
    }
    const pathKey = `${folder || ''}${name}`;
    const url = `${proto}://${host}/${zone}/${pathKey}`;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            AccessKey: key,
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length
        },
        body: buffer
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error subiendo a Bunny: ${res.status} ${text}`);
    }

    return url;
}

async function deleteFromBunny(publicUrl) {
    if (typeof publicUrl !== 'string') {
        throw new TypeError('La URL pública debe ser una cadena');
    }
    const parsed = new URL(publicUrl);
    // Asegurarnos de que el host coincida con nuestra configuración
    if (parsed.host !== host) {
        throw new Error('URL de Bunny inválida');
    }
    const apiUrl = `${proto}://${host}${parsed.pathname}`;

    const res = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { AccessKey: key }
    });

    if (!res.ok && res.status !== 404) {
        const text = await res.text();
        throw new Error(`Error borrando en Bunny: ${res.status} ${text}`);
    }
}

module.exports = { uploadToBunny, deleteFromBunny };
