declare module 'storyboard' {

    type level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

    type logMessageOnly = (message: string, attachment?: {
        attach: any,
        attachLevel?: 'debug' | 'trace'
    }) => void;

    type logSource = (source: string, message: string, attachment?: {
        attach: any,
        attachLevel?: 'debug' | 'trace'
    }) => void;

    type log = logMessageOnly & logSource;

    namespace Storyboard {
        interface childOptions {
            src?: string;
            title?: string;
            level?: level;
        }
        interface Story {
            info: log;
            error: log;
            trace: log;
            debug: log;
            fatal: log
            warn: log;
            close: () => void;
            child: (opts: childOptions) => Story;
        }
        export var mainStory: Story;
    }

    export = Storyboard;
    
}
