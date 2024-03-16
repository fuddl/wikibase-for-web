import wikibases from '../wikibases.mjs';
import WBEdit from '../importmap/wikibase-edit.mjs';

export class WikibaseEditQueue {
  constructor() {
    this.queue = []; // Each job will be an object with a 'job' property and a 'done' flag
    this.isProcessing = false;
    this.onProgressUpdate = null; // Callback for progress updates
  }

  // Add multiple jobs at once
  addJobs(jobs) {
    jobs.forEach(job => {
      this.queue.push({ job, done: false });
    });
    this.processQueue(); // Start processing if not already doing so
    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        queue: this.queue,
      });
    }
  }

  // Process the queue
  processQueue() {
    if (this.isProcessing || this.queue.every(job => job.done)) {
      return;
    }
    this.isProcessing = true;
    this.processNextJob();
  }

  // Process the next job in the queue
  processNextJob() {
    const nextJob = this.queue.find(job => !job.done);
    if (!nextJob) {
      this.isProcessing = false; // Done processing
      return;
    }

    this.performEdit(nextJob.job).then(() => {
      // Mark job as done and notify progress
      nextJob.done = true;
      if (this.onProgressUpdate) {
        this.onProgressUpdate({
          queue: this.queue,
        });
      }
      this.processNextJob();
    });
  }

  async getEditToken(endpoint) {
    const response = await fetch(
      `${endpoint}?action=query&meta=tokens&format=json`,
    );
    const json = JSON.parse(await response.text());
    return json.query.tokens.csrftoken;
  }

  async getEditTag(endpoint) {
    if (!this?.editTag) {
      const browserInfo = await browser?.runtime?.getBrowserInfo();
      this.editTag = `wikidata-for-${browserInfo?.name == 'Firefox' ? 'firefox' : 'web'}`;
    }
    let params = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'tags',
      tglimit: '500',
      continue: '', // Start with no continue value
    });

    while (true) {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();

      // Check for the tag in the current batch of results
      const tags = data.query.tags;
      if (tags.some(tag => tag.name === this.editTag)) {
        return this.editTag;
      }

      // Use the 'continue' information, if present, to get the next batch of results
      if (data.continue) {
        Object.keys(data.continue).forEach(key => {
          params.set(key, data.continue[key]);
        });
      } else {
        break; // No more data to process
      }
    }

    return false;
  }

  async performEdit(job) {
    const wbEdit = WBEdit({
      instance: wikibases[job.instance].api.instance.root,
      credentials: {
        browserSession: true,
      },
    });

    const [scope, action] = job.action.split('.');

    const result = wbEdit[scope][action](job.edit);

    // let response = await fetch(endpoint, {
    //   method: 'post',
    //   body: params,
    // });

    // let parsedResponse = JSON.parse(await response.text());

    // if (parsedResponse?.success === 1) {
    //   let updatedEntity = '';
    //   switch (job.action) {
    //     case 'wbcreateclaim':
    //       updatedEntity = job.entity;
    //       break;
    //     case 'wbsetaliases':
    //       updatedEntity = job.id;
    //       break;
    //   }
    //   if (updatedEntity) {
    //     browser.runtime
    //       .sendMessage({
    //         type: 'update_entity',
    //         entity: `${job.instance}:${updatedEntity}`,
    //       })
    //       .then(response => {})
    //       .catch(error => console.error('Message failed:', error));
    //   }
    // }
  }

  // Set a progress update callback
  setProgressUpdateCallback(callback) {
    this.onProgressUpdate = callback;
  }

  // Method to clear completed jobs from the queue and trigger progress update
  clearCompletedJobs() {
    this.queue = this.queue.filter(job => !job.done);

    // After clearing completed jobs, update progress
    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.queue);
    }
  }
}
