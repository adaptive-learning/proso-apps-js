var loggingServiceLoaded;
if (loggingServiceLoaded){
    throw "LoggingService already loaded";
}
loggingServiceLoaded = true;

var m = angular.module('proso.apps.common-logging', ['proso.apps.common-config']);

m.factory("loggingService", ["$window", function($window) {
    if (!!$window.loggingService){
        return $window.loggingService;
    }

    var self = this;
    var debugLog = [];
    var debugLogListeners = [];

    self.getDebugLog = function() {
        return debugLog;
    };

    self.extendDebugLog = function(url, events) {
        events.forEach(function(e) {
            e.url = url;
            debugLog.push(e);
        });
        debugLogListeners.forEach(function(listener) {
            listener(events);
        });
    };

    self.addDebugLogListener = function(listener) {
        debugLogListeners.push(listener);
    };

    $window.loggingService = self;
    return self;
}]);

m.factory("serverLogger", [function() {

    var self = this;
    var processing = {};

    self.debug = function(message, data) {
        self.log(message, data, "debug");
    };

    self.info = function(message, data) {
        self.log(message, data, "info");
    };

    self.warn = function(message, data) {
        self.log(message, data, "warn");
    };

    self.error = function(message, data) {
        self.log(message, data, "error");
    };

    self.log = function(message, data, level) {
        var jsonEvent = {
            message: message,
            level: level
        };
        if (data) {
            jsonEvent['data'] = data;
        }
        var eventKey = angular.toJson(jsonEvent);
        if (processing[eventKey]) {
            return;
        }
        processing[eventKey] = true;
        $.ajax({
            type: "POST",
            url: "/common/log/",
            beforeSend: function (request) {
                request.setRequestHeader("X-CSRFToken", self.cookie('csrftoken'));
            },
            contentType: "application/json",
            data: angular.toJson(jsonEvent)
        }).always(function() {
            delete processing[eventKey];
        });
    };

    self.cookie = function(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = $.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    return self;
}]);

m.config(["$provide", function($provide) {
    var configService;
    $provide.decorator("$exceptionHandler", ["serverLogger", "$injector", "$delegate", function(serverLogger, $injector, $delegate) {
        return function(exception, cause) {
            configService = configService || $injector.get("configService");
            $delegate(exception, cause);
            if (configService.getConfig("proso_common", "logging.js_errors", false)) {
                serverLogger.error(exception.message);
            }
        };
    }]);
}]);

m.config(['$httpProvider', function($httpProvider) {
    var loggingService;
    $httpProvider.interceptors.push(function($injector) {
        return {
            response: function(response) {
                loggingService = loggingService || $injector.get("loggingService");
                if (response.data instanceof Object && 'debug_log' in response.data) {
                    loggingService.extendDebugLog(response.config.url, response.data.debug_log);
                }
                return response;
            }
        };
    });
}]);
