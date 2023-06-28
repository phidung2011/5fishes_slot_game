
import { _decorator, Component, Button, Label, Color } from 'cc';
import { ExtAudioManager } from '../../../../../ext-framework/ExtAudioManager';

const { ccclass, property } = _decorator;

@ccclass('ItemBtnBottomHistoryDetail9920')
export class ItemBtnBottomHistoryDetail9920 extends Component {

    @property(Button)
    btnClick: Button = null!;

    @property(Label)
    labelText: Label = null!;

    onClickCallBack: any = null;
    _indexFreeSpin: number = -1;

    set selected(b: boolean) {
        this.btnClick.interactable = !b;
        this.labelText.color = new Color().fromHEX(b ? '#000000' : '#f7bb65');
    }

    setData(type: any, indexFreeSpin: number, onClickCallBack: any,) {
        let title = '';
        switch (type) {
            case 'summary':
                title = 'TỔNG KẾT';
                break;
            case 'normal':
                title = 'QUAY THƯỜNG';
                break;
            case 'free_option':
                title = 'CHỌN WILD';
                break;
            case 'free':
                title = 'QUAY MIỄN PHÍ ' + indexFreeSpin;
                break;
        }
        this.labelText.string = title;
        this._indexFreeSpin = indexFreeSpin;
        this.onClickCallBack = onClickCallBack;
    }

    getIdFreeSpin() {
        return this._indexFreeSpin;
    }

    onClickBtn() {
        // log("onclickBtn")
        ExtAudioManager.instance.playEffect("sfx_click_btn");
        if (this.onClickCallBack) {
            this.onClickCallBack(this._indexFreeSpin);
        }
        this.selected = true;
    }

}

