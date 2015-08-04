var m = angular.module('proso.apps.common-toolbar', ['ngCookies', 'proso.apps.common-config']);

m.controller("ToolbarController", ['$scope', '$cookies', 'configService', 'loggingService', '$timeout', '$http', function($scope, $cookies, configService, loggingService, $timeout, $http) {
    $scope.override = configService.override;
    $scope.removeOverridden = configService.removeOverridden;
    $scope.date = new Date();
    $scope.debugLog = [];
    $scope.opened = $cookies["toolbar:opened"] === "true";
    $scope.loggingOpened = true;
    $scope.override('debug', true);
    $scope.overridden = configService.getOverridden();
    loggingService.addDebugLogListener(function(events) {
        $timeout(function(){
            events.forEach(function (e) {
                $scope.debugLog.unshift(e);
            });
        });
    });

    $scope.$watch("opened", function(n, o){
        $cookies["toolbar:opened"] = n;
    });

    $scope.addToOverride = function(name) {
        if (!name) {
            return;
        }
        configService.override(name, '');
    };

    $scope.getOverridden = function() {
        var overridden = configService.getOverridden();
        Object.keys(overridden).filter(function(k) {
            return (k === 'user' || k === 'debug' || k === 'time');
        }).forEach(function (k) {
            delete overridden[k];
        });
        return overridden;
    };

    $scope.showAuditChart = function() {
        var params = {};
        if ($scope.auditLimit) {
            params['limit'] = $scope.auditLimit;
        }
        if ($scope.auditUser) {
            params['user'] = $scope.auditUser;
        }
        $http.get("/models/audit/" + $scope.auditKey, {params: params})
            .success(function(response) {
                var data = new google.visualization.DataTable();
                data.addColumn('number', 'Update');
                data.addColumn('number', 'Value');
                data.addColumn({type: 'datetime', role: 'tooltip'});
                response.data.reverse();
                var rows = [];
                for (var i = 0; i < response.data.length; i++) {
                    var record = response.data[i];
                    rows.push([i, record.value, new Date(record.time)]);
                }
                data.addRows(rows);
                var options = {
                    title: $scope.auditKey,
                    legend: {
                        position: 'none'
                    },
                    vAxis: {
                        format: '#.###'
                    },
                    hAxis: {
                        title: 'Time',
                        position: 'center'
                    },
                    pointSize: 10,
                    series: {
                        0: {
                            pointShape: 'diamond'
                        }
                    },
                    width: 450,
                    height: 300,
                    'chartArea': {'width': '90%', 'height': '90%'}
                };
                var formatter = new google.visualization.NumberFormat({
                    fractionDigits: 3, pattern: '#.###'
                });
                formatter.format(data, 1);
                var chart = new google.visualization.LineChart(document.getElementById('auditChart'));
                chart.draw(data, options);
            });
    };

}]);

m.directive('toolbar', [function () {
    return {
        restrict: 'E',
        controller: 'ToolbarController',
        templateUrl: 'templates/common-toolbar/toolbar.html'
    };
}]);
