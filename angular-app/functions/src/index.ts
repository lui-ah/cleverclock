/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as unzipper from "unzipper";
import { createWriteStream, writeFileSync } from "fs";
import { tmpdir } from "os";
import * as sqlite3 from "sqlite3";


export const getCards = onCall<{fileBase64:string}>(async (data) => {

    // Error handling is important, but this is just a demo.
    // That would be an endless rabbit hole.

    // there probably is a way to have this in memory, but I don't know how and this works for now.
    // have to use tmpdir, because inside firebase functions this is the only place where we can write files.

    if(!data.data.fileBase64) throw new HttpsError('invalid-argument', 'Keine Datei beigefügt.')

    writeFileSync(tmpdir + '/file.apkg', data.data.fileBase64, 'base64');

    const directory = await unzipper.Open.file(tmpdir + '/file.apkg').catch(_error => {
        throw new HttpsError('internal', 'Fehler beim Entpacken der Datei.');
    });

    const createDB = new Promise((resolve, _reject) => {
      const anki21 = directory.files.find((file) => file.path === 'collection.anki21');
      const anki21b = directory.files.find((file) => file.path === 'collection.anki21b');
      const anki2 = directory.files.find((file) => file.path === 'collection.anki2');

      if(!anki21 && anki21b) throw new HttpsError('unimplemented', 'Die Datei ist zu neu. Bitte exportieren Sie die Datei im Anki 2.0 Format.');

      const file = anki21 || anki2; // if 21 is present, use that. Otherwise use 2.

      // For older versions the .anki2 file contains the cards. For newer version that file only contains a note saying that the contents are in  different file.
      // For those the cards are in the anki21 or anki21b files.
      // the anki21b file is a binary file, so we can't read that. Compressed using Zstandard (zstd) compression.
      // There are ways to read that, but I'm not going to bother with that for now.
      // Should we reconsider: https://www.npmjs.com/package/node-zstandard. But that would be a lot of work.

      if(!file) throw new HttpsError('invalid-argument', 'Die Datei enthält keine Anki Karten.');

      file
        .stream()
        .pipe(createWriteStream(tmpdir + '/sqlite.db'))
        .on('error', (_err) => { throw new HttpsError('internal', 'Fehler beim Schreiben der Datei.') })
        .on('finish',resolve)
    });

  await createDB;

  const db = new sqlite3.Database(tmpdir + '/sqlite.db');

  const dbData = new Promise((resolve, _reject) => {
    const cards: string[] = [];
    
    db.serialize(() => {
        // A limit of 30 seems reasonable for a demo. There is not batch delete in the anki app, so we have to do it manually.
        // I wouldn't want the user to have to delete them all manually, so I'm not going to upload more than 30.
        // We limit to 31, so we know when we cross the limit.
        db.each(`SELECT * FROM 'notes' LIMIT 0,31`, (err, row) => {
          if (err) {
            throw new HttpsError('internal', 'Fehler beim Lesen der Datenbank.')
          }
          const card = (row as any).flds; 
          cards.push(card);
        }, () => {
          resolve(cards)
        });
    });
    db.on('error', (_err) => { throw new HttpsError('internal', 'Fehler beim Lesen der Datenbank.') });
  });

  return { cards: await dbData };

  // so to summarize, .apkg files are just zip files with a sqlite database inside. Guess csv would be too easy.
});


