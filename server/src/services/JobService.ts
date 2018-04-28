import { Component, Inject, OnModuleInit } from '@nestjs/common';
import DepToken from 'shared/constants/DepToken';
import { PouchFactory } from 'slothdb';

import JobStatus from 'shared/constants/JobStatus';
import { IJobDTO, JobFunction, JobViews } from 'shared/definitions/jobs';
import Job, { JobEntity } from 'shared/models/Job';

import Debug from 'debug';
import delay from 'delay';
import JobId from 'shared/constants/JobId';

const debug = Debug('compactd:job-scheduler');

@Component()
export default class JobService {
  private runningQueue: Promise<void>;
  private jobDefinitions: { [jobId: string]: JobFunction } = {};

  constructor(
    @Inject(DepToken.DatabaseFactory)
    private readonly factory: PouchFactory<any>
  ) {
    this.runningQueue = Promise.resolve();
  }

  public async findJobsByJobId(jobId: string, jobStatus?: JobStatus) {
    const startKey = jobStatus ? [jobId, jobStatus] : [jobId];
    const endKey = jobStatus ? [jobId, jobStatus + '\uffff'] : [jobId, {}];
    debug('queryDocs using %o and %o', startKey, endKey);

    const jobs = await Job.queryDocs(
      this.factory,
      JobViews.JobsById,
      startKey,
      endKey
    );

    return jobs.map(job => job.getProps());
  }

  public processQueue() {
    this.refreshQueue();
  }

  public define(jobId: JobId, fn: JobFunction) {
    debug(`defining job '%s'`, jobId);
    this.jobDefinitions[jobId] = fn;
  }

  public async schedule(props: IJobDTO) {
    debug(`scheduling '${props.jobId}' with %O`, props);

    const job = Job.create(this.factory, props);
    job.status = JobStatus.Pending;

    await job.save();

    this.refreshQueue();

    return job.getProps();
  }

  private async refreshQueue() {
    debug('refreshing queue');
    this.runningQueue = this.runningQueue.then(() => this.findNextJob());
  }

  private async findNextJob() {
    const [job] = await Job.queryDocs(this.factory, JobViews.PendingJobs);

    if (!job) {
      debug('findNextJob: queue is empty');
      return Promise.resolve();
    }

    const added = Date.parse(job.added);

    await delay(Math.max(0, added + job.delay - Date.now()));

    return this.startJob(job);
  }

  private errorToMeta(job: JobEntity, { message, stack }: any) {
    return {
      ...job.meta,
      error: {
        message
      }
    };
  }
  private async startJob(job: JobEntity) {
    const jobFn = this.jobDefinitions[job.jobId];

    if (!jobFn) {
      debug("job '%s' is not defined", job.jobId);
      job.status = JobStatus.Failed;
      job.meta = this.errorToMeta(
        job,
        new Error(`Undefined job '${job.jobId}'`)
      );
      await job.save();
      return;
    }

    job.status = JobStatus.Running;

    await job.save();

    debug('starting job %s', job.jobId);

    try {
      await jobFn(job.payload, job.meta, job);
      debug('job %s has been processed');
      job.status = JobStatus.Done;

      await job.save();
    } catch (err) {
      debug('error occured while running %s:\n%s', job.jobId, err.stack);

      job.status = JobStatus.Failed;
      job.meta = this.errorToMeta(job, err);
      await job.save();
    }
  }
}
