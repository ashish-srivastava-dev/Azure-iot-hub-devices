// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

//Reference: https://github.com/Azure/azure-iot-sdk-node/blob/main/service/samples/javascript/twin.js

'use strict';

var iothub = require('azure-iothub');

var connectionString = "<Azure IoT Hub connection string>";

var registry = iothub.Registry.fromConnectionString(connectionString);

// List devices
console.log('**listing devices...');
registry.list(function (err, deviceList) {
  deviceList.forEach(function (device) {
    var key = device.authentication ? device.authentication.symmetricKey.primaryKey : '<no primary key>';
    console.log(device.deviceId + ': ' + key);
  });

  let count = 1;
  setInterval(() => {
    // Create a new device 
    var device = {
      deviceId: 'iothub:device:sample-device-' + count++,

    };
    console.log('\n**creating device \'' + device.deviceId + '\'');

    registry.create(device, printAndContinue('create', function next() {
      // Get the newly-created device
      console.log('\n**getting device \'' + device.deviceId + '\'');

      registry.getTwin(device.deviceId, function (err, twin) {
        if (err) {
          console.error(err.message);
        } else {
          console.log('Model Id: ' + twin.modelId);
          console.log(JSON.stringify(twin, null, 2));
          var twinPatch = {
            tags: {
              city: "Redmond"
            },
            properties: {
              desired: {
                telemetrySendInterval: "5000"
              }
            }
          };

          // method 1: using the update method directly on the twin
          twin.update(twinPatch, function (err, twin) {
            if (err) {
              console.error(err.message);
            } else {
              console.log(JSON.stringify(twin, null, 2));
              // method 2: using the updateTwin method on the Registry object
              registry.updateTwin(twin.deviceId, {
                properties: {
                  desired: {
                    deviceName: 'sample-device-' + count,
                    min: "30",
                    max: "100",
                    unit: "deg F",
                    phenomenon: "Temperature",
                    valueIsBool: false,                    
                  }
                }
              }, twin.etag, function (err, twin) {
                if (err) {
                  console.error(err.message);
                } else {
                  console.log(JSON.stringify(twin, null, 2));
                }
              });
            }
          });
        }
      });
    }));
  }, 1000);
});

function printAndContinue(op, next) {
  return function printResult(err, deviceInfo, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
    if (deviceInfo) console.log(op + ' device info: ' + JSON.stringify(deviceInfo));
    if (next) next();
  };
}