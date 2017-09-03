import {GazelleIndexer} from './GazelleIndexer';
import {Indexer} from './Indexer';

export default function (type: 'gazelle'): typeof Indexer  {
  switch(type) {
    case 'gazelle': return GazelleIndexer;
  }
}
