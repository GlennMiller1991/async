import {PromiseConfiguration} from "../promise-configuration.ts";
import {IDependencyStream, IStreamIterator} from "./contracts.ts";
import {symAI} from "../constants.ts";
import {Dependency} from "./dependency.ts";

export class DependencyStream<T = any> implements IDependencyStream {
    private readonly selfDispose = new PromiseConfiguration();
    private readonly iterator: IStreamIterator<T>;

    get isDisposed() {
        return this.iterator.isDisposed;
    }

    constructor(public readonly owner: Dependency) {
        this.selfDispose = new PromiseConfiguration();
        this.iterator = owner[symAI]({externalDispose: this.selfDispose});
    }

    [symAI]() {
        return {
            next: () => {
                return this.iterator.next();
            }
        }
    }

    dispose() {
        if (this.isDisposed) return;
        this.selfDispose.resolve();
    }


}