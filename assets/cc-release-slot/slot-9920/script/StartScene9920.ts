
import { _decorator, Component, assetManager, director, log } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StartScene9920')
export class StartScene9920 extends Component {

    onLoad() {
        assetManager.loadBundle("bundle9920", (err, bundle) => {
            if (err) {
                log(`loadBundle: ${err}`);
            }
            else {
                bundle.loadScene(`scene/g9920P`, function (err, scene) {
                    director.runScene(scene);
                });
            }
        });

    }
}

