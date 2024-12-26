const PDF = require("pdfkit-table");
const AWS = require('aws-sdk');
const got = require('got');
const fetch = require('node-fetch');
const getStream = require('get-stream');

exports.handler = async (event) => {
    const SVID = event.queryStringParameters.svid;
    const HASH = event.queryStringParameters.hash;
    const img_str = decodeURIComponent(event.queryStringParameters.img);
    const decrypt_api = `https://abc.com?svid=${SVID}&hash=${HASH}`;
    const resp_decrypt = await fetch(decrypt_api);
    const data = await resp_decrypt.json();
    const surveyData = data.result;

    const doc = new PDF({ margin: 30, size: 'A4' });
    doc.fontSize(16);
    const fileName = `${data.id}.pdf`;

    const survey_questions_answers=surveyData.filter(s=>s.answer[0]!==undefined);
    const psf_file = await createPDF(doc, survey_questions_answers.map(s => [s.subject, s.answer[0]]), img_str);

    console.log('PDF Completed');
    //IAM 身分資訊
    AWS.config.update({
        credentials: {
            accessKeyId: '',
            secretAccessKey: ''
        }
    });
    //IAM region 資訊
    AWS.config.update({
        region: ''
    });
    const workdocs = new AWS.WorkDocs();

    await start(workdocs, fileName, psf_file);
    const pdf_body=await psf_file.toString('base64');

    let response = {
        statusCode: 200,
        headers: { 'Content-type': 'application/pdf' },
        body: pdf_body,
        isBase64Encoded: true,
    };
    return response;
}

const createPDF = async function (doc, row, img) {
    try {
        const table = {
            title: 'Survey Result',
            headers: ['Question', 'Answer'],
            rows: row
        };

        await doc.table(table, { width: 300 });
        await doc.text('This is your signature:');
        await doc.image(img);
        await doc.end();

        return await getStream.buffer(doc);
    } catch (e) {
        console.log(e);
    }
};

const describeUser = async function (workdocs) {
    //取得 workdocs 上某位使用者的資訊
    const user = await workdocs.describeUsers({
        OrganizationId: '',
        Query: ''
    }).promise();

    return user;
}

const initUpload = async function ({ workdocs, folderID, filename }) {
    try {
        const contentType = "application/octet-stream";
        const initResult = await workdocs.initiateDocumentVersionUpload({
            ParentFolderId: folderID,
            Name: filename,
            ContentType: contentType,
            ContentCreatedTimestamp: new Date(),
            ContentModifiedTimestamp: new Date()
        }).promise();
        const documentId = initResult.Metadata.Id;
        const versionId = initResult.Metadata.LatestVersionMetadata.Id;
        const { UploadUrl, SignedHeaders } = initResult.UploadMetadata;
        console.log("initUpload complete");
        return {
            documentId,
            versionId,
            uploadUrl: UploadUrl,
            signedHeaders: SignedHeaders
        };
    } catch (e) {
        console.log('failed initUpload', e);
        throw e;
    }
}

const uploadFile = async function ({ stream, signedHeaders, uploadUrl }) {
    try {
        console.log('reading file stream');
        const fileStream = stream;
        console.log('preparing form data');
        const extendParams = {
            headers: signedHeaders
        };
        console.log('got extendParams', extendParams);
        const client = got.extend(extendParams);
        await client.put(uploadUrl, {
            body: fileStream
        });
        console.log('upload complete');
    } catch (e) {
        console.log('failed uploadFile', e);
        throw e;
    }
}

const updateVersion = async function ({ workdocs, documentId, versionId }) {
    try {
        await workdocs.updateDocumentVersion({
            DocumentId: documentId,
            VersionId: versionId,
            VersionStatus: 'ACTIVE'
        }).promise();
        console.log('document version updated');
    } catch (e) {
        console.log('failed updateversion', e);
        throw e;
    }
}

const start = async function (workdocs, filename, stream) {
    try {
        const user = await describeUser(workdocs);
        const rootFoldId = user.Users[0].RootFolderId;

        const {
            documentId,
            versionId,
            uploadUrl,
            signedHeaders
        } = await initUpload({ workdocs: workdocs, folderID: rootFoldId, filename });
        await uploadFile({ stream, signedHeaders, uploadUrl });
        await updateVersion({ workdocs, documentId, versionId });
    } catch (e) {
        console.error(e);
    }
}