# Async tools

## Overview

### delay
delay is a function that can be executed synchronous or asynchronous.
The behaviour depends on passed arguments:
```typescript
// Returns a promise - asynchrounous running in a non-blocking manner;
await delay(number);

// Returns nothing - synchrounous running in a blocking manner;
delay(number, 'sync');
```

### getPromise
getPromise is a function that creates and returns promise, its fulfillment functions
and status flags.
Returned type is:
```typescript
type IPromiseConfiguration<T> = {
    resolve(arg: T): void, // function that resolves promise
    reject(err: Error): void, // function that rejects promise
    promise: Promise<T>,        // promise itself
    readonly isPending: boolean, // promise status flag
    readonly isFulfilled: boolean, // reverted promise status flag
} 
```
There is no any management of passed data for resolving.
Returned promise is usual ES promise so it is impossible to fulfill promise twice.

### DependencyStream
#### core
Implementation of reactive model leveraging native JavaScript async features like
Promises, (async) iterators and generators.
The version is 0.0.x so keep it in mind

```typescript
const counter = new DependencyStream<number>(0);

async function onCounterChange() {
    for await (let value of counter) {
        // do whatever you want
    }

    // here we going in case of disposing counter (counter.dispose)
    // or stream itself (counter.stream().dispose)
}

onCounterChange();

let i = 0;
setInterval(() => {
    for (let k = 0; k < 10; k++) {
        // The counter detects changes when the first new value 
        // differs from the previous one. 
        // Subsequent value updates are collected and processed together
        // during the next microtask execution phase of the event loop.
        counter.value = i++;
    }
}, 1000)
```

#### Framework integrations
##### React
Of course, there is a React integration via useStream hook:

```typescript jsx
type IController = {
    controller: SomeController,
}
export const Counter: React.FC<ITest> = React.memo(({
                                                        controller,
                                                    }) => {
    // num is an instance of DependencyStream
    const num = controller.num;
    const {value, dispose} = useStream(num);

    // resolving promises on component unmounting
    // This is won't cause of rerender
    useEffect(() => dispose, [])

    return (
        <div className={"container"}>
            <button className={"incrementer"}
                // Now result is array of streams values
                // It should be object
                    onClick={() => num.set(value![0] + 1)}>
                +
            </button>

            <div className={cn("display")}>
                {
                    // Now result is array of streams values
                    // It should be object                    
                }
                {value![0]}
            </div>
        </div>
    )
})
```

### Disclaimer
Now this package is CommonJS module but should be an ESM.

## Installation
Just type ```npm i @fbltd/async``` 