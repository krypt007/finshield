// FleekHQ/space-client
const { SpaceClient } = require('@fleekhq/space-client');
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const opts = {
  url: 'http://0.0.0.0:9998',
  defaultBucket: 'my-bucket',
};

const client = new SpaceClient(opts);



const createFleekHqBucket = async() => {
    try {
        const res = await client.createBucket({ slug: 'my-bucket'});
        const bucket = res.getBucket();

        console.log(bucket.getKey());
        console.log(bucket.getName());
        console.log(bucket.getPath());
        console.log(bucket.getCreatedat());
        console.log(bucket.getUpdatedat());
    } catch (e) {
        console.error(e)
    }
}