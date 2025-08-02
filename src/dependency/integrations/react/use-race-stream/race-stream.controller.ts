import {Dispatch, SetStateAction} from "react";
import {isObjectsContentEqual} from "../utils.ts";
import {IDepObjectArgument, IDepObjectReturn, raceStream} from "../../../stream-utils/index.ts";

export class RaceStreamController<T extends IDepObjectArgument> {
    private _value!: IDepObjectReturn<T>;
    private isFirstWas = false;
    rerenderTrigger?: Dispatch<SetStateAction<boolean>>
    deps: T;
    iterator!: ReturnType<typeof raceStream<T>>

    constructor(streams: T) {
        this.deps = streams;
        this.init()
    }

    get value() {
        return this._value;
    }

    async init() {
        this.iterator = raceStream(this.deps);
        this._value = Object.entries(this.deps)
            .reduce((acc, [key, dep]) => {
                acc[key as keyof T] = dep.value;
                return acc
            }, {} as typeof this._value);


        for await (let value of this.iterator) {
            this.rerenderTrigger?.(prev => !prev);
            if (!this.isFirstWas && !isObjectsContentEqual(this._value, value)) {
                this._value = value
            }
            this.isFirstWas = true;
        }
    }

    dispose = () => {
        this.iterator.dispose();
    }
}