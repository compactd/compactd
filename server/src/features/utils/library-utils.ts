import PouchDB from '../../database';
import clean from './library-cleaner';
import {Track, File} from 'compactd-models'; 
import * as fs from 'fs';
import {Scanner} from '../scanner/Scanner';

const files = new PouchDB<File>('files');

function deleteLibraryTree (libraryId: string) {
  return new Promise((resolve, reject) => {
    const scanner = new Scanner(libraryId);
    fs.unlink(scanner.treePath, (err) => {
      if (err) return reject(err);
      resolve();
    })
  })
}

export async function resetLibrary (libraryId: string) {
  const res = await files.query('files/by_library', {
    startkey: libraryId,
    endkey: libraryId,
    include_docs: true
  });
  
  await Promise.all(res.rows.map(({doc}) => {
    return files.remove(doc._id, doc._rev);
  }));

  await clean(PouchDB, false);

  await deleteLibraryTree(libraryId);
}

const emit: any = Function();

export async function createViews () {
  
  const ddoc = {
    _id: '_design/files',
    views: {
      by_library: {
        map: function (doc: File) {
          emit(doc.library);
        }.toString()
      }
    }
  };
  await files.put(ddoc as any);
}