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

    var $ul = $('<ul class="params" />');

    for (var key in paramsObj) {
      var node = paramsObj[key],
        nodeName = (parentName ? parentName + '.' : '') + key;

      var $li = $('<li />');
      if (node.required) {
        $li.addClass('required');
      }

      $li.append('<span class="name">' + nodeName + '</span>');
      $li.append(__processTypes(node.type));
      $li.append('<span class="desc">' + __processTxt(node.desc) + '</span>');

      if (node.params) {
        $li.append(__processParams(nodeName, node.params));
      }

      $ul.append($li);
    }

    return $ul;
  };


  var __processFunction = function($dl, parentNodeName, key, node) {
    var $dt = $('<dt>' 
      + key 
      + ' ' 
      + (node.gen ? '* ' : '')
      + __generateSig(node.params) 
      + 
    '</dt>');
    
    if (node.static) { 
      $dt.addClass('static');
    }

    $dt.attr('id', __slugify(parentNodeName + '.' + key));
    $dl.append($dt);

    $dd = $('<dd />');

    if (node.desc) {
      $dd.append('<div class="desc">' + __processTxt(node.desc) + '</div>');
    }

    if (node.params) {
      $dd.append(__processParams(node.params));
    }

    if (node.ret) {
      var $ret = $('<div class="return" />');
      $ret.append(__processTypes(node.ret.type));
      $ret.append('<span class="desc">' + __processTxt(node.ret.desc) + '</span>');
    }

    $dd.append($ret);

    $dl.append($dd);
  };


  var __processVar = function($dl, parentNodeName, key, node) {
    var $dt = $('<dt />');
    $dt.append('<span class="name">' + key + "</span>");
    $dt.append(__processTypes(node.type));
    $dt.attr('id', __slugify(parentNodeName + '.' + key));
    $dl.append($dt);

    $dd = $('<dd />');

    $dd.append('<span class="desc">' + __processTxt(node.desc) + '</span>');

    $ul = $('<ul class="keys" />');

    for (var childKey in node.keys) {
      var childNode = node.keys[childKey];

      var $li = $('<li />');

      $li.append('<span class="name">' + childKey + '</span>');
      $li.append(__processTypes(childNode.type));

      var desc = __processTxt(childNode.desc);
      desc += '<span class="default">(Default: ' + childNode.value + ')</span>';
      $li.append('<span class="desc">' + desc + '</span>');

      $ul.append($li);
    }
    $dd.append($ul);

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
          required: true,
          type: ['String', 'Array'],
          desc: 'Either Db URL or array of replica set URLs.'
        },
        options: {
          type: ['Object'],
          desc: 'Connection options.',
          params: {
            timeout: {
              type: ['Number'],
              desc: 'Connection timeout. Default is [[Robe.DEFAULT_CONNECTION_OPTIONS.timeout]]',
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
          required: true,
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
          required: true,
          type: ['String'],
          desc: 'Collection name.'
        },
        options: {
          type: ['Object'],
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
          required: true,
          type: ['[[Robe.Database]]'],
          desc: 'Database connection.'
        },
        collection: {
          required: true,
          type: ['Object'],
          desc: 'Underlying Mongoskin collection instance.'
        },
        options: {
          type: ['Object'],
          desc: 'Additional options',
          params: {
            schema: {
              type: ['Object'],
              desc: 'Database schema',
            },
            indexes: {
              type: ['Array'],
              desc: 'Database index definitions, see [MongoDB docs](http://docs.mongodb.org/manual/reference/method/db.collection.createIndex/#db.collection.createIndex).',
            },
            rawMode: {
              type: ['Boolean'],
              desc: 'Return raw query results instead of [[Robe.Document]] instances.'
            },
            methods: {
              type: ['Object'],
              desc: 'Prototype methods to add to this collection instance.',
            },
            docMethods: {
              type: ['Object'],
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
          required: true,
          type: ['String'],
          desc: 'Event name, one of `insert`, `remove` or `update`',
        },
        genFn: {
          required: true,
          type: ['GeneratorFunction'],
          desc: 'The handler. Must take a callback as a parameter.',
        },
      }
    },
    'after': {
      desc: 'Execute given handler after given event occurs.',
      params: {
        eventName: {
          required: true,
          type: ['String'],
          desc: 'Event name, one of `insert`, `remove` or `update`',
        },
        genFn: {
          required: true,
          type: ['GeneratorFunction'],
          desc: 'The handler. Must take a callback as a parameter.',
        },
      }
    },
    'insert': {
      desc: 'Insert a document.',
      params: {
        attrs: {
          required: true,
          type: ['Object'],
          desc: 'Document content.',
        },
        options: {
          type: ['Object'],
          desc: 'Additional options',
          params: {
            rawMode: {
              type: ['Boolean'],
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
      desc: 'Update documents.',
      params: {
        search: {
          type: ['Object'],
          desc: 'Search critera.',
        },
        update: {
          required: true,
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
      desc: 'Remove documents.',
      params: {
        search: {
          type: ['Object'],
          desc: 'Search critera.',
        },
      },
      ret: {
        type: ['Object'],
        desc: 'Removal result object',
      }
    },
  }
};
