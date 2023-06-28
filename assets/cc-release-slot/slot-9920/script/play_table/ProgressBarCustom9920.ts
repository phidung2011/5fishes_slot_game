import { _decorator, Component, Node, CCFloat, UITransformComponent } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ProgressBarCustom9920')
export class ProgressBarCustom9920 extends Component {
    @property(CCFloat)
    width: number = 0;

    @property(Node)
    nodeMask: Node = null!;

    private _progress: number = 0;

    onLoad() {
        this.progress = 0;
    }

    public set progress(value: number) {
        this._progress = value;
        let w = this.width * value;

        this.nodeMask && (this.nodeMask.getComponent(UITransformComponent).width = w);
    }

    public get progress() {
        return this._progress;
    }
}