
import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemRandomNumFree9920')
export class ItemRandomNumFree9920 extends Component {
    @property(Label)
    lbCountFree: Label = null!;

    setNumFree(num: number) {
        this.lbCountFree && (this.lbCountFree.string = '' + num);
    }

    switchContent() {
        let node_content = this.node.getChildByName('node_content');
        let tex_random = this.node.getChildByName('tex_random');
        tex_random && (tex_random.active = false);
        node_content && (node_content.active = true);
    }
}