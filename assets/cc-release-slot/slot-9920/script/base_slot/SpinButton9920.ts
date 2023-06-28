import { _decorator, Label } from 'cc';
import { ExtSpinButton } from '../../../../cc-slot-common/ext-slot/ExtSpinButton';

const { ccclass, property } = _decorator;

@ccclass('SpinButton9920')
export class SpinButton9920 extends ExtSpinButton {

    @property(Label)
    lbAutospinNumber: Label = null!;

    //Must overide the belowing properties
    public animIdleName = 'idle';
    public animClickName = 'pressed';
    public animHoverName = 'hover';
    public animHoldName = null;
    // --- end ---

    switchToAutoSpin(autospinNumber: number) {
        this.isAutoSpin = true;
        this.lbAutospinNumber.node.active = true;
        this.lbAutospinNumber.string = `${autospinNumber}`;
        this.arrow.node.active = false;
    }

    stopAutoSpin() {
        this.isAutoSpin = false;
        this.lbAutospinNumber.node.active = false;
        this.lbAutospinNumber.string = `0`;
        this.arrow.node.active = true;
    }
}
