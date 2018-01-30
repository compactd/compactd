import {} from 'jest';
import { CompactdAlbum } from 'api/models/CompactdAlbum';
import { Status, FindMode } from 'api/models/CompactdModel';
import pouch from 'pouchdb';
import fetch from 'node-fetch';
import * as sinon from 'sinon';
import { Album } from 'definitions';

pouch.plugin(require('pouchdb-adapter-memory'));
const PouchDB = pouch.defaults({adapter: 'memory'})

const BoundAlbum = CompactdAlbum.bind(null, PouchDB, fetch as any);
const sandbox = sinon.createSandbox();

const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('CompactdAlbum#constructor', () => {
  
  it ('creates a new database instance named `album`', () => {
    expect.assertions(2);
    const pouch = sinon.spy(PouchDB);
    const album = new CompactdAlbum(pouch as any, null, 'foo');
    
    expect(pouch.calledOnce).toBe(true);
    expect(pouch.calledWithExactly('albums')).toBe(true);
  });

  it ('creates a barebone object when only id is passed', () => {
    const album = new BoundAlbum('foo');

    expect(album.id).toBe('foo');
    expect(album.status).toBe(Status.BAREBONE);
  });

  it ('creates a fetched object when id and name is passed', () => {
    const album = new BoundAlbum('foo', 'Foo');

    expect(album.id).toBe('foo');
    expect(album.name).toBe('Foo');
    expect(album.status).toBe(Status.FETCHED);
  });

  it ('copies props from other object when cloned', () => {
    const album = new BoundAlbum('foo', 'Foo');
    const other = new BoundAlbum(album);

    expect(other.id).toBe('foo');
    expect(other.name).toBe('Foo');
    expect(other.status).toBe(Status.FETCHED);
  });

  it ('creates a fetched instance from props', () => {
    const album = new BoundAlbum({name: 'Foo', '_id': 'foo'});
    expect(album.name).toBe('Foo');
    expect(album.id).toBe('foo');
    expect(album.status).toBe(Status.FETCHED);
  });
})

describe('CompactdAlbum#props', () => {
  it ('returns an object with its props', () => {
    const album = new BoundAlbum('foo', 'bar');
    expect(album.props).toEqual({_id: 'foo', name: 'bar'});
  });
});

describe('CompactdAlbum#pull', () => {
  
  let getStub: sinon.SinonStub;
  beforeEach(() => {
    getStub = sandbox.stub(PouchDB.prototype, 'get').returns(Promise.resolve({
      name: 'Foobar',
      _id: 'foobar'
    }));
  });
  afterEach(() => {
    sandbox.restore();
  });
  it('calls PouchDB#get', async () => {
    expect.assertions(3);
    const album = new CompactdAlbum(PouchDB, null, 'foo', 'bar');
    await album.pull();
    expect(getStub.calledOnce).toBeTruthy();
    expect(getStub.calledWithExactly("foo")).toBeTruthy();
    expect(album.name).toBe("Foobar");
  });
  it('populates props', async () => {
    expect.assertions(1);
    const album = new CompactdAlbum(PouchDB, null, 'foo', 'bar');
    await album.pull();
    expect(album.name).toBe('Foobar');
  });
  it('sets its status to fetched', async () => {
    expect.assertions(1);
    const album = new CompactdAlbum(PouchDB, null, 'foo', 'bar');
    await album.pull();
    
    expect(album.status).toBe(Status.FETCHED);
  });
});

describe('CompactdAlbum.findAll', () => {

  let allDocsStub: sinon.SinonStub;
  beforeEach(() => {
    allDocsStub = sandbox.stub(PouchDB.prototype, 'allDocs').resolves({
      rows: []
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  it ('calls PouchDB#allDocs with include_docs = false whith BAREBONE', async () => {
    expect.assertions(3);
    const res = await CompactdAlbum.findAll(PouchDB, null, FindMode.BAREBONE);
    
    expect(res).toEqual([]);
    expect(allDocsStub.calledOnce).toBe(true);
    expect(allDocsStub.calledWith({include_docs: false})).toBe(true);
  });
  it ('calls PouchDB#allDocs with include_docs = true with PREFETCH', async () => {
    expect.assertions(3);
    const res = await CompactdAlbum.findAll(PouchDB, null, FindMode.PREFETCH);
    
    expect(res).toEqual([]);
    expect(allDocsStub.calledOnce).toBe(true);
    expect(allDocsStub.calledWith({include_docs: true})).toBe(true);
  });
  it ('calls PouchDB#allDocs with startkey and endkey when key is passed', async () => {
    expect.assertions(3);
    const res = await CompactdAlbum.findAll(PouchDB, null, FindMode.PREFETCH, 'foobar');
    
    expect(res).toEqual([]);
    expect(allDocsStub.calledOnce).toBe(true);
    expect(allDocsStub.calledWith({
      include_docs: true, startkey: 'foobar', endkey: 'foobar\uffff'})).toBe(true);
  });
  it ('maps each row with an album', async () => {
    expect.assertions(5);

    allDocsStub.returns({
      rows: [{id: 'foo'}, {id: 'bar'}]
    });

    const res = await CompactdAlbum.findAll(PouchDB, null, FindMode.PREFETCH, 'foobar');
    
    expect(res.length).toBe(2);
    expect(res[0].id).toBe('foo');
    expect(res[1].id).toBe('bar');
    expect(allDocsStub.calledOnce).toBe(true);
    expect(allDocsStub.calledWith({
      include_docs: true, startkey: 'foobar', endkey: 'foobar\uffff'})).toBe(true);
  });
});

describe('CompactdAlbum#detachFeed', () => {
  it ('doesnt fire once called', async (done) => {
    expect.assertions(1);

    const albums = new PouchDB(CompactdAlbum.DATABASE_NAME);
    const fz = await albums.put({
      _id: 'library/flatbush-zombies',
      name: 'Flatbush ZOMBiES'
    });
    const id = 'library/flatbush-zombies';
    const flatbush = new CompactdAlbum(PouchDB, null, id);
    let rev: string = null;
    await flatbush.fetch();

    const stub = sinon.stub();

    const unbinder = flatbush.addOnPropsChangedListener(stub);
    const res = await albums.put({
      _rev: fz.rev,
      _id: id,
      name: 'Flatbush Zombies'
    });
    await delay(15);
    unbinder.unbind();

    const res2 = await albums.put({
      _rev: res.rev,
      _id: id,
      name: 'Flatbush ZOMBIES'
    });

    await albums.put({
      _rev: res2.rev,
      _id: id,
      name: 'Flatbush ZombiES'
    });

    expect(stub.calledOnce).toBe(true);

    done();
  });
});

describe ('CompactdAlbum.create', () => {
  it('calls put with id and name', async () => {
    let putStub = sandbox.stub(PouchDB.prototype, 'put').resolves({});
    let getStub = sandbox.stub(PouchDB.prototype, 'get').resolves({
      _id: 'library/foo',
      name: 'foo'
    });
    
    const foo = await CompactdAlbum.create(PouchDB, null, 'foo');

    expect(foo.name).toBe('foo');
    expect(foo.id).toBe('library/foo');

    expect(putStub.calledOnce).toBe(true);
    expect(putStub.calledWith({
      _id: 'library/foo',
      name: 'foo'
    }));

    sandbox.restore();
  });

  
  it('slugifies name', async () => {
    let putStub = sandbox.stub(PouchDB.prototype, 'put').resolves({});
    let getStub = sandbox.stub(PouchDB.prototype, 'get').resolves({
      _id: 'library/foo-heavy-heart-trees-and-salad',
      name: 'foo ❤️ trees & salad'
    });
    
    const foo = await CompactdAlbum.create(PouchDB, null, 'foo');

    expect(foo.name).toBe('foo');
    expect(foo.id).toBe('library/foo');

    expect(putStub.calledOnce).toBe(true);
    expect(putStub.calledWith({
      _id: 'library/foo-heavy-heart-trees-and-salad',
      name: 'foo ❤️ trees & salad'
    }));

    sandbox.restore();
  });
});

describe ('CompactdAlbum.byNameAscending', () => {
  it('sorts an array by name ascending', () => {
    const docs = ['foo', 'bar', 'zzrot', 'foobar'].map((name) => ({name}));

    const res = docs.sort(CompactdAlbum.byNameAscending);

    expect(docs.map(({name}) => name)).toEqual([
      'bar', 'foo', 'foobar', 'zzrot'
    ]);
  });
});

describe ('CompactdAlbum.toProps', () => {
  it ('maps models to props', () => {
    const props = {foo: 'bar'};
    const res = CompactdAlbum.toProps()({props} as any);
    expect(props).toEqual(res);
  });
});

describe ('CompactdAlbum.fromProps', () => {
  it ('maps flat props to models', () => {
    const props = {
      _id: 'foo',
      name: 'bar'
    };

    const foo = CompactdAlbum.fromProps(PouchDB, null)(props);

    expect(foo.id).toBe('foo');
    expect(foo.name).toBe('bar');
    expect(foo).toBeInstanceOf(CompactdAlbum);
  });
  it ('maps nested props to models', () => {
    const props = {
      _id: 'foo',
      name: 'bar'
    };

    const foo = CompactdAlbum.fromProps(PouchDB, null)({
      doc: props, id: 'foo'});

    expect(foo.id).toBe('foo');
    expect(foo.name).toBe('bar');
    expect(foo).toBeInstanceOf(CompactdAlbum);
  });
  it ('maps id to models', () => {

    const foo = CompactdAlbum.fromProps(PouchDB, null)({id: 'foo'});

    expect(foo.id).toBe('foo');
    expect(foo.name).toBe(null);
    expect(foo).toBeInstanceOf(CompactdAlbum);
  });
});
