
import { _decorator, Component, Node, log } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestPlugins')
export class TestPlugins extends Component {
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    start () {
        const event = new EventEmitter();
        const lodash = _;
        const str = msgpack.encode("teststring");
        const fsm = new StateMachine();
        log(str);
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}