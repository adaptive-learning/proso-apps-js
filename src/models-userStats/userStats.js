var m = angular.module('proso.apps.models-userStats', ['ngCookies']);
m.service("userStatsService", ["$http", "$cookies", function($http, $cookies){
    var self = this;

    var filters = {
      filters: {},
    };

    self.addGroup = function (id, data) {
        if (!data.language){
            delete data.language;
        }
        filters.filters[id] = data;
    };

    self.addGroupParams = function (id, filter, language) {
        filters.filters[id] = filter;
        if (typeof language !== "undefined"){
            filters.language = language;
        }
    };

    self.getToPracticeCounts = function(){
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        return $http.post("/models/to_practice_counts/", filters, {cache: true});
    };

    self.getStats = function(mastered, username){
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        var params = {filters: JSON.stringify(filters.filters)};
        if (mastered){
            params.mastered = true;
        }
        if (username){
            params.username = username;
        }
        return $http.get("/models/user_stats/", {params: params});
    };

    self.getStatsPost = function(mastered, username){
        $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
        var params = "?";
        params += mastered ? "&mastered=true" : "";
        params += username ? "&username="+username : "";
        return $http.post("/models/user_stats/" + params, filters);
    };

    self.clean = function(){
        filters = {};
    };

    self.getGroups = function (){
        return angular.copy(filters);
    };

}]);
