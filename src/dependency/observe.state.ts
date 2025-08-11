import {Dependency} from "./dependency.ts";

class ObservationState {
    private _isObserved: boolean = false;
    private _isSuspended: boolean = false;
    dependencies: Set<Dependency> | undefined = undefined;
    private stack: Array<typeof this.dependencies> = [];

    suspend() {
        this._isSuspended = true;
    }

    cancelSuspense() {
        this._isSuspended = false;
    }

    get isObserved() {
        return this._isObserved;
    }

    set isObserved(value: boolean) {
        if (value) {
            this.push();
        } else {
            this.pop();
        }

        this._isObserved = !!this.dependencies;
    }

    setDep(dep: Dependency) {
        if (this._isSuspended) return;
        if (!this.isObserved) return;
        if (dep.done) return;
        this.dependencies!.add(dep);
    }
    getDeps() {
        return this.dependencies;
    }

    private push() {
        this.stack.push(this.dependencies);
        this.dependencies = new Set();
    }

    private pop() {
        this.dependencies = this.stack.pop();
    }
}

export const observationState = new ObservationState();