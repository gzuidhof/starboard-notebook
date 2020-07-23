import Hook, {MessageCallback, Message} from "console-feed/lib/Hook";

export class ConsoleCatcher {
    private currentHook?: MessageCallback;

    constructor(console: Console) {
        Hook(
            console,
            (msg: Message) => {
                if (this.currentHook) {
                    this.currentHook(msg);
                }
            },
            false
          );
    }

    public hook(callback: MessageCallback) {
        this.currentHook = callback;
    }

    public unhook(callback: MessageCallback) {
        if (this.currentHook === callback) {
            this.currentHook = undefined;
        }
    }
}
