/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";

// function base64ToArrayBuffer(base64: string) {
//     const binaryString = atob(base64);
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//         bytes[i] = binaryString.charCodeAt(i);
//     }
//     return bytes.buffer;
// }

// function base64ToBytes(base64: string) {
//     const buffer = base64ToArrayBuffer(base64);
    
//     const file = new File([buffer], "anki.apkg", {type: "application/zip"})
//     return file;
// }

export const helloWorld = onCall<{fileBase64:string}>(async (data) => {
    return {text: "Hello from Firebase!"};
});


