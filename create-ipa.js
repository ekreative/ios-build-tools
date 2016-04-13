#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),

    exec = require('./lib/exec'),
    find = require('./lib/find-identity-name');

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name', process.env.APP_NAME || 'build-tools')
    .option('--developer-name <name>', 'Developer name to use', process.env.DEVELOPER_NAME)
    .option('--ipa <name>', 'Ipa file to create', `${process.cwd()}/build/Release-iphoneos/` + (process.env.APP_NAME ? `${process.env.APP_NAME}.ipa` : 'app.ipa'))
    .option('--app <name>', 'App file to convert', `${process.cwd()}/build/Release-iphoneos/` + (process.env.APP_NAME ? `${process.env.APP_NAME}.app` : 'app.app'))
    .option('--provisioning-profile <profile>', 'Provisioning profile', process.env.PROVISIONING_PROFILE)
    .parse(process.argv);

let create = (developerName) => {
    let name = path.basename(program.provisioningProfile, path.extname(program.provisioningProfile));

    let commandPromise = exec(`xcrun -log -sdk iphoneos PackageApplication "${program.app}" -o "${program.ipa}" -sign "${developerName}" -embed "~/Library/MobileDevice/Provisioning\ Profiles/${name}.mobileprovision"`);

    commandPromise.catch((err) => {
        winston.error('Error creating ipa', err);
    });

};

if (program.developerName) {
    create(program.developerName);
} else {
    find(program.keychainName).then(create);
}
