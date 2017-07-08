/**
 *
 *      ioBroker Home Adapter
 *
 *      (c) 2017 ausHaus<teshaus@gmail.com>
 *
 *      MIT License
 *
 */
/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';
var utils      = require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter    = utils.adapter('home');

var objects = {};
///var states;

adapter.on('message', function (obj) {
    if (obj) processMessage(obj);
    processMessages();
});

adapter.on('ready', function () {
    main();
});

adapter.on('stateChange', function (id, state) {
    var end;
    var endd;
    if (!id || !state) return;

    for (var j = 0; j < adapter.config.devices.length; j++) {
        if (!adapter.config.devices[j]) continue;
        if (id === adapter.namespace + '.' + adapter.config.devices[j].group + '.' + adapter.config.devices[j].id) {
            end = adapter.config.devices[j];
            break;
        } else
        if (id === adapter.config.devices[j].binds) {
            endd = adapter.config.devices[j];
            break;
        }
    }

    if (end) {
        ///adapter.log.debug('END ' + end);
    } else
    if (endd) {
        ///adapter.log.debug('ENDD ' + endd);
    } else {
        return;
    }
    
    adapter.log.debug('stateChange ' + id + ': ' + JSON.stringify(state));

    // output to parser
    /*if (states[id] && states[id].native.binds) {   ///TESTAS
        adapter.log.debug('TESTAS ID ' + id);
    }*/

    var device;
    var binds;
    var i;
    for (i = 0; i < adapter.config.devices.length; i++) {
        if (!adapter.config.devices[i]) continue;
        if (id === adapter.namespace + '.' + adapter.config.devices[i].group + '.' + adapter.config.devices[i].id) {
            device = adapter.config.devices[i];
            break;
        } else
        if (id === adapter.config.devices[i].binds) {
            binds = adapter.config.devices[i];
            break;
        }
    }

    if (binds) {
        if (state.val === null) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'switch')) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'value')) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'blinds')) return;
        writeBinds(binds, state.val);
    } else
    if (device) {
        if (state.val === null) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'temperature')) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'humidity')) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'state')) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'indicator')) return;
        if (!objects[id] && (adapter.config.devices[i].role === 'counter')) return;
        writeWire(device, state.val);
    } else {
        adapter.log.warn('Wire "' + id + '" not found');
    }
});

function processMessages() {
    adapter.getMessage(function (err, obj) {
        if (obj) {
            processMessage(obj.command, obj.message);
            processMessages();
        }
    });
}

function writeWire(device, value) {
    if (device) {
        var role = device.role;
        var val;

        if (role.indexOf('switch') !== -1) {
            val = (value === '0' || value === 0 || value === 'false' || value === false) ? false : true;
        } else {
            val = parseFloat(value) || 0;
        }

        adapter.log.debug('Write /' + device.binds + ' with "' + val + '"');

        if (role.indexOf('switch') !== -1) {
            ///adapter.setForeignState(device.binds, !(value === '0' || value === 0 || value === 'false' || value === false), true);
            adapter.setForeignState(device.binds, !(value === '0' || value === 0 || value === 'false' || value === false));
        } else {
            ///adapter.setForeignState(device.binds, parseFloat(value) || 0, true);
            adapter.setForeignState(device.binds, parseFloat(value) || 0);
        }
    }
}

function writeBinds(device, value) {
    if (device) {
        var role = device.role;
        var val;

        if (role.indexOf('state') !== -1) {
            val = (value === '0' || value === 0 || value === 'false' || value === false) ? false : true;
        } else {
            val = parseFloat(value) || 0;
        }
        
        adapter.log.debug('Write /' + device.id + ' with "' + val + '"');

        if (role.indexOf('state') !== -1) {
            adapter.setState(device.group + '.' + device.id, value, true);
        } else {
            adapter.setState(device.group + '.' + device.id, parseFloat(value) || 0, true);
        }
    }
}

function createState(device, callback) {
    var id = device.id;
    ///var group = device.group;

    if (device.room === 'none') {
        device.room = '';
    }
    if (device.room) {
        adapter.addStateToEnum('rooms', device.room, '', device.group, id);
    }

    if (device.func === 'none') {
        device.func = '';
    }
    if (device.func) {
        adapter.addStateToEnum('functions', device.func, '', device.group, id);
    }

    var obj = {
        name:        (device.name || device.id),
        type:        'boolean',
        role:        device.role,
        read:        true,
        write:       false,
        def:         false,
        desc:        'Home state of ' + device.name
    };

    if (obj.role === 'switch') {
        obj.write  = true;
    }

    if (obj.role === 'blinds') {
        obj.role   = 'level';
        obj.type   = 'number';
        obj.write  = 'true';
        obj.unit   = '%';
        obj.min    = 0;
        obj.max    = 100;
        obj.def    = 0;
    }

    if (obj.role === 'value') {
        obj.role   = 'level';
        obj.type   = 'number';
        obj.write  = 'true';
        obj.def    = 0;
    }

    if (obj.role === 'counter') {
        obj.type   = 'number';
        obj.def    = 0;
    }

    if (obj.role === 'temperature') {
        obj.role   = 'level.temperature';
        obj.type   = 'number';
        obj.unit   = '°C';
        obj.min    = -30;
        obj.max    = 30;
        obj.def    = 0;
    }

    if (obj.role === 'humidity') {
        obj.role   = 'level.humidity';
        obj.type   = 'number';
        obj.unit   = '%';
        obj.min    = 0;
        obj.max    = 100;
        obj.def    = 0;
    }

    /* adapter.createState('', device.group, id, obj, {
        group:    device.group,
        id:       device.id,
        room:     device.room,
        function: device.func,
        binds:    device.binds
    }, callback); */
    var groupID = device.group + '.' + id;
    adapter.setObjectNotExists(groupID, {
        type: 'state',
        common: obj,
        native: {
            group:    device.group,
            id:       device.id,
            room:     device.room,
            function: device.func,
            binds:    device.binds
        },
    }, callback);
}

function addState(device, callback) {
    ///if (group) {
        adapter.getObject(device.group, function (err, obj) {
            if (err || !obj) {
                // if root does not exist, channel will not be created
                ///adapter.createChannel('', device.group, [], function () {
                    createState(device, callback);
                ///});
            } else {
                createState(device, callback);
            }
        });
    ///} else {
        ///createState(device, callback);
    ///}
}

function syncConfig(callback) {
    adapter.getStatesOf('', '', function (err, _states) {
        var configToDelete = [];
        var configToAdd    = [];
        var k;
        var count = 0;
        if (adapter.config.devices) {
            for (k = 0; k < adapter.config.devices.length; k++) {
                adapter.config.devices[k]._name = adapter.config.devices[k].id;
                configToAdd.push(adapter.namespace + '.' + adapter.config.devices[k].group + '.' + adapter.config.devices[k]._name);
            }
        }

        if (_states) {
            for (var j = 0; j < _states.length; j++) {
                var id = _states[j].native.id;
                var group = _states[j].native.group;
                if (!id) {
                    adapter.log.warn('No ID found for ' + JSON.stringify(_states[j]));
                    continue;
                }
                var pos = configToAdd.indexOf(_states[j]._id);
                // Entry still exists
                if (pos !== -1) {
                    configToAdd.splice(pos, 1);

                    if (adapter.config.devices) {
                        // Check group, id and name, role, room, function, binds
                        for (var u = 0; u < adapter.config.devices.length; u++) {
                            if (!adapter.config.devices[u] || !adapter.config.devices[u]._name) continue;

                            if (adapter.namespace + '.' + adapter.config.devices[u].group + '.' + adapter.config.devices[u]._name === _states[j]._id) {
                                if (_states[j].common.name !== (adapter.config.devices[u].name || adapter.config.devices[u].id) ||
                                    _states[j].native.id !== adapter.config.devices[u].id) {
                                    adapter.extendObject(_states[j]._id, {
                                        common: {
                                            name: (adapter.config.devices[u].name || adapter.config.devices[u].id)
                                        },
                                        native: {
                                            ip:         adapter.config.devices[u].id
                                        }
                                    });
                                }

                                if (_states[j].common.role !== adapter.config.devices[u].role) {
                                    if (adapter.config.devices[u].role === 'state') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'boolean',
                                                role:        adapter.config.devices[u].role,
                                                write:       false,
                                                unit:        '',
                                                min:         false,
                                                max:         true,
                                                def:         false
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'switch') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'boolean',
                                                role:        adapter.config.devices[u].role,
                                                write:       true,
                                                unit:        '',
                                                min:         false,
                                                max:         true,
                                                def:         false
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'value') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'number',
                                                role:        'level',
                                                write:       true,
                                                unit:        '',
                                                min:         0,
                                                max:         254,
                                                def:         0
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'blinds') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'number',
                                                role:        'level',
                                                write:       true,
                                                unit:        '%',
                                                min:         0,
                                                max:         100,
                                                def:         0
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'counter') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'number',
                                                role:        adapter.config.devices[u].role,
                                                write:       false,
                                                unit:        '',
                                                min:         0,
                                                max:         9999,
                                                def:         0
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'indicator') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'boolean',
                                                role:        adapter.config.devices[u].role,
                                                write:       false,
                                                unit:        '',
                                                min:         false,
                                                max:         true,
                                                def:         false
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'temperature') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'number',
                                                role:        'level.temperature',
                                                write:       false,
                                                unit:        '°C',
                                                min:         -30,
                                                max:         30,
                                                def:         0
                                            }
                                        });
                                    }
                                    if (adapter.config.devices[u].role === 'humidity') {
                                        adapter.extendObject(_states[j]._id, {
                                            common: {
                                                type:        'number',
                                                role:        'level.humidity',
                                                write:       false,
                                                unit:        '%',
                                                min:         0,
                                                max:         100,
                                                def:         0
                                            }
                                        });
                                    }
                                }

                                if (adapter.config.devices[u].room === 'none') {
                                    adapter.config.devices[u].room = '';
                                }
                                if (_states[j].native.room !== adapter.config.devices[u].room) {
                                    if (adapter.config.devices[u].room !== '') {
                                        adapter.log.info('Add a variable ' + _states[j]._id + ' to the ' + adapter.config.devices[u].room);
                                        adapter.deleteStateFromEnum('rooms', '', group, id);
                                        adapter.addStateToEnum('rooms', adapter.config.devices[u].room, '', group, id);

                                        adapter.extendObject(_states[j]._id, {
                                            native: {
                                                room: adapter.config.devices[u].room
                                            }
                                        });
                                    } else {
                                        adapter.log.info('Remove the variable ' + _states[j]._id + ' from the enum.rooms');
                                        adapter.deleteStateFromEnum('rooms', '', group, id);
                                        adapter.extendObject(_states[j]._id, {
                                            native: {
                                                room: ''
                                            }
                                        });
                                    }
                                }

                                if (adapter.config.devices[u].func === 'none') {
                                    adapter.config.devices[u].func = '';
                                }
                                if (_states[j].native.function !== adapter.config.devices[u].func) {
                                    if (adapter.config.devices[u].func !== '') {
                                        adapter.log.info('Add a variable ' + _states[j]._id + ' to the ' + adapter.config.devices[u].func);
                                        adapter.deleteStateFromEnum('functions', '', group, id);
                                        adapter.addStateToEnum('functions', adapter.config.devices[u].func, '', group, id);
                                        adapter.extendObject(_states[j]._id, {
                                            native: {
                                                function: adapter.config.devices[u].func
                                            }
                                        });
                                    } else {
                                        adapter.log.info('Remove the variable ' + _states[j]._id + ' from the enum.functions');
                                        adapter.deleteStateFromEnum('functions', '', group, id);
                                        adapter.extendObject(_states[j]._id, {
                                            native: {
                                                function: ''
                                            }
                                        });
                                    }
                                }

                                if (_states[j].native.binds !== adapter.config.devices[u].binds) {
                                    adapter.extendObject(_states[j]._id, {
                                        native: {
                                            binds: adapter.config.devices[u].binds
                                        }
                                    });
                                    /* if (adapter.config.devices[u].binds !== '') {
                                        adapter.log.info('Add the binding object to ' + adapter.config.devices[u].binds);
                                        adapter.extendForeignObject(adapter.config.devices[u].binds, {
                                            native: {
                                                binds: _states[j]._id
                                            }
                                        });
                                    } else {
                                        adapter.log.info('Remove the binding object from ' + _states[j].native.binds);
                                        adapter.extendForeignObject(_states[j].native.binds, {
                                            native: {
                                                binds: adapter.config.devices[u].binds
                                            }
                                        });
                                    } */
                                }
                            }
                        }
                    }

                } else {
                    configToDelete.push(_states[j]._id);
                    /* if (_states[j].native.binds !== '') {
                        adapter.log.info('Remove the binding object from ' + _states[j].native.binds);
                        adapter.extendForeignObject(_states[j].native.binds, {
                            native: {
                                binds: ''
                            }
                        });
                    } */
                }
            }
        }

        if (configToAdd.length && adapter.config.devices) { 
            for (var r = 0; r < adapter.config.devices.length; r++) {
                if (!adapter.config.devices[r] || !adapter.config.devices[r].group) continue;
                if (!adapter.config.devices[r] || !adapter.config.devices[r]._name) continue;
                if (configToAdd.indexOf(adapter.namespace + '.' + adapter.config.devices[r].group + '.' + adapter.config.devices[r]._name) !== -1) {
                    count++;
                    adapter.log.info('Create state ' + adapter.namespace + '.' + adapter.config.devices[r].group + '.' + adapter.config.devices[r]._name);
                    addState(adapter.config.devices[r], function () {
                        if (!--count && callback) callback();
                    });
                }
            }
        }
        if (configToDelete.length) {
            for (var e = 0; e < configToDelete.length; e++) {
                count++;
                adapter.log.info('Delete state ' + configToDelete[e]);
                adapter.delObject(configToDelete[e], function () {
                    if (!--count && callback) callback();
                });
            }
        }

        if (!count && callback) callback();
    });
}

/* function readObjects(index, callback) {
    if (index >= adapter.config.devices.length) {
        callback && callback();
    } else {
        var task = tasks.pop();
        var device = adapter.config.devices[index];
        if (!device.binds) {
            return setTimeout(readObjects, 0, index, callback);
        }
        adapter.getForeignState(device.binds, function (err, state) {
            if (state) {
                // TODO here!!! I dont understand why
                writeWire(device, state.val);
            }
            setTimeout(readObjects, 0, index, callback);
        });
    }
} */

function main() {
    if (!adapter.config.devices.length) {
        adapter.log.warn('No one ID configured for home');
        return;
    }

    // Subscribe on own variables to config binds
    if (adapter.config.devices.length) {
        for (var t = 0; t < adapter.config.devices.length; t++) {
            var parts = adapter.config.devices[t].binds.split('.');
            if (parts[0]) {
                var bindss = (parts[0] + '.' + parts[1] + '.*');
                adapter.subscribeForeignStates(bindss);
            }
        }
    } else {
        // subscribe for all variables
        ///adapter.subscribeForeignStates('*');
    }

    ///syncConfig(readObjects);
    syncConfig();

    adapter.subscribeStates('*');
}    
