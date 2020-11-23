const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express().use(cors({ origin: true }), bodyParser.json(), bodyParser.urlencoded({ extended: true }));

const admin = require('firebase-admin');
admin.initializeApp()
// const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

//imports needed for this function
const axios = require('axios');
const FormData = require('form-data');
const recursive = require('recursive-fs');
const basePathConverter = require('base-path-converter');

const ipfsAPI = require('ipfs-api');

//Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

const PINATA_API_FILE_ENDPOINT = functions.config().env.pinata.file_endpoint;
const PINATA_API_JSON_ENDPOINT = functions.config().env.pinata.json_endpoint;
const PINATA_API_KEY = functions.config().env.pinata.key; 
const PINATA_API_SECRET = functions.config().env.pinata.secret;


const Web3 = require('web3');


app.post("/", async (req, res) => {  //{:path}/{:descr}
  if (req.method !== "POST"){
    return res.status(500).json({
      message: 'Not Allowed'
    });
  }
  console.log(JSON.stringify(req.body));

  let message = `This is a test response`;
  res.status(200).send(message); 
  
});

//Addfile router for adding file a local file to the IPFS network without any local node
app.get('/addfile', function(req, res) {

    ipfs.files.add(testBuffer, function (err, file) {
        if (err) {
        console.log(err);
        }
        console.log(file)
    })

})
//Getting the uploaded file via hash code.
app.get('/getfile', function(req, res) {
    
    //This hash is returned hash of addFile router.
    const validCID = 'HASH_CODE'

    ipfs.files.get(validCID, function (err, files) {
        files.forEach((file) => {
        console.log(file.path)
        console.log(file.content.toString('utf8'))
        })
    })

})

const pinDirectoryToIPFS = async (pinataApiKey, pinataSecretApiKey, srcDirectory) => {
    const url = PINATA_API_FILE_ENDPOINT;
    const src = srcDirectory;
    
    //we gather the files from a local directory in this example, but a valid readStream is all that's needed for each file in the directory.
    recursive.readdirr(src, function (err, dirs, files) {
        let data = new FormData();
        files.forEach((file) => {
            //for each file stream, we need to include the correct relative file path
            data.append(`file`, fs.createReadStream(file), {
                filepath: basePathConverter(src, file)
            })
        });
    
        const metadata = JSON.stringify({
            name: 'testname',
            keyvalues: {
                exampleKey: 'exampleValue'
            }
        });
        data.append('pinataMetadata', metadata);
    
        return axios.post(url,
            data,
            {
                maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey
                }
            }
        ).then(function (response) {
            //handle response here
        }).catch(function (error) {
            //handle error here
        });
    });
};

const pinFileToIPFS = async (pinataApiKey, pinataSecretApiKey, filePath) => {
    const url = PINATA_API_FILE_ENDPOINT;

    //we gather a local file for this example, but any valid readStream source will work here.
    let data = new FormData();
    data.append('file', fs.createReadStream(filePath));

    //You'll need to make sure that the metadata is in the form of a JSON object that's been convered to a string
    //metadata is optional
    const metadata = JSON.stringify({
        name: 'testname',
        keyvalues: {
            exampleKey: 'exampleValue'
        }
    });
    data.append('pinataMetadata', metadata);

    //pinataOptions are optional
    const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
            regions: [
                {
                    id: 'FRA1',
                    desiredReplicationCount: 1
                },
                {
                    id: 'NYC1',
                    desiredReplicationCount: 2
                }
            ]
        }
    });
    data.append('pinataOptions', pinataOptions);

    return axios.post(url,
        data,
        {
            maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large files
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        }
    )
    .then(res => { 
        console.log(JSON.stringify(res.data));
        console.log(`Data to blockchain: ${res.data.IpfsHash}`)
    })
    .catch( e => { console.log(JSON.stringify(e)) });
};

const pinJSONToIPFS = async (pinataApiKey, pinataSecretApiKey, JSONBody) => {
    const url = PINATA_API_JSON_ENDPOINT;
    return axios
        .post(
            url,
            JSONBody,
            {
                headers: {
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey
                }
            }
        ).then( (res) => {
            //handle response here
        })
        .catch( (e) => {
            //handle error here
        });
};


const sendBlockchainTx = () => {
    // Show web3 where it needs to look for the Ethereum node.
    web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/YOUR-API-TOKEN-HERE'));

    // An extra module is required for this, use npm to install before running
    var Tx = require('ethereumjs-tx');

    // Used to sign the transaction. Obviously you SHOULD better secure this than just plain text
    var privateKey = new Buffer('PRIVATE-KEY', 'hex');

    // The reciviing address of the transaction
    var receivingAddr = ('0x9Ff24857b990a8d036D0973d9a0825A76C2c8723');

    // Value to be sent, converted to wei and then into a hex value
    var txValue = web3.utils.numberToHex(web3.utils.toWei('0.1', 'ether'));

    // Data to be sent in transaction, converted into a hex value. Normal tx's do not need this and use '0x' as default, but who wants to be normal?
    var txData = web3.utils.asciiToHex('oh hai mark'); 

    var rawTx = {
    nonce: '0x0', // Nonce is the times the address has transacted, should always be higher than the last nonce 0x0#
    gasPrice: '0x14f46b0400', // Normal is '0x14f46b0400' or 90 GWei
    gasLimit: '0x55f0', // Limit to be used by the transaction, default is '0x55f0' or 22000 GWei
    to: receivingAddr, // The receiving address of this transaction
    value: txValue, // The value we are sending '0x16345785d8a0000' which is 0.1 Ether
    data: txData // The data to be sent with transaction, '0x6f6820686169206d61726b' or 'oh hai mark' 
    }

    //console.log(rawTx); // This is used for testing to see if the rawTx was formmated created properly, comment out the code below to use.


    var tx = new Tx(rawTx);
    tx.sign(privateKey); // Here we sign the transaction with the private key

    var serializedTx = tx.serialize(); // Clean things up a bit

    console.log(serializedTx.toString('hex')); // Log the resulting raw transaction hex for debugging if it fails to send

    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')) // Broadcast the transaction to the network
    .on('receipt', console.log); 
}


exports.onFileChange= functions.region('europe-west3').storage.object().onFinalize(async (object) => {
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
    // [END eventAttributes]

    // [START stopConditions]
    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
        return console.log('This is not an image.');
    }

    // Get the file name.
    const fileName = path.basename(filePath);
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
        return console.log('Already a Thumbnail.');
    }
    // [END stopConditions]

    // [START thumbnailGeneration]
    // Download file from bucket.
    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);

    const metadata = {
        contentType: contentType,
    };
    await bucket.file(filePath).download({destination: tempFilePath});
    console.log('Image downloaded locally to', tempFilePath);
    // Generate a thumbnail using ImageMagick.
    //await spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
    console.log('Thumbnail created at', tempFilePath);

    // let testFile = fs.readFileSync(tempFilePath);
    //Creating buffer for ipfs function to add file to the system
    // let testBuffer = new Buffer(testFile);
    const filetoipfs = await pinFileToIPFS (PINATA_API_KEY, PINATA_API_SECRET, tempFilePath);
    //console.log(filetoipfs);

    // // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    // const thumbFileName = `thumb_${fileName}`;
    // const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    // // Uploading the thumbnail.
    // await bucket.upload(tempFilePath, {
    //     destination: thumbFilePath,
    //     metadata: metadata,
    // });
    // Once the thumbnail has been uploaded delete the local file to free up disk space.
    return fs.unlinkSync(tempFilePath);
});

exports.finshield = functions.region('europe-west3').https.onRequest(app); 