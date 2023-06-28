
import { _decorator, Component, log, Sprite, v2, v3, view, Vec2, Vec3, Material, UITransform } from 'cc';
import { SlotConfig9920 } from '../base_slot/SlotConfig9920';
import { ScreenShotController } from './ScreenShotController';
const { ccclass, property } = _decorator;

const temp_v3 = v3();

@ccclass('RippleController')
export class RippleController extends Component {
    @property(Material)
    rippleMat: Material = null!;
    @property(Sprite)
    effectSprite: Sprite = null!;

    private _params = v2();
    private _timeStartEff = 0.0;
    private _isRunEff = false;
    private _centerRippleEff = new Vec2(SlotConfig9920.maxResolution.width / 2, SlotConfig9920.maxResolution.height / 2);

    start() { }

    onEnable() { }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    startEffectFullScreen(posEff?: Vec2) {
        log('@@@  startEffectFullScreen: ');
        if (posEff) this._centerRippleEff = posEff;
        this.resetValue();
        let screenShotCtrl = this.effectSprite?.getComponent(ScreenShotController);
        screenShotCtrl && screenShotCtrl.captureScreen(this.startShader.bind(this));
    }

    startEffect(posEff?: Vec2) {
        log('@@@  startEffect: ');
        if (posEff) this._centerRippleEff = posEff;
        this.resetValue();
        this.startShader();
    }

    // touchStart() {
    // log('RippleController: touchStart');
    // this.screenShotSpr?.getComponent(ScreenShotController).captureScreen(this.startShader.bind(this));
    // }

    startShader() {
        log('@@@  startShader ');
        log('@@@  effectSprite w = ' + this.effectSprite.getComponent(UITransform).width + ', ' + this.effectSprite.getComponent(UITransform).height);

        this.effectSprite.customMaterial = this.rippleMat;
        this._isRunEff = true;
        this.runEff(this._centerRippleEff);
    }

    runEff(pos: Vec2) {
        log('@@@--- runEff = ' + pos.x + ', ' + pos.y);
        let uiTransform = this.effectSprite.getComponent(UITransform);
        // log('RippleController: uiTransform w = ' + uiTransform.contentSize.width + ', h = ' + uiTransform.contentSize.height);
        let designRatio = uiTransform.width * 1.0 / uiTransform.height;
        //resolution --> params.xy
        this._params.x = 1;
        this._params.y = designRatio;

        this.effectSprite.getMaterial(0)?.setProperty('params', this._params);
        this.effectSprite.getMaterial(0)?.setProperty('isRippleStart', 1);
        this.effectSprite.getMaterial(0)?.setProperty('center_coord', this.convertPosByShaderCoord(pos));
    }

    resetValue() {
        this._timeStartEff = 0.0;
        this._isRunEff = false;
    }

    stopEff() {
        this.resetValue();
        this.effectSprite.getMaterial(0)?.setProperty('isRippleStart', 0);
    }

    update(dt: number) {
        if (this._isRunEff) {
            this._timeStartEff += dt;

            this.effectSprite.getMaterial(0)?.setProperty('timeFromStart', this._timeStartEff);
        }
    }

    convertPosByShaderCoord(position: Vec2) {
        // log('--- convertPosByShaderCoord = ' + position.x + ', ' + position.y);
        const worldLocation = Vec3.set(temp_v3, position.x, position.y, 0);
        let uiTransform = this.effectSprite.getComponent(UITransform);
        let deltaX = (uiTransform.width - view.getVisibleSize().width) / 2;

        let posConverted = new Vec2(0, 0);
        posConverted.x = (worldLocation.x + deltaX) / uiTransform.width;
        posConverted.y = worldLocation.y / uiTransform.height;
        // posConverted.y =  1 - worldLocation.y / uiTransform.height;
        // log(' posConverted: = ' + posConverted.toString());
        return posConverted;
    }

}