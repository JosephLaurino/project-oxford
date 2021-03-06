'use strict';

var request = require('request').defaults({
    baseUrl: 'https://api.projectoxford.ai/emotion/v1.0/',
    headers: { 'User-Agent': 'nodejs/0.3.0' } }),
    fs = require('fs'),
    _Promise = require('bluebird');

var emotionUrl = '/recognize';

/**
 * @namespace
 * @memberof Client
 */
var emotion = function emotion(key) {
    /**
     * @private
     */
    function _return(error, response, resolve, reject) {
        if (error) {
            return reject(error);
        }

        if (response.statusCode !== 200) {
            reject(response.body);
        }

        return resolve(response.body);
    }

    /**
     * (Private) Analyze a local image, using a fs pipe
     * @private
     * @param  {string} image       - Path to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _emotionLocal(image, options) {
        return new _Promise(function (resolve, reject) {
            fs.createReadStream(image).pipe(request.post({
                uri: emotionUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/octet-stream'
                },
                qs: options
            }, function (error, response) {
                response.body = JSON.parse(response.body);
                _return(error, response, resolve, reject);
            }));
        });
    }

    /**
     * (Private) Analyze an online image
     * @private
     * @param  {string} image       - Url to image
     * @param  {Object} options     - Options object
     * @return {Promise}            - Promise resolving with the resulting JSON
     */
    function _emotionOnline(image, options) {
        return new _Promise(function (resolve, reject) {
            request.post({
                uri: emotionUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': key,
                    'Content-Type': 'application/json'
                },
                json: true,
                body: { url: image },
                qs: options
            }, function (error, response) {
                return _return(error, response, resolve, reject);
            });
        });
    }

    /**
     * Analyze the emotions of one or more faces in an image.
     *
     * @param  {Object}   options                - Options object
     * @param  {string}   options.url            - URL to the image file
     * @param  {string}   options.path           - URL to a local image file
     * @param  {Object[]} options.faceRectangles - Array of face rectangles.  Face rectangles
     *      are returned in the face.detect and vision.analyzeImage methods.
     * @return {Promise}                         - Promise resolving with the resulting JSON
     */
    function analyzeEmotion(options) {
        var qs = {};
        if (options && options.faceRectangles) {
            var rects = [];
            options.faceRectangles.forEach(function (rect) {
                var r = [];
                r.push(rect.left);
                r.push(rect.top);
                r.push(rect.width);
                r.push(rect.height);
                rects.push(r.join(','));
            });
            qs.faceRectangles = rects.join(';');
        }

        if (options.path) {
            return _emotionLocal(options.path, qs);
        }
        if (options.url) {
            return _emotionOnline(options.url, qs);
        }
    }

    return {
        analyzeEmotion: analyzeEmotion
    };
};

module.exports = emotion;
