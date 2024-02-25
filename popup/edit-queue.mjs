browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'update_edit_queue_progress') {
    const totalJobs = message.queue.length;
    const doneJobs = message.queue.filter(job => job.done).length;

    const bar = document.querySelector('progress');
    bar.setAttribute('max', totalJobs);
    bar.setAttribute('value', doneJobs);

    return Promise.resolve('done');
  }
});
