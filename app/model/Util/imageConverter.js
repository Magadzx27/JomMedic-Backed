'use strict';

module.exports = {
    blobToBase64Img: function (blobImage) {

        var buffer = ''
        var bufferBase64 = ''

        if (!blobImage) {
            bufferBase64 = ''
        } else {
            buffer = Buffer.from(blobImage);
            bufferBase64 = buffer.toString('base64');
        }

        var imageUri = `data:image/jpeg;base64,` + bufferBase64

        return imageUri;
    },
    base64ToBlob: function (dataURI) {

        if (typeof (dataURI) === 'object') {
            if (JSON.stringify(dataURI) === '{}' || JSON.stringify(dataURI) === '[]') {
                return '';
            } else if (!dataURI) {
                return '';
            }
            return false;
        } else if (typeof (dataURI) === 'string') {
            // If string is empty or whitespace
            if (!dataURI.trim()) {
                return '';
            }

            var base64String = dataURI.split(',')[1]
            var bufferValue = Buffer.from(base64String, "base64");
            return bufferValue;

        } else if (typeof (dataURI) === 'undefined') {
            return '';
        } else {

            var base64String = dataURI.split(',')[1]
            var bufferValue = Buffer.from(base64String, "base64");

            return bufferValue;
        }
    }
};

// function blobToB64Img(blobImage) {

//     var buffer = Buffer.from(blobImage);
//     var bufferBase64 = buffer.toString('base64');

//     var imageUri =  `data:image/jpeg;base64,` + bufferBase64

//     return imageUri
// }

// function b64ToBlob(dataURI) {

//     var base64String = dataURI.split(',')[1]

//     var bufferValue = Buffer.from(base64String,"base64");

//     return new Blob([ab], { type: dataType.toString() });
// }

