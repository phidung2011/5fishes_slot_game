
import { _decorator, Node, isValid, find, Tween, Prefab, instantiate, Vec3, tween } from 'cc';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';

const { ccclass, property } = _decorator;

@ccclass('WaitingProgress9920')
export class WaitingProgress9920 {
    private _isShowing: boolean = false;
    private _nodeWaiting: Node = null;
    private tweenWaitingRF!: Tween<Node>;

    static _instance: WaitingProgress9920;

    static get instance() {
        if (!this._instance) {
            this._instance = new WaitingProgress9920();
        }
        return this._instance;
    }

    init() {
        // init node and add to Canvas
        let prefabWaiting = ExtScreenManager.instance.assetBundle.get('res/prefabs/waiting_progress', Prefab)!;
        const node = instantiate(prefabWaiting!);
        node.setPosition(0, 0, 0);

        // rotate img waiting
        let imgWaiting = node.getChildByName('img_waiting');
        this.tweenWaitingRF = tween(imgWaiting)
            .by(1, { eulerAngles: new Vec3(0, 0, -360) })
            .repeatForever();

        this._nodeWaiting = node; // save node to reuse
    }

    show() {
        if (this._isShowing) return;

        // node WaitingProgress is existed
        if (this._nodeWaiting && isValid(this._nodeWaiting)) {
            // log('@@@ Waiting reuse');
            this._nodeWaiting.parent = find('Canvas');
            this._nodeWaiting.active = true;
            this.tweenWaitingRF && this.tweenWaitingRF.start();
            this._isShowing = true;
        }
    }

    hide() {
        if (this._nodeWaiting && isValid(this._nodeWaiting)) {
            this._nodeWaiting.parent = null;
        }
        this.tweenWaitingRF && this.tweenWaitingRF.stop();
        this._isShowing = false;
    }

}