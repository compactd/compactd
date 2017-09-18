import { Position, Toaster, Intent, IconName } from "@blueprintjs/core";

const toaster = Toaster.create({
  className: "compactd-toaster",
  position: Position.TOP,
});

const show = (opts: {
  icon?: IconName,
  message: string,
  intent?: 'NONE' | 'PRIMARY' | 'SUCCESS' | 'WARNING' | 'DANGER',
  onDismiss?: (didTimeoutExpire: boolean) => void
})  => {
  return toaster.show({
    iconName: opts.icon,
    message: opts.message,
    intent: Intent[opts.intent || 'NONE']
  });
};

export default {
  show,
  error: (err: Error | string, icon: IconName = 'error') => {
    console.log(err);
    show({
      icon, intent: 'DANGER', message: (err as any).message || err
    })
  }
};