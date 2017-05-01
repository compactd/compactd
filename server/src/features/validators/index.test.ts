import test from 'ava';
import {createValidator} from '.';
import * as Schemas from './Schemas';

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
