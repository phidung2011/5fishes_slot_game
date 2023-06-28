
import { assetManager, log, Prefab, _decorator, Component } from 'cc';
import { ExtAudioManager } from '../../../ext-framework/ExtAudioManager';
import ExtScreenManager from '../../../ext-framework/ui/ExtScreenManager';
import { SlotConfig9920 } from './base_slot/SlotConfig9920';

const { ccclass, property } = _decorator;

@ccclass('Slot9920Scene')
export class Slot9920Scene extends Component {

    @property(Prefab)
    pbfLoadingScreen: Prefab = null!;

    onLoad() {
        let bundle = assetManager.getBundle(`bundle${SlotConfig9920.GAME_ID}`);
        if (bundle) {
            log(`loadBundle: success`);
            this.node.addComponent(ExtScreenManager);
            ExtScreenManager.instance.assetBundle = bundle;
            ExtScreenManager.instance.setupCommon();
            ExtScreenManager.instance.initWithRootScreen(this.pbfLoadingScreen);
        }
    }

    onDestroy() {
        ExtAudioManager.instance.destroy();
    }

}
