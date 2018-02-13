import StoreOptionSchema from "./StoreOptionsSchema";
import HashMap from "../../helpers/HashMap";
import ResultEntry from "./ResultEntry";

export default abstract class Store {
  protected _id: string;
  protected optsSchema : StoreOptionSchema;
  public abstract readonly name: string;
  protected opts: HashMap<string> = {};

  protected constructor (optsSchema: StoreOptionSchema, opts: HashMap<string>, id: string) {
    this.optsSchema = optsSchema;
    this.optsSchema.forEach(({keyName, validator, defaultValue} ) => {
      const value = opts[keyName] || defaultValue;
      if (validator) {
        validator(value);
      }
      this.opts[keyName] = value;
    });
    this.opts.name = opts.name;
    this._id = id;
  }

  public get id () {
    return this._id;
  }

  abstract authenticate () : Promise<void>;

  abstract search (artist: string, album: string): Promise<ResultEntry[]>;
  
  /**
   * EventEmitter events:
   *  - 'progress': called on progress, with {value: 0-1}
   *  - 'error': error occured
   *  - 'end': fetch finished
   * @param sid the store id for the element
   * @return an event emitter
   */
  abstract fetchResult (sid: string): EventEmitter;
}