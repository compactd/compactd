import {ISchema} from './Schemas';

const validate = function (s: any, p: any) {
  var l = Object.keys;
  var e = l(s).map(function (k): string {
    return eval('(' + s[k] + ')')(k, p[k]);
  }).find(function (e: string): boolean {
    return e !== '';
  });
  if (e) {
    throw({forbidden: e});
  }
  var x = l(p).filter(function (k): boolean {
    return !~l(s).indexOf(k);
  });
  if (x.length) {
    throw({forbidden: 'Keys ' + x.join(', ') + ' aren\'t allowed'});
  }
}

export function createValidator (schema: ISchema): string {
  return `function(d,o,u) {
  (${validate.toString()})(${JSON.stringify(schema, (key, val) => {
    return typeof val === 'function' ? val.toString() : val;
  })}, d);
}`.replace(/(\s\s+|\n)/g, ' ')
}
