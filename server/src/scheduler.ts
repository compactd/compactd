import { scheduler } from "./features/scheduler/Scheduler";
import discogsTasks from "./features/aquarelle/discogfetch";

export function setupScheduler () {
  discogsTasks().then((tasks) => {
    scheduler.schedule(tasks);
  });
}