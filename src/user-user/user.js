var m = angular.module('proso.apps.user-user', ['ngCookies']);
m.service("userService", ["$http", function($http){
    var self = this;
    self.status = {
        "logged": false,
        "loading": false
    };
    self.user = {};
    var update = this.update = {};
    var sessionUpdated = false;
    self.error = {};

    // called on create
    self.init = function (){
    };

    self.signup = function(data){
        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/signup/", data);
        promise.success(function(response){
                _processUser(response.data);
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.signupParams = function(name, email, pass, pass2, firstName, lastName){
        return self.signup({
            "username": name,
            "email": email,
            "password": pass,
            "password_check": pass2,
            "first_name": firstName,
            "last_name": lastName
        });
    };

    // get public user profile from backend
    self.getUserProfile = function(username, stats){
        var params = {username: username};
        if (stats){
            params.stats = true;
        }
        return $http.get("/user/profile/", {params: params});
    };

    // get user profile from backend
    self.loadUser = function(stats){
        self.status.loading = true;
        var params = {};
        if (stats){
            params.stats = true;
        }
        return $http.get("/user/profile/", {params: params})
            .success(function(response){
                _processUser(response.data);
            })
            .finally(function(response){
                self.status.loading = false;
            });
    };

    self.processUser = function(data){
        _processUser(angular.copy(data));
    };

    // process user data
    var _processUser = function(data){
        if (!data) {
            self.status.logged = false;
            return;
        }
        self.status.logged = data.user && data.user.email !== undefined;
        self.user.profile = data;
        angular.extend(self.user, data.user);
        angular.extend(update, {
            user: {
                first_name: self.user.first_name,
                last_name: self.user.last_name
            },
            send_emails: self.user.profile.send_emails,
            public: self.user.profile.public
        });
        delete self.user.profile.user;
        if (!sessionUpdated){
            self.updateSession();
            sessionUpdated = true;
        }
    };

    self.login = function(username, pass){
        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/login/", {
            username: username,
            password: pass
        });
        promise.success(function(response){
                _processUser(response.data);
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.logout = function(){
        self.status.loading = true;
        $http.get("/user/logout/")
            .success(function(response){
                clearObj(self.user);
                self.status.logged = false;
            })
            .finally(function(response){
                self.status.loading = false;
            });
    };


    var _resetError = function(){
        clearObj(self.error);
    };

    var clearObj = function(obj){
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)){ delete obj[prop]; }
        }
    };


    self.loadUserFromJS = function (scope, stats) {
        scope.$apply(self.loadUser(stats));
    };

    self.loadSession = function(){
        self.status.loading = true;
        $http.get("/user/session/")
            .success(function(response){
                self.user.session = response.data;
            })
            .finally(function(response){
                self.status.loading = false;
            });
    };

    self.updateSession = function(){
        var data = {
            locale: window.navigator.language || window.navigator.userLanguage || window.navigator.browserLanguage,
            display_height: window.innerHeight,
            display_width: window.innerWidth
        };
        try{
            data.time_zone = jstz.determine().name();
        }catch (err){ console.log("JSTimeZone lib not loaded");}
        $http.post("/user/session/", data).error(function(){
            console.error("Error while updating session");
        });
    };

    self.updateProfile = function(user){
        var data = {
          user: {},
        };
        if (user.profile) {
          angular.extend(data, user.profile);
        }
        angular.extend(data.user, user);
        delete data.user.profile;
        delete data.user.username;

        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/profile/", data);
        promise.success(function(response){
                _processUser(response.data);
            })
            .error(function(response){
                self.error = response;
            }).finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.loginGoogle = function() {
        _openPopup('/login/google-oauth2/', '/user/close_popup/');
    };

    self.loginFacebook = function() {
        _openPopup('/login/facebook/', '/user/close_popup/');
    };

    self.loginEdookit = function() {
        _openPopup('/login/edookit/', '/user/close_popup/');
    };

    var _openPopup = function(url, next){
        var settings = 'height=700,width=700,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=yes,directories=no,status=yes';
        url += "?next=" + next;
        window.open(url, "popup", settings);
    };

    self.init();

    self.updateClasses = function(){
        self.status.loading = true;
        _resetError();
        var promise = $http.get("/user/classes/");
        promise.success(function(response){
                var classes = response.data;
                angular.forEach(classes, function (cls) {
                    delete cls.owner;
                });
                self.user.profile.owner_of = classes;
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.createClass = function(name, code){
        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/create_class/", {
            name: name,
            code: code
        });
        promise.success(function(response){
                var cls = response.data;
                delete cls.owner;
                self.user.profile.owner_of.push(cls);
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.joinClass = function (code) {
        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/join_class/", {
            code: code
        });
        promise.success(function(response){
                self.user.profile.member_of.push(response.data);
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.createStudent = function(data){
        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/create_student/", data);
        promise.success(function(response){
                angular.forEach(self.user.profile.owner_of, function (cls) {
                    if (cls.id === data.class){
                        cls.members.push(response.data);
                    }
                });
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

    self.loginStudent = function (id) {
        self.status.loading = true;
        _resetError();
        var promise = $http.post("/user/login_student/", {
            student: id
        });
        promise.success(function(response){
                _processUser(response.data);
            })
            .error(function(response){
                self.error = response;
            })
            .finally(function(response){
                self.status.loading = false;
            });
        return promise;
    };

}]);
