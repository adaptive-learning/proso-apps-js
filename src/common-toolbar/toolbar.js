var m = angular.module('proso.apps.common-toolbar', ['ngCookies', 'proso.apps.common-config']);

m.controller("ToolbarController", ['$scope', '$cookies', 'configService', 'loggingService', '$timeout', '$http', function($scope, $cookies, configService, loggingService, $timeout, $http) {
    $scope.override = configService.override;
    $scope.removeOverridden = configService.removeOverridden;
    $scope.date = new Date();
    $scope.debugLog = [];
    $scope.opened = $cookies["toolbar:opened"] === "true";
    $scope.maximized = $cookies["toolbar:maximized"] === "true";
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

    $scope.$watch("maximized", function(n, o){
        $cookies["toolbar:maximized"] = n;
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
            $http.get('/configab/experiments', {params: {filter_column: 'is_enabled', filter_value: true, stats: true, learning_curve_length: 5}})
                .success(function(response) {
                    var data = response.data;
                    if (data.length === 0) {
                        return;
                    }
                    $scope.abExperiment = data[0];
                    $scope.drawABTestingBar('number_of_users');
                });
        }
        $scope.drawABTestingBar('number_of_users');
    };

    var getFlashcardFilterParams = function(){
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
        return params;
    };

    $scope.showFlashcardsPractice = function() {
        $scope.flashcardsAnswers = [];
        var params = getFlashcardFilterParams();

        $http.get('/flashcards/practice_image', {params: params}).success(function(response) {
            document.getElementById("flashcardsChart").innerHTML = response;
        });
    };

    $scope.showFlashcardsAnswers = function() {
        var params = getFlashcardFilterParams();

        document.getElementById("flashcardsChart").innerHTML = '';
        $http.get('/flashcards/answers', {params: params}).success(function(response) {
            $scope.flashcardsAnswers = response.data;
        });
    };

    $scope.drawABTestingBar = function(column) {
        if (!$scope.abExperiment) {
            return;
        }
        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Experiment Setup');
        data.addColumn('number', 'Number of Users');
        data.addRows($scope.abExperiment.setups.map(function(setup) {
            return [
                'Setup #' + setup.id,
                setup.stats.number_of_users,
            ];
        }));
        var view = data;
        var title = 'All';
        if (column) {
            var columns = {
                number_of_users: [0, 1],
            };
            title = column;
            view = new google.visualization.DataView(data);
            view.setColumns(columns[column]);
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
            intervals: {
                styel: 'bars',
                pointSize: 2,
                barWidth: 0,
                lineWidth: 2,
            },
            chartArea: {'width': '80%', 'height': '80%'}
        };
        chart.draw(view, options);
    };

    $scope.drawABCurve = function(curve_accessor) {
        if (!$scope.abExperiment) {
            return;
        }
        var data = new google.visualization.DataTable();
        data.addColumn({type: 'number', role: 'domain'});
        var length = 9999999;
        console.log(curve_accessor);
        $scope.abExperiment.setups.forEach(function(setup) {
            data.addColumn('number', 'Setup #' + setup.id);
            console.log(setup.stats);
            length = Math.min(length, setup.stats[curve_accessor].values.length);
        });
        var rows = [];
        for (var i = 0; i < length; i++) {
            var row = [i];
            /*jshint -W083 */
            $scope.abExperiment.setups.forEach(function(setup) {
                row.push(setup.stats[curve_accessor].values[i].value);
            });
            rows.push(row);
        }
        data.addRows(rows);
        var chart = new google.visualization.LineChart(document.getElementById("abChart"));
        var options = {
            title: curve_accessor,
            legend: {
                position: 'none'
            },
            vAxis: {
                format: '#.###'
            },
            hAxis: {
                title: 'Progress',
                position: 'center'
            },
            lineWidth: 2,
            pointSize: 2,
            curveType: 'function',
            width: 480,
            height: 300,
            'chartArea': {'width': '80%', 'height': '80%'}
        };
        chart.draw(data, options);
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
                    'chartArea': {'width': '80%', 'height': '80%'}
                };
                var formatter = new google.visualization.NumberFormat({
                    fractionDigits: 3, pattern: '#.###'
                });
                formatter.format(data, 1);
                var chart = new google.visualization.LineChart(document.getElementById('auditChart'));
                chart.draw(data, options);
            });
    };

    $scope.recommendUser = function() {
        var filter = {};
        if ($scope.recommendationRegisterMin) {
            filter.register_min = $scope.recommendationRegisterMin;
        }
        if ($scope.recommendationRegisterMax) {
            filter.register_max = $scope.recommendationRegisterMax;
        }
        if ($scope.recommendationAnswersMin) {
            filter.number_of_answers_min = $scope.recommendationAnswersMin;
        }
        if ($scope.recommendationAnswersMax) {
            filter.number_of_answers_max = $scope.recommendationAnswersMax;
        }
        if ($scope.recommendationSuccessMin) {
            filter.success_min = $scope.recommendationSuccessMin;
        }
        if ($scope.recommendationSuccessMax) {
            filter.success_max = $scope.recommendationSuccessMax;
        }
        if ($scope.recommendationVariableName) {
            filter.variable_name = $scope.recommendationVariableName;
        }
        if ($scope.recommendationVariableMin) {
            filter.variable_min = $scope.recommendationVariableMin;
        }
        if ($scope.recommendationVariableMax) {
            filter.variable_max = $scope.recommendationVariableMax;
        }
        $scope.recommendationOutput = 'Loading...';
        $http.get('/models/recommend_users', {params: filter})
            .success(function (response) {
                if (response.data.length > 0) {
                    $scope.recommendationOutput = response.data[0];
                } else {
                    $scope.recommendationOutput = 'Not Found';
                }
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
