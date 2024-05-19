/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";
import * as unzipper from "unzipper";
import { createWriteStream, writeFileSync } from "fs";
import { tmpdir } from "os";
import * as sqlite3 from "sqlite3";


export const getCards = onCall<{fileBase64:string}>(async (data) => {

    // Error handling is important, but this is just a demo.
    // That would be an endless rabbit hole.

    // there probably is a way to have this in memory, but I don't know how and this works for now.
    // have to use tmpdir, because inside firebase functions this is the only place where we can write files.

    writeFileSync(tmpdir + '/file.apkg', data.data.fileBase64, 'base64');

    const directory = await unzipper.Open.file(tmpdir + '/file.apkg');
    const craeteDB = new Promise((resolve, reject) => {
    directory.files[0]
      .stream()
      .pipe(createWriteStream(tmpdir + '/sqlite.db'))
      .on('error',reject)
      .on('finish',resolve)
    });

  await craeteDB;

  const db = new sqlite3.Database(tmpdir + '/sqlite.db');

  const dbData = new Promise((resolve, _reject) => {
    const cards: string[] = [];
    
    db.serialize(() => {
        // A limit of 30 seems reasonable for a demo. There is not batch delete in the anki app, so we have to do it manually.
        // I wouldn't want the user to have to delete them all manually, so I'm not going to upload more than 30.
        // We limit to 31, so we know when we cross the limit.
        db.each(`SELECT * FROM 'notes' LIMIT 0,31`, (err, row) => {
            if (err) {
                console.error(err.message);
            }
            const card = (row as any).flds; 
            cards.push(card);
        }, () => {
            resolve(cards)
        });
      });
  });

  return { cards: await dbData };

  // so to summarize, .apkg files are just zip files with a sqlite database inside. Guess csv would be too easy.
});


