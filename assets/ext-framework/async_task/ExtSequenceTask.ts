import ExtTaskContainer from "./ExtTaskContainer";

export default class ExtSequenceTask extends ExtTaskContainer {

    update(dt: number) {
        if (this._listTask.length > 0) {
            this._listTask[0].update(dt);

            if (this._listTask[0].isDone()) {
                this.nextTask();
            }
        }
    }

    nextTask() {
        this.completedTask++;
        if (this._listTask.length > 0) {
            this._listTask[0].cleanUp();
            this._listTask.splice(0, 1);
        }
    }
}
