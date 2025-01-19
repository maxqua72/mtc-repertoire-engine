const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

module.exports = {
  hooks: {
    postPackage: async (config, options) => {
      console.info('postPackage: Packages built at:', options.outputPaths);
      try {
        
        console.log('Hook postPackage: Copia e pruning di node_modules...');

        const resourcesPath = path.join(options.outputPaths[0], 'resources');
        const nodeModulesDest = path.join(resourcesPath, 'node_modules');
        
        const tmpPath = path.join('out','tmpdir');
        const nodeModulesTmp = path.join(tmpPath,'node_modules');
        const nodeModulesSrc = path.join(__dirname, 'node_modules'); // Percorso alla node_modules del tuo progetto

        // Copia node_modules
        await fs.copy(nodeModulesSrc, nodeModulesTmp);
        console.log('node_modules copiato da ' + nodeModulesSrc + ' in ' + nodeModulesTmp);

        await fs.copy(path.join(__dirname, 'package.json'), path.join(tmpPath, 'package.json'));
        await fs.copy(path.join(__dirname, 'package-lock.json'), path.join(tmpPath, 'package-lock.json'));
        
        
        // Esegui npm prune nella cartella nodeModulesTmp
        execSync('npm prune --production', { cwd: nodeModulesTmp, stdio: 'inherit' });
        await fs.copy(nodeModulesTmp, nodeModulesDest);
        console.log('copia da ' + nodeModulesTmp + ' in ' + nodeModulesDest);
        console.log('Pruning completato.');
        
       
        /*
        console.log(`Running npm prune in ${resourcesPath}`); 
        execSync('npm prune --production', { cwd: nodeModulesDest, stdio: 'inherit' });
        */
      } catch (error) {
        console.error('Errore nella hook postPackage:', error);
        throw error; // Importante per fermare la build in caso di errore
      }
    },
    

  },
  packagerConfig: {
    //asar: {unpackDir: path.join('**', '{node_modules}', '**', '*') },
    asar: true, //{unpackDir: "./node_modules/**/*" },
    //prune: false,
    //asar: true,
    
    /*
    extraResource: [ 
        './node_modules'
    ],
    
    hooks: { 
      async afterCopyExtraResources(buildPath, electronVersion, platform, arch) { 
        const resourcesPath = path.join(buildPath, 'resources', 'node_modules'); 
        console.log(`Running npm prune in ${resourcesPath}`); 
        execSync('npm prune --production', { cwd: resourcesPath, stdio: 'inherit' });
      },
    },
    */
    out: 'out/make',
    /*
    afterAsar:[(buildPath, electronVersion, platform, arch) => {
      console.log('hook: afterAsar')
    }],
    
    afterCopy:[async (buildPath, electronVersion, platform, arch) => {
      try{
        console.log('hook: afterCopy')
      } catch(error){console.log('hook: afterCopy error')}
      
    }],
    
    afterPrune:[(buildPath, electronVersion, platform, arch) => {
      console.log('hook: afterPrune')
    }]*/
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'maxqua72',
        description: 'Application to load and use local chess engines as external engine for Mind The Check Openings Repertoire'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin','linux','win32'],
      config: { 
        name: 'mtc-repertoire-engine-${version}' // Genera nomi unici per ogni piattaforma
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    /*
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },*/
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/main/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      //[FuseV1Options.RunAsNode]: false,
      [FuseV1Options.RunAsNode]: true,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      //[FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};
