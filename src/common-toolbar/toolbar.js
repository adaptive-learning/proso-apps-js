var m = angular.module('proso.apps.common-toolbar', ['ngCookies', 'proso.apps.common-config']);

m.controller("ToolbarController", ['$scope', '$cookies', 'configService', 'loggingService', '$timeout', '$http', function($scope, $cookies, configService, loggingService, $timeout, $http) {
    $scope.override = configService.override;
    $scope.removeOverridden = configService.removeOverridden;
    $scope.date = new Date();
    $scope.debugLog = [];
    $scope.opened = $cookies["toolbar:opened"] === "true";
    $scope.loggingOpened = true;
    $scope.abTestingOpened = false;
    $scope.flashcardsLimit = 10;
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

    $scope.openABTesting = function() {
        $scope.abTestingOpened = ! $scope.abTestingOpened;
        if ($scope.abTestingOpened && !$scope.abExperiment) {
            $http.get('/configab/experiments', {params: {filter_column: 'is_enabled', filter_value: true, stats: true}})
                .success(function(response) {
                    var data = response.data;
                    if (data.length === 0) {
                        return;
                    }
                    $scope.abExperiment = data[0];
                    $scope.abExperiment.setups.forEach(function(setup) {
                        setup.values.forEach(function(value) {
                            $scope.abExperiment.variables.forEach(function(variable) {
                                if (variable.id = value.variable_id) {
                                    value.variable = variable;
                                }
                            });
                        });
                    });
                    $scope.drawABTesting();
                });
        }
        $scope.drawABTesting();
    };

    $scope.showFlashcardsPractice = function() {
        var params = {
            limit: $scope.flashcardsLimit
        };
        if ($scope.flashcardsCategories) {
            params.categories = JSON.stringify(
                $scope.flashcardsCategories.split(',').map(function(x) { return x.trim(); })
            );
        }
        if ($scope.flashcardsContexts) {
            params.contexts = JSON.stringify(
                $scope.flashcardsContexts.split(',').map(function(x) { return x.trim(); })
            );
        }
        if ($scope.flashcardsTypes) {
            params.types = JSON.stringify(
                $scope.flashcardsTypes.split(',').map(function(x) { return x.trim(); })
            );
        }
        $http.get('/flashcards/practice_image', {params: params}).success(function(response) {
            document.getElementById("flashcardsChart").innerHTML = response;
        });
    };

    $scope.drawABTesting = function(column) {
        if (!$scope.abExperiment) {
            return;
        }
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Experiment Setup');
        data.addColumn('number', 'Number of Answers');
        data.addColumn('number', 'Number of Users');
        data.addColumn('number', 'Returning Chance');
        data.addRows($scope.abExperiment.setups.map(function(setup) {
            return [
                'Setup #' + setup.id,
                setup.stats.number_of_answers_median,
                setup.stats.number_of_users,
                setup.stats.returning_chance,
            ];
        }));
        var view = data;
        var title = 'All';
        if (column) {
            var columns = {
                number_of_answers_median: 1,
                number_of_users: 2,
                returning_chance: 3,
            };
            title = column;
            view = new google.visualization.DataView(data);
            view.setColumns([0, columns[column]]);
        }
        var chart = new google.visualization.ColumnChart(document.getElementById("abChart"));
        var options = {
            title: title,
            legend: {
                position: 'none'
            },
            vAxis: {
                format: '#.###'
            },
            width: 480,
            height: 300,
            'chartArea': {'width': '80%', 'height': '80%'}
        };
        chart.draw(view, options);
    };

    $scope.showAuditChart = function() {
        var params = {};
        if ($scope.auditLimit) {
            params['limit'] = $scope.auditLimit;
        }
        if ($scope.auditUser) {
            params['user'] = $scope.auditUser;
        }
        if ($scope.auditPrimary) {
            params['item'] = $scope.auditPrimary;
        }
        if ($scope.auditSecondary) {
            params['item_secondary'] = $scope.auditSecondary;
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
                        title: 'Update',
                        position: 'center'
                    },
                    width: 480,
                    height: 300,
                    'chartArea': {'width': '80%', 'height': '90%'}
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
