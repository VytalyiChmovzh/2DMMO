var request = require('request'),
    io = require('socket.io').listen(1112),

    /* Models */
    Workspace = function(id, name) {
        return {
            id: id,
            name: name
        }
    },

    /* Api */
    api = {
        baseUrl: 'api_ci.ger911.com/api/',
        token: null,
        requestHeaders: {
            'Cache-Control': 'no-cache=true; no-store=true',
            'ClientType': 'API',
            'ClientVersion': '1',
            'TimeZoneStandard': 'Pacific Time'
        },
        /* Login part */
        authorize: function(username, password, success) {
            var headers = this.requestHeaders,
                requestOptions,
                self = this;

            headers['Authorization'] = 'Basic '+ new Buffer(username + ':' + password).toString("base64");

            requestOptions = {
                uri: 'http://'+ this.baseUrl + '1.0/token',
                method: 'GET',
                headers: headers
            };

            request.get(requestOptions, function(error, response, body) {
                body = JSON.parse(body);
                self.token = body['access_token'];

                success();
            });
        },
        refreshToken: function() {
            var headers = this.requestHeaders,
                requestOptions,
                self = this;

            headers['Authorization'] = 'Session '+ this.token;

            requestOptions = {
                uri: 'http://'+ this.baseUrl + '1.0/token',
                method: 'GET',
                headers: headers
            };

            request.get(requestOptions, function(error, response, body) {
                self.token = body['access_token'];
            });
        },
        /* Workspaces part */
        workspaces: {
            lastWorkspacesData: null,
            checkWorkspacesData: function(workspaces) {
                console.log('Check workspaces');
                var workspace;

                if (!this.lastWorkspacesData) {
                    this.lastWorkspacesData = workspaces;
                    return;
                }

                for(workspace in this.lastWorkspacesData) {
                    if (workspaces[workspace] === undefined) {
                        console.log('Workspace removed');
                        console.log(this.lastWorkspacesData[workspace]);

                        io.sockets.emit('workspace:removed', this.lastWorkspacesData[workspace]);
                    }
                }

                for(workspace in workspaces) {
                    if (this.lastWorkspacesData[workspace] === undefined) {
                        console.log('Workspace added');
                        console.log(workspaces[workspace]);

                        io.sockets.emit('workspace:new', workspaces[workspace]);
                    }

                    if (this.lastWorkspacesData[workspace] !== undefined && this.lastWorkspacesData[workspace].name !== workspaces[workspace].name) {
                        console.log('Workspace name changed');
                        console.log(workspaces[workspace]);

                        io.sockets.emit('workspace:nameChanged', workspaces[workspace]);
                    }
                }

                this.lastWorkspacesData = workspaces;
            },
            getWorkspaces: function() {
                var headers = api.requestHeaders,
                    requestOptions,
                    self = this;

                headers['Authorization'] = 'Session ' + api.token;

                requestOptions = {
                    uri: 'http://'+ api.baseUrl + '/lookups/1.0/workspaces/infos',
                    method: 'GET',
                    headers: headers
                };

                request.get(requestOptions, function(error, response, workspaceInfos) {
                    var i,
                        j,
                        workspace,
                        workspaces = {};

                    workspaceInfos = JSON.parse(workspaceInfos);

                    for (i = 0, j = workspaceInfos.length; i < j; i++) {
                        workspace = workspaceInfos[i];
                        workspaces[workspace['ID']] = new Workspace(workspace['ID'], workspace['Name']);
                    }

                    self.checkWorkspacesData(workspaces);
                });
            }
        }
    };

/* Auth and set intervals on success */
api.authorize('farrow', 'password!', function() {
    setInterval(function() { api.refreshToken(); }, 60000); //Set token refresh every minute
    setInterval(function() { api.workspaces.getWorkspaces(); }, 3000);
});
