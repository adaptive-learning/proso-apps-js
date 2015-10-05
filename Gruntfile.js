var markdown = require('node-markdown').Markdown;
var fs = require('fs');

module.exports = function(grunt) {
    'use strict';
    var version = '1.3.0';
    var master = true;
    var version_parts = version.split(".");
    version_parts = {
        major: parseInt(version_parts[0]),
        minor: parseInt(version_parts[1]),
        patch: parseInt(version_parts[2])
    };

    grunt.initConfig({
        ngversion: '1.3.13',
        bsversion: '3.1.1',
        uibsversion: '0.13.0',
        angticsversion: '0.17.2',
        modules: [],
        pkg: grunt.file.readJSON('package.json'),
        dist: 'dist',
        version: {major: version_parts.major, minor: version_parts.minor, patch: version_parts.patch},
        bowerBranch: master ? "master" : "version-" + version_parts.major + "." + version_parts.minor + ".X",
        branch: master ? "master" : "master-" + version_parts.major + "." + version_parts.minor + ".X",
        filename: 'proso-apps',
        meta: {
            servicemodules: 'angular.module("proso.apps", ["proso.apps.tpls", <%= srcServiceModules %>, "proso.apps.common-toolbar"])',
            modules: 'angular.module("proso.apps", [<%= srcModules %>]);',
            tplmodules: 'angular.module("proso.apps.tpls", [<%= tplModules %>]);',
            toolbartplmodules: 'angular.module("proso.apps.tpls", ["templates/common-toolbar/toolbar.html"]);',
            all: 'angular.module("proso.apps", ["proso.apps.tpls", <%= srcModules %>]);',
            gettext: [
                'angular.module("proso.apps.gettext", [])',
                '.value("gettext", window.gettext || function(x){return x;})',
                '.filter("trans", ["gettext", function(gettext) {',
                '    return function(msgid) {',
                '        return gettext(msgid);',
                '    };',
                '}]);'
            ].join('\n'),
            cssInclude: '',
            cssFileBanner: '/* Include this file in your html if you are using the CSP mode. */\n\n',
            cssFileDest: '<%= dist %>/<%= filename %>-csp.css',
            banner: ['/*',
                ' * <%= pkg.name %>',
                ' * Version: <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
                ' * License: <%= pkg.license %>',
                ' */\n'].join('\n')
        },
        shell: {
            bower: {
                command: [
                    'cd <%= dist %>',
                    'if [ -d proso-apps-js-bower ]; then rm -rf proso-apps-js-bower; fi',
                    'git clone git@github.com:adaptive-learning/proso-apps-js-bower.git',
                    'cd proso-apps-js-bower',
                    '(git checkout <%= bowerBranch %> || git checkout -b <%= bowerBranch %> )',
                    'cp ../*.js .',
                    'cp ../*.css .',
                    'cp ../*.map .',
                    'git add .',
                    'git commit -m "automatic update"',
                    'git push origin <%= bowerBranch %>'
                ].join(' && ')
            },
            bower_release: {
                command: [
                    'cd <%= dist %>/proso-apps-js-bower',
                    'git tag <%= version.major %>.<%= version.minor %>.<%= version.patch %>',
                    'git push origin <%= version.major %>.<%= version.minor %>.<%= version.patch %>'
                ].join(' && ')
            },
            increase_patch: {
                command: [
                    'git checkout <%= branch %>',
                    'git tag <%= version.major %>.<%= version.minor %>.<%= version.patch %>',
                    'git push origin <%= version.major %>.<%= version.minor %>.<%= version.patch %>',
                    'sed -i "s/var version = \'.*\';/var version = \'<%= version.major %>.<%= version.minor %>.<%= version.patch + 1 %>\';/g" Gruntfile.js',
                    'git add Gruntfile.js',
                    'git commit -m "start working on version <%= version.major %>.<%= version.minor %>.<%= version.patch + 1 %>"',
                    'git push origin'
                ].join(' && ')
            },
            start_new_version: {
                command: [
                    'git checkout master',
                    'git branch master-<%= version.major %>.<%= version.minor %>.X',

                    'sed -i "s/var version = \'.*\';/var version = \'<%= version.major %>.<%= version.minor + 1 %>.0\';/g" Gruntfile.js',
                    'git add Gruntfile.js',
                    'git commit -m "start working on version <%= version.major %>.<%= version.minor + 1%>.0"',
                    'git push origin',

                    'git checkout master-<%= version.major %>.<%= version.minor %>.X',
                    'sed -i "s/var master = t..e;/var master = false;/g" Gruntfile.js',
                    'git add Gruntfile.js',
                    'git commit -m "new branch for version <%= version.major %>.<%= version.minor %>.X"',
                    'git push origin master-<%= version.major %>.<%= version.minor %>.X'
                ].join(' && ')
            }
        },
        watch: {
            docs: {
                files: ['misc/demo/index.html', 'src/**/*.md', 'src/**/*.html'],
                tasks: ['after-test']
            },
            html: {
                files: ['templates/**/*.html'],
                tasks: ['default']
            },
            css: {
                files: ['src/**/*.css'],
                tasks: ['default']
            },
            js: {
                files: ['src/**/*.js'],
                tasks: ['default']
            }
        },
        concat: {
            services: {
                options: {
                    banner: '<%= meta.banner %><%= meta.servicemodules %>\n<%= meta.toolbartplmodules %>\n<%= meta.gettext %>\n',
                    footer: '<%= meta.cssInclude %>'
                },
                src: [], //src filled in by build task
                dest: '<%= dist %>/<%= filename %>-services.js'
            },
            all: {
                options: {
                    banner: '<%= meta.banner %><%= meta.all %>\n<%= meta.tplmodules %>\n<%= meta.gettext %>\n',
                    footer: '<%= meta.cssInclude %>'
                },
                src: ['<%= dist %>/<%= filename %>-translations.js'], //src filled in by build task
                dest: '<%= dist %>/<%= filename %>-all.js'
            }
        },
        jasmine : {
            src : 'src/*/*.js',
            options : {
                specs : 'src/*/specs/**/*.js',
                vendor : [
                    'node_modules/angular/angular.js',
                    'node_modules/angular-cookies/angular-cookies.js',
                    'node_modules/angular-mocks/angular-mocks.js',
                    'node_modules/jsTimezoneDetect/jstz.main.js',
                ],
                helpers : 'helpers/**/*.js',
            }
        },
        html2js: {
            dist: {
                options: {
                    module: null,
                    base: '.',
                },
                files: [{
                    expand: true,
                    src: ['templates/**/*.html'],
                    ext: '.html.js'
                }]
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'src/**/*.js',
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                sourceMapIncludeSources: true,
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n',
            },
            all: {
                options: {
                    sourceMapName: '<%= dist %>/<%= filename %>-all.min.js.map',
                },
                src: '<%= dist %>/<%= filename %>-all.js',
                dest: '<%= dist %>/<%= filename %>-all.min.js',
            },
            services: {
                options: {
                    sourceMapName: '<%= dist %>/<%= filename %>-services.min.js.map',
                },
                src: '<%= dist %>/<%= filename %>-services.js',
                dest: '<%= dist %>/<%= filename %>-services.min.js',
            }
        },
        copy: {
            demohtml: {
                options: {
                    //process html files with gruntfile config
                    processContent: grunt.template.process
                },
                files: [{
                    expand: true,
                    src: ['**/*.html'],
                    cwd: 'misc/demo/',
                    dest: 'dist/'
                }]
            },
            demoassets: {
                files: [{
                    expand: true,
                    //Don't re-copy html files, we process those
                    src: ['**/**/*', '!**/*.html'],
                    cwd: 'misc/demo',
                    dest: 'dist/'
                }]
            }
        },
        nggettext_extract: {
            pot: {
                files: {
                    '<%= dist %>/<%= filename %>.pot': ['templates/**/*.html', 'src/**/*.js']
                }
            },
        },
        nggettext_compile: {
            all: {
                files: {
                    '<%= dist %>/<%= filename %>-translations.js': ['po/*.po']
                }
            },
        },
    });

    var foundModules = {};
    function findModule(name) {
        if (foundModules[name]) {
            return;
        }
        foundModules[name] = true;

        function breakup(text, separator) {
            return text.replace(/[A-Z]/g, function (match) {
                return separator + match;
            });
        }
        function ucwords(text) {
            return text.replace(/^([a-z])|\s+([a-z])/g, function ($1) {
                return $1.toUpperCase();
            });
        }
        function enquote(str) {
            return '"' + str + '"';
        }

        var module = {
            name: name,
            moduleName: enquote('proso.apps.' + name),
            displayName: ucwords(breakup(name, ' ')),
            srcFiles: grunt.file.expand('src/'+name+'/*.js'),
            cssFiles: grunt.file.expand('src/'+name+'/*.css'),
            tplFiles: grunt.file.expand('templates/'+name+'/*.html'),
            tpljsFiles: grunt.file.expand('templates/'+name+'/*.html.js'),
            tplModules: grunt.file.expand('templates/'+name+'/*.html').map(enquote),
            dependencies: dependenciesForModule(name),
            docs: {
                md: grunt.file.expand('src/'+name+'/docs/*.md')
                    .map(grunt.file.read).map(markdown).join('\n'),
                js: grunt.file.expand('src/'+name+'/docs/*.js')
                    .map(grunt.file.read).join('\n'),
                html: grunt.file.expand('src/'+name+'/docs/*.html')
                    .map(grunt.file.read).join('\n')
            }
        };
        var styles = {
            css: [],
            js: []
        };
        module.cssFiles.forEach(processCSS.bind(null, styles, true));
        if (styles.css.length) {
            module.css = styles.css.join('\n');
            module.cssJs = styles.js.join('\n');
        }

        module.dependencies.forEach(findModule);
        grunt.config('modules', grunt.config('modules').concat(module));
    }

    /**
     * Logic from AngularJS
     * https://github.com/angular/angular.js/blob/36831eccd1da37c089f2141a2c073a6db69f3e1d/lib/grunt/utils.js#L121-L145
     */
    function processCSS(state, minify, file) {
        /* jshint quotmark: false */
        var css = fs.readFileSync(file).toString(), js;
        state.css.push(css);

        if(minify){
            css = css
                .replace(/\r?\n/g, '')
                .replace(/\/\*.*?\*\//g, '')
                .replace(/:\s+/g, ':')
                .replace(/\s*\{\s*/g, '{')
                .replace(/\s*\}\s*/g, '}')
                .replace(/\s*\,\s*/g, ',')
                .replace(/\s*\;\s*/g, ';');
        }
        //escape for js
        css = css
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r?\n/g, '\\n');
        js = "!angular.$$csp() && angular.element(document).find('head').prepend('<style type=\"text/css\">" + css + "</style>');";
        state.js.push(js);

        return state;
    }

    function dependenciesForModule(name) {
        var deps = [];
        grunt.file.expand('src/' + name + '/*.js').map(grunt.file.read).forEach(function(contents) {
            //Strategy: find where module is declared,
            //and from there get everything inside the [] and split them by comma
            var moduleDeclIndex = contents.indexOf('angular.module(');
            var depArrayStart = contents.indexOf('[', moduleDeclIndex);
            var depArrayEnd = contents.indexOf(']', depArrayStart);
            var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
            dependencies.split(',').forEach(function(dep) {
                if (dep.indexOf('proso.apps.') > -1) {
                    var depName = dep.trim().replace('proso.apps.','').replace(/['"]/g,'');
                    if (deps.indexOf(depName) < 0) {
                        deps.push(depName);
                        //Get dependencies for this new dependency
                        deps = deps.concat(dependenciesForModule(depName));
                    }
                }
            });
        });
        return deps;
    }

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-angular-gettext');

    grunt.registerTask('before-test', ['jshint', 'html2js']);
    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('after-test', ['build', 'copy']);
    grunt.registerTask('default', ['before-test', 'test', 'after-test']);
    grunt.registerTask('release_patch', ['shell:increase_patch', 'shell:bower', 'shell:bower_release']);
    grunt.registerTask('start_new_version', ['shell:start_new_version']);
    grunt.registerTask('build', 'Build PROSO Apps -- javascript', function() {
        var _ = grunt.util._;

        grunt.file.expand({
            filter: 'isDirectory', cwd: '.'
        }, 'src/*').forEach(function(dir) {
            findModule(dir.split('/')[1]);
        });

        var modules = grunt.config('modules');
        var serviceModules = modules.filter(function(m) { return m.tplModules.length === 0;});
        grunt.config('srcModules', _.pluck(modules, 'moduleName'));
        grunt.config('srcServiceModules', _.pluck(serviceModules, 'moduleName'));
        grunt.config('tplModules', _.pluck(modules, 'tplModules').filter(function(tpls) { return tpls.length > 0;} ));
        grunt.config('demoModules', modules
                .filter(function(module) {
                    return module.docs.md && module.docs.js && module.docs.html;
                })
                .sort(function(a, b) {
                    if (a.name < b.name) { return -1; }
                    if (a.name > b.name) { return 1; }
                    return 0;
                })
        );

        var cssStrings = _.flatten(_.compact(_.pluck(modules, 'css')));
        var cssJsStrings = _.flatten(_.compact(_.pluck(modules, 'cssJs')));
        if (cssStrings.length) {
            grunt.config('meta.cssInclude', cssJsStrings.join('\n'));

            grunt.file.write(grunt.config('meta.cssFileDest'), grunt.config('meta.cssFileBanner') +
                cssStrings.join('\n'));

            grunt.log.writeln('File ' + grunt.config('meta.cssFileDest') + ' created');
        }

        var moduleFileMapping = _.clone(modules, true);
        moduleFileMapping.forEach(function (module) {
            delete module.docs;
        });

        grunt.config('moduleFileMapping', moduleFileMapping);

        var srcFiles = _.pluck(modules, 'srcFiles');
        var tpljsFiles = _.pluck(modules, 'tpljsFiles');
        var srcServiceFiles = _.pluck(serviceModules, 'srcFiles');
        //Set the concat task to concatenate the given src modules
        grunt.config('concat.services.src',
            grunt.config('concat.services.src')
                .concat(srcServiceFiles)
                .concat([grunt.file.expand('src/common-toolbar/*.js')])
                .concat(['templates/common-toolbar/toolbar.html.js'])
        );
        //Set the concat-with-templates task to concat the given src & tpl modules
        grunt.config('concat.all.src', grunt.config('concat.all.src')
            .concat(srcFiles).concat(srcFiles).concat(tpljsFiles));

        grunt.task.run(['html2js', 'nggettext_compile', 'concat', 'copy', 'uglify']);
    });
};
