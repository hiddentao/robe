$(function() {
  buildApi();
  buildNav();
});



function buildNav() {
  var root = {
    children: []
  },
  parent = root;

  $('section').each(function() {
    var section = $(this);

    var heading = section.children('h2, h3');

    var navItem = {
      id: section.attr('id'),
      text: heading.text(),
      children: [],
    };

    if ('H3' === heading.prop('tagName')) {
      parent.children.push(navItem);
    } else {
      root.children.push(navItem);
      parent = navItem;
    }
  });

  __buildNav = function(nodeList) {
    if (!nodeList.length) {
      return '';
    }

    var html = '<ul>';

    nodeList.forEach(function(node) {
      html += '<li>';
      html += '<a href="#' + node.id + '">' + node.text + '</a>';

      html += __buildNav(node.children);

      html += '</li>';
    });

    return html + '</ul>';
  };

  $('nav').append(__buildNav(root.children));
};




function buildApi() {

  var __slugify = function(str) {
    return 'api_' + str.toLowerCase().replace('/[\s\.]+/igm', '_');
  };


  var __generateSig = function(params) {
    return '(' + (params ? Object.keys(params).join(', ') : '') + ')';
  };


  var __processTxt = function(str) {
    // turn links into real links
    return str
      .replace(/\[\[(.+?)\]\]/igm, function (match, capture) { 
        return '<a href="#' + __slugify(capture) + '">' + capture + '</a>';
      })
      .replace(/\[(.+?)\]\((.+?)\)/igm, '<a href="$2">$1</a>')
      .replace(/\`(.+?)\`/igm, '<code>$1</code>')
  };


  var __processTypes = function(types) {
    var str = types.map(function(t) {
      return '<code>' + __processTxt(t) + '</code>';
    }).join(' or ');

    return $('<span class="type">' + str + '</span>');
  };


  var __processParams = function(parentName, paramsObj) {
    if (1 === arguments.length) {
      paramsObj = parentName;
      parentName = null;
    }

    var $ul = $('<ul/>');

    for (var key in paramsObj) {
      var node = paramsObj[key],
        nodeName = (parentName ? parentName + '.' : '') + key;

      var $li = $('<li />');
      if (!node.defaultValue) {
        $li.addClass('required');
      }

      $li.append('<span class="name">' + nodeName + '</span>');
      $li.append(__processTypes(node.type));
      if (node.defaultValue) {
        $li.append('<code class="default">' + __processTxt(node.defaultValue) + '</code>');
      }
      $li.append('<span class="desc">' + __processTxt(node.desc) + '</span>');

      if (node.params) {
        $li.append(__processParams(nodeName, node.params));
      }

      $ul.append($li);
    }

    return $ul;
  };


  var __processFunction = function($dl, parentNodeName, key, node) {
    var $dt = $('<dt>.' 
      + key 
      + ' ' 
      + (node.gen ? '* ' : '')
      + __generateSig(node.params) 
      + 
    '</dt>');
    
    if (node.static) { 
      $dt.addClass('static');
    }

    if ('constructor' === key) { 
      $dt.addClass('constructor');
    }

    $dt.attr('id', __slugify(parentNodeName + '.' + key));
    $dl.append($dt);

    $dd = $('<dd />');

    if (node.desc) {
      $dd.append('<div class="desc">' + __processTxt(node.desc) + '</div>');
    }

    if (node.params) {
      $params = $('<div class="params" />');
      $params.append('<label>Params:</label>');
      $params.append(__processParams(node.params));
      $dd.append($params);
    }

    if (node.ret) {
      var $ret = $('<div class="return"><label>Returns:</label></div>');
      $ret.append(__processTypes(node.ret.type));
      $ret.append('<span class="desc">' + __processTxt(node.ret.desc) + '</span>');
    }

    $dd.append($ret);

    $dl.append($dd);
  };


  var __processVar = function($dl, parentNodeName, key, node) {
    var $dt = $('<dt />');
    $dt.append('<span class="name">.' + key + "</span>");
    $dt.append(__processTypes(node.type));
    $dt.attr('id', __slugify(parentNodeName + '.' + key));
    $dl.append($dt);

    $dd = $('<dd />');

    $dd.append('<span class="desc">' + __processTxt(node.desc) + '</span>');

    $keys = $('<div class="keys" />')
    $ul = $('<ul/>');

    for (var childKey in node.keys) {
      var childNode = node.keys[childKey];

      var $li = $('<li />');

      $dt.attr('id', __slugify(parentNodeName + '.' + key + '.' + childKey));

      $li.append('<span class="name">' + childKey + '</span>');
      $li.append(__processTypes(childNode.type));
      $li.append('<span class="value">' + childNode.value + '</span>');

      var desc = __processTxt(childNode.desc);
      $li.append('<span class="desc">' + desc + '</span>');

      $ul.append($li);
    }

    $keys.append($ul);
    $dd.append($keys);

    $dl.append($dd);
  };


  var __processApiNode = function(parentNodeName, parentObj) {
    var $dl = $('<dl />');

    for (var key in parentObj) {
      var node = parentObj[key];

      if (node.keys) {
        __processVar($dl, parentNodeName, key, node);
      } else {
        __processFunction($dl, parentNodeName, key, node);
      }
    }

    return $dl;
  };


  var $api = $('#api');

  for (var key in apiDocs) {
    var node = apiDocs[key];

    var $section = $('<section />');
    $section.attr('id', __slugify(key));
    $section.append('<h3>' + key + '</h3>');

    $section.append(__processApiNode(key, node));

    $api.append($section);
  }
};



var apiDocs = {
  'Robe': {
    connect: {
      static: true,
      params: {
        url: {
          type: ['String', 'Array'],
          desc: 'Either Db URL or array of replica set URLs.'
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Connection options.',
          params: {
            timeout: {
              type: ['Number'],
              defaultValue: '[[Robe.DEFAULT_CONNECTION_OPTIONS.timeout]]',
              desc: 'Connection timeout.',
            },
          },
        },
      },
      ret: {
        type: ['Promise'],
        desc: 'Resolves to a database connection if successful.',
      },
      desc: 'Connect to a database',
    },
    closeAll: {
      static: true,
      ret: {
        type: ['Promise'],
        desc: 'Resolves once connections closed.',
      },
      desc: 'Close all opened database connections.',
    },
    DEFAULT_CONNECTION_OPTIONS: {
      type: ['Object'],
      desc: 'Default connection options.',
      keys: {
        'timeout': {
          type: ['Number'],
          value: 3000,
          desc: 'Default connection timeout in millseconds',
        }
      }
    },
  },
  'Robe.Database': {
    constructor: {
      params: {
        db: {
          type: ['Object'],
          desc: 'Mongoskin connection instance.'
        },
      },
    },
    close: {
      ret: {
        type: ['Promise'],
        desc: 'Resolves once connection closed.',
      },
      desc: 'Close this database connection.',
    },
    collection: {
      params: {
        name: {
          type: ['String'],
          desc: 'Collection name.'
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options, see [[Robe.Collection.constructor]].',
        },
      },
      ret: {
        type: ['[[Robe.Collection]]'],
        desc: 'The collection.',
      },
      desc: 'Get a collection instance.',
    },
    oplog: {
      gen: true,
      ret: {
        type: ['[[Robe.Oplog]]'],
        desc: 'Singleton oplog instance.'
      },
      desc: 'Get oplog watcher. This will create and start the watcher if not already done so.'
    },
  },
  'Robe.Collection': {
    constructor: {
      params: {
        db: {
          type: ['[[Robe.Database]]'],
          desc: 'Database connection.'
        },
        collection: {
          type: ['Object'],
          desc: 'Underlying Mongoskin collection instance.'
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options',
          params: {
            schema: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Database schema',
            },
            indexes: {
              type: ['Array'],
              defaultValue: '[]',
              desc: 'Database index definitions, see [MongoDB docs](http://docs.mongodb.org/manual/reference/method/db.collection.createIndex/#db.collection.createIndex).',
            },
            rawMode: {
              type: ['Boolean'],
              defaultValue: 'false',
              desc: 'Return raw query results instead of [[Robe.Document]] instances.'
            },
            methods: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Prototype methods to add to this collection instance.',
            },
            docMethods: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Prototype methods to add to any [[Robe.Document]] instances returned.',
            }
          }
        },
      }
    },
    'ensureIndexes': {
      gen: true,
      desc: 'Ensure all configured indexes (set during construction) actually exist within the database.'
    },
    'before': {
      desc: 'Execute given handler before given event occurs.',
      params: {
        eventName: {
          type: ['String'],
          desc: 'Event name, one of `insert`, `remove` or `update`',
        },
        genFn: {
          type: ['GeneratorFunction'],
          desc: 'The handler. Must take a callback as a parameter.',
        },
      }
    },
    'after': {
      desc: 'Execute given handler after given event occurs.',
      params: {
        eventName: {
          type: ['String'],
          desc: 'Event name, one of `insert`, `remove` or `update`',
        },
        genFn: {
          type: ['GeneratorFunction'],
          desc: 'The handler. Must take a callback as a parameter.',
        },
      }
    },
    'insert': {
      gen: true,
      desc: 'Insert a document.',
      params: {
        attrs: {
          type: ['Object'],
          desc: 'Document content.',
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options',
          params: {
            rawMode: {
              type: ['Boolean'],
              defaultValue: 'false',
              desc: 'Return raw inserted document rather than a [[Robe.Document]] instance.'
            }
          }
        },
      },
      ret: {
        type: ['Object', 'Robe.Document'],
        desc: 'The new document',
      },
    },
    'update': {
      gen: true,
      desc: 'Update documents.',
      params: {
        search: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Filtering query.',
        },
        update: {
          type: ['Object'],
          desc: 'What to update.',
        },
      },
      ret: {
        type: ['Object'],
        desc: 'Update result object',
      }
    },
    'remove': {
      gen: true,
      desc: 'Remove documents.',
      params: {
        search: {
          type: ['Object'],
          desc: 'Filtering query.',
        },
      },
      ret: {
        type: ['Object'],
        desc: 'Removal result object',
      }
    },
    'find': {
      gen: true,
      desc: 'Find documents.',
      params: {
        selector: {
          type: ['Object'],
          desc: 'Filtering query.',
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options.',
          params: {
            sort: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Sort filter (Mongo syntax)',
            },
            skip: {
              type: ['Number'],
              defaultValue: '0',
              desc: 'No. of documents to skip when fetching.'
            },
            limit: {
              type: ['Number'],
              defaultValue: '0',
              desc: 'Max. no. of documents to return.'
            },
            fields: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Fields to return or exclude (Mongo syntax).'
            },
            rawMode: {
              type: ['Boolean'],
              defaultValue: 'false',
              desc: 'Return raw documents rather than [[Robe.Document]] instances.'
            }
          }
        }
      },
      ret: {
        type: ['Array'],
        desc: 'The documents.',
      }
    },
    'findOne': {
      gen: true,
      desc: 'Find a single document.',
      params: {
        selector: {
          type: ['Object'],
          desc: 'Filtering query.',
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options.',
          params: {
            sort: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Sort filter (Mongo syntax)',
            },
            skip: {
              type: ['Number'],
              defaultValue: '0',
              desc: 'No. of documents to skip when fetching.'
            },
            fields: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Fields to return or exclude (Mongo syntax).'
            },
            rawMode: {
              type: ['Boolean'],
              defaultValue: 'false',
              desc: 'Return raw document rather than a [[Robe.Document]] instance.'
            }
          }
        }
      },
      ret: {
        type: ['Object', '[[Robe.Document]]'],
        desc: 'The document if found; otherwise `null`',
      }
    },
    'findStream': {
      gen: true,
      desc: 'Stream documents.',
      params: {
        selector: {
          type: ['Object'],
          desc: 'Filtering query.',
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options.',
          params: {
            sort: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Sort filter (Mongo syntax)',
            },
            skip: {
              type: ['Number'],
              defaultValue: '0',
              desc: 'No. of documents to skip when fetching.'
            },
            limit: {
              type: ['Number'],
              defaultValue: '0',
              desc: 'Max. no. of documents to return.'
            },
            fields: {
              type: ['Object'],
              defaultValue: '{}',
              desc: 'Fields to return or exclude (Mongo syntax).'
            },
            rawMode: {
              type: ['Boolean'],
              defaultValue: 'false',
              desc: 'Return raw documents rather than [[Robe.Document]] instances.'
            }
          }
        }
      },
      ret: {
        type: ['[[Robe.Cursor]]'],
        desc: 'A streaming cursor.',
      }
    }, 
    'count': {
      gen: true,
      desc: 'Count no. of documents.',
      params: {
        selector: {
          type: ['Object'],
          desc: 'Filtering query.',
        },
      },
      ret: {
        type: ['Number'],
        desc: 'No. of documents.',
      }      
    },
    'addWatcher': {
      gen: true,
      desc: 'Add an oplog watcher for this collection. See [[Robe.Oplog]].',
      params: {
        callback: {
          type: ['GeneratorFunction'],
          desc: 'Callback that will be notified of updates.',
        },
      },
    },
    'removeWatcher': {
      gen: true,
      desc: 'Remove given oplog watcher for this collection.',
      params: {
        callback: {
          type: ['GeneratorFunction'],
          desc: 'Callback to remove from watcher list.',
        },
      },
    },    
  },
  'Robe.Document': {
    constructor: {
      desc: 'Construct a document.',
      params: {
        collection: {
          type: ['[[Robe.Collection]]'],
          desc: 'The underlying collection',
        },
        doc: {
          type: ['Object'],
          desc: 'The raw Mongo document.',
          defaultValue: '{}'
        }
      }
    },
    'markChanged': {
      desc: 'Mark one or more properties as having changed. This affects what properties get updated in the db when [[Robe.Document.save]] is called.',
      params: {
        '...keys': {
          type: ['Array'],
          desc: 'Names or properties to mark as having changed.'
        }
      }
    },
    'toJSON': {
      desc: 'Get JSON version of this document.',
      ret: {
        type: ['Object'],
        desc: 'JSON object.'
      },
    },
    'changes': {
      desc: 'Get changed properties.',
      ret: {
        type: ['Object'],
        desc: 'Changed properties and their new values.'
      },
    },
    'reset': {
      desc: 'Reset changed properties to original values.',
    },    
    'save': {
      gen: true,
      desc: 'Persist changes made to this document.',
    },    
    'remove': {
      gen: true,
      desc: 'Remove this document from the db.',
    },    
    'reload': {
      gen: true,
      desc: 'Reload this document from the db.',
    },    
  },
  'Robe.Cursor': {
    constructor: {
      desc: 'Construct a streaming cursor.  A `result` event will be emitted for each result, an `error` event will be emitted for any errors, and a `success` event will be emitted once cursor completes.',
      params: {
        collection: {
          type: ['[[Robe.Collection]]'],
          desc: 'The underlying collection',
        },
        promise: {
          type: ['Promise'],
          desc: 'A `Promise` returned from a `monk` `find()` call.'
        },
        options: {
          type: ['Object'],
          defaultValue: '{}',
          desc: 'Additional options',
          params: {
            rawMode: {
              type: ['Boolean'],
              defaultValue: 'false',
              desc: 'Return raw documents rather than [[Robe.Document]] instances.'
            }
          }
        },
      }
    },
    'close': {
      gen: true,
      desc: 'Close this cursor.',
    },    
  },
  'Robe.Oplog': {
    constructor: {
      desc: 'Construct a Mongo oplog watcher. Extends `EventEmitter2`.',
      params: {
        db: {
          type: ['[[Robe.Database]]'],
          desc: 'The underlying database',
        },
      }
    },
    'start': {
      desc: 'Start the watcher.',
      ret: {
        type: ['Promise'],
        desc: 'Resolves once oplog watcher started.'
      },
    },    
    'stop': {
      desc: 'Stop the watcher.',
      ret: {
        type: ['Promise'],
        desc: 'Resolves once oplog watcher destroyed.'
      },
    },    
    'pause': {
      desc: 'Pause the watcher.',
    },    
    'resume': {
      desc: 'Resume the watcher.',
    },    
  },
  'Robe.Utils': {
    toObjectID: {
      desc: 'Convert given string into Mongo `ObjectId`.',
      params: {
        str: {
          type: ['[[String]]'],
          desc: 'The id string',
        },
      },
      ret: {
        type: ['Mongoskin.ObjectID'],
        desc: 'The `ObjectID` representation.'
      }
    },
    isObjectID: {
      desc: 'Get whether given string represents a valid Mongo `ObjectID`.',
      params: {
        str: {
          type: ['[[String]]'],
          desc: 'The id string',
        },
      },
      ret: {
        type: ['Boolean'],
        desc: '`true` if so, `false` otherwise.'
      }
    },
    bindGen: {
      desc: 'Bind generator function to given context.',
      params: {
        genFn: {
          type: ['GeneratorFunction'],
          desc: 'The function',
        },
        ctx: {
          type: ['Object'],
          desc: 'The `this` context.',
        },
      },
      ret: {
        type: ['GeneratorFunction'],
        desc: 'Bound function.'
      }
    },
    isGen: {
      desc: 'Get if given function is a generator function.',
      params: {
        fn: {
          type: ['Function'],
          desc: 'The function',
        },
      },
      ret: {
        type: ['Boolean'],
        desc: '`true` if so, `false` otherwise.'
      }
    },
  },
};


