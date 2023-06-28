
import { _decorator, Component, Node } from 'cc';
import ExtScreenManager from '../../../../ext-framework/ui/ExtScreenManager';

const { ccclass, property } = _decorator;

@ccclass('FxTransitionFlash9920')
export class FxTransitionFlash9920 extends Component {
    @property(Node)
    vfxFlash: Node = null!;

    transitionOut() {
        this.vfxFlash.active = true;
        this.scheduleOnce(() => {
                this.node.destroy();
                ExtScreenManager.instance.removeAllEffects();
        }, 2.0)
    }
}