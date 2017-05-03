import {ISchema} from './Schemas';
import {IPermission, IPermissions} from './Permissions';

const validate = function (sc: any, pe: any, pr: any, old: any,
  user: any, assign: any, find: any) {
  var keys = Object.keys;
  var doc = assign({}, old || {}, pr || {});
  var err = find(keys(sc).map(function (k): string {
    return eval('(' + sc[k] + ')')(k, doc[k]);
  }), (function (el: string): boolean {
    return el !== '';
  }));
  if (err) {
    throw({forbidden: err});
  }

  var ex = keys(pr).filter(function (k) {
    return k !== '_id';
  }).filter(function (k): boolean {
    return !~keys(sc).indexOf(k);
  });

  if (ex.length) {
    throw({forbidden: 'Keys ' + ex.join(', ') + ' aren\'t allowed'});
  }
  if (!pe) return;

  if (!old) {
    var perm = pe.create;
    for (var i = 0; i < user.roles.length; i++) {
      var role = user.roles[i];
      if (perm[role]) return;
    }
    throw({forbidden: 'User is not allowed to create documents'});
  }

  var perm = pe.read;
  var ok = false;
  for (var i = 0; i < user.roles.length; i++) {
    var role = user.roles[i];
    if (perm[role]) ok = true;
  }
  if (!ok) throw({forbidden: 'User is not allowed to update documents'});

  for (var i = 0; i < keys(pr).length; i++) {
    var key = keys(pr)[i];
    var val = pr[key];

    if (val !== old[key] && !~pe.upd_fd.indexOf(key))
      throw({forbidden: 'Not allowed to update ' + key});
  }


}

export function createValidator (schema: ISchema, perms?: IPermissions): string {
  return `function(d,o,u) {
  function _f(t, a) {
    if (null == t) throw new TypeError('"t" is null or not defined');
    var b = Object(t),
        c = b.length >>> 0;
    if ("function" != typeof a) throw new TypeError("predicate must be a function");
    for (var d = arguments[1], e = 0; e < c;) {
      var f = b[e];
      if (a.call(d, f, e, b)) return f;
      e++
    }
  }
  function _a (a, b) {
    "use strict";
    if (null == a) throw new TypeError("Cannot convert undefined or null to object");
    for (var c = Object(a), d = 1; d < arguments.length; d++) {
      var e = arguments[d];
      if (null != e)
        for (var f in e) Object.prototype.hasOwnProperty.call(e, f) && (c[f] = e[f])
    }
    return c;
  };
  (${validate.toString()})(${JSON.stringify(schema, (key, val) => {
    return typeof val === 'function' ? val.toString() : val;
  })}, ${JSON.stringify(perms)}, d, o, u, _a, _f);
}`.replace(/(\s\s+|\n)/g, ' ')
}
