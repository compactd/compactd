import * as path from 'path';
import {mainStory} from 'storyboard';
import * as fs from 'fs';
import * as semver from 'semver';
import config from './config';
import PouchDB from './database';
import {resetLibrary} from './features/utils/library-utils';
import {Library} from 'compactd-models';
import {Scanner} from './features/scanner/Scanner';
import { initialize } from './features/analytics/Analytics';

const {version} = require('../../package.json');

type UpgradeFunction = (() => Promise<void>);

export const upgraders: {
  [version: string]: 'reset' | UpgradeFunction;
} = {
  '1.2.0-5': 'reset',
  '1.3.0-alpha.7': () => {
    return initialize();
  }
}

export async function runUpgrade (oldOne: string, version: string): Promise<boolean> {

  if (semver.gt(version, oldOne)) {
    const requiredUpgrades = Object.keys(upgraders).filter((target) => {
      return semver.gt(target, oldOne);
    });
    if (requiredUpgrades.find((v) => {
      return upgraders[v] == 'reset';
    })) {

      return true;
    }
    
    await requiredUpgrades.reduce((acc, val: string) => {
      return acc.then(() => {
        return (upgraders as any)[val]();
      });
    }, Promise.resolve());
    return false;
  }
  console.log('\n  Nothing to do, versions match\n');
  return false;
}

export async function resetLibraries () {
  const libraries = new PouchDB<Library>('libraries');

  const libs = await libraries.allDocs();

  await Promise.all(libs.rows.map((doc) => {
    return resetLibrary(doc.id);
  }))
} 

export async function rescanAll (onEnterDir: (path: string) => void) {
  const libraries = new PouchDB<Library>('libraries');

  const libs = await libraries.allDocs();

  await Promise.all(libs.rows.map((doc) => {
    const scanner = new Scanner(doc.id);
    scanner.on('open_folder', (folder) => {
      onEnterDir(folder);
    });
    return scanner.scan(PouchDB);
  }))

}