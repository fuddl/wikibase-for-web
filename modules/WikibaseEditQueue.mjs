import wikibases from '../wikibases.mjs';

export class WikibaseEditQueue {
  constructor({ resolvedCache }) {
    this.queue = []; // Each job will be an object with a 'job' property and a 'done' flag
    this.isProcessing = false;
    this.onProgressUpdate = null; // Callback for progress updates
    this.lastClaim = '';
    this.lastEntity = '';
    this.resolvedCache = resolvedCache;
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

    return '';
  }

  jobToParams(job) {
    const params = new URLSearchParams();
    Object.entries(job).forEach(([key, value]) => {
      if (['instance', 'status'].includes(key)) {
        return;
      }
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      params.append(key, value);
    });
    return params;
  }

  serializeValue(datavalue) {
    if (datavalue.type === 'string') {
      return `"${datavalue.value}"`;
    } else {
      return JSON.stringify(datavalue.value);
    }
  }

  updateView(entity) {
    browser.runtime
      .sendMessage({
        type: 'update_entity',
        entity: entity,
      })
      .then(response => {})
      .catch(error => console.error('Message failed:', error));
  }

  async performFetchRequest(instance, params) {
    const endpoint = wikibases[instance].api.instance.apiEndpoint;
    const token = await this.getEditToken(endpoint);
    const tag = await this.getEditTag(endpoint);

    let response = await fetch(endpoint, {
      method: 'post',
      body: new URLSearchParams({
        token: token,
        format: 'json',
        tags: tag,
        ...params,
      }),
    });
    let parsedResponse = await response.json();

    if (parsedResponse.success === 1) {
      if (parsedResponse?.claim?.id) {
        this.lastClaim = parsedResponse.claim.id;
        this.updateView(
          `${instance}:${this.lastClaim.replace(/(\$|\-).+/, '')}`,
        );
      }
      if (parsedResponse?.entity?.id) {
        this.lastEntity = parsedResponse.entity.id;
        this.updateView(`${instance}:${this.lastEntity}`);
      }
    }
    if (parsedResponse?.error) {
      console.debug({ request: params });
      console.debug({ response: parsedResponse });
    }

    return parsedResponse;
  }

  compareValues(A, B) {
    if (typeof A === 'string') {
      return A === B;
    }

    // Iterate through each key in object A
    for (const key in A) {
      // Check if the key exists in object B and the values are the same
      if (!(key in B) || A[key] !== B[key]) {
        return false;
      }
    }
    return true;
  }

  async getExistingClaim(instance, params) {
    const api = wikibases[instance].api;
    const url = api.getEntities({
      ids: [params.entity],
      props: ['claims'],
      format: 'json',
    });

    const { entities } = await fetch(url).then(res => res.json());
    if (entities?.[params.entity]?.claims?.[params.property]) {
      const claims = entities[params.entity].claims[params.property];
      for (const claim of claims) {
        if (claim?.mainsnak?.datavalue?.value) {
          const isIdentical = this.compareValues(
            JSON.parse(params.value),
            claim.mainsnak.datavalue.value,
          );
          if (isIdentical) {
            return claim.id;
          }
        }
      }
    }
    return false;
  }

  async performEdit(job) {
    if (job?.statement === 'LAST' && this.lastClaim !== '') {
      job.statement = this.lastClaim;
    }

    if (job?.entity === 'LAST' && this.lastEntity !== '') {
      job.entity = this.lastEntity;
    }

    switch (job.action) {
      case 'entity:create':
        await this.performFetchRequest(job.instance, {
          action: 'wbeditentity',
          new: job.new,
          data: JSON.stringify(job.data),
        });
        break;
      case 'claim:create':
        const claimCreation = {
          action: 'wbcreateclaim',
          entity: job.entity,
          property: job.claim.mainsnak.property,
          snaktype: job.claim.mainsnak.snaktype,
          value: this.serializeValue(job.claim.mainsnak.datavalue),
        };

        const existingclaim = await this.getExistingClaim(
          job.instance,
          claimCreation,
        );
        if (existingclaim) {
          // skipping this edit
          this.lastClaim = existingclaim;
        } else {
          await this.performFetchRequest(job.instance, claimCreation);
        }
        break;
      case 'qualifier:set':
        await this.performFetchRequest(job.instance, {
          action: 'wbsetqualifier',
          claim: job.statement,
          property: job.property,
          value: this.serializeValue(job.value),
          snaktype: job.snaktype,
        });
        break;
      case 'reference:set':
        await this.performFetchRequest(job.instance, {
          action: 'wbsetreference',
          statement: job.statement,
          snaks: JSON.stringify(job.snaks),
        });
        break;
      case 'sitelink:set':
        await this.performFetchRequest(job.instance, {
          action: 'wbsetsitelink',
          linksite: job.sitelink.site,
          linktitle: job.sitelink.title,
          id: job.entity,
        });
        break;
      case 'labels:add':
        await this.performFetchRequest(job.instance, {
          action: 'wbsetaliases',
          add: job.add,
          language: job.language,
          id: job.entity,
        });
        break;
      case 'resolver:add':
        if (job.url in this.resolvedCache) {
          this.resolvedCache[job.url].push({
            directMatch: true,
            instance: job.instance,
            resolved: [
              {
                specificity: 1000,
                id: `${job.instance}:${job.entity}`,
              },
            ],
          });
        }
        break;
    }
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
