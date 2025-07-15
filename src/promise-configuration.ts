export class PromiseConfiguration<TReturn = void> {
    readonly promise!: Promise<TReturn>
    _resolve!: (value: TReturn) => void;
    _reject!: (value: Error) => void;
    _isFulfilled: boolean = false;

    constructor() {
        this.promise = new Promise<TReturn>((res, rej) => {
            this._resolve = ((value: TReturn) => {
                res(value);
                this._isFulfilled = true;
            });
            this._reject = (error: Error) => {
                rej(error);
                this._isFulfilled = true;
            }
        });
    }

    get reject() {
        return this._reject
    }

    get resolve() {
        return this._resolve
    }

    get isFulfilled() {
        return this._isFulfilled
    }

    get isPending() {
        return !this.isFulfilled;
    }
}