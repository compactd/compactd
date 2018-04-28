import JobId from "../constants/JobId";
import JobStatus from "../constants/JobStatus";
import { JobEntity } from "../models/Job";

export interface IJob {
  _id: string;
  uid: string;
  added: string;
  jobId: string;
  payload: any;
  meta: any;
  status: JobStatus;
  priority: number;
  delay: number;
}

export interface IJobDTO {
  jobId: JobId;
  payload?: any;
  meta?: any;
  priority?: number;
  delay?: number;
}

export enum JobViews {
  PendingJobs = "views/pending_jobs",
  JobsById = "views/by_job_id"
}

export type JobFunction = (
  payload: any,
  meta: any,
  job: JobEntity
) => Promise<void>;
