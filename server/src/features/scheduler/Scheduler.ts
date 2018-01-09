import { clearInterval } from "timers";

export type SchedulerFunc = () => Promise<void>;

/**
 * The scheduler  is a basic helper class that runs tasks when the server becames idle
 * It provides a middleware which will postpone the execution of said tasks for 15m on every request.
 */
export default class Scheduler {
  private executorKey: number;
  private static INSTANCE = new Scheduler();
  private queue: SchedulerFunc[] = [];
  private interval: NodeJS.Timer = null;

  constructor () {}

  private _middleware (req: Express.Request, res: Express.Response, next: Function) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // This key will be used to stop the pending tasks in the middle of an execution
    // when this key changes, the execute function will stop running
    this.executorKey = Date.now();

    this.interval = setInterval(() => {
      clearInterval(this.interval);
      this.interval = null;
      this.execute();
    }, 15 * 60 * 1000);

    next();
  }
  /**
   * Executes all given tasks until the executorKey has changed
   */
  async execute(): Promise<void> {
    const key = this.executorKey;

    for (let i in this.queue) {
      const func = this.queue[i];
      await func();
      this.queue.splice(+i, 1);
      if (this.executorKey != key) {
        return;
      }
    }
  }
  /**
   * Schedules a func, this function will be ran when the server becomes idle
   * @param func 
   */
  schedule (func: SchedulerFunc|SchedulerFunc[]) {
    if (Array.isArray(func)) {
      return func.forEach((fun) => {
        this.schedule(fun);
      });
    }
    this.queue.push(func);
  }
  /**
   * Middleware that postpone on every request 
   */
  middleware () {
    return this._middleware.bind(this);
  }
  static getInstance () {
    return Scheduler.INSTANCE;
  }
}

export const scheduler = Scheduler.getInstance();