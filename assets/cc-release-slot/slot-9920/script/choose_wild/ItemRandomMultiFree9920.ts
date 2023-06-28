import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemRandomMultiFree9920')
export class ItemRandomMultiFree9920 extends Component {
    @property(Label)
    lb_multiple_free: Label = null!;

    setMultiFree(multi1: number, multi2: number, multi3: number) {
        this.lb_multiple_free && (this.lb_multiple_free.string = 'x' + multi1 + ',' + multi2 + ',' + multi3);
    }

    switchContent() {
        let lb_multiple_free = this.node.getChildByName('lb_multiple_free');
        let lb_no_value = this.node.getChildByName('lb_no_value');
        lb_no_value && (lb_no_value.active = false);
        lb_multiple_free && (lb_multiple_free.active = true);
    }
}