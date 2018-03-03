import { Databases } from "./state";
import { Dispatch } from "redux";
import { CompactdState } from ".";

export function wrapDatabaseFromState (fn: (databases: Databases, ...args: any[]) => Promise<any>) {
  return (...args: any[]) => {
    return (dispatch: Dispatch<any>, getState: () => CompactdState) => {
      fn(getState().app.databases, ...args).then((action) => {
        if (!action) return;
        dispatch(action);
      }).catch((err) => {
        console.trace(err);
      });
    }
  }
}