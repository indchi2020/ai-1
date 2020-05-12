 /**
 * Implements JavaScript functions that extend Snap! to access AI cloud services and the machine learning library tensorflow.js
 * Authors: Ken Kahn
 * License: New BSD
 */

"use strict";

let segmenter;

// listen for requests for segmentations and poses
const respond_to_messages =
    async (event) => {              
        if (typeof event.data.segmentation_and_pose !== 'undefined') {
            const image_data = event.data.segmentation_and_pose.image_data;
            const options = event.data.segmentation_and_pose.options;
            const config = options && options.config;
//          console.time("segmentation");
            const segmentation = await segmenter.segmentPersonParts(image_data, config);
//          console.timeLog("segmentation");
            let color_mapping = options["color mappings"];
            if (color_mapping === '') {
                color_mapping = undefined; // not specified
            }
            if (color_mapping) {
                if (typeof color_mapping[0][0] === 'string') {
                    // remove body part names
                    color_mapping = color_mapping.map((mapping) => mapping[1]);
                };
                color_mapping = color_mapping.slice(1); // eCraft2Learn starts with the color for not a body part
             }
             if (options["create segmentation costume"]) {
                 segmentation.mask = bodyPix.toColoredPartMask(segmentation, color_mapping);
//               console.timeLog("segmentation");
             }
//           console.timeEnd("segmentation");
             event.source.postMessage({segmentation_response: segmentation,
                                       time_stamp: event.data.segmentation_and_pose.time_stamp}, "*");
        } else if (typeof event.data.segmentations_and_poses !== 'undefined') {
            const image_data = event.data.segmentations_and_poses.image_data;
            const options = event.data.segmentations_and_poses.options;
            const config = options && options.config;
            const segmentations = await segmenter.segmentMultiPersonParts(image_data, config);
            let color_mappings = options["color mappings"];
            let color_mapping;
            if (color_mappings) {
                color_mappings = color_mappings.map((color_mapping) => {
                    if (typeof color_mapping[0][0] === 'string') {
                        // remove body part names
                        return color_mapping.map((mapping) => mapping[1]);
                    } else {
                        return color_mapping;
                    }
                });
            }
            if (options["create costume"]) {
                if (color_mappings && color_mappings.length > 1) {
                    // each segmentation (i.e. person) has a different color mapping
                    segmentations.forEach((segmentation, index) => {
                        segmentations[index].mask = bodyPix.toColoredPartMask(segmentations, color_mappings[index].slice(1));
                    });
                } else {
                    const color_mapping = color_mappings && color_mappings[0].slice(1); // .map((rgba) => rgba.slice(0, 3));
                    // if no color_mappings then default rainbow is used
                    const mask = bodyPix.toColoredPartMask(segmentations, color_mapping);
                    segmentations.forEach((segmentation) => {
                        segmentation.mask = mask; // they all share the same mask
                    });
                }
//                 console.timeLog("segmentation");
                // if one wanted the pixels one can get them from the costume using the pixel library block in Snap! for example
//                     } else if (color_mappings) {
//                         segmentations.forEach((segmentation, index) => {
//                             color_mapping = color_mappings.length > 1 ? color_mappings[index] : color_mappings[0];
//                             segmentation.pixels = [];
//                             segmentation.data.forEach((part_id) => {
//                                 segmentation.pixels.push(color_mapping[part_id+1]); // +1 since -1 is "no body part"
//                             });
//                         });
            }
            if (options["create person bitmask"]) {
                 const person_segmentations = await segmenter.segmentMultiPerson(image_data, config);
                 segmentations.forEach((segmentation, index) => {
                     segmentation.person_bitmap = person_segmentations[index].data;  
                 });
            }
            event.source.postMessage({segmentation_response: segmentations,
                                      time_stamp: event.data.segmentations_and_poses.time_stamp}, "*");
        };
};

window.addEventListener('DOMContentLoaded', 
                        () => {
                            window.addEventListener("message", respond_to_messages);
                            bodyPix.load().then((model) => {
                                segmenter = model;
                                window.parent.postMessage("Ready", "*");
                            });
                        });
