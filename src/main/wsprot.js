/**
 * Protocol between client and server wss
 * Client                            Server
 * get-available-engines ----------->
 *        <-------------------------- list of engines
 * choose-engine -------------------> 
 *                                    stop engine if different
 *                                    start engine
 *        <-------------------------- engine data
 * 
 */

const schemaClient2Server = {
    type: 'object',
    properties: {
        msgtype: {
            type: 'string',
            enum: ['setup', 'config', 'uci']
        },
        engine: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                path: { type: 'string' },
                file: { type: 'string' },
                options: {
                    elements: {
                        type: 'object',
                        properties:{
                            name: { type: 'string'},
                            value:  { type: 'string'},
                        }
                    }
                },
            }
            
        },
        cmd: {
            type: 'string',
            enum: [ 'discover-engine', 'start-engine', 'restart-engine',
                    'get-available-engines', 'choose-engine', , 'get-current-engine',
                    'update-config', // broacast ai client 
            ]
        },
        ucicmd: {
            type: 'string'
        },
        args:[]
    },
    required: ['msgtype'],
    if: { properties: { msgtype: { const: 'setup' } }}, 
    then: { required: ['cmd']},
    if: { properties: { msgtype: { const: 'uci' } }},
    then: { required: ['ucicmd']}
};

const schemaServer2Client = {
    type: 'object',
    properties: {
        msgtype: {
            type: 'string',
            enum: ['setup', 'uci']
        },
        engine: {
            type: 'object',
            properties: {
                id: 'number',
                name: 'string'
            }
        },
        data: {
            type: 'object'
        },
        ucidata: {
            type: 'string'
        }
    },
    required: ['msgtype'],
    if: { properties: { msgtype: { const: 'uci' } }},
    then: { required: ['ucidata']}
};