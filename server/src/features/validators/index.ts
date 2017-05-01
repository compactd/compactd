import {ISchema} from './Schemas';

function validate (schema: any, props: any) {
  var err = Object.keys(schema).map(function (key): string {
    return eval('(' + schema[key] + ')')(key, props[key]);
  }).find(function (el: string): boolean {
    return el !== '';
  });
  if (err) {
    throw({forbidden: err});
  }
  const extra = Object.keys(props).filter(function (key): boolean {
    return !~Object.keys(schema).indexOf(key);
  });
  if (extra.length > 0) {
    throw({forbidden: 'Keys ' + extra.join(', ') + ' aren\'t allowed'});
  }
}

export function createValidator (schema: ISchema): string {
  return `function(newDoc, oldDoc, userCtx) {
  var _schema = ${JSON.stringify(schema, (key, val) => {
    return typeof val === 'function' ? val.toString() : val;
  })};

  ${validate.toString()}
  validate(_schema, newDoc);
}`.replace(/(\s\s+|\n)/g, ' ')
}
