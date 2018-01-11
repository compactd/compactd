#! /usr/bin/env node

const sbConfig = require('storyboard').config;


if(process.argv.includes('--verbose')  || process.env.STORYBOARD) {
  require('storyboard-preset-console');
  if (!process.env.STORYBOARD) {
    sbConfig({filter: '*:DEBUG -scanner'});
  }
}

const CLI       = require('clui');
const chalk     = require('chalk');
const crypto    = require('crypto');
const base64url = require('base64url');
const config    = require('./server/dist/config').default;
const entropy   = require('string-entropy');
const fs        = require('fs-promise');
const pkg       = require('./package.json');
const path      = require('path');
const shortid   = require('shortid');
const mkdirp    = require('mkdirp');
const inquirer  = require('inquirer');
const Spinner   = CLI.Spinner;
const fetch     = require('node-fetch');

const {configure}   = require('./server/dist/features/configure');
const Authenticator = require('./server/dist/features/authenticator').default;
const PouchDB       = require('./server/dist/database').default;
const Models        = require('compactd-models');
const {Scanner}     = require('./server/dist/features/scanner/Scanner');

const {runUpgrade, resetLibraries, rescanAll}  = require('./server/dist/upgrader');

const capabilities = require('fluent-ffmpeg/lib/capabilities');
const Agent        = require('./server/dist/features/aquarelle/AquarelleAgent');
const pm2          = require('pm2')

const LAST_VERSION_WITHOUT_UPGRADER = '1.2.0-4';
const AVAILABLE_MODES = ['serve', 'configure', 'recover', 'reset', 'clean', 'upgrade'];

const mode = getMode();

const REQUIRED_NODE = '^7.7.0';
const MIN_ENTROPY = 512;

const verbose = process.argv.includes('-v') || process.argv.includes('--verbose');

function getMode () {
  if (process.argv.includes('--mode')) {
    const arg = process.argv[process.argv.indexOf('--mode') + 1]
    if (AVAILABLE_MODES.includes(arg)) {
      return arg;
    }
  }

  return AVAILABLE_MODES.find((mode) => {
    return process.argv.includes(`--${mode}`);
  }) || 'serve';
}


async function checkFile() {
  const file = path.join(config.get('dataDirectory'), 'testfile');
  const key = shortid.generate();
  await fs.writeFile(file, `testfile.${key}`);
  const res = await fs.readFile(file, 'utf8');
  await fs.unlink(file);
  const stillExists = await fs.exists(file);

  if (res === `testfile.${key}` && !stillExists) {
    return;
  }
  throw new Error('Unknown reason');
}

switch (mode) {
  case 'reset': {
    console.log(chalk.yellow(`\n  Thanks for downloading compactd ${pkg.version} !`));
    console.log(chalk.grey(`\n  Trying reset library...`));

    const spin = new Spinner('Running scan...', [ '⠁','⠂','⠄','⡀','⢀','⠠','⠐','⠈']);
    spin.start();
    resetLibraries().then(() => {
      return rescanAll((name) => {
        spin.message('Scanning ' + name);
      });
    }).then(() => {
      return fetchArtworks(spin);
    }).then(() => {
      spin.stop();
      console.log('\n  ' + chalk.bgGreen.black(' Successfully reset compactd ') + '\n');
      process.exit(0);
    }).catch((err) => {
      console.log(err);
    });
    return;
  }
  case 'upgrade': {
    const versionFile = path.join(config.get('dataDirectory'), '_version');

    let oldOne = LAST_VERSION_WITHOUT_UPGRADER;

    if (fs.existsSync(versionFile)) {
      oldOne = fs.readFileSync(versionFile).toString();
    }

    console.log(chalk.yellow(`\n  Thanks for downloading compactd ${pkg.version} !`));
    console.log(chalk.grey(`\n  Trying to upgrade database from version ${oldOne}...`));

    const spin = new Spinner('Running upgrade...', [ '⠁','⠂','⠄','⡀','⢀','⠠','⠐','⠈']);
    spin.start();

    runUpgrade(oldOne, pkg.version).then((shouldReset) => {
      if (shouldReset) {
        return resetLibraries().then(() => true);
      }
      return false;
    }).then((shouldRescan) => {
      if (!shouldRescan) {
        fs.writeFileSync(versionFile, pkg.version);
        spin.stop();
        console.log('\n  ' + chalk.bgGreen.black(' Successfully upgraded compactd') + '\n');
        process.exit(0);
      }
      spin.message('Rescanning media content');
      return rescanAll((name) => {
        spin.message('Scanning ' + name);
      });
    }).then(() => {
      return fetchArtworks(spin);
    }).then(() => {
      fs.writeFileSync(versionFile, pkg.version);
      spin.stop();
      console.log('\n  ' + chalk.bgGreen.black(' Successfully upgraded compactd') + '\n');
      process.exit(0);
    }).catch((err) => {
      console.log(err);
    });
    return;
  }
  case 'serve':
    console.log(chalk.yellow(`\n  Thanks for downloading compactd ${pkg.version} !`));
    console.log(chalk.grey('\n  Trying to start compactd in the background...'));

    const versionFile = path.join(config.get('dataDirectory'), '_version');
    if (!fs.existsSync(versionFile)) {
      console.log('\n  Please upgrade your database to the latest version')
      console.log('  You may want to use compactd --upgrade\n');
      process.exit(1);
    }
    const version = fs.readFileSync(versionFile).toString();
    if (version !== pkg.version) {
      console.log('\n  Please upgrade your database to the latest version')
      console.log('  You may want to use compactd --upgrade\n');
      process.exit(1);
    }

    pm2.connect(function (err) {
      if (err) {
        console.error(err);
        process.exit(2);
      }
      pm2.start({
        name: 'compactd',
        script: './server/index.js'
      }, function (err, app) {
        if (err) {
          console.error(err);
          process.exit(2);
        }
        pm2.disconnect();
        console.log('\n  ' + chalk.bgGreen.black(' Successfully started compactd in the background') + '\n');
      });
    })
    return;
  case 'configure':
    console.log(chalk.yellow(`\n  Thanks for downloading compactd ${pkg.version} !`));
    console.log(chalk.grey('\n  This wizard will guide you through the configuration of compactd'));
    console.log(chalk.grey('  This should only take one or two minutes...\n'));

    const spin = new Spinner('Checking for ffmpeg and ffprobe...', [ '⠁','⠂','⠄','⡀','⢀','⠠','⠐','⠈']);

    delay(420)(spin)
      .then(checkForFFmpeg)
      .then(message('Checking secret entropy'))
      .then(delay(300))
      .then(checkSecret)
      .then(message('Checking folder write permissions'))
      .then(delay(700))
      .then(checkFolderPermissions)
      .then(message('Checking CouchDB installation'))
      .then(delay(543))
      .then(checkCouchDB)
      .then(() => {
        console.log('\n    ' + chalk.black(chalk.bgYellow(' All good! You can now start configuring compactd ')));
        console.log('');
      })
      .then(() => {
        console.log(chalk.grey('  Now compactd is going to secure you CouchDB collection by setting a password,'));
        console.log(chalk.grey('  creating the standard collections and adding validation and permissions.\n'));
        return inquirer.prompt([{
          type: 'confirm',
          name: 'continue',
          message: 'Do you wish to continue',
          default: true
        }]);
      }).then((res) => {
        if (res.continue) {
          return spin;
        } else {
          throw new Error();
        }
      }).then(configureDatabase)
      .then(() => {
        console.log(chalk.grey('\n  Now you are going to create the admin user for your app'));
        console.log(chalk.grey('  The credentials will be used to login from your web browser\n'));
        return inquirer.prompt([{
          type: 'input',
          name: 'username',
          message: 'Please choose a username',
          validate: (str) => /^[a-z0-9_]{4,16}$/i.test(str) ? true : 'Username must be between 4 and 16 characters longs'
        }, {
          type: 'password',
          name: 'password',
          message: 'Please choose a password',
          validate: (str) => /^.{4,}$/.test(str) ? true : 'Password must be at least 4 characters longs'
        }]).then((res) => [res, spin]);
      }).then(registerUser).then((spin) => {
        console.log(chalk.grey('\n  Now you can create a music library, where your music is stored'));
        console.log(chalk.grey('  If you are migrating from cassette, you might wanna use cassette downloads folder\n'));
        return inquirer.prompt([{
          type: 'input',
          name: 'name',
          message: 'Please choose a friendly name',
          default: 'My Music'
        }, {
          type: 'input',
          name: 'path',
          message: 'Please entrer the absolute path to your music'
        }]).then((res) => [res, spin]);
      }).then(createAndScanLibrary)
      .then(fetchArtworks)
      .then(() => {
        console.log('  ' + chalk.bgGreen.black(' Successfully configured compactd '))
        console.log('\n' + chalk.grey('You may start it using '+ chalk.yellow('compactd --serve')));
      }).catch((err) => {
        if (verbose) console.log('\n  ' + chalk.grey(err) + '\n');
        console.log('\n  ' + chalk.bgRed(' Couldn\'t finish configuration ') + '\n')
      });
}

async function fetchArtworks (spin) {
  await Agent.reset();

  spin.message('Downloading album covers');
  spin.start();
  const displayName = (name) => {
    spin.message(`Downloading cover for ${name}`)
  };
  await Agent.processAlbums(displayName).catch((err) => {
    if (verbose) console.log(err);
  });
  spin.message('Downloading artist artworks');
  await Agent.processArtists(displayName).catch((err) => {
    if (verbose) console.log(err);
  });
  spin.stop();
  return spin;
}

async function createAndScanLibrary ([res, spin]) {
  console.log('');
  spin.message('Starting scan');
  spin.start();
  const libID = Models.libraryURI(Models.mapLibraryToParams(res));
  const library = Object.assign({}, res, {_id: libID});
  const libraries = new PouchDB('libraries');
  await libraries.put(library);
  const scanner = new Scanner(libID);
  scanner.on('open_folder', (folder) => {
    spin.message('Scanning ' + folder);
  });
  await scanner.scan(PouchDB);
  spin.stop();
  return spin;
}

function registerUser ([res, spin]) {
  const auth = new Authenticator(shortid.generate(), config.get('secret'));
  console.log('');
  spin.message('Creating a new user')
  spin.start();

  return auth.registerUser(res).then(() => {
    spin.stop();
    return spin;
  }).catch((err) => {
    spin.stop();
    console.log(err);
  });
}

function configureDatabase (spin) {

  spin.message('Configuring database');
  spin.start();
  return configure().then(() => {
    spin.stop();
    return spin;
  });
}

function message(msg) {
  return (spin) => {
    spin.message(msg);
    spin.start();
    return Promise.resolve(spin);
  }
}

function delay(ms) {
  return (spin) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(spin);
      }, ms);
    })
  }
}

async function checkCouchDB (spin) {
  let res, data;
  
  try {
    res = await fetch(`http://localhost:5984/`);
    data = await res.json();
  } catch (err) {
    spin.stop();
    console.log(chalk.red(`  ✘ CouchDB isnt reachable on ${5984}`));
    throw new Error();
  }

  if (data.couchdb === 'Welcome') {
    try {
      const membership = await fetch(`http://localhost:5984/_membership`);
      const {error} = await membership.json();
      if (error) throw new Error();
      spin.stop();
      console.log(chalk.green(`  ✔ CouchDB is available on port ${chalk.yellow(5984)}`));
      return spin;
    } catch (err) {
      spin.stop();
      console.log(chalk.red(`  ✘ CouchDB is already configured`));
      throw new Error();
    }
  } else {

    spin.stop();
    console.log(chalk.red(`  ✘ CouchDB isnt reachable on ${5984}`));
    throw new Error();
  }
}

function generateSecret (spin) {
  spin.message('Generating secret and password');

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const secret = base64url(crypto.randomBytes(144));
      const couchPassword = base64url(crypto.randomBytes(64));

      config.set('secret', secret);
      config.set('couchPassword', couchPassword);

      mkdirp.sync(config.get('dataDirectory'));

      const out = path.join(config.get('dataDirectory'), 'config.json');
      fs.writeFile(out, JSON.stringify({secret, couchPassword}, null, 2), (err) => {
        if (err) {
          spin.stop();
          return reject(err)
        }
        checkSecret(spin).then(() => {
          spin.stop()

          // There is a weird bug which makes the rest of the script fails for apparently no reason
          // Anyway the only way to make it work for now is to restart the script
          console.log('\n  Please start this script again to configure\n');
          process.exit(0);
        }).catch((err) => {
          spin.stop();
          reject(err);
        });
      });
    }, 420);
  });
}

function checkSecret (spin) {
  const secret = config.get('secret');
  if (!fs.existsSync(path.join(config.get('dataDirectory'), 'config.json'))) {
    return generateSecret(spin);
  }
  if (secret === 'pleaseChangeThisValue') {
    spin.stop();
    console.log(chalk.red(`  ✘ Please set your secret in the config file`));
    return Promise.reject(new Error('Default secret'));
  } else {
    const ent = entropy(secret);

    if (ent < MIN_ENTROPY) {
      spin.stop();
      console.log(chalk.red(`  ✘ Your JWT Secret doesn't have a high entropy (current: ${
       ent
      } < ${MIN_ENTROPY})`));
      return Promise.reject('Entropy too low');
    }
    const ent2 = entropy(config.get('couchPassword'));

    if (ent2 < 256) {
      spin.stop();
      console.log(chalk.red(`  ✘ Your couchDB password is too weak (current: ${
       ent2
      } < 256)`));
      return Promise.reject('Entropy too low');
    }
    spin.stop();
    console.log(chalk.green(`  ✔ You secret is secure (entropy: ${ent})`));
    return Promise.resolve(spin);
  }
}

function checkFolderPermissions (spin) {
  return checkFile().then((res) => {
    spin.stop();
    console.log(chalk.green(`  ✔ Folder ${chalk.yellow(config.get('dataDirectory'))} is writable`));
    return spin;
  }).catch((err) => {
    spin.stop();
    console.log(chalk.red(`  ✘ Folder ${config.get('dataDirectory')} is not writable`));
    console.log(chalk.grey(`    ${err.message}`));
  });
}

function checkForFFmpeg (spin) {
  return new Promise((resolve, reject) => {
    spin.start();

    const caps = {};
    capabilities(caps);
    caps._getFfmpegPath.call(caps, function (err1, ffmpegPath) {
      caps._getFfprobePath.call(caps, function (err2, ffprobePath) {
        if (err1 || err2 || ffmpegPath === '') {
          spin.stop();
          console.log(chalk.red(`  ✘ FFmpeg not found in the Path`));
          console.log(chalk.grey(`    Please install ffmpeg and ffprobe and make sure it's in the path`));
          return reject(err1 || err2);
        }

        spin.stop();
        console.log(chalk.green('  ✔ FFprobe and FFmpeg found in ' + chalk.yellow(ffmpegPath)));

        resolve(spin);
      });
    });
  })
}
