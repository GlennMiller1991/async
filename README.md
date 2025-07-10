### R&D async tools ###

First of all, attention paid to creation of reactive model
leveraging native JavaScript async features like Promises, (async) iterators
and generators.

The version is 0.0.0 so keep it in mind

```typescript
const counter = new DependencyStream<number>(0);

async function onCounterChange() {
    for await (let value of counter.stream()) {
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
        counter.set(i++);
    }
}, 1000)
```

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

Now this package is CommonJS module but should be ESM.