import ExtBaseScreen from "./ui/ExtBaseScreen";

export default abstract class ExtBaseDirector {

    protected _eventNames: string[] = null!;

    _registerListeners() {

    }

    _unregisterListeners() {

    }

    protected abstract processEvent(eventData: any): void;

}