import Orbit from 'orbit/core';
import Requestable from 'orbit/requestable';
import RequestConnector from 'orbit/connectors/request_connector';
import RSVP from 'rsvp';

var primarySource,
    secondarySource,
    requestConnector;

var testRescueMode = function(actionName) {
  var ActionName = actionName.charAt(0).toUpperCase() + actionName.slice(1);

  var successfulOperation = function() {
    return new RSVP.Promise(function(resolve, reject) {
      resolve(':)');
    });
  };

  var failedOperation = function() {
    return new RSVP.Promise(function(resolve, reject) {
      reject(':(');
    });
  };

  test("a RequestConnector in `rescue` mode should call the primary source and, if successful, should not call the secondary source", function() {
    expect(4);

    requestConnector = new RequestConnector(primarySource,
                                            secondarySource,
                                            {mode: 'rescue'});

    var order = 0;

    primarySource['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return successfulOperation();
    };

    secondarySource['_' + actionName] = function() {
      ok(false, '_' + ActionName + ' should not be triggered on the secondary source');
    };

    primarySource.on('did' + ActionName, function() {
      equal(++order, 2, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    primarySource[actionName]().then(function(result) {
      start();
      equal(++order, 3, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("a RequestConnector in `rescue` mode should call the secondary source after an unsuccessful action on the primary source", function() {
    expect(6);

    requestConnector = new RequestConnector(primarySource,
                                            secondarySource,
                                            {mode: 'rescue'});

    var order = 0;

    primarySource['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return failedOperation();
    };

    secondarySource['_' + actionName] = function() {
      equal(++order, 2, '_' + actionName + ' triggered next');
      return successfulOperation();
    };

    secondarySource.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('did' + ActionName, function() {
      equal(++order, 4, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    primarySource[actionName]().then(function(result) {
      start();
      equal(++order, 5, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("a RequestConnector in `assist` mode should call the secondary source before any action on the primary source", function() {
    expect(5);

    requestConnector = new RequestConnector(primarySource,
                                            secondarySource,
                                            {mode: 'assist'});

    var order = 0;

    secondarySource['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return successfulOperation();
    };

    primarySource['_' + actionName] = function() {
      ok(false, '_' + ActionName + ' should not be triggered on the primary source');
    };

    secondarySource.on('did' + ActionName, function() {
      equal(++order, 2, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    primarySource[actionName]().then(function(result) {
      start();
      equal(++order, 4, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("a RequestConnector in `assist` mode should call the secondary source, and if unsuccessful, the primary source will be called", function() {
    expect(6);

    requestConnector = new RequestConnector(primarySource,
                                            secondarySource,
                                            {mode: 'assist'});

    var order = 0;

    secondarySource['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' on the secondary source triggered first');
      return failedOperation();
    };

    secondarySource.on('didNot' + ActionName, function() {
      equal(++order, 2, 'didNot' + ActionName + ' triggered after action failed on the secondary source');
    });

    primarySource['_' + actionName] = function() {
      equal(++order, 3, '_' + actionName + ' on the primary source triggered first');
      return successfulOperation();
    };

    primarySource.on('did' + ActionName, function() {
      equal(++order, 4, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    primarySource[actionName]().then(function(result) {
      start();
      equal(++order, 5, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("a RequestConnector should connect calls that match the `type` filter", function() {
    expect(6);

    requestConnector = new RequestConnector(primarySource,
                                            secondarySource,
                                            {mode: 'rescue',
                                             types: ['planet']});

    var order = 0;

    primarySource['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first');
      return failedOperation();
    };

    secondarySource['_' + actionName] = function() {
      equal(++order, 2, '_' + actionName + ' triggered next');
      return successfulOperation();
    };

    secondarySource.on('did' + ActionName, function() {
      equal(++order, 3, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('did' + ActionName, function() {
      equal(++order, 4, 'did' + ActionName + ' triggered after action performed successfully');
    });

    primarySource.on('didNot' + ActionName, function() {
      ok(false, 'didNot' + ActionName + ' should not be triggered');
    });

    stop();
    primarySource[actionName]('planet').then(function(result) {
      start();
      equal(++order, 5, 'promise resolved last');
      equal(result, ':)', 'success!');
    });
  });

  test("a RequestConnector should not connect calls that don't match the `type` filter", function() {
    expect(4);

    requestConnector = new RequestConnector(primarySource,
                                            secondarySource,
                                            {mode: 'rescue',
                                             types: ['planet']});

    var order = 0;

    primarySource['_' + actionName] = function() {
      equal(++order, 1, '_' + actionName + ' triggered first for primary source');
      return failedOperation();
    };

    secondarySource['_' + actionName] = function() {
      ok(false, '_' + ActionName + ' should not be triggered for secondary source');
    };

    primarySource.on('didNot' + ActionName, function() {
      equal(++order, 2, 'didNot' + ActionName + ' triggered after action failed');
    });

    primarySource.on('did' + ActionName, function() {
      ok(false, 'did' + ActionName + ' should not be triggered');
    });

    stop();
    primarySource[actionName]('moon').then(
      null,
      function(result) {
        start();
        equal(++order, 3, 'promise rejection resolved last');
        equal(result, ':(', 'failure!');
      }
    );
  });

};

///////////////////////////////////////////////////////////////////////////////

module("Unit - RequestConnector", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    primarySource = {};
    Requestable.extend(primarySource);

    secondarySource = {};
    Requestable.extend(secondarySource);
  },

  teardown: function() {
    primarySource = null;
    secondarySource = null;
    requestConnector = null;

    Orbit.Promise = null;
  }
});

testRescueMode('find');
