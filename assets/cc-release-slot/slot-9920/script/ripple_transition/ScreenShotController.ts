
import { _decorator, Component, Camera, RenderTexture, Sprite, SpriteFrame, Texture2D, ImageAsset, log, Size, sys, UITransform } from 'cc';
import { SlotConfig9920 } from '../base_slot/SlotConfig9920';
const { ccclass, property } = _decorator;

@ccclass('ScreenShotController')
export class ScreenShotController extends Component {

    @property(Camera)
    copyCamera: Camera = null!;

    _screenShotSpr: Sprite = null;
    _renderTexture: RenderTexture = null;
    _buffer: ArrayBufferView = null!;

    private _screenWidth = 0.0;
    private _screenHeight = 0.0;

    start() {
        this._screenShotSpr = this.node.getComponent(Sprite);
        if (!this._screenShotSpr) this._screenShotSpr.addComponent(Sprite);

        // let frameWidth = screen.windowSize.width / screen.devicePixelRatio;
        // let frameHeight = screen.windowSize.height / screen.devicePixelRatio;
        // log('@@@ frameWidth = ' + frameWidth + ', ' + frameHeight);

        // // let getVisibleSize = view.getVisibleSize();
        // // log('@@@ getVisibleSize = ' + getVisibleSize.width + ', ' + getVisibleSize.height);

        // // ***NOTE***: width must >= height 
        // if (view.getVisibleSize().width < view.getVisibleSize().height) {
        //     // portrait
        //     let width_default = view.getVisibleSize().width; // 720

        //     // this._screenWidth = width_default * frameHeight / frameWidth;
        //     // this._screenHeight = this._screenWidth; // 720 * ratio

        //     this._screenWidth = width_default;
        //     this._screenHeight = width_default * frameHeight / frameWidth; // 720 * ratio

        //     log('@@@ portrait = ' + this._screenWidth + ', ' + this._screenHeight);
        // } else {
        //     // landscape
        //     this._screenHeight = view.getVisibleSize().height; // 720
        //     this._screenWidth = view.getVisibleSize().height * frameWidth / frameHeight; // 720 * ratio

        //     log('@@@ landscape = ' + this._screenWidth + ', ' + this._screenHeight);
        // }

        this._screenWidth = SlotConfig9920.maxResolution.width;
        this._screenHeight = SlotConfig9920.maxResolution.height;

        this._renderTexture = new RenderTexture();
        this._renderTexture.reset({
            width: this._screenWidth,
            height: this._screenHeight,
        })

        this.copyCamera.targetTexture = this._renderTexture;
    }

    onDestroy() {
        log('@@@@ onDestroy _renderTexture');
        if (this._renderTexture) {
            this._renderTexture.destroy();
            this._renderTexture = null;
        }
    }

    captureScreen(callback = () => { }) {
        var width = this._screenWidth;
        var height = this._screenHeight;

        this._buffer = this._renderTexture.readPixels(0, 0, width, height);
        this.showImage(width, height, callback);
    }

    showImage(width, height, callback = () => { }) {
        log('@@ showImage: w = ' + width + ', h = ' + height);
        let img = new ImageAsset();
        img.reset({
            _data: this._buffer,
            width: width,
            height: height,
            format: Texture2D.PixelFormat.RGBA8888,
            _compressed: false
        });
        let texture = new Texture2D();
        texture.image = img;
        let sf = new SpriteFrame();
        sf.texture = texture;
        sf.packable = false;

        this._screenShotSpr!.getComponent(Sprite).spriteFrame = sf;
        this._screenShotSpr!.getComponent(Sprite).spriteFrame.flipUVY = true;
        if (sys.isNative && (sys.os === sys.OS.IOS || sys.os === sys.OS.OSX)) {
            this._screenShotSpr!.getComponent(Sprite).spriteFrame.flipUVY = false;
        }
        this._screenShotSpr?.getComponent(UITransform)?.setContentSize(new Size(width, height));
        callback && callback();
    }
}