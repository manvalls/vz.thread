# vz Thread

[![NPM](https://nodei.co/npm/vz.thread.png?downloads=true)](https://nodei.co/npm/vz.thread/)

No piece of software is ever completed, feel free to contribute and be humble

**Note:** This package is supposed to be used in a browser context using a tool like browserify

## Sample usage:

```javascript

var Thread = require('vz.thread'),
    thread;

thread = new Thread(function(){
  
  // This code gets executed only once, at the start of the thread
  
  // Here we're creating a global variable *in the context of the thread*,
  // it's not visible outside of it, just like functions and variables of
  // outside the thread are not visible inside of it
  
  // Synchronous wait
  
  wait = function(time){
    var t0 = Date.now();
    while(t0 + time > Date.now());
  };
  
},function(data,answer){
  
  // This is the code that gets executed each time Thread.run is called
  // For this example, we're implementing a delayed echo
  
  wait(5000); // A synchronous wait, but since it's being called
              // in the thread it doesn't block parent execution
  
  answer(data); // With this call we return to the parent
                // the result of the operation implemented
                // in this thread
  
});

// Now let's use our thread!

thread.run('Hello world',function(answer){
  // answer == 'Hello world'
});

```

## Reference

### Thread object

#### Constructor([setup,]handler)

##### setup()

A function, or an array of them, that gets executed at the start of the thread, in the context of it. Use it to initialize global variables and functions.

##### handler(data,answer)

A function that gets executed each time Thread.run is called.

###### data

The data passed to Thread.run

###### answer(data,transfer)

A function to be called with the result of the thread operation

####### data

Data to be sent to the upper thread, as a result of the operation

####### transfer

Array of Transferable items, their ownership will be transfered to the upper thread

#### Thread.run(data,[transfer,]callback[,thisArg])

Executes the thread in an asynchronous manner

##### data

The data to be sent to the thread handler

##### transfer

Array of Transferable objects whose ownership will be transfered to the underlying thread

##### callback(data)

This function will be called when the answer function has been called from the thread

###### data

The data passed to the answer function

#### Thread.destroy()

Ends the thread and clean things up. After this call, the thread is no longer usable.
