System.register([], function (_export, _context) {
  "use strict";

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function createApplication(_ref) {
    var loadJsListFile = _ref.loadJsListFile,
      fetchWasm = _ref.fetchWasm;
    // NOTE: before here we shall not import any module!
    var promise = Promise.resolve();
    return promise.then(function () {
      return _defineProperty({
        start: start
      }, 'import', topLevelImport);
    });

    function start(_ref3) {
      var findCanvas = _ref3.findCanvas;
      var settings;
      var cc;
      return Promise.resolve().then(function () {
        return topLevelImport('cc');
      }).then(function (engine) {
        cc = engine;
        return loadSettingsJson(cc);
      }).then(function () {
        settings = window._CCSettings;
        return initializeGame(cc, settings, findCanvas).then(function () {
          if (!settings.renderPipeline) return cc.game.run();
        }).then(function () {
          if (settings.scriptPackages) {
            return loadModulePacks(settings.scriptPackages);
          }
        }).then(function () {
          return loadJsList(settings.jsList);
        }).then(function () {
          return loadAssetBundle(settings.hasResourcesBundle, settings.hasStartSceneBundle);
        }).then(function () {
          if (settings.renderPipeline) return cc.game.run();
        }).then(function () {
          cc.game.onStart = onGameStarted.bind(null, cc, settings);
          onGameStarted(cc, settings);
        });
      });
    }

    function topLevelImport(url) {
      return _context["import"]("".concat(url));
    }

    function loadAssetBundle(hasResourcesBundle, hasStartSceneBundle) {
      var promise = Promise.resolve();
      var _cc$AssetManager$Buil = cc.AssetManager.BuiltinBundleName,
        MAIN = _cc$AssetManager$Buil.MAIN,
        RESOURCES = _cc$AssetManager$Buil.RESOURCES,
        START_SCENE = _cc$AssetManager$Buil.START_SCENE;
      var bundleRoot = hasResourcesBundle ? [RESOURCES, MAIN] : [MAIN];

      if (hasStartSceneBundle) {
        bundleRoot.push(START_SCENE);
      }

      return bundleRoot.reduce(function (pre, name) {
        return pre.then(function () {
          return loadBundle(name);
        });
      }, Promise.resolve());
    }

    function loadBundle(name) {
      return new Promise(function (resolve, reject) {
        cc.assetManager.loadBundle(name, function (err, bundle) {
          if (err) {
            return reject(err);
          }

          resolve(bundle);
        });
      });
    }

    function loadModulePacks(packs) {
      return Promise.all(packs.map(function (pack) {
        return topLevelImport(pack);
      }));
    }

    function loadJsList(jsList) {
      var promise = Promise.resolve();
      jsList.forEach(function (jsListFile) {
        promise = promise.then(function () {
          return loadJsListFile("src/".concat(jsListFile));
        });
      });
      return promise;
    }

    function loadSettingsJson(cc) {
      var settings = 'src/settings.json';
      return new Promise(function (resolve, reject) {
        if (typeof fsUtils !== 'undefined' && !settings.startsWith('http')) {
          var result = fsUtils.readJsonSync(settings);

          if (result instanceof Error) {
            reject(result);
          } else {
            window._CCSettings = result;
            resolve();
          }
        } else {
          var requestSettings = function requestSettings() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', settings);
            xhr.responseType = 'text';

            xhr.onload = function () {
              window._CCSettings = JSON.parse(xhr.response);
              resolve();
            };

            xhr.onerror = function () {
              if (retryCount-- > 0) {
                setTimeout(requestSettings, retryInterval);
              } else {
                reject(new Error('request settings failed!'));
              }
            };

            xhr.send(null);
          };

          var retryCount = 3;
          var retryInterval = 2000;
          requestSettings();
        }
      });
    }
  }

  function initializeGame(cc, settings, findCanvas) {
    if (settings.macros) {
      for (var key in settings.macros) {
        cc.macro[key] = settings.macros[key];
      }
    }

    var gameOptions = getGameOptions(cc, settings, findCanvas);
    var success = cc.game.init(gameOptions);

    try {
      if (settings.customLayers) {
        settings.customLayers.forEach(function (layer) {
          cc.Layers.addLayer(layer.name, layer.bit);
        });
      }
    } catch (error) {
      console.warn(error);
    }

    return success ? Promise.resolve(success) : Promise.reject();
  }

  function onGameStarted(cc, settings) {
    window._CCSettings = undefined;
    cc.view.resizeWithBrowserSize(true);
    const initLoader = document.getElementById('initial-loader');
    initLoader && initLoader.parentElement && initLoader.parentElement.removeChild(initLoader);

    checkHighPixelRatio();
    if (cc.sys.isMobile) {
      if (settings.orientation === 'landscape') {
        cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
      } else if (settings.orientation === 'portrait') {
        cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
      }

      cc.view.enableAutoFullScreen(false);
    }

    var launchScene = settings.launchScene; // load scene

    if (typeof setFullScreen === 'function') {
      setFullScreen(settings);
    }

    var width = settings.designResolution.width;
    var height = settings.designResolution.height;
    cc.director.loadScene(launchScene, null, function () {
      cc.view.setDesignResolutionSize(width, height, 2);
      console.log("Success to load scene: ".concat(launchScene));
    });
  }

  function checkHighPixelRatio() {
    if (cc.sys.isNative)
      return;

    let limitH = 720;
    if (!cc.sys.isMobile) {
      limitH = 1080;
      if (window.devicePixelRatio > 1) {
        window.devicePixelRatio = 1.5;
        cc.director.root.resize(cc.screen.windowSize.width, cc.screen.windowSize.height);
      }
    }
    if (cc.screen.windowSize.height > limitH) {
      let height = cc.screen.windowSize.height / window.devicePixelRatio;
      window.devicePixelRatio = limitH / height;
      cc.director.root.resize(cc.screen.windowSize.width, cc.screen.windowSize.height);
    }
  }

  function getGameOptions(cc, settings, findCanvas) {
    // asset library options
    var assetOptions = {
      bundleVers: settings.bundleVers,
      remoteBundles: settings.remoteBundles,
      server: settings.server,
      subpackages: settings.subpackages
    };
    var options = {
      debugMode: settings.debug ? cc.DebugMode.INFO : cc.DebugMode.ERROR,
      showFPS: !false && settings.debug,
      frameRate: 60,
      groupList: settings.groupList,
      collisionMatrix: settings.collisionMatrix,
      renderPipeline: settings.renderPipeline,
      adapter: findCanvas('GameCanvas'),
      assetOptions: assetOptions,
      customJointTextureLayouts: settings.customJointTextureLayouts || [],
      physics: settings.physics,
      orientation: settings.orientation,
      exactFitScreen: settings.exactFitScreen
    };
    return options;
  }

  _export("createApplication", createApplication);

  return {
    setters: [],
    execute: function () { }
  };
});