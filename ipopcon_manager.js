var util = require('util');
var async = require('async');
const JSON = require('circular-json');
var SensorTag = require('./index');
var ipopcon = new Object();
var values;

function Sensor_Values(left,right)
{
  this.accel_x=0;
  this.accel_y=0;
  this.accel_z=0;
  this.accel_average=0;
  this.magnetometer_x=0;
  this.magnetometer_y=0;
  this.magnetometer_z=0;
  this.gyro_x=0;
  this.gyro_y=0;
  this.gyro_z=0;
  this.temperature=0;
  this.ir_temperature=0;
  this.lux=0;
  this.baro=0;
  this.altitude=0;
  this.left_button=left;
  this.right_button=right;
}

var connection = null;
var WebSocketServer = require('websocket').server;
var http = require('http');
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

wsServer.on('request', function(request) {


    connection = request.accept('ipopcon_connection', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    connection.on('message', function(message) {

      if(message.utf8Data == "$discover_ipopcon"){

        SensorTag.discover(function(sensorTag) {
          console.log('discovered: ' + sensorTag);
          ipopcon["device"] = sensorTag;
          sensorTag.on('disconnect', function() {
            console.log('disconnected!');
            process.exit(0);
          });

          async.series([
              function(callback) {
                console.log('connectAndSetUp');
                sensorTag.connectAndSetUp(callback);
              },
              function(callback) {
                console.log('readDeviceName');
                sensorTag.readDeviceName(function(error, deviceName) {
                  console.log('\tdevice name = ' + deviceName);
                  callback();
                });
              },
              function(callback) {
                console.log('readSystemId');
                sensorTag.readSystemId(function(error, systemId) {
                  console.log('\tsystem id = ' + systemId);
                  ipopcon["id"] = systemId;
                  callback();
                });
              },
              function(callback) {
                console.log('readSerialNumber');
                sensorTag.readSerialNumber(function(error, serialNumber) {
                  console.log('\tserial number = ' + serialNumber);
                  callback();
                });
              },
              function(callback) {
                console.log('readFirmwareRevision');
                sensorTag.readFirmwareRevision(function(error, firmwareRevision) {
                  console.log('\tfirmware revision = ' + firmwareRevision);
                  callback();
                });
              },
              function(callback) {
                console.log('readHardwareRevision');
                sensorTag.readHardwareRevision(function(error, hardwareRevision) {
                  console.log('\thardware revision = ' + hardwareRevision);
                  callback();
                });
              },
              function(callback) {
                console.log('readSoftwareRevision');
                sensorTag.readHardwareRevision(function(error, softwareRevision) {
                  console.log('\tsoftware revision = ' + softwareRevision);
                  callback();
                });
              },
              function(callback) {
                console.log('readManufacturerName');
                sensorTag.readManufacturerName(function(error, manufacturerName) {
                  console.log('\tmanufacturer name = ' + manufacturerName);
                  callback();
                });
              },
              function(callback) {
                console.log('enableIrTemperature');
                sensorTag.enableIrTemperature(callback);
              },

              function(callback) {
                console.log('enableAccelerometer');
                sensorTag.enableAccelerometer(callback);
              },


              function(callback) {
                console.log('enableBarometricPressure');
                sensorTag.enableBarometricPressure(callback);
              },

              function(callback) {
                console.log('enableGyroscope');
                sensorTag.enableGyroscope(callback);
              },

              function(callback) {
                console.log('enableLuxometer');
                sensorTag.enableLuxometer(callback);
              },

              function(callback) {
                console.log('enableSimplekey');
                sensorTag.notifySimpleKey(callback);
              },
              function(callback) {
                setTimeout(callback, 1000);
              },
              function(callback) {
                console.log('enableMagnetometer');
                sensorTag.enableMagnetometer(callback);


                connection.send(JSON.stringify(ipopcon));//send ipopcon id
                ipopcon["data"] = new Sensor_Values(sensorTag.left_button ? 1 : 0,sensorTag.right_button ? 1 : 0);//init and get current ipopcon button values
                delete ipopcon["id"];
              },

              function(callback) {



                setInterval(function() {


                  async.series([

                  function(callback) {
                  console.log('read available sensor values!');

                  ipopcon["data"].left_button = sensorTag.left_button ? 1 : 0; //read button sensor
                  ipopcon["data"].right_button = sensorTag.right_button ? 1 : 0; //read button sensor

                  sensorTag.readGyroscope(function(error, x, y, z) {
                      ipopcon["data"].gyro_x = x;
                      ipopcon["data"].gyro_y = y;
                      ipopcon["data"].gyro_z = z;
          //            console.log('gyro_x : ' + ipopcon["data"].gyro_x);
          //            console.log('gyro_y : '+ ipopcon["data"].gyro_y);
          //            console.log('gyro_z : '+ ipopcon["data"].gyro_z);
                    });

                    sensorTag.readAccelerometer(function(error, x=0, y=0, z=0) {
                      ipopcon["data"].accel_x = x;
                      ipopcon["data"].accel_y = y;
                      ipopcon["data"].accel_z = z;
                      ipopcon["data"].accel_average = ( Math.sqrt(Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2)) - 1 );

          //            console.log('accel_x  : '+ ipopcon["data"].accel_x);
          //            console.log('accel_y  : '+ ipopcon["data"].accel_y);
          //            console.log('accel_z  : '+ ipopcon["data"].accel_z);
                    });

                    sensorTag.readIrTemperature(function(error, objectTemperature=0, ambientTemperature=0) {
                      ipopcon["data"].ir_temperature = ambientTemperature;
            //          console.log('ir_temperature : ' + ipopcon["data"].ir_temperature);
                    });
                    sensorTag.readLuxometer(function(error, lux=0) {
                      ipopcon["data"].lux = lux;
            //          console.log('lux : ' + ipopcon["data"].lux);
                    });
                    sensorTag.readBarometricPressure(function(error, temp, pressure=0) {
                      ipopcon["data"].baro = pressure;
                      ipopcon["data"].temperature = temp;

                      ipopcon["data"].altitude = 44330*(1 - Math.pow((pressure/1025.6),1/5.255)  );    // p0 = 1013.4(seoul see hPa)
              //         console.log('baro : ' + ipopcon["data"].baro);
              //        console.log('temperature : ' + ipopcon["data"].temperature);
                    });

                    callback();
                  },



                  function(callback) {
                    sensorTag.readMagnetometer(function(error, x=0, y=0, z=0) {
                      ipopcon["data"].magnetometer_x = x;
                      ipopcon["data"].magnetometer_y = y;
                      ipopcon["data"].magnetometer_z = z;
          //            console.log('magnetometer_x  : '+ ipopcon["data"].magnetometer_x);
          //            console.log('magnetometer_y  : '+ ipopcon["data"].magnetometer_y);
            //          console.log('magnetometer_z  : '+ ipopcon["data"].magnetometer_z);
                    });
                    callback();

                  },
                  function(callback) {
                    console.dir(ipopcon["data"]);
                    connection.send(JSON.stringify(ipopcon));
                    callback();
                  }
                  ]);

                }, 500);

              }



            ]);


        });





      }


    });




//////////////////////


});
////////////////////////////////////////////////////////////////////////////////
