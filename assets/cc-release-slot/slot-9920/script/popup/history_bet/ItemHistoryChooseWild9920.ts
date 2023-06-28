import { _decorator, sp, Label, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemHistoryChooseWild9920')
export class ItemHistoryChooseWild9920 extends Component {
    @property(Node)
    nodeBigFish: Node = null!;

    @property(Label)
    lbNumFree: Label = null!;

    @property(Label)
    lbMultiFree: Label = null!;

    setData(resultData: any) {
        // setData(selectedOption: number, remainingFreeSpins: number, multiplierConfig: any) {
        this._showBigFish(resultData.selectedOption);
        this.lbNumFree.string = resultData.remainingFreeSpins + '';
        let multiple = resultData.result.multiplierConfig;
        this.lbMultiFree.string = 'x' + multiple[0] + ',' + multiple[1] + ',' + multiple[2];
    }

    private _showBigFish(wildId: number) {
        let bigFishTarget = this.nodeBigFish?.getComponent(sp.Skeleton);
        if (bigFishTarget) {
            bigFishTarget.setSkin('K' + wildId);
        }
    }
}
