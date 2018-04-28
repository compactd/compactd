import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothIndex,
  SlothRel,
  SlothURI,
  SlothView
} from "slothdb";
import { IJob, JobViews } from "../definitions/jobs";

import uuid from "uuid";
import JobStatus from "../constants/JobStatus";

@SlothEntity("jobs")
export class JobEntity extends BaseEntity<IJob> {
  @SlothURI("jobs", "uid")
  // tslint:disable-next-line:variable-name
  public _id = "";

  @SlothField() public uid = uuid.v4();

  @SlothField() public added = new Date().toJSON();

  @SlothView(
    /* istanbul ignore next */ function getByJobId(doc: any, emit) {
      emit([doc.job_id, doc.status]);
    },
    "by_job_id"
  )
  @SlothField("job_id")
  public jobId = "";

  @SlothField() public payload: any = {};

  @SlothField() public meta: any = {};

  @SlothField() public status = JobStatus.Created;

  @SlothView(
    /* istanbul ignore next */ function getPendingJobs(doc: any, emit) {
      /* tslint:disable:prefer-const no-var-keyword */
      if (doc.status !== "pending") {
        return;
      }
      var added = Date.parse(doc.added);
      var runIn = Math.max(0, added + doc.delay - Date.now());

      emit([runIn, doc.priority, added], null);
      /* tslint:enable:prefer-const no-var-keyword */
    },
    "pending_jobs"
  )
  @SlothField()
  public priority = 0;

  @SlothField() public delay = 100;
}

export default new SlothDatabase<IJob, JobEntity, JobViews>(JobEntity);
