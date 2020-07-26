const core = require('@actions/core');
const aws = require('aws-sdk');


function createTimestamp() {
  const date = new Date();
  let isoString = date.toISOString();
  // removes '-', 'T', ':' and 'Z'
  isoString = isoString.replace(/[-T:Z\.]/g, '');
  return isoString;
}


async function run() {
  try {
    const cloudFront = new aws.CloudFront({
      customUserAgent: 'aws-cloudfront-create-invalidation'
    });

    // get inputs
    const distributionId = core.getInput('distribution-id', { required: true });
    const pathsString = core.getInput('paths', { required: true });

    // inputs can only be strings, so parse them using newlines
    let paths = pathsString.split('\n');

    if (!Array.isArray(paths)) {
      paths = [paths];
    }

    // create invalidation
    core.debug('Creating invalidation');
    const createInvalidationResponse = await cloudFront.createInvalidation({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: createTimestamp(),
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    }).promise();

    core.setOutput('location', createInvalidationResponse.Location);
    core.info(`Invalidation created. Watch the progress in the AWS CloudFront console: ${createInvalidationResponse.Location}`);

  } catch (error) {
    core.setFailed(error.message);
    core.debug(error.stack);
  }
}


module.exports = run;


/* istanbul ignore next */
if (require.main === module) {
  run();
}
