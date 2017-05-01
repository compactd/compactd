import test from 'ava';
import {createValidator} from '.';
import * as Schemas from './Schemas';
import * as Perms from './Permissions';

test('createValidator - should eval complex validator', t => {
  const validator = createValidator(Schemas.TrackSchema);
  eval(`const validate = ${validator}`);
  t.pass();
});

test('createValidator - should not throw for valid Track', t => {

  const validator = createValidator(Schemas.TrackSchema);
  const val: any = {};
  eval(`val.idate = ${validator}`);

  val.idate({
    name: 'foo',
    artist: '42',
    album: '13370'
  });

  val.idate({
    name: 'foo',
    artist: '42',
    album: '13370',
    track_artist: 'foo'
  });

  val.idate({
    name: 'foo',
    artist: '42',
    album: '1337',
    number: 1337
  });

  t.pass();
})

test('createValidator - should throw for missing required', t => {

  const validator = createValidator(Schemas.TrackSchema);
  const val: any = {};
  eval(`val.idate = ${validator}`);

  t.throws(() => val.idate({
    name: 'foo',
    album: '13370'
  }));

  t.pass();
})

test('createValidator - should throw for invalid value', t => {

  const validator = createValidator(Schemas.TrackSchema);
  const val: any = {};
  eval(`val.idate = ${validator}`);

  t.throws(() => val.idate({
    name: 1337,
    album: '13370'
  }));

  t.throws(() => val.idate({
    name: 1337,
    album: {foo: 'bar'}
  }));

  t.pass();
});

test('createValidator - should throw for invalid value', t => {

  const validator = createValidator(Schemas.TrackSchema);
  const val: any = {};
  eval(`val.idate = ${validator}`);

  t.throws(() => val.idate({
    name: 'foo',
    artist: '42',
    album: '1337',
    number: 1337,
    foo: 'bar'
  }));

  t.pass();
});

test('createValidator - allows only admin/app to create track', t => {
  const validator = createValidator(Schemas.TrackSchema,
    Perms.TrackPermissions);

  const props = {
    name: 'foo',
    artist: '42',
    album: '1337',
    number: 1337
  };

  let validate = {} as any;

  eval(`validate = ${validator}`);

  validate(props, undefined, {
    roles: ['_admin']
  });

  validate(props, undefined, {
    roles: ['foo', 'app', 'end_user']
  });

  t.throws(() => validate(props, undefined, {
    roles: ['end_user', 'user', 'foo']
  }));

});

test('createValidator - allows only admin/app to update track', t => {
  const validator = createValidator(Schemas.TrackSchema,
    Perms.TrackPermissions);

  const props = {
    name: 'bar',
    number: 42
  };
  const old = {
    name: 'foo',
    artist: '42',
    album: '1337',
    number: 1337
  };

  let validate = {} as any;
  eval(`validate = ${validator}`);

  validate(props, old, {
    roles: ['_admin']
  });

  validate(props, old, {
    roles: ['foo', 'app', 'end_user']
  });

  t.throws(() => validate(props, old, {
    roles: ['foo']
  }));

});

test('createValidator - allows only to update specific props', t => {
  const validator = createValidator(Schemas.TrackSchema,
    Perms.TrackPermissions);

  const props = {
    name: 'bar',
    number: 42,
    artist: 'foo'
  };
  const old = {
    name: 'foo',
    artist: '42',
    album: '1337',
    number: 1337
  };

  let validate = {} as any;
  eval(`validate = ${validator}`);

  t.throws(() => validate(props, old, {
    roles: ['_admin']
  }), Object);

});
