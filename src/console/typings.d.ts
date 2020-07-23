declare module "console-feed/lib/Hook" {
    declare type Methods =
      | 'log'
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
      | 'table'
      | 'clear'
      | 'time'
      | 'timeEnd'
      | 'count'
      | 'assert';
    
        
    declare interface Storage {
        pointers: {
            [name: string]: () => any;
        };
        src: any;
    }
    
    declare interface HookedConsole extends Console {
        feed: Storage;
    }
    
    declare interface Message {
        method: Methods;
        data?: any[];
    }
    
    declare type Callback = (encoded: Message, message: Message) => void;
    declare type MessageCallback = (message: Message) => void;
    
    declare function Hook(
        console: any,
        callback: Callback,
        encode = true,
    ): HookedConsole; 

    declare function Hook(
        console: any,
        callback: MessageCallback,
        encode = false,
    ): HookedConsole; 

    export = Hook;
    export {MessageCallback, Message};
}