const core = require('@actions/core');
const aws = require('aws-sdk');


function createTimestamp() {
  const date = new Date();
  let isoString = date.toISOString();
  // removes '-', 'T', ':' and 'Z'
  isoString = isoString.replace(/[-T:Z\.]/g, '');
  return isoString;
}

function parseAndCleanPaths(pathsString) {
  let paths = pathsString.split('\n');

  // if there's only one element, convert to array
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  // clean up any spaces
  for (let i = 0; i < paths.length; ++i) {
    paths[i] = paths[i].trim();
  }

  return paths;
}


async function run() {
  try {
    const cloudFront = new aws.CloudFront({
      customUserAgent: 'aws-cloudfront-create-invalidation'
    });

    // get inputs
    const distributionId = core.getInput('distribution-id', { required: true });
    const pathsString = core.getInput('paths', { required: true });

    // inputs can only be strings, so parse them to an array
    const paths = parseAndCleanPaths(pathsString);

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
    core.info(`Invalidation created. Watch the progress in the AWS CloudFront console: https://console.aws.amazon.com/cloudfront/home?region=${aws.config.region}#distribution-settings:${distributionId}`);

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
