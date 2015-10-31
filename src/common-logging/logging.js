var loggingServiceLoaded;
if (loggingServiceLoaded){
    throw "LoggingService already loaded";
}
loggingServiceLoaded = true;

var m = angular.module('proso.apps.common-logging', []);

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

    self.debug = function(jsonEvent) {
        self.log(jsonEvent, "debug");
    };

    self.info = function(jsonEvent) {
        self.log(jsonEvent, "info");
    };

    self.warn = function(jsonEvent) {
        self.log(jsonEvent, "warn");
    };

    self.error = function(jsonEvent) {
        self.log(jsonEvent, "error");
    };

    self.log = function(jsonEvent, level) {
        jsonEvent['level'] = level;
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
    $provide.decorator("$exceptionHandler", ["serverLogger", "$delegate", function(serverLogger, $delegate) {
        return function(exception, cause) {
            $delegate(exception, cause);
            serverLogger.error({exception: exception.message});
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
