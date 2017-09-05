import {GazelleIndexer} from './GazelleIndexer';
import {Indexer} from './Indexer';

export default function (type: string): typeof GazelleIndexer  {
  switch(type) {
    case 'gazelle': return GazelleIndexer;
  }
}
